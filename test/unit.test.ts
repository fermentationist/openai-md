import { getModeration, failsModeration, getCompletion } from "../src/index";
import assert from "assert";

describe("getModeration", async () => {
  it("should return a promise that resolves to the response from the OpenAI API createModeration endpoint", async () => {
    const input = "This is a test";
    const result = await getModeration(input);
    const resultKeys = Object.keys(result);
    assert(resultKeys.includes("categories"));
    assert(resultKeys.includes("category_scores"));
    assert(resultKeys.includes("flagged"));
  });
});

describe("failsModeration", async () => {
  it("should return a promise that resolves to false if the input passes moderation", async () => {
    const input = "This is a test";
    const result = await failsModeration(input);
    assert(typeof result === "boolean");
  });
});

describe("getCompletion", async () => {
  it("should return a promise that resolves to the requested completion (a string) from the OpenAI API createCompletion endpoint", async () => {
    const prompt = "This is a test";
    const result = await getCompletion(prompt);
    assert.strictEqual(typeof result, "string");
  });
});
