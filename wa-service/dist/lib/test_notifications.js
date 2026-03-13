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
const OrderService_1 = require("./OrderService");
const WhatsAppSessionManager_1 = require("./WhatsAppSessionManager");
const BusinessService_1 = require("./BusinessService");
const types_1 = require("./types");
// --- MOCKS ---
// Mock Business Context to provide Owner Phone
BusinessService_1.businessService.getBusinessContext = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        contactPhone: "999888777", // Owner's phone
        businessName: "Notification Test Store"
    };
});
// Mock WhatsApp Manager to intercept messages
const sentMessages = [];
// @ts-ignore
WhatsAppSessionManager_1.whatsappSessionManager.sendMessage = (businessId, to, text) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[MOCK WA] Sending to ${to}: ${text.substring(0, 50)}...`);
    sentMessages.push({ to, text });
});
// Mock Session
const mockSession = {
    sessionId: 'sess-notify-1',
    userId: 'user-cust-1', // Customer phone
    businessId: 'biz-1',
    businessType: types_1.BusinessType.ECOMMERCE,
    conversationState: types_1.BotState.IDLE,
    language: 'en',
    cart: [{ productId: 'p1', name: 'Test Widget', qty: 2, unitPrice: 50 }],
    userDetails: { name: 'Alice', address: 'Wonderland' },
    memory: {},
    fallbackCount: 0,
    lastActiveAt: Date.now(),
    isLockedToHuman: false
};
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("--- Starting Notification Tests ---");
        try {
            // 1. Test Owner Notification on Create
            console.log("\n1. Testing Create Order -> Owner Notification");
            const order = yield OrderService_1.orderService.createOrder(mockSession);
            const ownerMsg = sentMessages.find(m => m.to === "999888777");
            if (ownerMsg && ownerMsg.text.includes("New Order Received")) {
                console.log("PASS: Owner notification sent.");
            }
            else {
                console.log("FAIL: Owner notification missing or incorrect.");
            }
            // Reset logs
            sentMessages.length = 0;
            // 2. Test Customer Notification on CONFIRMED
            console.log("\n2. Testing Update Status -> CONFIRMED");
            yield OrderService_1.orderService.updateOrderStatus(order.businessId, order.orderId, 'CONFIRMED');
            const custMsg1 = sentMessages.find(m => m.to === "user-cust-1");
            if (custMsg1 && custMsg1.text.includes("Order Confirmed")) {
                console.log("PASS: Confirmed notification sent.");
            }
            else {
                console.log("FAIL: Confirmed notification missing.");
            }
            sentMessages.length = 0;
            // 3. Test Customer Notification on DISPATCHED
            console.log("\n3. Testing Update Status -> DISPATCHED");
            yield OrderService_1.orderService.updateOrderStatus(order.businessId, order.orderId, 'DISPATCHED');
            const custMsg2 = sentMessages.find(m => m.to === "user-cust-1");
            if (custMsg2 && custMsg2.text.includes("Order Dispatched")) {
                console.log("PASS: Dispatched notification sent.");
            }
            else {
                console.log("FAIL: Dispatched notification missing.");
            }
            sentMessages.length = 0;
            // 4. Test Customer Notification on DELIVERED
            console.log("\n4. Testing Update Status -> DELIVERED");
            yield OrderService_1.orderService.updateOrderStatus(order.businessId, order.orderId, 'DELIVERED');
            const custMsg3 = sentMessages.find(m => m.to === "user-cust-1");
            if (custMsg3 && custMsg3.text.includes("Order Delivered")) {
                console.log("PASS: Delivered notification sent.");
            }
            else {
                console.log("FAIL: Delivered notification missing.");
            }
        }
        catch (error) {
            console.error("Test Error:", error);
        }
    });
}
if (require.main === module) {
    runTest();
}
