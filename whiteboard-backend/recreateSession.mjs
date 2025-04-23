import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';

// DynamoDB Client initialization
const dynamodb = new DynamoDBClient({ region: 'us-east-2' });
const TABLE_NAME = 'WhiteboardDrawings'; 

export const handler = async (event) => {
  try {
    console.log('Raw Event Body:', JSON.stringify(event.body));

    const body = JSON.parse(event.body);
    const sessionId = body.sessionId;
    const drawingData = body.drawingData;

    if (!sessionId) {
      throw new Error("Missing sessionId.");
    }

    if (!drawingData) {
      throw new Error("Missing drawingData.");
    }

    console.log(`Session ID: ${sessionId}`);
    console.log(`Drawing Data:`, drawingData);

    // Convert the entire item to DynamoDB format using marshall
    const item = marshall({
      sessionId: sessionId,
      drawingData: drawingData,
      strokeId: randomUUID(),
    });

    const params = {
      TableName: TABLE_NAME,
      Item: item,
    };

    const command = new PutItemCommand(params);
    await dynamodb.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Drawing data loaded successfully' }),
    };

  } catch (error) {
    console.error('Error processing drawing data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to save drawing data',
        error: error.message || 'Unknown error',
      }),
    };
  }
};
