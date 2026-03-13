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
const ProductService_1 = require("./ProductService");
const types_1 = require("./types");
const BusinessService_1 = require("./BusinessService");
// --- MOCKS ---
const MOCK_BIZ_ID = '507f1f77bcf86cd799439011';
// Mock Business Context
BusinessService_1.businessService.getBusinessContext = (id) => __awaiter(void 0, void 0, void 0, function* () {
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
    };
});
// Mock Session
const mockSession = {
    sessionId: 'sess-prod-test',
    userId: 'user-1',
    businessId: MOCK_BIZ_ID,
    businessType: types_1.BusinessType.ECOMMERCE,
    conversationState: types_1.BotState.MAIN_MENU,
    lastActiveAt: Date.now(),
    language: 'en',
    cart: [],
    userDetails: {},
    memory: {},
    fallbackCount: 0,
    isLockedToHuman: false
};
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("--- Starting Product Logic Tests ---");
        // 1. Test Empty Product List
        console.log("\n1. Testing Empty Product List...");
        // Mock getProducts to return empty
        // @ts-ignore
        ProductService_1.productService.getProducts = () => __awaiter(this, void 0, void 0, function* () { return []; });
        const responseEmpty = yield RuleEngine_1.ruleEngine.handleIncomingMessage(Object.assign({}, mockSession), "1" // Select "Browse Products" from Main Menu
        );
        console.log("Response (Empty):", responseEmpty.response.substring(0, 100)); // Log first 100 chars
        if (responseEmpty.response.includes("no products") || responseEmpty.response.includes("empty") || responseEmpty.response.includes("available")) {
            console.log("PASS: Handled empty product list correctly.");
        }
        else {
            console.log("WARN: Did not detect 'no products' message - check template.");
        }
        // 2. Test Populated Product List
        console.log("\n2. Testing Populated Product List...");
        // Mock getProducts to return data
        // @ts-ignore
        ProductService_1.productService.getProducts = () => __awaiter(this, void 0, void 0, function* () {
            return [{
                    _id: "p1",
                    name: "Super Widget",
                    description: "Best widget ever",
                    price: 99.99,
                    inStock: true,
                    isActive: true, // Added missing flag
                    businessId: MOCK_BIZ_ID
                }];
        });
        const responsePopulated = yield RuleEngine_1.ruleEngine.handleIncomingMessage(Object.assign({}, mockSession), "1");
        console.log("Response (Populated):", responsePopulated.response.substring(0, 100));
        if (responsePopulated.response.includes("Super Widget")) {
            console.log("PASS: Displayed product name correctly.");
        }
        else {
            console.log("FAIL: Did not display product name.");
        }
        // 3. Test Product Selection Logic (User selects '1')
        console.log("\n3. Testing Product Selection...");
        // Setup session state as if products were shown
        const browsingSession = Object.assign(Object.assign({}, mockSession), { conversationState: types_1.BotState.BROWSING_PRODUCTS, lastShownProducts: [{
                    _id: "p1",
                    name: "Super Widget",
                    price: 99.99,
                    businessId: "biz-1"
                }] });
        const responseSelect = yield RuleEngine_1.ruleEngine.handleIncomingMessage(
        // @ts-ignore
        browsingSession, "1" // User types "1" to select first product
        );
        console.log("Response (Selection):", responseSelect.response.substring(0, 100));
        if (responseSelect.newState === types_1.BotState.VIEWING_PRODUCT) {
            console.log("PASS: Transitioned to VIEWING_PRODUCT.");
        }
        else {
            console.log("FAIL: State did not transition relative to selection.");
        }
    });
}
if (require.main === module) {
    runTest();
}
