import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
  GetItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';

const dynamodb = new DynamoDBClient();
const apiGateway = new ApiGatewayManagementApiClient({
  endpoint: `WEBSOCKET`, // Find this not here.
});

const WHITEBOARD_CONNECTIONS = "WhiteboardConnections";
const WHITEBOARD_DRAWINGS = "WhiteboardDrawings";

const getConnections = async (sessionId) => {
  const result = await dynamodb.send(
    new ScanCommand({
      TableName: WHITEBOARD_CONNECTIONS,
      FilterExpression: "sessionId = :sessionId",
      ExpressionAttributeValues: { ":sessionId": { S: sessionId } },
    })
  );
  return result.Items || [];
};

const sendMessageToConnection = async (connectionId, message) => {
  await apiGateway.send(
    new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(message),
    })
  );
};

const broadcastMessage = async (connections, senderId, message) => {
  const postCalls = connections.map(async (conn) => {
    const connId = conn?.connectionId?.S;
    if (connId && connId !== senderId) {
      try {
        await sendMessageToConnection(connId, message);
      } catch (error) {
        if (error.statusCode === 410) {
          await dynamodb.send(
            new DeleteItemCommand({
              TableName: WHITEBOARD_CONNECTIONS,
              Key: { connectionId: { S: connId } },
            })
          );
        }
      }
    }
  });

  await Promise.all(postCalls);
};

export const handler = async (event) => {
  try {
    if (!event.body) return { statusCode: 200, body: "Ignored" };

    const body = JSON.parse(event.body);
    console.log("Received message:", body);
    const connectionId = event.requestContext?.connectionId;
    const sessionId = body.sessionId || "global-session";

    if (!connectionId) throw new Error("Missing connectionId");
    const connections = await getConnections(sessionId);

    // ------------------- ERASE -----------------------
    if (body.erase) {
      const eraseMsg = {
        sessionId,
        erase: true,
        userId: body.userId,
      };

      // Delete all strokes in the session
      const oldDrawings = await dynamodb.send(new QueryCommand({
        TableName: WHITEBOARD_DRAWINGS,
        KeyConditionExpression: "sessionId = :sessionId",
        ExpressionAttributeValues: { ":sessionId": { S: sessionId } }
      }));

      for (const item of oldDrawings.Items || []) {
        await dynamodb.send(new DeleteItemCommand({
          TableName: WHITEBOARD_DRAWINGS,
          Key: {
            sessionId: item.sessionId,
            strokeId: item.strokeId
          }
        }));
      }

      await broadcastMessage(connections, connectionId, eraseMsg);
      return { statusCode: 200, body: "Erased" };
    }

    // ------------------- CURSOR -----------------------
    if (body.cursorData) {
      const cursorMsg = {
        sessionId,
        userId: body.cursorData.userId,
        position: body.cursorData.position,
      };
      await broadcastMessage(connections, connectionId, cursorMsg);
    }

    // ------------------- SHAPE -----------------------
    if (body.shapeData) {
      const shapeMsg = {
        sessionId,
        userId: body.shapeData.userId,
        shapeData: body.shapeData,
      };

      const shapeData = body.shapeData;

      const { userId, type, lineColor, lineWidth } = shapeData;
      const strokeId = `${userId}-${Date.now()}`;

      await dynamodb.send(new PutItemCommand({
        TableName: WHITEBOARD_DRAWINGS,
        Item: {
          sessionId: { S: sessionId },
          strokeId: { S: strokeId }, // consistent ID
          userId: { S: userId },
          drawingData: {
            M: {
              type: { S: "shape" },
              shapeType: { S: shapeData.type }, // "circle", "rectangle", etc.
              lineColor: { S: shapeData.lineColor },
              lineWidth: { N: shapeData.lineWidth.toString() },
              start: {
                M: {
                  x: { N: shapeData.start.x.toString() },
                  y: { N: shapeData.start.y.toString() },
                },
              },
              end: {
                M: {
                  x: { N: shapeData.end.x.toString() },
                  y: { N: shapeData.end.y.toString() },
                },
              },
            },
          },
        },
      }));
      console.log("Shape stored in DynamoDB " + strokeId);
      await broadcastMessage(connections, connectionId, shapeMsg);
    }

    // ------------------- NEW USER -----------------------
    if (body.newUser) {
      const previous = await dynamodb.send(new QueryCommand({
        TableName: WHITEBOARD_DRAWINGS,
        KeyConditionExpression: "sessionId = :sessionId",
        ExpressionAttributeValues: {
          ":sessionId": { S: sessionId }
        }
      }));

      const drawings = (previous.Items || [])
      .filter(item => item.drawingData?.M)
      .map(item => {
        const data = item.drawingData.M;

        if (data.type?.S === "shape") {
          // This is a SHAPE (rectangle, circle, etc.)
          return {
            type: "shape",
            shapeType: data.shapeType?.S || "rectangle",
            lineColor: data.lineColor?.S || "#000000",
            lineWidth: Number(data.lineWidth?.N || 1),
            start: {
              x: Number(data.start?.M?.x?.N || 0),
              y: Number(data.start?.M?.y?.N || 0),
            },
            end: {
              x: Number(data.end?.M?.x?.N || 0),
              y: Number(data.end?.M?.y?.N || 0),
            },
          };
        } else {
          // This is a FREEHAND DRAWING (path)
          return {
            type: "drawing",
            lineColor: data.lineColor?.S || "#000000",
            lineWidth: Number(data.lineWidth?.N || 1),
            path: (data.path?.L || []).map(p => ({
              x: Number(p.M?.x?.N || 0),
              y: Number(p.M?.y?.N || 0),
            })),
          };
        }
      });

      if (drawings.length > 0) {
        await sendMessageToConnection(connectionId, { drawingData: drawings });
      }

      return { statusCode: 200, body: "Sent drawing history" };
    }

    // ------------------- DRAWING -----------------------
    if (body.drawingData) {
      const { userId, path, lineColor, lineWidth } = body.drawingData;
      const strokeId = `${userId}-${Date.now()}`;

      await dynamodb.send(new PutItemCommand({
        TableName: WHITEBOARD_DRAWINGS,
        Item: {
          sessionId: { S: sessionId },
          strokeId: { S: strokeId },
          userId: { S: userId },
          drawingData: {
            M: {
              lineColor: { S: lineColor },
              lineWidth: { N: lineWidth.toString() },
              path: {
                L: path.map(p => ({
                  M: {
                    x: { N: p.x.toString() },
                    y: { N: p.y.toString() },
                  },
                })),
              },
            },
          },
        },
      }));

      const drawMsg = {
        sessionId,
        userId,
        path,
        lineColor,
        lineWidth,
      };

      await broadcastMessage(connections, connectionId, drawMsg);
      return { statusCode: 200, body: "Stroke stored and broadcasted" };
    }

    return { statusCode: 200, body: "Nothing to do" };
  } catch (err) {
    console.error("Error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};
