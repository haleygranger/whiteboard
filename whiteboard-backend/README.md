# Whiteboard-Backend

## Overview

These Lambda functions are not actually connected to the backend. These are here for reference and for version control later down the line. When making changes to these functions, keep in mind that the functionality of these functions are within the AWS Lambda console itself.

## Functions

#### createSession.mjs

This function runs whenever a new session is being created (the session does not already exist). A `sessionId` is created then stored in `WhiteboardSessions` for later reference.

#### deleteWhiteboard.mjs

This function runs whenever an authenticated user deletes a saved whiteboard. Using the `sessionId` the whiteboard is queried and deleted from `SavedWhiteboards` table.

#### loadWhiteboard.mjs

This runs whenever an authenticated user navigates to the screen to load a previous whiteboard. It receives the `userId` from the client. All previous saved whiteboards are retrieved from the `SavedWhiteboards` table that corresponds to the `userId`. All the whiteboards (and the data that corresponds to each whiteboard) are returned as a response to the client.

#### recreateSession.mjs

This runs whenever an authenticated user attempts to retrieve a previously saved whiteboard. The function receives the `sessionId` and drawing data from the client. It formats this information into DynamoDB format and puts it into the `WhiteboardDrawings` table.

#### SaveWhiteboard

This runs whenever a user wants to save their whiteboard. Using the `sessionId` the whiteboard information, including all of its drawings, are found in `WhiteboardDrawings`. They are then saved to the `SavedWhiteboards` table.

#### websocketConnect

This function is the connection route to the WebSocket. It gathers all information needed for the user to connect to the whiteboard, and saves it to `WhiteboardConnections` table.

#### websocketDisconnect

This function is the disconnect route to the WebSocket. This sends a disconnect alert to the other users within the session that a user has left the session. If the last connection in the session leaves, all volatile drawing data is removed from `WhiteboardDrawings` and the session is removed from the `WhiteboardSessions`.

#### websocketMessage

This function is the default route to the WebSocket. This function handles all other message types from the user to broacast onto other users. This includes

- Clearing the whiteboard
- Cursor information
- Handling shapes
- New user connections
- All drawings
