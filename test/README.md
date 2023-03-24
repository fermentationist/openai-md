# Testing notes

## Necessary environment variables
- **`OPENAI_API_KEY`** (required) - API key needed to generate content using the OpenAI API
- **`TS_NODE_COMPILER_OPTIONS={"module":"commonjs"}`** (required for dev/testing only) - setting this variable and value is necessary to allow Mocha (test runner) to work with ESModules and TypeScript

## API Usage
Be aware that running these tests will generate content using the OpenAI API. This will count against your API usage and may incur charges. 

## Testability
The tests are liable to be flaky due to the nature of the API. In .mocharc.json, the `timeout` value is set to 30000ms. This seems to be a good value for the tests to pass consistently. If you are experiencing flaky tests, try increasing this value.