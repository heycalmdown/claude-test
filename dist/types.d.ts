export interface DynamoDBKey {
    PK: string;
    SK?: string;
}
export interface DynamoDBItem {
    [key: string]: any;
}
export interface QueryParams {
    tableName: string;
    pk: string;
    sk?: string;
    limit?: number;
}
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
export type ChatMessage = ChatCompletionMessageParam;
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
export interface Tool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, any>;
            required: string[];
        };
    };
}
export interface ToolResult {
    tool_call_id: string;
    role: 'tool';
    content: string;
}
//# sourceMappingURL=types.d.ts.map