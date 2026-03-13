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
const OrderService_1 = require("./OrderService");
// --- MOCKS ---
BusinessService_1.businessService.getBusinessContext = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        businessName: "Critical Fix Store",
        settings: { primaryGoal: "sales", currency: "USD" },
        personality: { greetingStyle: "warm", useEmojis: true },
        policies: { delivery: "Free delivery" }
    };
});
// Mock Order Persistence
// Just overwrite the method for testing
const originalCreateOrder = OrderService_1.orderService.createOrder;
// @ts-ignore
OrderService_1.orderService.createOrder = (session) => __awaiter(void 0, void 0, void 0, function* () {
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
});
const mockSession = {
    sessionId: 'test-critical-fix',
    userId: 'user-fix-1',
    businessId: 'mock-business-id',
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
        console.log("--- Starting Critical Fixes Test ---");
        try {
            // 1. Test Empty Cart Checkout Guard
            console.log("\n1. Testing Empty Cart Checkout Guard");
            mockSession.cart = [];
            // Force state CART_ACTIVE and send "checkout"
            mockSession.conversationState = types_1.BotState.CART_ACTIVE;
            let result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "checkout");
            console.log(`Bot Response: ${result.response}`);
            console.log(`New State (Should NOT be COLLECTING_DETAILS): ${result.newState}`);
            if (result.newState !== types_1.BotState.COLLECTING_DETAILS) {
                console.log("PASS: Empty cart blocked.");
            }
            else {
                console.log("FAIL: Empty cart allowed.");
            }
            // 2. Test Cart UI Consistency
            console.log("\n2. Testing Cart UI Options");
            mockSession.cart = [{ productId: 'p1', name: 'Widget', qty: 1, unitPrice: 10 }];
            // Reset state so handleCart is called clean? 
            // Actually handleIncomingMessage routes to handleCart if state is CART_ACTIVE
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "cart");
            // Note: the input "cart" might trigger global command check first? 
            // Global check calls handleCart too.
            console.log(`Bot Response: ${result.response}`);
            if (result.response.includes("1. Checkout"))
                console.log("PASS: Options shown");
            else
                console.log("FAIL: Options missing");
            // 3. Test Details Collection & Order Persistence
            console.log("\n3. Testing Details & Persistence");
            // Move to checkout (simulate user typing 'checkout' with items in cart)
            mockSession.conversationState = types_1.BotState.CART_ACTIVE;
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "checkout");
            console.log(`Bot Response (Checkout prompt): ${result.response}`);
            // Provide details
            const details = "John Doe, 123 Main St, New York";
            console.log(`User Input: ${details}`);
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, details);
            console.log(`Bot Response (Summary): ${result.response}`);
            // Confirm Order
            console.log("User Input: confirm");
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "confirm");
            console.log(`Bot Response (Success): ${result.response}`);
            // Log output should show "[MOCK] Order Persisted!"
        }
        catch (error) {
            console.error("Test Error:", error);
        }
    });
}
// Check validation
if (require.main === module) {
    runTest();
}
