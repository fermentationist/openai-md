import "dotenv/config";
import {
  Configuration,
  CreateModerationResponseResultsInner,
  OpenAIApi,
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

// getCompletion returns a promise that resolves to the response from the OpenAI API createCompletion endpoint
export async function getCompletion(
  prompt: string,
  {
    temperature = 0.95,
    maxTokens,
    model,
    apiKey,
  }: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    apiKey?: string;
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
    console.log("Getting completion from OpenAI API...");
    const wordCount = prompt.split(/[\s,.-]/).length;
    const estimatedPromptTokens = Math.round(wordCount * 1.5);
    const difference = 2048 - estimatedPromptTokens;
    performance.mark("start");
    const response = await openai.createCompletion({
      model: model ?? "text-davinci-003",
      prompt,
      max_tokens: maxTokens ?? difference,
      temperature,
    });
    console.log("\nGPT model used:", response?.data?.model);
    console.log("Total tokens:", response?.data?.usage?.total_tokens);
    return response?.data?.choices && response.data.choices[0].text;
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
