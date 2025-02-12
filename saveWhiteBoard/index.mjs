import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

// Cognito JWT Verifier setup
const verifier = CognitoJwtVerifier.create({
    userPoolId: "us-east-2_SV64Gr3VO",
    tokenUse: "id",
    clientId: "1leh5p4ea4vq0imp5nksudclsa",
});

export const handler = async (event) => {
    try {
        const authHeader = event.headers?.Authorization;
        if (!authHeader) {
            return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        const token = authHeader.replace("Bearer ", "");
        const payload = await verifier.verify(token);
        const userId = payload.sub; // Cognito User ID

        const { sessionId, data } = JSON.parse(event.body);
        if (!sessionId || !data) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
        }

        await dynamoDB.send(new PutCommand({
            TableName: "WhiteboardSessions",
            Item: {
                sessionId: sessionId,
                userId: userId,
                data: data,
                lastUpdated: new Date().toISOString(),
            },
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Whiteboard saved successfully", sessionId }),
        };
    } catch (error) {
        console.error("Error saving whiteboard:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to save whiteboard", details: error.message }),
        };
    }
};
