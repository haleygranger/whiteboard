import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

const dynamodb = new DynamoDBClient();
const apiGateway = new ApiGatewayManagementApiClient({
  endpoint: `wss://it1jqs927h.execute-api.us-east-2.amazonaws.com/production`
});

const TABLE_NAME = "WhiteboardConnections";

const getConnections = async (sessionId) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "sessionId = :sessionId",
      ExpressionAttributeValues: { ":sessionId": { S: sessionId } },
    };

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error("Error fetching connections:", error);
    return [];
  }
};

const broadcastMessage = async (connections, senderId, message) => {
  const postCalls = connections.map(async (conn) => {
    const connId = conn.connectionId ? conn.connectionId.S : null;
    if (connId && connId !== senderId) {
      try {
        await apiGateway.send(
          new PostToConnectionCommand({
            ConnectionId: connId,
            Data: JSON.stringify(message),
          })
        );
      } catch (error) {
        if (error.statusCode === 410) {
          console.log(`Stale connection found: ${connId}, removing...`);
          await dynamodb.send(
            new DeleteItemCommand({
              TableName: TABLE_NAME,
              Key: { connectionId: { S: connId } },
            })
          );
        } else {
          console.error(`Error sending message to ${connId}:`, error);
        }
      }
    }
  });

  await Promise.all(postCalls);
};

export const handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Ignore $connect and $disconnect events
    if (!event.body) {
      console.warn("Ignoring event with no body (likely $connect or $disconnect).");
      return { statusCode: 200, body: "Ignored non-message event" };
    }

    const body = JSON.parse(event.body);
    console.log("Parsed body:", body);

    const connectionId = event.requestContext?.connectionId;
    if (!connectionId) {
      throw new Error("Missing connectionId");
    }

    const sessionId = body.sessionId || "global-session"; // Default to global session if none provided
    const typingUsers = body.typingUsers || [];

    // Get all active connections for this session
    const connections = await getConnections(sessionId);

    // Broadcast typing users to all other users in the session
    await broadcastMessage(connections, connectionId, { sessionId, typingUsers });

    return { statusCode: 200, body: "Typing status processed" };
  } catch (error) {
    console.error("Error processing message:", error);
    return { statusCode: 500, body: "Message processing failed" };
  }
};
