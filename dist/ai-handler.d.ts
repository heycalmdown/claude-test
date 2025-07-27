import OpenAI from 'openai';
import { ChatMessage } from './types';
export declare class AIHandler {
    private openai;
    private dynamoTool;
    private tools;
    constructor(apiKey: string, region?: string);
    private handleToolCall;
    chat(messages: ChatMessage[]): Promise<OpenAI.Chat.Completions.ChatCompletion>;
}
//# sourceMappingURL=ai-handler.d.ts.map