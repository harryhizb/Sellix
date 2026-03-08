
import { ruleEngine } from './RuleEngine';
import { productService } from './ProductService';
import { BotState, SessionContext, BusinessType } from './types';
import { businessService } from './BusinessService';

// --- MOCKS ---

const MOCK_BIZ_ID = '507f1f77bcf86cd799439011';

// Mock Business Context
businessService.getBusinessContext = async (id: string) => {
    return {
        businessId: id,
        businessName: "Test Store",
        currency: "USD",
        personality: {
            tone: "friendly",
            commonEmojis: "👋,🛍️"
        },
        settings: {
            deliveryInfo: "We deliver in 2 days"
        }
    } as any;
};

// Mock Session
const mockSession: SessionContext = {
    sessionId: 'sess-prod-test',
    userId: 'user-1',
    businessId: MOCK_BIZ_ID,
    businessType: BusinessType.ECOMMERCE,
    conversationState: BotState.MAIN_MENU,
    lastActiveAt: Date.now(),
    language: 'en',
    cart: [],
    userDetails: {},
    memory: {},
    fallbackCount: 0,
    isLockedToHuman: false
};

async function runTest() {
    console.log("--- Starting Product Logic Tests ---");

    // 1. Test Empty Product List
    console.log("\n1. Testing Empty Product List...");

    // Mock getProducts to return empty
    // @ts-ignore
    productService.getProducts = async () => [];

    const responseEmpty = await ruleEngine.handleIncomingMessage(
        { ...mockSession },
        "1" // Select "Browse Products" from Main Menu
    );

    console.log("Response (Empty):", responseEmpty.response.substring(0, 100)); // Log first 100 chars

    if (responseEmpty.response.includes("no products") || responseEmpty.response.includes("empty") || responseEmpty.response.includes("available")) {
        console.log("PASS: Handled empty product list correctly.");
    } else {
        console.log("WARN: Did not detect 'no products' message - check template.");
    }


    // 2. Test Populated Product List
    console.log("\n2. Testing Populated Product List...");

    // Mock getProducts to return data
    // @ts-ignore
    productService.getProducts = async () => [{
        _id: "p1",
        name: "Super Widget",
        description: "Best widget ever",
        price: 99.99,
        inStock: true,
        isActive: true, // Added missing flag
        businessId: MOCK_BIZ_ID
    }];

    const responsePopulated = await ruleEngine.handleIncomingMessage(
        { ...mockSession },
        "1"
    );

    console.log("Response (Populated):", responsePopulated.response.substring(0, 100));

    if (responsePopulated.response.includes("Super Widget")) {
        console.log("PASS: Displayed product name correctly.");
    } else {
        console.log("FAIL: Did not display product name.");
    }

    // 3. Test Product Selection Logic (User selects '1')
    console.log("\n3. Testing Product Selection...");

    // Setup session state as if products were shown
    const browsingSession = {
        ...mockSession,
        conversationState: BotState.BROWSING_PRODUCTS,
        lastShownProducts: [{
            _id: "p1",
            name: "Super Widget",
            price: 99.99,
            businessId: "biz-1"
        }]
    };

    const responseSelect = await ruleEngine.handleIncomingMessage(
        // @ts-ignore
        browsingSession,
        "1" // User types "1" to select first product
    );

    console.log("Response (Selection):", responseSelect.response.substring(0, 100));

    if (responseSelect.newState === BotState.VIEWING_PRODUCT) {
        console.log("PASS: Transitioned to VIEWING_PRODUCT.");
    } else {
        console.log("FAIL: State did not transition relative to selection.");
    }
}

if (require.main === module) {
    runTest();
}
