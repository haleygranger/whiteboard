import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamodb = new DynamoDBClient({ region: "us-east-2" });
const SAVED_WHITEBOARDS = "SavedWhiteboards";
const WHITEBOARD_DRAWINGS = "WhiteboardDrawings";

const getWhiteboard = async (sessionId) => {
  console.log("Getting whiteboard from DynamoDB: ", sessionId);
  const params = {
    TableName: WHITEBOARD_DRAWINGS,
    KeyConditionExpression: "sessionId = :sid",
    ExpressionAttributeValues: {
      ":sid": { S: sessionId },
    },
  };

  try {
    const result = await dynamodb.send(new QueryCommand(params));
    if (result.Items && result.Items.length > 0) {
      const item = unmarshall(result.Items[0]);
      return item.drawingData;
    } else {
      throw new Error("Whiteboard not found");
    }
  } catch (error) {
    console.error("Error getting whiteboard from DynamoDB:", error);
    throw error;
  }
};

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const sessionId = body.sessionId;
    const userId = body.userId;

    if (!sessionId || !userId)
      return { statusCode: 400, body: "Missing sessionId or userId" };

    const drawingData = await getWhiteboard(sessionId);

    const params = {
      TableName: SAVED_WHITEBOARDS,
      Item: {
        sessionId: { S: sessionId },
        userId: { S: userId },
        drawingData: { S: JSON.stringify(drawingData) },
        timestamp: { S: new Date().toISOString() },
      },
    };

    await dynamodb.send(new PutItemCommand(params));
    console.log("Successfully saved whiteboard to DynamoDB");

    return { statusCode: 200, body: JSON.stringify("Saved Successfully") };
  } catch (error) {
    console.error("Error processing Lambda:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
