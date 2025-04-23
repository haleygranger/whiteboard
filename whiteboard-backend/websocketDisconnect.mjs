import { DynamoDBClient, DeleteItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand} from '@aws-sdk/client-apigatewaymanagementapi';

const dynamodb = new DynamoDBClient();
const apiGateway = new ApiGatewayManagementApiClient({
  endpoint: `WEBSOCKET`, // Find this not here.
});
const TABLE_NAME = "WhiteboardConnections";
const WHITEBOARD_SESSION_TABLE = "WhiteboardSessions";
const WHITEBOARD_DRAWING_TABLE = "WhiteboardDrawings";

// Function to check if last connectionId on session
const checkWhiteboardSession = async (connectionId) => {
  const getSessionParams = {
    TableName: TABLE_NAME,
    Key: { connectionId: { S: connectionId } },
  };
  const sessionData = await dynamodb.send(new GetItemCommand(getSessionParams));

  if (!sessionData.Item) {
    console.log("No session found for this connectionId");
    return;
  }

  const sessionId = sessionData.Item.sessionId.S;
  const userId = sessionData.Item.userId.S;
  console.log("userId:", userId);

  const disconnectMessage = {
    type: "user-disconnect",
    userId: userId,
  };

  // Find all other connections in the same session
  const searchBySessionParams = {
    TableName: TABLE_NAME,
    FilterExpression: "sessionId = :sessionId",
    ExpressionAttributeValues: { ":sessionId": { S: sessionId } },
  };
  
  const results = await dynamodb.send(new ScanCommand(searchBySessionParams));
  console.log("Connections in session:", results.Items);

  const otherConnections = results.Items.filter(
    (item) => item.connectionId.S !== connectionId
  );

  for (const conn of otherConnections) {
    try {
      await apiGateway.send(
        new PostToConnectionCommand({
          ConnectionId: conn.connectionId.S,
          Data: JSON.stringify(disconnectMessage),
        })
      );
    } catch (error) {
      console.log("Error sending disconnect message to", conn.connectionId.S, error);
    }
  }

  // If this was the last connection, delete session + drawings
  if (results.Items.length === 1) {
    console.log("Deleting whiteboard session:", sessionId);
    await dynamodb.send(
      new DeleteItemCommand({
        TableName: WHITEBOARD_SESSION_TABLE,
        Key: { sessionId: { S: sessionId } },
      })
    );
    try {
      await dynamodb.send(
        new DeleteItemCommand({
          TableName: WHITEBOARD_DRAWING_TABLE,
          Key: { sessionId: { S: sessionId } },
        })
      );
    } catch (error) {
      console.log("No drawing found for this session");
    }
  }
};


export const handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    if (!connectionId) {
      throw new Error("Connection ID not found in the event.");
    }

    // Await checkWhiteboardSession before proceeding
    await checkWhiteboardSession(connectionId);

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
