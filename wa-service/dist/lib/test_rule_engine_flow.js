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
const ProductService_1 = require("./ProductService");
// --- MOCKS ---
BusinessService_1.businessService.getBusinessContext = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        businessName: "Mock Store",
        slug: "mock-store",
        settings: { primaryGoal: "sales", currency: "USD" },
        personality: { greetingStyle: "warm", useEmojis: true },
        policies: { delivery: "Free delivery" }
    };
});
ProductService_1.productService.getProducts = (bid, opts) => __awaiter(void 0, void 0, void 0, function* () {
    return [
        { _id: "p1", name: "Mock Product 1", price: 100 },
        { _id: "p2", name: "Mock Product 2", price: 200 }
    ];
});
// --- END MOCKS ---
// Mock Session
const mockSession = {
    sessionId: 'test-session',
    userId: '1234567890',
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
        console.log("--- Starting RuleEngine Flow Test ---");
        try {
            // 1. Send "Hi" -> Expect Welcome
            console.log("\nUser: Hi");
            let result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "Hi");
            console.log(`Bot: ${result.response}`);
            console.log(`State: ${result.newState}`);
            // 2. Send "1" (Menu selection) -> Expect Product List
            console.log("\nUser: 1");
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "1");
            console.log(`Bot: ${result.response}`);
            console.log(`State: ${result.newState}`);
            // 3. Send "1" (Product selection) -> Expect Details
            console.log("\nUser: 1");
            result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(mockSession, "1");
            console.log(`Bot: ${result.response}`);
            console.log(`State: ${result.newState}`);
        }
        catch (error) {
            console.error("Test Error:", error);
        }
    });
}
if (require.main === module) {
    runTest();
}
