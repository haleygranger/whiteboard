import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB client
const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        // Generate a unique session ID
        const sessionId = Date.now().toString(); 
        
        // Define the new session object
        const newSession = {
            sessionId: sessionId,
            createdAt: new Date().toISOString(),
            drawings: [],  // Empty drawing data initially
        };

        // Save to DynamoDB
        await dynamoDB.send(new PutCommand({
            TableName: "WhiteboardSessions",
            Item: newSession
        }));

        // Return success response
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Session created successfully",
                sessionId: sessionId
            }),
        };
    } catch (error) {
        console.error("Error creating session:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to create session" }),
        };
    }
};
