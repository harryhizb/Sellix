
import { orderService } from './OrderService';
import { whatsappSessionManager } from './WhatsAppSessionManager';
import { businessService } from './BusinessService';
import { BotState, SessionContext, BusinessType } from './types';

// --- MOCKS ---

// Mock Business Context to provide Owner Phone
businessService.getBusinessContext = async (id: string) => {
    return {
        contactPhone: "999888777", // Owner's phone
        businessName: "Notification Test Store"
    } as any;
};

// Mock WhatsApp Manager to intercept messages
const sentMessages: { to: string, text: string }[] = [];
// @ts-ignore
whatsappSessionManager.sendMessage = async (businessId, to, text) => {
    console.log(`[MOCK WA] Sending to ${to}: ${text.substring(0, 50)}...`);
    sentMessages.push({ to, text });
};

// Mock Session
const mockSession: SessionContext = {
    sessionId: 'sess-notify-1',
    userId: 'user-cust-1', // Customer phone
    businessId: 'biz-1',

    conversationState: BotState.IDLE,
    language: 'en',
    cart: [{ productId: 'p1', name: 'Test Widget', qty: 2, unitPrice: 50 }],
    userDetails: { name: 'Alice', address: 'Wonderland' },
    memory: {},
    fallbackCount: 0,
    lastActiveAt: Date.now(),
    isLockedToHuman: false
};

async function runTest() {
    console.log("--- Starting Notification Tests ---");

    try {
        // 1. Test Owner Notification on Create
        console.log("\n1. Testing Create Order -> Owner Notification");
        const order = await orderService.createOrder(mockSession);

        const ownerMsg = sentMessages.find(m => m.to === "999888777");
        if (ownerMsg && ownerMsg.text.includes("New Order Received")) {
            console.log("PASS: Owner notification sent.");
        } else {
            console.log("FAIL: Owner notification missing or incorrect.");
        }

        // Reset logs
        sentMessages.length = 0;

        // 2. Test Customer Notification on CONFIRMED
        console.log("\n2. Testing Update Status -> CONFIRMED");
        await orderService.updateOrderStatus(order.businessId, order.orderId, 'CONFIRMED');

        const custMsg1 = sentMessages.find(m => m.to === "user-cust-1");
        if (custMsg1 && custMsg1.text.includes("Order Confirmed")) {
            console.log("PASS: Confirmed notification sent.");
        } else {
            console.log("FAIL: Confirmed notification missing.");
        }
        sentMessages.length = 0;

        // 3. Test Customer Notification on DISPATCHED
        console.log("\n3. Testing Update Status -> DISPATCHED");
        await orderService.updateOrderStatus(order.businessId, order.orderId, 'DISPATCHED');

        const custMsg2 = sentMessages.find(m => m.to === "user-cust-1");
        if (custMsg2 && custMsg2.text.includes("Order Dispatched")) {
            console.log("PASS: Dispatched notification sent.");
        } else {
            console.log("FAIL: Dispatched notification missing.");
        }
        sentMessages.length = 0;

        // 4. Test Customer Notification on DELIVERED
        console.log("\n4. Testing Update Status -> DELIVERED");
        await orderService.updateOrderStatus(order.businessId, order.orderId, 'DELIVERED');

        const custMsg3 = sentMessages.find(m => m.to === "user-cust-1");
        if (custMsg3 && custMsg3.text.includes("Order Delivered")) {
            console.log("PASS: Delivered notification sent.");
        } else {
            console.log("FAIL: Delivered notification missing.");
        }

    } catch (error) {
        console.error("Test Error:", error);
    }
}

if (require.main === module) {
    runTest();
}
