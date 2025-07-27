import { DynamoDBItem } from './types';
export declare class DynamoDBTool {
    private client;
    private docClient;
    constructor(region?: string);
    getItem(tableName: string, pk: string, sk?: string): Promise<DynamoDBItem | undefined>;
    queryTable(tableName: string, pk: string, sk?: string, limit?: number): Promise<DynamoDBItem[]>;
}
//# sourceMappingURL=dynamodb-tool.d.ts.map