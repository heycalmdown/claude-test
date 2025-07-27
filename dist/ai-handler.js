"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIHandler = void 0;
const openai_1 = __importDefault(require("openai"));
const dynamodb_tool_1 = require("./dynamodb-tool");
class AIHandler {
    constructor(apiKey, region = 'us-east-1') {
        this.openai = new openai_1.default({ apiKey });
        this.dynamoTool = new dynamodb_tool_1.DynamoDBTool(region);
        this.tools = [
            {
                type: "function",
                function: {
                    name: "get_item",
                    description: "Get an item from DynamoDB table using pk and optional sk",
                    parameters: {
                        type: "object",
                        properties: {
                            tableName: { type: "string", description: "The DynamoDB table name" },
                            pk: { type: "string", description: "The partition key" },
                            sk: { type: "string", description: "The sort key (optional)" }
                        },
                        required: ["tableName", "pk"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "query_table",
                    description: "Query a DynamoDB table using pk and optional sk prefix",
                    parameters: {
                        type: "object",
                        properties: {
                            tableName: { type: "string", description: "The DynamoDB table name" },
                            pk: { type: "string", description: "The partition key" },
                            sk: { type: "string", description: "The sort key prefix (optional)" },
                            limit: { type: "number", description: "Maximum number of items to return" }
                        },
                        required: ["tableName", "pk"]
                    }
                }
            }
        ];
    }
    async handleToolCall(toolCall) {
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args);
        console.log(`🔧 Tool Call: ${name}`);
        console.log(`📋 Arguments:`, parsedArgs);
        switch (name) {
            case 'get_item':
                console.log(`🔍 Getting item from ${parsedArgs.tableName} with pk: ${parsedArgs.pk}, sk: ${parsedArgs.sk}`);
                const getResult = await this.dynamoTool.getItem(parsedArgs.tableName, parsedArgs.pk, parsedArgs.sk);
                console.log(`📄 Get result:`, getResult);
                return getResult;
            case 'query_table':
                console.log(`🔍 Querying table ${parsedArgs.tableName} with pk: ${parsedArgs.pk}, sk: ${parsedArgs.sk}, limit: ${parsedArgs.limit}`);
                const queryResult = await this.dynamoTool.queryTable(parsedArgs.tableName, parsedArgs.pk, parsedArgs.sk, parsedArgs.limit);
                console.log(`📄 Query result count: ${queryResult.length}`);
                console.log(`📄 Query result:`, queryResult);
                return queryResult;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    async chat(messages) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages,
                tools: this.tools,
                tool_choice: "auto"
            });
            const message = response.choices[0].message;
            console.log(`🤖 AI wants to use tools: ${message.tool_calls ? 'YES' : 'NO'}`);
            if (message.tool_calls) {
                const toolResults = [];
                for (const toolCall of message.tool_calls) {
                    try {
                        const result = await this.handleToolCall(toolCall);
                        toolResults.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            content: JSON.stringify(result)
                        });
                    }
                    catch (error) {
                        console.log(`❌ Tool call error:`, error);
                        toolResults.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            content: JSON.stringify({ error: error.message })
                        });
                    }
                }
                const followUpMessages = [
                    ...messages,
                    message,
                    ...toolResults
                ];
                return await this.openai.chat.completions.create({
                    model: "gpt-4",
                    messages: followUpMessages
                });
            }
            return response;
        }
        catch (error) {
            throw new Error(`AI chat failed: ${error.message}`);
        }
    }
}
exports.AIHandler = AIHandler;
//# sourceMappingURL=ai-handler.js.map