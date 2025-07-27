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
- `OPENAI_API_KEY`: OpenAI API key (required) - read from system environment
- `AWS_REGION`: AWS region (default: us-east-1) - read from system environment or defaults
- AWS credentials: Uses AWS CLI default profile or environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)

## NPM Scripts
- `npm run dev`: Development mode (using tsx)
- `npm start`: Production mode (using tsx)
- `npm ci`: Clean install dependencies (used in workflow)

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

## Shield Table Structure (Table: "Shield")

### Buyer Threat Score Search
- **Purpose**: Get buyer threat score events in chronological order
- **PK Format**: `THREAT_SCORE#{buyer_id}`
- **SK Format**: `EVENT#{seq}`
- **Example**: PK=`THREAT_SCORE#5491226`, SK=`EVENT#001`
- **Usage**: Use query_table with tableName="Shield" and pk=`THREAT_SCORE#{buyer_id}` to get all threat score events for a buyer
- **Sort Order**: Ascending (oldest events first) - controlled by ScanIndexForward: true

## Coding Rules
- All code written in TypeScript
- Use strict mode
- Error handling with try-catch blocks
- Follow OpenAI's ChatCompletionMessageParam type
- Use AWS SDK v3

## Git Rules

### PR-Based Workflow (MANDATORY)
1. **UPDATE MAIN FIRST**: Before creating feature branch, pull latest main and run npm ci
2. **NEVER COMMIT DIRECTLY TO MAIN**: All changes must go through Pull Requests
3. **Feature Branch Creation**: Create feature branches with descriptive names
4. **Push to Remote**: `git push origin <feature-branch>`
5. **Create PR**: Use GitHub CLI or web interface to create Pull Request
6. **Immediate Squash Merge**: Merge PR immediately using squash merge
7. **Pull Latest Main**: Always pull remote main after merging and run npm ci

### Detailed Workflow Steps
```bash
# 0. MANDATORY: Before creating any new feature branch, ensure main is up-to-date
# This prevents merge conflicts and ensures consistent dependencies
git checkout main
git pull origin main
npm ci

# 1. Create feature branch
git checkout -b feature-descriptive-name

# 2. Auto-install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then npm ci; fi

# 3. Make changes and commit
git add .
git commit -m "Descriptive commit message"

# 4. Push to remote
git push origin feature-descriptive-name

# 5. Create PR using GitHub CLI
gh pr create --title "Feature Description" --body "Detailed description"

# 6. Merge PR with squash (use GitHub web interface or CLI)
gh pr merge --squash --delete-branch

# 7. Switch to main and pull latest
# Always run npm ci after pulling to ensure dependencies are up-to-date
git checkout main
git pull origin main
npm ci
```

### Dependency Management Rule
- **NPM CI AUTOMATION**: When creating a new branch, if `node_modules` directory doesn't exist locally, automatically run `npm ci`
- This ensures all dependencies are properly installed before starting development
- Use `npm ci` instead of `npm install` for consistent, reproducible builds based on package-lock.json

### Legacy Rules (DEPRECATED - Use PR workflow instead)
- ~~**MAIN BRANCH PUSH RULE**: Always push main branch changes to upstream~~
- ~~After merging to main, immediately run: `git push origin main`~~
- **SQUASH MERGE RULE**: Always squash branch commits when merging to main
- This keeps main branch history clean with one commit per feature
- This rule applies to all projects consistently

## How to Run
1. Ensure `OPENAI_API_KEY` is set in your environment variables
2. AWS credentials should be configured via AWS CLI (`aws configure`) or environment variables
3. Development mode: `npm run dev`
4. Production: `npm start`

## Type Checking
TypeScript files are executed directly using tsx. No build step required.

## Important Notes
- Program exits if OpenAI API key is missing from environment variables
- AWS credentials automatically loaded from ~/.aws/credentials or environment variables
- All DynamoDB operations are asynchronous
- JSON serialization/deserialization when calling AI tools
- No .env file dependency - uses system environment variables directly