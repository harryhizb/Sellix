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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAIService = exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const types_1 = require("./types");
dotenv_1.default.config();
class OpenAIService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn("OPENAI_API_KEY is missing. AI features will fail.");
        }
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY || "dummy",
        });
    }
    static getInstance() {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }
    /**
     * Derives a human-readable business type from capabilities.
     */
    getBusinessTypeFromCapabilities(capabilities) {
        if (!capabilities)
            return "Business";
        if (capabilities.supportsProducts || capabilities.supportsCart)
            return "E-commerce";
        if (capabilities.supportsServices || capabilities.supportsBooking)
            return "Service / Booking";
        if (capabilities.supportsInformation)
            return "Informational / Institute";
        return "Business";
    }
    /**
     * Queries OpenAI to clarify user intent when regex rules fail.
     * STRICTLY READ-ONLY. Does not modify state.
     */
    queryClarifier(userMessage, session, businessContext // Injected from RuleEngine
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!process.env.OPENAI_API_KEY)
                return { confidence: 0, entities: {} };
            try {
                const businessType = this.getBusinessTypeFromCapabilities(businessContext === null || businessContext === void 0 ? void 0 : businessContext.capabilities);
                const systemPrompt = `
You are a strict Intent Classifier for a WhatsApp Bot representing "${(businessContext === null || businessContext === void 0 ? void 0 : businessContext.name) || 'the business'}".
Your goal is to map user input to a canonical Intent and extract entities.

# BUSINESS CONTEXT
Name: ${businessContext === null || businessContext === void 0 ? void 0 : businessContext.name}
Type: ${businessType}
Tone: ${(businessContext === null || businessContext === void 0 ? void 0 : businessContext.tone) || 'Professional'}
Policies: ${JSON.stringify((businessContext === null || businessContext === void 0 ? void 0 : businessContext.policies) || {})}
Description: ${(businessContext === null || businessContext === void 0 ? void 0 : businessContext.description) || ''}

# CONSTRAINTS
- Return ONLY JSON.
- DO NOT invent information.
- DO NOT hallucinate products.
- Valid Intents: ${Object.values(types_1.Intent).join(', ')}

# CURRENT STATE
State: ${session.conversationState}

# JSON SCHEMA
{
  "intent": "Intent Enum",
  "confidence": number (0.0 - 1.0),
  "entities": { "quantity": number, "productKeywords": [], "address": string, "size": string, "color": string },
  "clarificationQuestion": "string (optional, only if very confused)"
}
`;
                const completion = yield this.openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `User says: "${userMessage}"` }
                    ],
                    temperature: 0.1,
                    max_tokens: 150,
                    response_format: { type: "json_object" }
                });
                const content = completion.choices[0].message.content;
                if (!content)
                    throw new Error("Empty response from OpenAI");
                const parsed = JSON.parse(content);
                // --- STRICT GUARDRAILS ---
                // 1. Validate Intent Enum
                let validatedIntent = undefined;
                if (parsed.intent && Object.values(types_1.Intent).includes(parsed.intent)) {
                    validatedIntent = parsed.intent;
                }
                else {
                    console.warn(`[AI Guardrail] Invalid Intent returned: ${parsed.intent}`);
                }
                // 2. Filter Hallucinated Entities
                let validatedEntities = {};
                if (typeof parsed.entities === 'object' && parsed.entities !== null) {
                    validatedEntities = parsed.entities;
                }
                // 3. Confidence Floor
                const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
                return {
                    intent: validatedIntent,
                    confidence: confidence > 0.0 ? confidence : 0.5,
                    entities: validatedEntities,
                    clarificationQuestion: parsed.clarificationQuestion
                };
            }
            catch (error) {
                console.error("OpenAI Clarifier Error:", error);
                return { confidence: 0, entities: {} };
            }
        });
    }
}
exports.OpenAIService = OpenAIService;
exports.openAIService = OpenAIService.getInstance();
