import OpenAI from "openai";
import dotenv from "dotenv";
import { SessionContext, Intent, CONSTANTS } from "./types";

dotenv.config();

export interface AIClarifierResponse {
    intent?: Intent;
    confidence: number;
    entities: Record<string, any>;
    clarificationQuestion?: string;
}

export class OpenAIService {
    private openai: OpenAI;
    private static instance: OpenAIService;

    private constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn("OPENAI_API_KEY is missing. AI features will fail.");
        }
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "dummy",
        });
    }

    public static getInstance(): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }

    /**
     * Derives a human-readable business type from capabilities.
     */
    private getBusinessTypeFromCapabilities(capabilities?: any): string {
        if (!capabilities) return "Business";
        if (capabilities.supportsProducts || capabilities.supportsCart) return "E-commerce";
        if (capabilities.supportsServices || capabilities.supportsBooking) return "Service / Booking";
        if (capabilities.supportsInformation) return "Informational / Institute";
        return "Business";
    }

    /**
     * Queries OpenAI to clarify user intent when regex rules fail.
     * STRICTLY READ-ONLY. Does not modify state.
     */
    public async queryClarifier(
        userMessage: string,
        session: SessionContext,
        businessContext: any // Injected from RuleEngine
    ): Promise<AIClarifierResponse> {
        if (!process.env.OPENAI_API_KEY) return { confidence: 0, entities: {} };

        try {
            const businessType = this.getBusinessTypeFromCapabilities(businessContext?.capabilities);

            const systemPrompt = `
You are a strict Intent Classifier for a WhatsApp Bot representing "${businessContext?.name || 'the business'}".
Your goal is to map user input to a canonical Intent and extract entities.

# BUSINESS CONTEXT
Name: ${businessContext?.name}
Type: ${businessType}
Tone: ${businessContext?.tone || 'Professional'}
Policies: ${JSON.stringify(businessContext?.policies || {})}
Description: ${businessContext?.description || ''}

# CONSTRAINTS
- Return ONLY JSON.
- DO NOT invent information.
- DO NOT hallucinate products.
- Valid Intents: ${Object.values(Intent).join(', ')}

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

            const completion = await this.openai.chat.completions.create({
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
            if (!content) throw new Error("Empty response from OpenAI");

            const parsed = JSON.parse(content);

            // --- STRICT GUARDRAILS ---

            // 1. Validate Intent Enum
            let validatedIntent: Intent | undefined = undefined;
            if (parsed.intent && Object.values(Intent).includes(parsed.intent as Intent)) {
                validatedIntent = parsed.intent as Intent;
            } else {
                console.warn(`[AI Guardrail] Invalid Intent returned: ${parsed.intent}`);
            }

            // 2. Filter Hallucinated Entities
            let validatedEntities: any = {};
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

        } catch (error) {
            console.error("OpenAI Clarifier Error:", error);
            return { confidence: 0, entities: {} };
        }
    }
}

export const openAIService = OpenAIService.getInstance();