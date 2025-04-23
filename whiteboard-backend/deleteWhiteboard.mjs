import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

// DynamoDB Client initialization
const dynamodb = new DynamoDBClient({ region: 'us-east-2' });
const SAVEDWHITEBOARDS = 'SavedWhiteboards'; 

export const handler = async (event) => {
  try{
    const body = JSON.parse(event.body);
    const sessionId = body.sessionId;

    const params = {
      TableName: SAVEDWHITEBOARDS,
      Key: {
        sessionId: { S: sessionId }
      }
    };

    await dynamodb.send(new DeleteItemCommand(params));

  } catch (error) {
    console.error(error);
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify('Whiteboard deleted.'),
  };
  return response;
};
