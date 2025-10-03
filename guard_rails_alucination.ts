import { anthropic } from "./ai/antrhopic.js";

/**
 * Function to generate content  with guardrails withoud halucination 
 * @param userPrompt Question from user
 * @param knowledgeContext Context of information to provided to model 
 */
async function generateWithGuardrails(userPrompt: string, knowledgeContext: string) {
    const systemPrompt = `
        You are a factual and cautious AI assistant.
        Your prime directive is to NEVER MAKE UP INFORMATION.

        You must respond strictly based on the 'KNOWLEDGE CONTEXT' provided below.

        <KNOWLEDGE_CONTEXT>
        ${knowledgeContext}
        </KNOWLEDGE_CONTEXT>

        GUARDRAIL RULES:
        1. Knowledge Restriction: Use ONLY the text within <KNOWLEDGE_CONTEXT>.
        2. Hallucination Prevention: If the answer to the user's question cannot be
        fully supported by the KNOWLEDGE CONTEXT, you must respond with a phrase that
        indicates uncertainty or lack of information, such as: "I have no information about
        this in my provided context" or "The knowledge context does not address this question."
        3. **Format**: Please answer clearly and concisely.
    `;

    console.log("Chamando o Claude com Guardrail...");

    try {
        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1024,
            system: systemPrompt, // Apply o guardrail here
            messages: [
                {
                    role: "user",
                    content: userPrompt,
                }
            ],
        });

        const firstContent = message.content.find(block => block.type === 'text');

        if (firstContent && firstContent.type === 'text') {
            const responseText = firstContent.text.trim();
            console.log("--- Response from Claude ---");
            console.log(responseText);
            console.log("---------------------------");
        } else {
            console.error("Claude's response did not contain an expected block of text.");
        }

    } catch (error) {
        console.error("Erro ao chamar a API da Anthropic:", error);
    }
}

// --- Use Cases ---

const knowledge = `
    Anthropic's headquarters are located in San Francisco, California.
    Anthropic's latest AI model is Claude 3.5 Sonnet, released in June 2024.
    Claude was built using an approach called "Constitutional AI."
`;

// Scenario 1: Factual Question (the answer is in the context)
console.log("Test 1: Question in Context (Guardrail Off)");
await generateWithGuardrails("What is Anthropic's latest AI model and when was it released?", knowledge);

// Scenario 2: Question that requires External Knowledge (must trigger the guardrail)
console.log("\n---");
console.log("Test 2: Out of Context Question (Guardrail On)");
await generateWithGuardrails("Who won the 1998 World Cup?", knowledge);

// Scenario 3: Ambiguous Question (must use context)
console.log("\n---");
console.log("Test 3: Question Whose Detail Is in Context");
await generateWithGuardrails("Where is Anthropic's headquarters?", knowledge);