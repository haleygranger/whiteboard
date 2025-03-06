import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient();
const TABLE_NAME = "WhiteboardConnections";

export const handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Get connection ID from API Gateway WebSocket request
    const connectionId = event.requestContext?.connectionId;
    if (!connectionId) {
      throw new Error("Connection ID not found in the event.");
    }

    // Get session ID from API Gateway WebSocket request
    const sessionId = event.queryStringParameters?.sessionId || "global-session";

    // Prepare the parameters for DynamoDB put operation
    const params = {
      TableName: TABLE_NAME,
      Item: {
        connectionId: { S: connectionId },
        sessionId: { S: sessionId }
      }
    };

    // Store the connection in DynamoDB
    const command = new PutItemCommand(params);
    await dynamodb.send(command);

    console.log(`User connected: ${connectionId} in session: ${sessionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected Successfully' })
    };
  } catch (error) {
    console.error('Error connecting user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Connection failed' })
    };
  }
};
