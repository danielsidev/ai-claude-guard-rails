import { anthropic } from "./ai/antrhopic.js";

interface ResultAnalysis {
  category: string;
  summary: string;
  relevanceScore: number; // Guardrail: Must be a number between 1 and 10
}
/**
 * Main function to execute API call with guardrails in prompt.
 * @param textForAnalysis The text that the model should parse.
 */
async function analisarTextoComGuardrail(textForAnalysis: string) {
  const systemPrompt = `You are a content analysis assistant.
        You must parse the text provided by the user and generate a JSON object that ONLY contains the following keys and formats:
        <json_schema>
        {
        "category": "string (e.g., 'Technology', 'News', 'Sports')",
        "summary": "string (a concise summary with a maximum of 50 words)",
        "relevanceScore": "number (an integer EXCLUSIVELY between 1 and 10, where 10 is the most relevant)"
        }
        </json_schema>

        Your response MUST be the JSON object only. Do not include explanatory text, comments, or anything else besides the JSON.
        Analyze this text and return ONLY a valid JSON object, without markdown formatting.
        Do not include \`\`\`json or \`\`\` markers.
        Return the raw JSON only.
        `;
  console.log("-> Sending request to Claude...");
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "{Analyze the following text: \""+textForAnalysis+"\"",
        },
      ],
    });
    const firstBlock = response.content[0];
    let jsonString: string;
    if (firstBlock && firstBlock.type === 'text') {
      jsonString = firstBlock.text.trim();
    } else {
      throw new Error(
        `Claude's output did not start with a text block. Block type found: ${firstBlock?.type}`
      );
    }
    console.log("\n--- Claude's Output ---");
    console.log(jsonString);
    console.log("-----------------------------\n");
    const resultadoBruto: ResultAnalysis = JSON.parse(jsonString);
    if (
      typeof resultadoBruto.category !== "string" ||
      typeof resultadoBruto.summary !== "string" ||
      typeof resultadoBruto.relevanceScore !== "number" ||
      resultadoBruto.relevanceScore < 1 ||
      resultadoBruto.relevanceScore > 10
    ) {
      throw new Error("The template's JSON output failed runtime validation.");
    }

    console.log("✅ Claude's Exit Successfully Validated (Guardrail Passed)!");
    console.log("Structured Final Result:");
    console.log(resultadoBruto);
    return resultadoBruto;

  } catch (error) {
    console.error("❌ Guardrail Fail! An API or validation error occurred:");
    console.error(error);
    return null;
  }
}

// Example
const text="Apple's new M4 processor, built on 3nm technology, promises a 50% increase in graphics rendering speed, making it ideal for video editing professionals.";
analisarTextoComGuardrail(text);