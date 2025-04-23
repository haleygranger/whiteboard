# Whiteboard-Backend

## Overview

These Lambda functions are not actually connected to the backend. These are here for reference and for version control later down the line. When making changes to these functions, keep in mind that the functionality of these functions are within the AWS Lambda console itself.

## Functions

#### createSession.mjs

This function runs whenever a new session is being created (the session does not already exist). A `sessionId` is created then stored in `WhiteboardSessions` for later reference.

#### deleteWhiteboard.mjs

This function runs whenever an authenticated user deletes a saved whiteboard. Using the `sessionId` the whiteboard is queried and deleted from `SavedWhiteboards` table.

#### loadWhiteboard.mjs

This runs whenever a user wants to save their whiteboard. All drawing data is saved to the `SavedWhiteboards` table.

#### recreateSession.mjs

This runs whenever a new user is trying to access a session that already exists and has been drawn on. The `sessionId` is used to find the session in `WhiteboardSessions`, gather the previous drawing information, and send it back to the user.

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
