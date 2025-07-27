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

      // Auto-calculate threat score sum if this is a threat score query
      if (parsedArgs.tableName === 'Shield' && parsedArgs.pk?.startsWith('THREAT_SCORE#')) {
        const sum = queryResult.reduce((total: number, item: any) => {
          const value = item.amount;
          return total + (typeof value === 'number' ? value : 0);
        }, 0);
        console.log(`🧮 Auto-calculated threat score total: ${sum}`);
        return { events: queryResult, totalThreatScore: sum };
      }

      return queryResult;
    case 'sum_property':
      console.log(
        `🧮 Summing property '${parsedArgs.property}' from array of ${parsedArgs.data.length} objects`,
      );
      const sum = parsedArgs.data.reduce((total: number, item: any) => {
        const value = item[parsedArgs.property];
        return total + (typeof value === 'number' ? value : 0);
      }, 0);
      console.log(`📊 Sum result: ${sum}`);
      return sum;
    default:
      throw new Error(`Unknown tool: ${name}`);
    }
  }

  async chat(
    messages: ChatMessage[],
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: this.tools,
        tool_choice: 'auto',
      });

      const message = response.choices[0].message;

      console.log(
        `🤖 AI wants to use tools: ${message.tool_calls ? 'YES' : 'NO'}`,
      );

      if (message.tool_calls) {
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

        const followUpMessages: ChatMessage[] = [
          ...messages,
          message as ChatMessage,
          ...(toolResults as ChatMessage[]),
        ];

        return await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: followUpMessages,
        });
      }

      return response;
    } catch (error) {
      throw new Error(`AI chat failed: ${(error as Error).message}`);
    }
  }
}
