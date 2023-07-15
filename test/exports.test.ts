import { getModeration, failsModeration, getCompletion, generateMarkdown, generateMarkdownAndSaveToFile } from "../src/index";
import fs from "fs";
import { parseMarkdown, getDateString } from "../src/helpers";
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
    assert.strictEqual(result, false);
  });
});

describe("getCompletion", async () => {
  it("should return a promise that resolves to the requested completion (a string) from the OpenAI API createCompletion endpoint", async () => {
    const prompt = "This is a test";
    const result = await getCompletion(prompt);
    assert.strictEqual(typeof result, "string");
  });
});

describe("generateMarkdown", async () => {
  it("should return a promise that resolves to a string representation of a markdown file, generated by the OpenAI API", async () => {
    const userPrompt = "This is a test";
    const result = await generateMarkdown(userPrompt);
    assert.strictEqual(typeof result, "string");
  });

  it("should return a promise that resolves to a string representation of a markdown file, generated by the OpenAI API, with front matter that contains any data passed with the 'meta' option", async () => {
    const userPrompt = "This is a test";
    const result = await generateMarkdown(userPrompt, {
      meta: {
        title: "Test",
        description: "This is a test",
        date: "fakeDate"
      },
    });
    assert.strictEqual(typeof result, "string");
    const {meta, content} = parseMarkdown(result);
    assert.strictEqual(meta.title, "Test");
    assert.strictEqual(meta.description, "This is a test");
    assert.strictEqual(meta.date, "fakeDate");
    assert(content.length);
  });

  it("should return a promise that resolves to a string representation of a markdown file, generated by the OpenAI API, with front matter", async () => {
    const userPrompt = "This is a test";
    const result = await generateMarkdown(userPrompt, {
      meta: {
        title: "Test",
        description: "This is a test",
      },
      frontMatterToGenerate: ["date"],
    });
    assert.strictEqual(typeof result, "string");
    const {meta, content} = parseMarkdown(result);
    assert.strictEqual(meta.title, "Test");
    assert.strictEqual(meta.description, "This is a test");
    assert.strictEqual(meta.date, getDateString());
    assert(content.length);
  });

  it("should return a promise that resolves to a string representation of a markdown file, generated by the OpenAI API, with front matter, and a title generated by the AI", async () => {
    const userPrompt = "This is a test";
    const result = await generateMarkdown(userPrompt, {
      meta: {
        description: "This is a test",
      },
      frontMatterToGenerate: ["title", "date"],
      temperature: 0,
    });
    assert.strictEqual(typeof result, "string");
    const {meta, content} = parseMarkdown(result);
    assert.strictEqual(typeof meta.title, "string");
    assert(meta.title.length);
    assert.strictEqual(meta.description, "This is a test");
    assert.strictEqual(meta.date, getDateString());
    assert(content.length);
  });
});

describe("generateMarkdownAndSaveToFile", async () => {
  it("should return a promise that resolves to a string representation of a markdown file, generated by the OpenAI API, and saves it to a file", async () => {
    const userPrompt = "This is a test";
    const testTitle = "Test title with spaces & special characters!@#$%^*()";
    const result = await generateMarkdownAndSaveToFile(userPrompt, {
      meta: {
        title: testTitle,
        description: "This is a test",
      },
      frontMatterToGenerate: ["date"],
    });
    assert.strictEqual(typeof result, "string");
    const {meta, content} = parseMarkdown(result);
    assert.strictEqual(meta.title, testTitle);
    assert.strictEqual(meta.description, "This is a test");
    assert.strictEqual(meta.date, getDateString());
    assert(content.length);
    assert(fs.existsSync("temp/Test-title-with-spaces-and-special-characters.md"));
    const fileContents = fs.readFileSync("temp/Test-title-with-spaces-and-special-characters.md", "utf8");
    const {meta: fileMeta, content: fileContent} = parseMarkdown(fileContents);
    assert.strictEqual(fileMeta.title, testTitle);
    assert.strictEqual(fileMeta.description, "This is a test");
    assert.strictEqual(fileMeta.date, getDateString());
    assert(fileContent.length);
    fs.unlinkSync("temp/Test-title-with-spaces-and-special-characters.md");
  });
});
