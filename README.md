# DynamoDB AI Handler (TypeScript)

AI handler with DynamoDB tool access capability. Written in TypeScript for type safety.

## Setup

1. Set environment variables:
```bash
cp .env.example .env
```

2. Configure the following values in `.env` file:
- `OPENAI_API_KEY`: OpenAI API key
- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

## Usage

```bash
# Development mode (direct TypeScript execution)
npm run dev

# Build and run
npm run build
npm start

# Build watch mode
npm run watch
```

## Project Structure

```
src/
├── types.ts          # Type definitions
├── dynamodb-tool.ts  # DynamoDB tool class
├── ai-handler.ts     # AI handler class
└── index.ts          # Entry point
```

## Available DynamoDB Tools

- `get_item`: Get item from table using pk and optional sk
- `query_table`: Query table using pk and optional sk prefix

## Example

When you ask the AI "Get user information with pk 'user123' from the users table", the AI will automatically use the appropriate DynamoDB tool to retrieve the data.