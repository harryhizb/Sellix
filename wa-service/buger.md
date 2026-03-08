# Bug Analysis: State Transition & Summary Inconsistencies

## 1. Trace Message Flow
When a user interacts with the catalog:
1. **Browse Products**: User sends "1" from Main Menu -> `FlowRouter` sets state to `BROWSING_PRODUCTS`.
2. **Select Product**: User sends product number -> `CartEngine` sets state to `VIEWING_PRODUCT`.
3. **Select Variant/Add**: User sends "1" -> `CartEngine` sets state to `SELECTING_VARIANT` (if variants exist) or `AWAITING_QUANTITY`.
4. **Enter Quantity**: User sends "2".

**Observation**: Instead of adding 2 items to the cart, the bot responds with "Please enter your Order ID" and changes state to `TRACKING_ORDER`.

## 2. Root Cause Analysis: State Priority Bypass
The issue lies in the execution order within `RuleEngine.ts`. Global commands are checked **before** the `FlowRouter` (which handles state-based logic) is even called.

### Global Numeric Handling [File: `src/lib/RuleEngine.ts`]
```typescript
// Line 50: Global commands are checked first
let result = await this.checkGlobalCommands(session, cleanMessage, aiContext);
if (result) return this.finalize(session, result);

// ... later ...

// Line 77: checkGlobalCommands implementation
private async checkGlobalCommands(...) {
    const input = normalizeInput(message);
    // ...
    // Line 107: Shortcut for tracking triggers if input is "2"
    if (input.includes('track') || input === '2' || message.trim().toLowerCase().startsWith('#')) {
        if (session.conversationState === BotState.TRACKING_ORDER) return null;
        return {
            response: TemplateRegistry.askOrderId(),
            newState: BotState.TRACKING_ORDER,
            updatedSession: session
        };
    }
}
```

### State-Specific Handling [File: `src/lib/engines/FlowRouter.ts`]
The state-based logic is in `FlowRouter.ts`, but it is **bypassed** because the `RuleEngine` returns early if `checkGlobalCommands` matches.
```typescript
// Line 309: This is where the quantity should be handled
case BotState.AWAITING_QUANTITY:
    return cartEngine.handleQuantityInput(session, message, context);
```

**Root Cause**: The global mapping of "2" to `TRACKING_ORDER` in `RuleEngine.ts` has higher priority than the current conversational state (`AWAITING_QUANTITY`).

## 3. Order Summary: Removed Discounts
The order summary fails to show discounts because the `CartEngine` doesn't pass the calculated values to the template.

### Analysis [File: `src/lib/engines/CartEngine.ts`]
In `handleCollectingDetails`, the template is called without payment/discount data:
```typescript
// Line 331
const response = TemplateRegistry.orderSummary(session, context.settings?.currency || context.currency || 'USD');
```

### Analysis [File: `src/lib/templates/TemplateRegistry.ts`]
The template defaults discount to 0 if `orderData` is missing:
```typescript
// Line 243
static orderSummary(session: SessionContext, currency: string, orderData?: any): BaileysMessage {
    // ...
    // Line 248: Defaults to 0 because orderData is undefined
    const discount = orderData ? orderData.discountAmount : 0;
```

## 4. Summary of Findings
| Issue | File Reference | Line | Explanation |
| :--- | :--- | :--- | :--- |
| **Numeric Bypass** | `src/lib/RuleEngine.ts` | 107 | "2" is hardcoded as a global shortcut for tracking, overriding all other states. |
| **State Priority** | `src/lib/RuleEngine.ts` | 50-54 | `checkGlobalCommands` is executed before `flowRouter.route`. |
| **Cart Remains 0** | `src/lib/engines/CartEngine.ts` | 202 | `addToCart` is never called because `handleQuantityInput` is never reached. |
| **Missing Discount** | `src/lib/engines/CartEngine.ts` | 331 | `orderSummary` is called without pre-computed discount/total data. |
