# DynamoDB AI Handler

An intelligent command-line interface that combines OpenAI's GPT-4 with AWS DynamoDB operations. This TypeScript application enables natural language queries to interact with DynamoDB tables, providing a conversational interface for database operations.

## Features

- **Natural Language Interface**: Query DynamoDB using conversational English
- **Multiple Operation Modes**: Interactive CLI and one-time query execution
- **Built-in Tools**:
  - `get_item`: Retrieve specific items by partition key (PK) and optional sort key (SK)
  - `query_table`: Query tables with PK and optional SK prefix filtering
  - `sum_property`: Calculate sums of numeric properties from query results
  - `format_timestamp`: Convert between milliseconds timestamps and human-readable dates
- **Debug Mode**: Verbose logging for troubleshooting
- **Type Safety**: Full TypeScript implementation with strict typing

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AWS credentials configured
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dynamodb-ai-handler
```

2. Install dependencies:
```bash
npm ci
```

3. Set up environment variables:
```bash
# Required
export OPENAI_API_KEY="your-openai-api-key"

# Optional (uses AWS default profile if not set)
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="your-aws-access-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
```

## Usage

### Interactive Mode

Start the interactive CLI:
```bash
npm run dev
```

Available commands in interactive mode:
- Type your queries in natural language
- `clear` - Clear conversation history
- `exit` or `quit` - Exit the program

### One-Time Query Mode

Execute a single query and exit:
```bash
npm run dev -- --onetimequery "Find threat scores for buyer 5491226"
```

### Debug Mode

Enable debug logging:
```bash
# Interactive mode with debug
npm run dev -- --debug

# One-time query with debug (enabled by default)
npm run dev -- --onetimequery "Your query here"
```

## Supported Table Structures

### Auth Table

#### Buyer Activity Records
- **Purpose**: Track buyer activities
- **PK Format**: `ACTIVITY#VENDOR#{vendor_id}#BUYER#{buyer_id}`
- **Example**: `ACTIVITY#VENDOR#292#BUYER#5491226`

#### Login Accounts
- **Purpose**: Store buyer login accounts
- **PK Format**: `AUTH#VENDOR#{vendor_id}`
- **SK Format**: `EMAIL#{email}`
- **Example**: PK=`AUTH#VENDOR#123`, SK=`EMAIL#user@example.com`

### Shield Table

#### Threat Scores
- **Purpose**: Track buyer threat score events
- **PK Format**: `THREAT_SCORE#{buyer_id}`
- **SK Format**: `EVENT#{sequence_number}`
- **Example**: PK=`THREAT_SCORE#5491226`, SK=`EVENT#001`
- **Note**: Events are returned in chronological order (oldest first)

## Example Queries

```bash
# Find buyer activities
"Find activities for vendor 292 and buyer 5491226"

# Find login accounts
"Find login accounts for vendor 123"
"Find login for vendor 123 with email user@example.com"

# Find threat scores with automatic sum calculation
"Find threat scores for buyer 5491226"

# Format timestamps
"Convert timestamp 1737066557123 to readable format"
"What is the timestamp for 2025-01-15T10:30:00Z?"
```

## Project Structure

```
src/
├── types.ts          # TypeScript interfaces and type definitions
├── dynamodb-tool.ts  # DynamoDB client wrapper for read operations
├── ai-handler.ts     # OpenAI integration and tool orchestration
└── index.ts          # CLI entry point and user interface
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Linting
```bash
# Run linter and type checking
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Git Workflow

This project follows a PR-based workflow:

1. Always update main first:
```bash
git checkout main
git pull origin main
npm ci
```

2. Create feature branch:
```bash
git checkout -b feature/your-feature-name
```

3. Make changes and commit:
```bash
git add .
git commit -m "Your commit message"
```

4. Push to remote:
```bash
git push origin feature/your-feature-name
```

5. Create and merge PR:
```bash
gh pr create --title "Feature Description" --body "Details"
gh pr merge --squash --delete-branch
```

6. Update local main:
```bash
git checkout main
git pull origin main
npm ci
```

## Configuration

The application uses the following configuration:

- **Model**: GPT-4.1-mini (optimized for speed and cost)
- **AWS SDK**: v3 with DynamoDB Document Client
- **Region**: Configurable via `AWS_REGION` environment variable
- **Timeout**: No specific timeout limits for operations

## Error Handling

The application includes comprehensive error handling:
- Missing API keys trigger clear error messages
- Failed DynamoDB operations provide detailed error information
- Tool execution errors are caught and reported to the AI for recovery
- Invalid queries receive helpful feedback

## Security Notes

- Never commit API keys or AWS credentials
- Use environment variables or AWS IAM roles for authentication
- The tool only supports read operations (get_item and query_table)
- No write operations are implemented for safety

## License

MIT