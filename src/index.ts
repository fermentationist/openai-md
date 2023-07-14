#! /usr/bin/env node
import "dotenv/config";
import * as fs from "fs";
import CLISpinner from "./spinner.js";
import * as openAi from "./openAi.js";
import {
  containsFrontMatter,
  parseMarkdown,
  getFilename,
  frontMatterObjectToString,
  getDateString,
} from "./helpers.js";

export const getCompletion = openAi.getCompletion;
export const getModeration = openAi.getModeration;
export const failsModeration = openAi.failsModeration;
export const DEFAULT_POLICED_CATEGORIES = openAi.DEFAULT_POLICED_CATEGORIES;

// get environment variables
const OUTPUT_DIRECTORY = process.env.OAIMD_OUTPUT_DIRECTORY || "temp";
const AUTHOR = process.env.OAIMD_AUTHOR;

let tempDirExists: boolean | null = null;

// instantiate CLISpinner
const spinner = new CLISpinner();

// getSystemPrompt returns a string to be used as a prompt for the OpenAI API

// getMarkdownContent returns a string containing a blog post generated by the OpenAI API, in markdown format
async function getMarkdownContent(
  prompt: string,
  {
    temperature,
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
  console.log("Generating markdown content. This may take a minute...");
  spinner.start();
  const completion = await openAi.getCompletion(prompt, {
    temperature,
    maxTokens,
    model,
    apiKey,
    frontMatterToGenerate,
  });
  spinner.stop();
  return completion as string;
}

// updateFrontMatter returns a string representation of a markdown file, with updated front matter
export function updateFrontMatter(
  markdownString: string,
  frontMatter: Record<string, string> = {},
  frontMatterToGenerate: string[] = []
) {
  let updatedMeta: Record<string, string> = {};
  let content = markdownString;
  if (containsFrontMatter(markdownString)) {
    let meta: Record<string, string> = {};
    ({ meta, content } = parseMarkdown(markdownString));
    // remove any front matter keys that we did not ask the AI to generate
    for (const key in meta) {
      if (!frontMatterToGenerate.includes(key)) {
        delete meta[key];
      }
    }
    const metaWithLowerCaseKeys = Object.keys(meta).reduce((output, key) => {
      output[key.toLowerCase()] = meta[key];
      return output;
    }, {} as Record<string, string>);
    updatedMeta = {
      ...metaWithLowerCaseKeys,
      ...frontMatter,
    };
  } else {
    updatedMeta = { ...frontMatter };
  }
  if (frontMatterToGenerate.includes("date")) {
    updatedMeta.date = getDateString();
  }

  if (
    AUTHOR &&
    !frontMatterToGenerate.includes("author") &&
    !frontMatter.author
  ) {
    updatedMeta.author = AUTHOR;
  }
  const updatedFrontMatter = frontMatterObjectToString(updatedMeta);
  return `---\n${updatedFrontMatter}\n---\n${content}`;
}

// writeToFile writes the data to a markdown file on disk
function writeToFile(dirName: string, filename: string, data: string) {
  if (tempDirExists === null) {
    // have not yet checked if directory exists
    tempDirExists = fs.existsSync(dirName);
  }
  if (!tempDirExists) {
    fs.mkdirSync(dirName, { recursive: true });
  }
  return fs.writeFileSync(`${dirName}/${filename}.md`, data, "utf8");
}

// generateMarkdown returns a string representation of a markdown file, generated by the OpenAI API
export async function generateMarkdown(
  userPrompt: string,
  {
    meta = {},
    temperature = 0.95,
    frontMatterToGenerate = [],
    maxTokens,
    model,
    apiKey,
  }: {
    meta?: Record<string, string>;
    temperature?: number;
    frontMatterToGenerate?: string[];
    maxTokens?: number;
    model?: string;
    apiKey?: string;
  } = {}
) {
  const content = await getMarkdownContent(userPrompt, {
    temperature,
    maxTokens,
    model,
    apiKey,
    frontMatterToGenerate,
  });
  let output;
  if (frontMatterToGenerate.length || Object.keys(meta).length) {
    output = updateFrontMatter(content, meta, frontMatterToGenerate);
  } else {
    output = content;
  }
  return output;
}

// generateMarkdownAndSaveToFile calls generateMarkdown and then saves the result to a file
export async function generateMarkdownAndSaveToFile(
  userPrompt: string,
  {
    temperature, // the "temperature" to use when generating an OpenAI completion: a number between 0 and 2, defaults to 0.95
    meta, // an object containing the front matter to be added to the markdown file
    frontMatterToGenerate, // an array containing the keys for front matter values to be generated by the OpenAI API
    outputDirectory, // the directory to save the file to, defaults to "temp"
    filenameKey, // the key in the front matter to use as the filename, defaults to "title",
    filename, // the filename to use, defaults to the value of filenameKey
    maxTokens, // the maximum number of tokens to generate, defaults to the difference between the maximum allowed (2048) and the estimated number of tokens in the prompt
    model, // the model to use, defaults to "davinci"
    apiKey, // the OpenAI API key to use, can also be set using the OPENAI_API_KEY environment variable
  }: {
    temperature?: number;
    meta?: Record<string, string>;
    frontMatterToGenerate?: string[];
    outputDirectory?: string;
    filenameKey?: string;
    filename?: string;
    maxTokens?: number;
    model?: string;
    apiKey?: string;
  } = {}
) {
  const markdownContent = await generateMarkdown(userPrompt, {
    meta,
    temperature,
    frontMatterToGenerate,
    maxTokens,
    model,
    apiKey,
  });
  const nameOfFile =
    filename === undefined || filename === ""
      ? getFilename(markdownContent, filenameKey)
      : filename;
  const dir = outputDirectory || OUTPUT_DIRECTORY;
  writeToFile(dir, nameOfFile, markdownContent);
  console.log("Markdown saved to:", `${dir}/${nameOfFile}.md`);
  return markdownContent;
}

// re-exporting methods in default object for convenience
export default {
  generateMarkdown,
  generateMarkdownAndSaveToFile,
  getCompletion,
  getModeration,
  failsModeration,
  DEFAULT_POLICED_CATEGORIES,
};
