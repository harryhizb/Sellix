# SaaS WhatsApp AI Bot: Comprehensive Technical Breakdown

This document provides a deep-dive into the architecture, state-machines, and contracts of the platform.

---

## 1️⃣ CONVERSATION STATE MACHINE

### A. Full BotState Enum
Defined in `wa-service/src/lib/types.ts`:

```typescript
export enum BotState {
    IDLE = 'IDLE',
    GREETING = 'GREETING',
    MAIN_MENU = 'MAIN_MENU',
    BROWSING_PRODUCTS = 'BROWSING_PRODUCTS',
    VIEWING_PRODUCT = 'VIEWING_PRODUCT',
    SELECTING_VARIANT = 'SELECTING_VARIANT',
    AWAITING_QUANTITY = 'AWAITING_QUANTITY',
    COLLECTING_PRODUCT_NOTES = 'COLLECTING_PRODUCT_NOTES',
    PRODUCT_SELECTED = 'PRODUCT_SELECTED',
    CART_ACTIVE = 'CART_ACTIVE',
    COLLECTING_DETAILS = 'COLLECTING_DETAILS',
    ORDER_DETAILS_PENDING = 'ORDER_DETAILS_PENDING',
    CONFIRMING_ORDER = 'CONFIRMING_ORDER',
    ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    ORDER_PLACED = 'ORDER_PLACED',
    HUMAN_HANDOFF = 'HUMAN_HANDOFF',
    TRACKING_ORDER = 'TRACKING_ORDER',
    VIEWING_POLICY = 'VIEWING_POLICY',
    BROWSING_COURSES = 'BROWSING_COURSES',
    BROWSING_EVENTS = 'BROWSING_EVENTS',
    BROWSING_SERVICES = 'BROWSING_SERVICES'
}
```

### B. State Ownership & Transitions

| State | Owned By | Primary Logic File | Transitions Allowed |
| :--- | :--- | :--- | :--- |
| `MAIN_MENU` | `FlowRouter` | `FlowRouter.ts` | → `BROWSING_PRODUCTS`, `TRACKING_ORDER`, `VIEWING_POLICY` |
| `BROWSING_PRODUCTS` | `CartEngine` / `BookingEngine` | `CartEngine.ts` | → `VIEWING_PRODUCT`, `MAIN_MENU` |
| `VIEWING_PRODUCT` | `CartEngine` / `Booking` / `Inst` | `CartEngine.ts` | → `SELECTING_VARIANT`, `AWAITING_QUANTITY`, `COLLECTING_DETAILS` |
| `SELECTING_VARIANT` | `CartEngine` | `CartEngine.ts` | → `AWAITING_QUANTITY`, `BROWSING_PRODUCTS` |
| `AWAITING_QUANTITY` | `CartEngine` | `CartEngine.ts` | → `CART_ACTIVE`, `BROWSING_PRODUCTS` |
| `CART_ACTIVE` | `CartEngine` | `CartEngine.ts` | → `COLLECTING_DETAILS`, `BROWSING_PRODUCTS`, `MAIN_MENU` |
| `COLLECTING_DETAILS` | `Cart` / `Booking` / `Inquiry` | `CartEngine.ts` | → `CONFIRMING_ORDER` |
| `CONFIRMING_ORDER` | `CartEngine` / `Booking` | `CartEngine.ts` | → `IDLE` (Success), `COLLECTING_DETAILS` (Edit) |
| `BROWSING_COURSES` | `InstituteEngine` | `InstituteEngine.ts` | → `VIEWING_PRODUCT`, `MAIN_MENU` |

### C. State Isolation Check
*   **Shared States**: Yes. `VIEWING_PRODUCT`, `COLLECTING_DETAILS`, and `CONFIRMING_ORDER` are heavily reused across `CartEngine`, `BookingEngine`, and `InstituteEngine`.
*   **Meaning Reuse**: `COLLECTING_DETAILS` means "Address/Name" in E-commerce but "Name/Date/Time/Phone" in Booking.
*   **Cross-Engine Transitions**: One engine **cannot** directly transition into another's unique state, but because they share `CONFIRMING_ORDER`, the `FlowRouter` must use `capabilities` even *after* the engine has processed the logic to decide which success message to show.

