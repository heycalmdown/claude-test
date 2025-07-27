# DynamoDB AI Handler - Claude Reference

## Project Overview
AI handler with DynamoDB tool access capability. Written in TypeScript for type safety.

## Architecture
- **DynamoDBTool**: Read operations class wrapping AWS DynamoDB SDK (get and query only)
- **AIHandler**: Handler connecting OpenAI API with DynamoDB tools
- **Types**: All interface and type definitions

## File Structure
```
src/
├── types.ts          # Type definitions (DynamoDBKey, DynamoDBItem, ChatMessage, etc.)
├── dynamodb-tool.ts  # DynamoDB read operations class (get and query only)
├── ai-handler.ts     # OpenAI and DynamoDB tool connection class
└── index.ts          # Entry point
```

## Environment Variables
- `OPENAI_API_KEY`: OpenAI API key (required)
- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

## NPM Scripts
- `npm run dev`: Development mode (using ts-node)
- `npm start`: Production mode (using ts-node)

## DynamoDB Tool Functions
1. **get_item**: Get item from table using pk and optional sk
2. **query_table**: Query table using pk and optional sk prefix

## Auth Table Structure (Table: "Auth")

### Buyer Activity Search
- **Purpose**: Search for buyer activities
- **PK Format**: `ACTIVITY#VENDOR#{vendor_id}#BUYER#{buyer_id}`
- **Example**: `ACTIVITY#VENDOR#292#BUYER#5491226`
- **Usage**: Use query_table with this PK to get all activities for a specific buyer

### Buyer Login Account Search  
- **Purpose**: Search for buyer login accounts
- **PK Format**: `AUTH#VENDOR#{vendor_id}`
- **SK Format**: `EMAIL#{email_id}`
- **Example**: PK=`AUTH#VENDOR#123`, SK=`EMAIL#user@example.com`
- **Usage**: Use query_table with PK and optional SK prefix to find login accounts

## Coding Rules
- All code written in TypeScript
- Use strict mode
- Error handling with try-catch blocks
- Follow OpenAI's ChatCompletionMessageParam type
- Use AWS SDK v3

## Git Rules
- **MAIN BRANCH PUSH RULE**: Always push main branch changes to upstream
- After merging to main, immediately run: `git push origin main`
- **SQUASH MERGE RULE**: Always squash branch commits when merging to main
- Use `git merge --squash <branch>` to create single commit without merge commits
- This keeps main branch history clean with one commit per feature
- This rule applies to all projects consistently

## How to Run
1. Set environment variables: `cp .env.example .env`
2. Development mode: `npm run dev`
3. Production: `npm start`

## Type Checking
TypeScript files are executed directly using ts-node. No build step required.

## Important Notes
- Program exits if OpenAI API key is missing
- AWS credentials use environment variables or AWS CLI profile
- All DynamoDB operations are asynchronous
- JSON serialization/deserialization when calling AI tools