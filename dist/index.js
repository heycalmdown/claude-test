"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const readline = __importStar(require("readline"));
const ai_handler_1 = require("./ai-handler");
dotenv.config();
async function main() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('Error: OPENAI_API_KEY environment variable is required');
        process.exit(1);
    }
    const aiHandler = new ai_handler_1.AIHandler(apiKey, process.env.AWS_REGION || 'ap-southeast-1');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const messages = [
        {
            role: "system",
            content: `You are a helpful assistant with access to DynamoDB operations. You can get items by PK/SK and query tables by PK with optional SK prefix.

IMPORTANT: You have access to two DynamoDB tools:
1. get_item: Get a specific item using PK and optional SK
2. query_table: Query items by PK with optional SK prefix

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

USAGE EXAMPLES:
- "Find buyer activities for vendor 292 and buyer 5491226" → query_table(tableName="Auth", pk="ACTIVITY#VENDOR#292#BUYER#5491226")
- "Find login accounts for vendor 123" → query_table(tableName="Auth", pk="AUTH#VENDOR#123")  
- "Find login account for vendor 123 with email user@example.com" → query_table(tableName="Auth", pk="AUTH#VENDOR#123", sk="EMAIL#user@example.com")

Always use the exact PK/SK format specified above. When users mention vendor/buyer IDs or emails, construct the proper key format.`
        }
    ];
    console.log('DynamoDB AI Handler CLI');
    console.log('Available commands:');
    console.log('- Buyer Activity: "Find activities for vendor X buyer Y"');
    console.log('- Login Account: "Find login for vendor X" or "Find login for vendor X email Y"');
    console.log('- Type "exit" or "quit" to quit');
    console.log('- Type "clear" to clear conversation history');
    console.log('');
    const askQuestion = () => {
        rl.question('You: ', async (input) => {
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
                    role: "user",
                    content: trimmedInput
                });
                console.log('Thinking...');
                const response = await aiHandler.chat(messages);
                const aiResponse = response.choices[0].message.content;
                console.log(`AI: ${aiResponse}`);
                console.log('');
                // Add AI response to conversation history
                messages.push({
                    role: "assistant",
                    content: aiResponse || ""
                });
                askQuestion();
            }
            catch (error) {
                console.error('Error:', error.message);
                askQuestion();
            }
        });
    };
    askQuestion();
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map