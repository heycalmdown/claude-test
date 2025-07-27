"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBTool = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
class DynamoDBTool {
    constructor(region = 'ap-southeast-1') {
        this.client = new client_dynamodb_1.DynamoDBClient({ region });
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(this.client);
    }
    async getItem(tableName, pk, sk) {
        try {
            const key = { PK: pk };
            if (sk) {
                key.SK = sk;
            }
            const command = new lib_dynamodb_1.GetCommand({
                TableName: tableName,
                Key: key
            });
            const response = await this.docClient.send(command);
            return response.Item;
        }
        catch (error) {
            throw new Error(`Failed to get item: ${error.message}`);
        }
    }
    async queryTable(tableName, pk, sk, limit = 100) {
        try {
            let keyConditionExpression = 'PK = :pk';
            const expressionAttributeValues = { ':pk': pk };
            if (sk) {
                keyConditionExpression += ' AND begins_with(SK, :sk)';
                expressionAttributeValues[':sk'] = sk;
            }
            const command = new lib_dynamodb_1.QueryCommand({
                TableName: tableName,
                KeyConditionExpression: keyConditionExpression,
                ExpressionAttributeValues: expressionAttributeValues,
                Limit: limit
            });
            const response = await this.docClient.send(command);
            return response.Items || [];
        }
        catch (error) {
            throw new Error(`Failed to query table: ${error.message}`);
        }
    }
}
exports.DynamoDBTool = DynamoDBTool;
//# sourceMappingURL=dynamodb-tool.js.map