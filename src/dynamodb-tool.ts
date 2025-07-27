import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBKey, DynamoDBItem, QueryParams } from './types';

export class DynamoDBTool {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  constructor(region: string = 'ap-southeast-1') {
    this.client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  async getItem(tableName: string, pk: string, sk?: string): Promise<DynamoDBItem | undefined> {
    try {
      const key: Record<string, any> = { PK: pk };
      if (sk) {
        key.SK = sk;
      }
      
      const command = new GetCommand({
        TableName: tableName,
        Key: key
      });
      const response = await this.docClient.send(command);
      return response.Item;
    } catch (error) {
      throw new Error(`Failed to get item: ${(error as Error).message}`);
    }
  }

  async queryTable(tableName: string, pk: string, sk?: string, limit: number = 100): Promise<DynamoDBItem[]> {
    try {
      let keyConditionExpression = 'PK = :pk';
      const expressionAttributeValues: Record<string, any> = { ':pk': pk };
      
      if (sk) {
        keyConditionExpression += ' AND begins_with(SK, :sk)';
        expressionAttributeValues[':sk'] = sk;
      }
      
      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit
      });
      const response = await this.docClient.send(command);
      return response.Items || [];
    } catch (error) {
      throw new Error(`Failed to query table: ${(error as Error).message}`);
    }
  }
}
