"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const RuleEngine_1 = require("./RuleEngine");
const types_1 = require("./types");
const BusinessService_1 = require("./BusinessService");
// --- MOCKS ---
BusinessService_1.businessService.getBusinessContext = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        businessName: "Refined Store",
        slug: "refined-store",
        settings: { primaryGoal: "sales", currency: "USD" },
        personality: { greetingStyle: "warm", useEmojis: true },
        policies: { delivery: "Free delivery" }
    };
});
// Mock dedupe always returning false unless we force it, 
// strictly speaking we should integration test with real Redis/DB but logic check is enough.
// We'll mock the module function if possible or just assume it returns false for now and test logic flow.
// Actually, since isDuplicateOrder is imported, we can't easily mock it without a framework like Jest.
// validation: we trust the logic in RuleEngine if conversationState updates correctly.
const mockSession = {
    sessionId: 'test-session-refine',
    userId: 'user-refine-1',
    businessId: 'mock-business-id',
    businessType: types_1.BusinessType.ECOMMERCE,
    conversationState: types_1.BotState.IDLE,
    language: 'en',
    cart: [],
    userDetails: {},
    memory: {},
    fallbackCount: 0,
    lastActiveAt: Date.now(),
    isLockedToHuman: false
};
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("--- Starting Refinements Test ---");
        try {
            // 1. Global "Menu" from IDLE
            console.log("\nUser: menu");
            let result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "menu");
            console.log(`Bot (Global Menu): ${result.response.substring(0, 30)}...`);
            console.log(`State: ${result.newState}`);
            // 2. Global "Cart" from MAIN_MENU
            console.log("\nUser: cart");
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "cart");
            console.log(`Bot (Global Cart): ${result.response}`);
            console.log(`State: ${result.newState}`);
            // 3. Navigation "back" from Cart
            console.log("\nUser: back - (should not work in cart directly but valid input 'menu' works)");
            // Actually handleCart implementation supports 'menu' or 'browse'
            console.log("\nUser: menu");
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "menu");
            console.log(`Bot: ${result.response.substring(0, 30)}...`);
            console.log(`State: ${result.newState}`);
            // 4. Test "Yes" trigger (Should FAIL to add to cart in Viewing Product)
            // Setup state manually
            mockSession.conversationState = types_1.BotState.VIEWING_PRODUCT;
            mockSession.meta = { focusingProduct: { name: "Test Prod", price: 10 } };
            console.log("\nUser: yes (Should NOT add to cart)");
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "yes");
            console.log(`Bot: ${result.response}`); // Expect fallback
            console.log(`State: ${result.newState}`);
            console.log("\nUser: add (Should add to cart)");
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "add");
            console.log(`Bot: ${result.response}`);
            console.log(`State: ${result.newState}`);
            // 5. Test Timeout Logic (Preserve Cart)
            console.log("\n...Simulating Timeout (16 mins later)...");
            mockSession.cart = [{ productId: 'p1', qty: 1, name: "TestItem" }];
            mockSession.lastActiveAt = Date.now() - (16 * 60 * 1000);
            // Next message should trigger timeout check -> Reset State -> Then process message
            // If message is 'hi', it goes to greeting.
            console.log("User: hi");
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "hi");
            console.log(`Bot: ${result.response.substring(0, 30)}...`);
            console.log(`State update: ${mockSession.conversationState}`);
            console.log(`Cart length (Should be 1): ${mockSession.cart.length}`);
        }
        catch (error) {
            console.error("Test Error:", error);
        }
    });
}
if (require.main === module) {
    runTest();
}
