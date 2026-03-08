
import { ruleEngine } from './RuleEngine';
import { BotState, SessionContext } from './types';
import { businessService } from './BusinessService';
import { orderService } from './OrderService';

// --- MOCKS ---
businessService.getBusinessContext = async (id: string) => {
    return {
        businessName: "Critical Fix Store",
        settings: { primaryGoal: "sales", currency: "USD" },
        personality: { greetingStyle: "warm", useEmojis: true },
        policies: { delivery: "Free delivery" }
    } as any;
};

// Mock Order Persistence
// Just overwrite the method for testing
const originalCreateOrder = orderService.createOrder;
// @ts-ignore
orderService.createOrder = async (session) => {
    console.log("[MOCK] Order Persisted!");
    // Call original logic to get ID back
    // Since original logic is just creating object and logging, it's fine.
    // We can just return a fake order object for the test
    return {
        orderId: 'ORD-TEST-123',
        businessId: session.businessId,
        userId: session.userId,
        items: session.cart,
        total: 100,
        status: 'PENDING',
        userDetails: session.userDetails,
        createdAt: new Date()
    };
};

const mockSession: SessionContext = {
    sessionId: 'test-critical-fix',
    userId: 'user-fix-1',
    businessId: 'mock-business-id',
    conversationState: BotState.IDLE,
    language: 'en',
    cart: [],
    userDetails: {},
    memory: {},
    fallbackCount: 0,
    lastActiveAt: Date.now(),
    isLockedToHuman: false
};

async function runTest() {
    console.log("--- Starting Critical Fixes Test ---");

    try {
        // 1. Test Empty Cart Checkout Guard
        console.log("\n1. Testing Empty Cart Checkout Guard");
        mockSession.cart = [];

        // Force state CART_ACTIVE and send "checkout"
        mockSession.conversationState = BotState.CART_ACTIVE;
        let result = await ruleEngine.handleIncomingMessage(mockSession, "checkout");
        console.log(`Bot Response: ${result.response}`);
        console.log(`New State (Should NOT be COLLECTING_DETAILS): ${result.newState}`);

        if (result.newState !== BotState.COLLECTING_DETAILS) {
            console.log("PASS: Empty cart blocked.");
        } else {
            console.log("FAIL: Empty cart allowed.");
        }

        // 2. Test Cart UI Consistency
        console.log("\n2. Testing Cart UI Options");
        mockSession.cart = [{ productId: 'p1', name: 'Widget', qty: 1, unitPrice: 10 }];
        // Reset state so handleCart is called clean? 
        // Actually handleIncomingMessage routes to handleCart if state is CART_ACTIVE
        result = await ruleEngine.handleIncomingMessage(mockSession, "cart");
        // Note: the input "cart" might trigger global command check first? 
        // Global check calls handleCart too.

        console.log(`Bot Response: ${result.response}`);
        if (result.response.includes("1. Checkout")) console.log("PASS: Options shown");
        else console.log("FAIL: Options missing");

        // 3. Test Details Collection & Order Persistence
        console.log("\n3. Testing Details & Persistence");

        // Move to checkout (simulate user typing 'checkout' with items in cart)
        mockSession.conversationState = BotState.CART_ACTIVE;
        result = await ruleEngine.handleIncomingMessage(mockSession, "checkout");
        console.log(`Bot Response (Checkout prompt): ${result.response}`);

        // Provide details
        const details = "John Doe, 123 Main St, New York";
        console.log(`User Input: ${details}`);
        result = await ruleEngine.handleIncomingMessage(mockSession, details);
        console.log(`Bot Response (Summary): ${result.response}`);

        // Confirm Order
        console.log("User Input: confirm");
        result = await ruleEngine.handleIncomingMessage(mockSession, "confirm");
        console.log(`Bot Response (Success): ${result.response}`);
        // Log output should show "[MOCK] Order Persisted!"

    } catch (error) {
        console.error("Test Error:", error);
    }
}

// Check validation
if (require.main === module) {
    runTest();
}
