import { ruleEngine } from './RuleEngine';
import { BotState, SessionContext } from './types';
import { businessService } from './BusinessService';
import { productService } from './ProductService';

// --- MOCKS ---
businessService.getBusinessContext = async (id: string) => {
    return {
        businessName: "Mock Store",
        slug: "mock-store",
        settings: { primaryGoal: "sales", currency: "USD" },
        personality: { greetingStyle: "warm", useEmojis: true },
        policies: { delivery: "Free delivery" }
    };
};

productService.getProducts = async (bid: string, opts: any) => {
    return [
        { _id: "p1", name: "Mock Product 1", price: 100 },
        { _id: "p2", name: "Mock Product 2", price: 200 }
    ] as any;
};
// --- END MOCKS ---

const mockSession: SessionContext = {
    sessionId: 'test-session-checkout',
    userId: '1234567890',
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
    console.log("--- Starting Checkout Flow Test ---");

    try {
        // 1. Start Conversation
        console.log("\nUser: Hi");
        let result = await ruleEngine.handleIncomingMessage(mockSession, "Hi");
        console.log(`Bot: ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 2. Go to Products
        console.log("\nUser: 1");
        result = await ruleEngine.handleIncomingMessage(mockSession, "1");
        console.log(`Bot (List): ${result.response.substring(0, 50)}...`);
        console.log(`State: ${result.newState}`);

        // 3. Select Product 1
        console.log("\nUser: 1");
        result = await ruleEngine.handleIncomingMessage(mockSession, "1");
        console.log(`Bot (Details): ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 4. Add to Cart
        console.log("\nUser: add");
        result = await ruleEngine.handleIncomingMessage(mockSession, "add");
        console.log(`Bot (Cart Add): ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 5. Checkout
        console.log("\nUser: checkout");
        result = await ruleEngine.handleIncomingMessage(mockSession, "checkout");
        console.log(`Bot (Ask Details): ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 6. Give Details
        console.log("\nUser: John Doe, 123 Main St");
        result = await ruleEngine.handleIncomingMessage(mockSession, "John Doe, 123 Main St");
        console.log(`Bot (Order Summary): ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 7. Confirm
        console.log("\nUser: Confirm");
        result = await ruleEngine.handleIncomingMessage(mockSession, "Confirm");
        console.log(`Bot (Success): ${result.response}`);
        console.log(`State: ${result.newState}`);

    } catch (error) {
        console.error("Test Error:", error);
    }
}

if (require.main === module) {
    runTest();
}
