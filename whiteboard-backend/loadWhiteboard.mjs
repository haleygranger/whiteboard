import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({ region: "us-east-2" });
const TABLE_NAME = "SavedWhiteboards";

export const handler = async (event) => {
    console.log("Fetching previous strokes for new user");
    try {
        const body = JSON.parse(event.body);
        console.log("Parsed Body: " + JSON.stringify(body));

        const userId = body.userId;
        if (!userId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing userId in request body" }),
            };
        }

        const params = {
            TableName: TABLE_NAME,
            IndexName: "UserIdIndex", // GSI name
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": { S: userId },
            },
        };

        const response = await dynamodb.send(new QueryCommand(params));
        console.log("Query Response: ", JSON.stringify(response));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Whiteboards retrieved successfully",
                data: response.Items,
            }),
        };

    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
