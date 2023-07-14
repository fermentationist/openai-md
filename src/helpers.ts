// containsFrontMatter returns true if the markdown string contains front matter (meta) data
export function containsFrontMatter(markdownString: string) {
  if (!markdownString) {
    return false;
  }
  return (
    markdownString.trim().startsWith("---") &&
    (markdownString.match(/---/g) || []).length >= 2
  );
}

// parseMarkdown parses a string representation of a markdown file into a front matter (meta) object and a content string
export function parseMarkdown(markdownString: string) {
  if (!containsFrontMatter(markdownString)) {
    return { meta: {}, content: markdownString };
  }
  const [_, frontMatter, ...contentArray] = markdownString.split("---");
  const content = contentArray.join("---");
  const keyValues = frontMatter?.split("\n");
  const frontMatterObject = (keyValues || []).reduce(
    (output, keyValueString) => {
      const [key, value] = keyValueString.split(": ");
      if (key.trim()) {
        output[key.trim()] = value?.trim();
      }
      return output;
    },
    {} as Record<string, string>
  );
  return { meta: frontMatterObject, content };
}

// slugify returns a slug for use in a URL and as a filename
export function slugify(inputString: string) {
  if (!inputString) {
    return void 0;
  }
  const slug = inputString
    ?.trim()
    .toLowerCase()
    .replace(/[?"'“”‘’.,/[\]{}=+()*^%$#@!]/g, "")
    .replaceAll("&", "and")
    .replaceAll(" ", "-");
  return encodeURIComponent(slug);
}

// getFilename returns a filename for a markdown file. It will based on a value in the front matter ("title", by default), or else the current date
export function getFilename(markdownString: string, frontMatterKey = "title") {
  const { meta } = parseMarkdown(markdownString);
  return (
    (meta[frontMatterKey] && slugify(meta[frontMatterKey])) ?? getDateString()
  );
}

// frontMatterObjectToString returns a string representation of an object, to be used in a markdown file, as front matter
export function frontMatterObjectToString(
  frontMatterObject: Record<string, string>
) {
  const entries = Object.entries(frontMatterObject);
  const outputArray = entries.map(entry => {
    return `${entry[0]}: ${entry[1]}`;
  });
  return outputArray.join("\n");
}

// getDateString returns a string representation of a date, in the format YYYY-MM-DD
export function getDateString(dateObj = new Date(), timeZone?: string) {
  if (typeof dateObj === "string") {
    return dateObj;
  }
  const formattedString = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  });
  const [month, date, year] = formattedString.split("/");
  return `${year}-${month}-${date}`;
}
