import { anthropic } from "./ai/antrhopic.js";

const MIN_CONFIDENCE_THRESHOLD = 80; // confidence limit (ex: 80 em 100)

async function generateInitialResponse(userPrompt: string, knowledgeContext: string): Promise<string> {
    const generationSystemPrompt = `
        You are an AI assistant whose job it is to answer the user's question.
        Your sole source of truth is the CONTEXT provided below.

        <CONTEXT>
        ${knowledgeContext}
        </CONTEXT>

        If the answer isn't in the CONTEXT, respond concisely by stating that the information wasn't found.
        Your response should be the answer text ONLY, without any introductions.
    `;

    const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: generationSystemPrompt,
        messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find(block => block.type === 'text');

    return textBlock && textBlock.type === 'text' ? textBlock.text.trim() : "";
}

async function evaluateResponseConfidence(
    userPrompt: string,
    knowledgeContext: string,
    generatedResponse: string
): Promise<{ confidenceScore: number, explanation: string }> {

    const evaluationSystemPrompt = `
            You are an AI guardrail evaluator. Your task is to determine the **factual reliability** of the 'GENERATED RESPONSE' by strictly comparing it to the 'KNOWLEDGE CONTEXT'.

            1. If the RESPONSE is 100% grounded in the CONTEXT, the reliability is 100.
            2. If the RESPONSE contains information not in the CONTEXT (hallucination), the reliability is 0.
            3. If the RESPONSE honestly admits missing information (as instructed), the reliability is 95.

            <KNOWLEDGE_CONTEXT>
            ${knowledgeContext}
            </KNOWLEDGE_CONTEXT>

            <GENERATED_RESPONSE>
            ${generatedResponse}
            </GENERATED_RESPONSE>

            Respond ONLY with a JSON object in the following Typescript format:
            interface Evaluation {
            confidenceScore: number; // An integer from 0 to 100
            explanation: string; // A brief explanation of the score.
            }
    `;
    const jsonPrefix = '{"confidenceScore":';
    const userMessage = { role: "user", content: `Avalie a RESPOSTA GERADA.` } as const;
    const assistantContinuation = { role: "assistant", content: jsonPrefix } as const;
    const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 512,
        system: evaluationSystemPrompt,
        messages: [
            userMessage,
            assistantContinuation 
        ],
        stop_sequences: ['}'],
    });

    const firstContentBlock = message.content[0];
    let rawResponse = '';
    if (firstContentBlock && firstContentBlock.type === 'text') {
        const generatedJsonSnippet = firstContentBlock.text.trim();
        rawResponse = jsonPrefix + generatedJsonSnippet + '}';
    } else {
        console.error("Error: Guardrail evaluator did not return a valid text block.");
        rawResponse = '{"confidenceScore": 0, "explanation": "No text content found."}';
    }

    try {
        return JSON.parse(rawResponse) as { confidenceScore: number, explanation: string };
    } catch (e) {
        console.error("Erro ao analisar JSON de avaliação:", rawResponse);
        return { confidenceScore: 0, explanation: "Error in evaluator JSON formatting." };
    }
}

async function runConfidenceGuardrail(userPrompt: string, knowledgeContext: string) {
    console.log(`--- Guardrail Test (Limit: ${MIN_CONFIDENCE_THRESHOLD}) ---`);
    console.log(`Question of User: ${userPrompt}\n`);

    const generatedResponse = await generateInitialResponse(userPrompt, knowledgeContext);
    console.log(`[1/2] Generated Response: ${generatedResponse}`);

    const evaluation = await evaluateResponseConfidence(userPrompt, knowledgeContext, generatedResponse);

    console.log(`[2/2] Guardrail Assessment:`);
    console.log(`  Confidence Score: ${evaluation.confidenceScore} / 100`);
    console.log(`  Justification: ${evaluation.explanation}\n`);

    if (evaluation.confidenceScore >= MIN_CONFIDENCE_THRESHOLD) {
        console.log(`✅ GUARD PASSED (Score >= ${MIN_CONFIDENCE_THRESHOLD})`);
        console.log(`FINAL RESPONSE TO THE USER: ${generatedResponse}`);
    } else {
        console.log(`❌ GUARD FAILED (Score < ${MIN_CONFIDENCE_THRESHOLD})`);
        console.log(`FINAL RESPONSE TO THE USER: We're sorry, but this information could not be verified with a sufficient level of confidence: (${evaluation.confidenceScore}%).`);
    }
    console.log(`\n${'-'.repeat(50)}\n`);
}


const knowledgeBase = `
The official launch of Claude 4 Sonnet was in May 2025.
Anthropic is headquartered in San Francisco.
Anthropic's principal founder is Dario Amodei.
`;

// Test 1: Factual Information (MUST PASS)
await runConfidenceGuardrail("When was Claude 4 Sonnet released?", knowledgeBase);

// Test 2: Missing Information (MUST PASS as "Don't Know", Score 95)
await runConfidenceGuardrail("What is the name of Anthropic's CEO?", knowledgeBase);

// Test 3: Hallucination-Inducing Question
// Note: The first prompt should already attempt to prevent the hallucination.
// If the model hallucinates, the Guardrail should catch it.
await runConfidenceGuardrail("What did co-founder Ben Mann say about the future of AI in 2026?", knowledgeBase);