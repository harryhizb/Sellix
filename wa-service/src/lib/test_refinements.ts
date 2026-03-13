import { ruleEngine } from './RuleEngine';
import { BotState, SessionContext, BusinessType } from './types';
import { businessService } from './BusinessService';
import { productService } from './ProductService';
import { isDuplicateOrder } from './utils/dedupe';

// --- MOCKS ---
businessService.getBusinessContext = async (id: string) => {
    return {
        businessName: "Refined Store",
        slug: "refined-store",
        settings: { primaryGoal: "sales", currency: "USD" },
        personality: { greetingStyle: "warm", useEmojis: true },
        policies: { delivery: "Free delivery" }
    } as any;
};

// Mock dedupe always returning false unless we force it, 
// strictly speaking we should integration test with real Redis/DB but logic check is enough.
// We'll mock the module function if possible or just assume it returns false for now and test logic flow.
// Actually, since isDuplicateOrder is imported, we can't easily mock it without a framework like Jest.
// validation: we trust the logic in RuleEngine if conversationState updates correctly.

const mockSession: SessionContext = {
    sessionId: 'test-session-refine',
    userId: 'user-refine-1',
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
    console.log("--- Starting Refinements Test ---");

    try {
        // 1. Global "Menu" from IDLE
        console.log("\nUser: menu");
        let result = await ruleEngine.handleIncomingMessage(mockSession, "menu");
        console.log(`Bot (Global Menu): ${result.response.substring(0, 30)}...`);
        console.log(`State: ${result.newState}`);

        // 2. Global "Cart" from MAIN_MENU
        console.log("\nUser: cart");
        result = await ruleEngine.handleIncomingMessage(mockSession, "cart");
        console.log(`Bot (Global Cart): ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 3. Navigation "back" from Cart
        console.log("\nUser: back - (should not work in cart directly but valid input 'menu' works)");
        // Actually handleCart implementation supports 'menu' or 'browse'
        console.log("\nUser: menu");
        result = await ruleEngine.handleIncomingMessage(mockSession, "menu");
        console.log(`Bot: ${result.response.substring(0, 30)}...`);
        console.log(`State: ${result.newState}`);

        // 4. Test "Yes" trigger (Should FAIL to add to cart in Viewing Product)
        // Setup state manually
        mockSession.conversationState = BotState.VIEWING_PRODUCT;
        mockSession.meta = { focusingProduct: { name: "Test Prod", price: 10 } };

        console.log("\nUser: yes (Should NOT add to cart)");
        result = await ruleEngine.handleIncomingMessage(mockSession, "yes");
        console.log(`Bot: ${result.response}`); // Expect fallback
        console.log(`State: ${result.newState}`);

        console.log("\nUser: add (Should add to cart)");
        result = await ruleEngine.handleIncomingMessage(mockSession, "add");
        console.log(`Bot: ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 5. Test Timeout Logic (Preserve Cart)
        console.log("\n...Simulating Timeout (16 mins later)...");
        mockSession.cart = [{ productId: 'p1', qty: 1, name: "TestItem" }];
        mockSession.lastActiveAt = Date.now() - (16 * 60 * 1000);

        // Next message should trigger timeout check -> Reset State -> Then process message
        // If message is 'hi', it goes to greeting.
        console.log("User: hi");
        result = await ruleEngine.handleIncomingMessage(mockSession, "hi");
        console.log(`Bot: ${result.response.substring(0, 30)}...`);
        console.log(`State update: ${mockSession.conversationState}`);
        console.log(`Cart length (Should be 1): ${mockSession.cart.length}`);

    } catch (error) {
        console.error("Test Error:", error);
    }
}

if (require.main === module) {
    runTest();
}
