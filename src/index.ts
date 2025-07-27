import * as readline from 'readline';
import { AIHandler } from './ai-handler';
import { ChatMessage } from './types';

const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant with access to DynamoDB operations. You can get items by PK/SK and query tables by PK with optional SK prefix.

IMPORTANT: You have access to these tools:
1. get_item: Get a specific item using PK and optional SK
2. query_table: Query items by PK with optional SK prefix
3. sum_property: Calculate the sum of a numeric property from an array of objects

AUTH TABLE STRUCTURE (Table name: "Auth"):

## Buyer Activity Search
- Purpose: Search for buyer activities
- PK format: ACTIVITY#VENDOR#{vendor_id}#BUYER#{buyer_id}
- Example: ACTIVITY#VENDOR#292#BUYER#5491226
- Use query_table with this PK to get all activities for a specific buyer

## Buyer Login Account Search  
- Purpose: Search for buyer login accounts
- PK format: AUTH#VENDOR#{vendor_id}
- SK format: EMAIL#{email_id}
- Example: PK="AUTH#VENDOR#123", SK="EMAIL#user@example.com"
- Use query_table with PK and optional SK prefix to find login accounts

SHIELD TABLE STRUCTURE (Table name: "Shield"):

## Buyer Threat Score Search
- Purpose: Get buyer threat score events in chronological order
- PK format: THREAT_SCORE#{buyer_id}
- SK format: EVENT#{seq}
- Example: PK="THREAT_SCORE#5491226", SK="EVENT#001"
- Use query_table with tableName="Shield", pk="THREAT_SCORE#{buyer_id}", and sk="EVENT#" to get only threat score events for a buyer
- Sort Order: Ascending (oldest events first) - controlled by ScanIndexForward: true
- After displaying the threat score events, use sum_property tool to calculate the total threat score by summing the score property from the query results

USAGE EXAMPLES:
- "Find buyer activities for vendor 292 and buyer 5491226" → query_table(tableName="Auth", pk="ACTIVITY#VENDOR#292#BUYER#5491226")
- "Find login accounts for vendor 123" → query_table(tableName="Auth", pk="AUTH#VENDOR#123")  
- "Find login account for vendor 123 with email user@example.com" → query_table(tableName="Auth", pk="AUTH#VENDOR#123", sk="EMAIL#user@example.com")
- "Find threat scores for buyer 5491226" → query_table(tableName="Shield", pk="THREAT_SCORE#5491226", sk="EVENT#") then sum_property(data=query_result, property="score")

Always use the exact PK/SK format specified above. When users mention vendor/buyer IDs or emails, construct the proper key format.`;

export async function handleOneTimeQuery(aiHandler: AIHandler, query: string, systemPrompt: string = DEFAULT_SYSTEM_PROMPT): Promise<void> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: query,
    },
  ];

  try {
    console.log(`Processing query: ${query}`);
    console.log('Thinking...');
    const response = await aiHandler.chat(messages);
    const aiResponse = response.choices[0].message.content;

    console.log(`Result: ${aiResponse}`);
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  const aiHandler = new AIHandler(
    apiKey,
    process.env.AWS_REGION,
  );

  // Check if command line argument is provided for one-time execution
  const args = process.argv.slice(2);
  if (args.length > 0 && args[0] === '--onetimequery') {
    const query = args.slice(1).join(' ');
    if (query) {
      await handleOneTimeQuery(aiHandler, query);
      return;
    }
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: DEFAULT_SYSTEM_PROMPT,
    },
  ];

  console.log('DynamoDB AI Handler CLI');
  console.log('Available commands:');
  console.log('- Buyer Activity: "Find activities for vendor X buyer Y"');
  console.log('- Login Account: "Find login for vendor X" or "Find login for vendor X email Y"');
  console.log('- Type "exit" or "quit" to quit');
  console.log('- Type "clear" to clear conversation history');
  console.log('');

  const askQuestion = () => {
    rl.question('You: ', async(input) => {
      const trimmedInput = input.trim();

      if (trimmedInput.toLowerCase() === 'exit' || trimmedInput.toLowerCase() === 'quit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      if (trimmedInput.toLowerCase() === 'clear') {
        messages.splice(1); // Keep only system message
        console.log('Conversation history cleared.');
        askQuestion();
        return;
      }

      if (!trimmedInput) {
        askQuestion();
        return;
      }

      try {
        messages.push({
          role: 'user',
          content: trimmedInput,
        });

        console.log('Thinking...');
        const response = await aiHandler.chat(messages);
        const aiResponse = response.choices[0].message.content;

        console.log(`AI: ${aiResponse}`);
        console.log('');

        // Add AI response to conversation history
        messages.push({
          role: 'assistant',
          content: aiResponse || '',
        });

        askQuestion();
      } catch (error) {
        console.error('Error:', (error as Error).message);
        askQuestion();
      }
    });
  };

  askQuestion();
}

if (require.main === module) {
  main();
}
