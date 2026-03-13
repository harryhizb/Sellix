import { ruleEngine } from './RuleEngine';
import { BotState, SessionContext, BusinessType } from './types';
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

// Mock Session
const mockSession: SessionContext = {
    sessionId: 'test-session',
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
    console.log("--- Starting RuleEngine Flow Test ---");

    try {
        // 1. Send "Hi" -> Expect Welcome
        console.log("\nUser: Hi");
        let result = await ruleEngine.handleIncomingMessage(mockSession, "Hi");
        console.log(`Bot: ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 2. Send "1" (Menu selection) -> Expect Product List
        console.log("\nUser: 1");
        result = await ruleEngine.handleIncomingMessage(mockSession, "1");
        console.log(`Bot: ${result.response}`);
        console.log(`State: ${result.newState}`);

        // 3. Send "1" (Product selection) -> Expect Details
        console.log("\nUser: 1");
        result = await ruleEngine.handleIncomingMessage(mockSession, "1");
        console.log(`Bot: ${result.response}`);
        console.log(`State: ${result.newState}`);

    } catch (error) {
        console.error("Test Error:", error);
    }
}

if (require.main === module) {
    runTest();
}
