import OpenAI from 'openai';
import { DynamoDBTool } from './dynamodb-tool';
import { ChatMessage, ToolCall, Tool, ToolResult } from './types';

export class AIHandler {
  private openai: OpenAI;
  private dynamoTool: DynamoDBTool;
  private tools: Tool[];

  constructor(apiKey: string, region?: string) {
    this.openai = new OpenAI({ apiKey });
    this.dynamoTool = new DynamoDBTool(region);
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'get_item',
          description:
            'Get an item from DynamoDB table using pk and optional sk',
          parameters: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'The DynamoDB table name',
              },
              pk: { type: 'string', description: 'The partition key' },
              sk: { type: 'string', description: 'The sort key (optional)' },
            },
            required: ['tableName', 'pk'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'query_table',
          description: 'Query a DynamoDB table using pk and optional sk prefix',
          parameters: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'The DynamoDB table name',
              },
              pk: { type: 'string', description: 'The partition key' },
              sk: {
                type: 'string',
                description: 'The sort key prefix (optional)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of items to return',
              },
            },
            required: ['tableName', 'pk'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'sum_property',
          description:
            'Calculate the sum of a numeric property from an array of objects',
          parameters: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { type: 'object' },
                description: 'Array of objects to sum',
              },
              property: { type: 'string', description: 'Property name to sum' },
            },
            required: ['data', 'property'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'format_timestamp',
          description:
            'Convert milliseconds timestamp to human-readable date or vice versa',
          parameters: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'number',
                description: 'Milliseconds timestamp to convert to date',
              },
              dateString: {
                type: 'string',
                description: 'Date string to convert to milliseconds timestamp',
              },
              timezone: {
                type: 'string',
                description: 'Timezone for formatting (default: UTC)',
              },
              format: {
                type: 'string',
                description: 'Output format: "iso", "locale", "relative" (default: "iso")',
              },
            },
            required: [],
          },
        },
      },
    ];
  }

  private async handleToolCall(toolCall: ToolCall): Promise<any> {
    const { name, arguments: args } = toolCall.function;
    const parsedArgs = JSON.parse(args);

    console.log(`🔧 Tool Call: ${name}`);
    console.log('📋 Arguments:', parsedArgs);

    switch (name) {
      case 'get_item':
        console.log(
          `🔍 Getting item from ${parsedArgs.tableName} with pk: ${parsedArgs.pk}, sk: ${parsedArgs.sk}`,
        );
        const getResult = await this.dynamoTool.getItem(
          parsedArgs.tableName,
          parsedArgs.pk,
          parsedArgs.sk,
        );
        console.log('📄 Get result:', getResult);
        return getResult;
      case 'query_table':
        console.log(
          `🔍 Querying table ${parsedArgs.tableName} with pk: ${parsedArgs.pk}, sk: ${parsedArgs.sk}, limit: ${parsedArgs.limit}`,
        );
        const queryResult = await this.dynamoTool.queryTable(
          parsedArgs.tableName,
          parsedArgs.pk,
          parsedArgs.sk,
          parsedArgs.limit,
        );
        console.log(`📄 Query result count: ${queryResult.length}`);
        console.log('📄 Query result:', queryResult);
        return queryResult;
      case 'sum_property':
        if (!parsedArgs.data || !Array.isArray(parsedArgs.data)) {
          throw new Error('sum_property requires a valid "data" array parameter');
        }
        if (!parsedArgs.property) {
          throw new Error('sum_property requires a "property" parameter');
        }
        console.log(
          `🧮 Summing property '${parsedArgs.property}' from array of ${parsedArgs.data.length} objects`,
        );
        const sum = parsedArgs.data.reduce((total: number, item: any) => {
          const value = item[parsedArgs.property];
          return total + (typeof value === 'number' ? value : 0);
        }, 0);
        console.log(`📊 Sum result: ${sum}`);
        return sum;
      case 'format_timestamp':
        console.log(`🕒 Formatting timestamp with args:`, parsedArgs);
        
        if (parsedArgs.timestamp) {
          // Convert milliseconds timestamp to human-readable date
          const date = new Date(parsedArgs.timestamp);
          const timezone = parsedArgs.timezone || 'UTC';
          const format = parsedArgs.format || 'iso';
          
          let result: any = {
            timestamp: parsedArgs.timestamp,
            date: date,
            timezone: timezone
          };
          
          switch (format) {
            case 'iso':
              result.formatted = date.toISOString();
              break;
            case 'locale':
              result.formatted = date.toLocaleString('en-US', { 
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              break;
            case 'relative':
              const now = Date.now();
              const diff = now - parsedArgs.timestamp;
              const seconds = Math.floor(diff / 1000);
              const minutes = Math.floor(seconds / 60);
              const hours = Math.floor(minutes / 60);
              const days = Math.floor(hours / 24);
              
              if (days > 0) {
                result.formatted = `${days} day${days === 1 ? '' : 's'} ago`;
              } else if (hours > 0) {
                result.formatted = `${hours} hour${hours === 1 ? '' : 's'} ago`;
              } else if (minutes > 0) {
                result.formatted = `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
              } else {
                result.formatted = `${seconds} second${seconds === 1 ? '' : 's'} ago`;
              }
              break;
          }
          
          console.log(`📅 Timestamp conversion result:`, result);
          return result;
        } else if (parsedArgs.dateString) {
          // Convert date string to milliseconds timestamp
          const date = new Date(parsedArgs.dateString);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date string: ${parsedArgs.dateString}`);
          }
          
          const result = {
            dateString: parsedArgs.dateString,
            timestamp: date.getTime(),
            iso: date.toISOString()
          };
          
          console.log(`📅 Date string conversion result:`, result);
          return result;
        } else {
          throw new Error('format_timestamp requires either "timestamp" or "dateString" parameter');
        }
    default:
      throw new Error(`Unknown tool: ${name}`);
    }
  }

  async chat(
    messages: ChatMessage[],
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      let currentMessages = [...messages];
      let response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: currentMessages,
        tools: this.tools,
        tool_choice: 'auto',
      });

      let message = response.choices[0].message;

      // Continue looping while the AI wants to use tools
      while (message.tool_calls) {
        console.log(
          `🤖 AI wants to use tools: YES (${message.tool_calls.length} tools)`,
        );

        const toolResults: ToolResult[] = [];
        for (const toolCall of message.tool_calls) {
          try {
            const result = await this.handleToolCall(toolCall);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify(result ?? null),
            });
          } catch (error) {
            console.log('❌ Tool call error:', error);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify({ error: (error as Error).message }),
            });
          }
        }

        // Add assistant message and tool results to conversation
        currentMessages = [
          ...currentMessages,
          message as ChatMessage,
          ...(toolResults as ChatMessage[]),
        ];

        // Make another API call with the updated conversation
        response = await this.openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: currentMessages,
          tools: this.tools,
          tool_choice: 'auto',
        });

        message = response.choices[0].message;
      }

      console.log(`🤖 AI wants to use tools: NO - Final answer ready`);
      return response;
    } catch (error) {
      throw new Error(`AI chat failed: ${(error as Error).message}`);
    }
  }
}