---

## 2️⃣ BUSINESS MODEL & CAPABILITY STRUCTURE

### Authoritative Rule
Routing is determined by **both**, but `capabilities` is authoritative for feature availability while `category` is authoritative for UI/Template selection.

### Schema Blueprint (`src/models/Business.ts`)
```typescript
{
  category: "ecommerce" | "restaurant" | "service" | "institute" | "other",
  capabilities: {
    supportsProducts: boolean,
    supportsServices: boolean,
    supportsBooking: boolean,
    supportsCart: boolean,
    supportsInformation: boolean
  },
  aiSettings: {
    ruleEngineWeight: number, // Default 0.7
    llmFallbackThreshold: number,
    enableMultilingual: boolean
  },
  personality: {
    tone: string,
    greetingStyle: string,
    useEmojis: boolean
  }
}
```

---

## 3️⃣ ENGINE RESPONSIBILITY CONTRACT

### `CartEngine`
*   **Entry Points**: `handleBrowse`, `handleProductBrowsing`.
*   **Models**: `Product`, `Order`, `ConversationSession`.
*   **Creates Orders**: Yes (Type: 'order').
*   **Templates**: `productList`, `productFlow`, `variantSelection`, `cartUpdated`, `orderSummary`.
*   **Calls Another Engine**: No.

### `BookingEngine`
*   **Entry Point**: `handleBrowse`.
*   **Models**: `Product` (Services), `Order`, `Appointment`.
*   **Creates Orders**: Yes (Type: 'booking').
*   **Creates Appointments**: Yes.
*   **Templates**: `serviceList`, `serviceFlow`, `askBookingNamePhone`, `bookingConfirmation`.
*   **Calls Another Engine**: No.

### `InstituteEngine`
*   **Entry Point**: `handleBrowseCourses`.
*   **Models**: `Product` (Courses).
*   **Creates Orders**: No (Current version provides links/info).
*   **Templates**: `instituteCourses`, `instituteCourseDetail`, `instituteAdmissions`.
*   **Calls Another Engine**: No.

---

## 4️⃣ ORDER MODEL OVERLOAD ANALYSIS

The `Order` model (`wa-service/src/models/Order.ts`) is a **God Object** serving four distinct purposes:
1.  **Product Sales**: `items` array + `deliveryDetails`.
2.  **Bookings**: Uses `bookingDetails` (Name/Date/Time) + single service in `items`.
3.  **Registrations/Enrollments**: (Placeholders for future expansion).

### Distinguished By:
*   `type`: enum `['order', 'booking', 'registration', 'enrollment']`.
*   **Status Coupling**: `shipped` makes sense for 'order' but is invalid for 'booking'. The `Order.updateStatus` method has hardcoded validation that assumes an e-commerce flow, which creates friction for service-based businesses.

---

## 5️⃣ SESSION STRUCTURE

### `ConversationSession` Schema
```json
{
  "sessionId": "jid@s.whatsapp.net",
  "userId": "sender_jid",
  "businessId": "ObjectId",
  "conversationState": "BROWSING_PRODUCTS",
  "cart": [],
  "lastShownProducts": [],
  "meta": {
    "focusingProduct": {},
    "selectedVariant": {},
    "pendingCartItemIndex": 0
  },
  "isLockedToHuman": false,
  "expiresAt": "Date (TTL 24h)"
}
```
*   **Persistence**: Loaded at start of every message in `RuleEngine`; saved at the end of `WhatsAppSessionManager` processing.
*   **Engine-Aware**: The session is **not** engine-aware; it only stores the `BotState`. The `FlowRouter` must infer the engine from the `businessId`.

---

## 6️⃣ TEMPLATE REGISTRY CONTRACT

*   **Total Keys**: ~35 templates.
*   **Shared Templates**: `productList`, `mainMenu`, `orderSuccess`.
*   **Logic in Templates**: Yes. Templates like `greeting` and `mainMenu` contain conditional logic checking `capabilities` to decide which numbers (1, 2, 3) correspond to which features.
*   **Risk**: If `FlowRouter` logic and `TemplateRegistry` logic for "Menu Item #1" go out of sync, the bot will display one option but execute another.

---

## 7️⃣ FLOW ROUTER DELEGATION RULES

