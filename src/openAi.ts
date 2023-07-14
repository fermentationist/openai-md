import "dotenv/config";
import { get } from "http";
import {
  Configuration,
  CreateModerationResponseResultsInner,
  OpenAIApi,
  ChatCompletionRequestMessageRoleEnum,
} from "openai";

export const DEFAULT_POLICED_CATEGORIES = [
  "hate",
  "hate/threatening",
  // "self-harm",
  // "sexual",
  "sexual/minors",
  // "violence",
  // "violence/graphic",
];

const DEFAULT_MODEL = "gpt-3.5-turbo-0613";

// initialize OpenAI API
let configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
let openai = new OpenAIApi(configuration);

// getModeration returns a promise that resolves to the response from the OpenAI API createModeration endpoint
export async function getModeration(
  input: string,
  apiKey?: string
): Promise<CreateModerationResponseResultsInner> {
  if (apiKey) {
    // if an API key is passed in, use it
    configuration = new Configuration({
      apiKey,
    });
    openai = new OpenAIApi(configuration);
  }
  const response = await openai.createModeration({ input });
  const results = response?.data?.results?.[0];
  return results;
}

// failsModeration returns the category of violation (a string) if the input fails moderation, or false if it passes
export async function failsModeration(
  input: string,
  {
    policedCategories = DEFAULT_POLICED_CATEGORIES,
    apiKey,
  }: { policedCategories?: string[]; apiKey?: string } = {}
) {
  const { categories } = await getModeration(input, apiKey);
  for (const category in categories) {
    const isInViolation =
      categories[category as keyof typeof categories] &&
      policedCategories.includes(category);
    if (isInViolation) {
      return category;
    }
  }
  return false;
}

function getSystemPrompt(frontMatterToGenerate: string[] = []) {
  const frontMatterToGenerateCopy = [...frontMatterToGenerate];
  const lastKey = frontMatterToGenerateCopy.pop();
  // if there is only one key, we don't need to use the word "and"
  const frontMatterDescription = frontMatterToGenerateCopy.length
    ? `${frontMatterToGenerateCopy.join(", ")}${
        lastKey ? ` and ${lastKey}` : ""
      }`
    : `${lastKey ?? ""}`;
  // if there is no front matter to generate, don't include the front matter part of the prompt
  const prompt = `The assistant writes blog posts in markdown format. The assistant creates markdown files that include ${
    frontMatterDescription
      ? `front matter with ${frontMatterDescription}, and `
      : ``
  }content that uses a single main heading and section headings, lists and code blocks (only when the prompt explicitly mentions code) where appropriate, about whatever the subject of the user prompt is.`;
  return prompt;
}

// getCompletion returns a promise that resolves to the response from the OpenAI API createCompletion endpoint
export async function getCompletion(
  prompt: string,
  {
    temperature = 0.95,
    maxTokens,
    model,
    apiKey,
    frontMatterToGenerate,
  }: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    apiKey?: string;
    frontMatterToGenerate?: string[];
  } = {}
) {
  if (apiKey) {
    // if an API key is passed in, use it
    configuration = new Configuration({
      apiKey,
    });
    openai = new OpenAIApi(configuration);
  }
  try {
    const messages = [
      {
        role: "system" as ChatCompletionRequestMessageRoleEnum,
        content: getSystemPrompt(frontMatterToGenerate),
      },
      {
        role: "user" as ChatCompletionRequestMessageRoleEnum,
        content: prompt,
      },
    ];
    console.log("Getting completion from OpenAI API...");
    const wordCount = prompt.split(/[\s,.-]/).length;
    const estimatedPromptTokens = Math.round(wordCount * 1.5);
    const difference = 2048 - estimatedPromptTokens;
    performance.mark("start");
    const response = await openai.createChatCompletion({
      model: model ?? DEFAULT_MODEL,
      messages,
      max_tokens: maxTokens ?? difference,
      temperature,
    });
    console.log("\nGPT model used:", response?.data?.model);
    console.log("Total tokens:", response?.data?.usage?.total_tokens);
    return (
      response?.data?.choices && response.data.choices[0]?.message?.content
    );
  } catch (error) {
    console.log("Error getting completion from OpenAI API:");
    console.error(error);
  } finally {
    performance.mark("end");
    const measurement = performance.measure("createCompletion", "start", "end");
    console.log(
      "Time to run: ",
      parseFloat((measurement.duration / 1000).toFixed(2)),
      "s"
    );
  }
}
