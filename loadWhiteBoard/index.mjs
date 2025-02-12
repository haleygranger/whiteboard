import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

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
        // Verify user JWT token (Cognito)
        const authHeader = event.headers?.Authorization;
        if (!authHeader) {
            return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized: Missing token" }) };
        }

        const token = authHeader.replace("Bearer ", "");
        const payload = await verifier.verify(token);
        const userId = payload.sub; // Cognito User ID

        // Look for sessionId
        const sessionId = event.queryStringParameters?.sessionId;
        if (!sessionId) {
            return { statusCode: 400, body: JSON.stringify({ error: "Whiteboard ID is required" }) };
        }

        // Retrieve whiteboard data from DynamoDB
        const response = await dynamoDB.send(new GetCommand({
            TableName: "WhiteboardSessions",
            Key: {
                sessionId: sessionId
            },
        }));

        // Check if whiteboard exists
        if (!response.Item) {
            return { statusCode: 404, body: JSON.stringify({ error: "Whiteboard not found" }) };
        }

        // Return retrieved whiteboard data
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Whiteboard retrieved successfully", data: response.Item }),
        };
    } catch (error) {
        console.error("Error retrieving whiteboard:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to retrieve whiteboard", details: error.message }),
        };
    }
};