### Routing Priority
1.  **Button IDs**: `cmd_*` parsed by `parseButtonId`.
2.  **Explicit State**: If `session.conversationState` is not `IDLE/MAIN_MENU`.
3.  **Keywords**: "cart", "track", "browse".
4.  **Fallback**: `RuleEngine` takes over for NLP/AI processing.

```typescript
// Core Delegation logic
switch (session.conversationState) {
    case BotState.BROWSING_PRODUCTS:
        if (context.category === 'INSTITUTE') return instituteEngine.handleCourseBrowsing(...);
        if (caps.supportsBooking) return bookingEngine.handleServiceBrowsing(...);
        return cartEngine.handleProductBrowsing(...);
}
```

---

## 8️⃣ DATABASE RELATIONSHIP MAP

*   **Business → Products**: 1:N. Products carry a `category` to distinguish items from services.
*   **Business → Orders**: 1:N. The source of truth for all transactions.
*   **Orders → Appointments**: 1:1. Created only when `Order.type === 'booking'`.
*   **Customers → Sessions**: 1:1. Sessions are transient (TTL), Customers are permanent.

---

## 9️⃣ FRONTEND ARCHITECTURE

### A. Business Type Rendering (`src/app/dashboard/page.tsx`)
```typescript
const category = business.category || 'ecommerce';
if (category === 'service') return <ServiceDashboard business={business} />;
if (category === 'institute') return <InstituteDashboard business={business} />;
return <EcommerceDashboard business={business} />;
```

### B. Onboarding Logic
Driven by `CATEGORY_CONFIGS` in `src/app/dashboard/onboarding/page.tsx`. It uses a **single shared component** with dynamic field labels and visibility toggles.

### C. Shared Component Audit
*   **`DynamicSidebar`**: Awareness of `businessCategory`.
*   **`DynamicForm`**: Heavily aware of `category` to show "Spice Level" vs "Course Duration".
*   ** pure UI**: `Card`, `Button`, `Input` (shadcn).

---

## 🔟 KNOWN STRUCTURAL WEAKNESSES (MANDATORY)

1.  **State Machine Collision**: Using `VIEWING_PRODUCT` for both a physical shoe and a Calculus course leads to generic templates that lack vertical-specific context.
2.  **Order Model Overload**: The `Order` model is too large. Validating a "shipped" status on a "dental appointment" is possible but logically broken.
3.  **Template-Code Coupling**: The fact that `TemplateRegistry` knows which number (e.g., "1️⃣ ") maps to which feature is a maintenance nightmare.
4.  **Inconsistent Onboarding**: Fields like `ownerPhone` are sometimes stored in `Business` and sometimes in `Business.metadata`.
5.  **Hardcoded Engine Selection**: `FlowRouter` uses `caps.supportsBooking` check before `caps.supportsCart`, making it impossible for a business to offer both cleanly without a nested menu.

---

## 1️⃣1️⃣ EXAMPLE FULL MESSAGE FLOW

### E-commerce Flow ("Hi")
1.  **Input**: "Hi"
2.  **State**: `IDLE` → `MAIN_MENU`
3.  **Routing**: `RuleEngine` detects greeting → Calls `TemplateRegistry.mainMenu`.
4.  **Response**: "1. Browse Products, 2. Track Order..."
5.  **DB**: Updates `ConversationSession` state to `MAIN_MENU`.

### Booking Flow ("Book a haircut")
1.  **Input**: "1" (from Main Menu)
2.  **Routing**: `FlowRouter` sees `BotState.MAIN_MENU` + "1" → `BookingEngine.handleBrowse`.
3.  **Response**: "🛠️ Our Services: 1. Haircut, 2. Shave..."
4.  **State**: `BROWSING_PRODUCTS`.

---

## 12️⃣ ARCHITECTURE CONSISTENCY CHECK

*   **Vertical Separation**: **Partial**. Logic is separated into Engines, but database models (`Order`, `Product`) and state enums are heavily coupled.
*   **Shared Template Breakage**: Removing shared templates would break the `mainMenu` and `greeting` for all businesses.
*   **Shared State Breakage**: Removing shared states would require duplicating the `FlowRouter` switch logic for every engine, significantly increasing code volume but improving safety.
