import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient();
const TABLE_NAME = "WhiteboardConnections";

export const handler = async (event) => {
  try {
    const connectionId = event.requestContext?.connectionId;
    if (!connectionId) {
      throw new Error("Connection ID not found in the event.");
    }

    console.log(`Disconnecting user: ${connectionId}`);

    // Remove the connection from DynamoDB
    await dynamodb.send(
      new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: { connectionId: { S: connectionId } },
      })
    );

    return { statusCode: 200, body: "Disconnected" };
  } catch (error) {
    console.error("Error handling disconnect:", error);
    return { statusCode: 500, body: "Failed to disconnect" };
  }
};
