# Collaborative Whiteboard

A real-time collaborative whiteboard application where users can draw on a shared whiteboard. The apps allows user to create or join a whiteboard session, enabling them to collaberate with others. The whiteboard updates in real time for all connected users allowing for great interaction.

## Authors

- [@haleygranger](https://www.github.com/haleygranger)

## Features

- Real-time collaborative drawing
- Shareable whiteboard session links or QR codes
- Low-latency updates via WebSockets
- Responsive frontend with React
- Powerful AWS backend
- Guess or authenticated user experiences

## Tech Stack

**Frontend:** React, TypeScript

**Backend:** AWS Lambda, DynamoDB

**Networking:** WebSockets API, API Gateway

**Deployment:** AWS Amplify

**Authentication:** Amazon Cognito

## Getting Started

### Prerequisites

- Node.js and npm
- AWS account for backend/data setup

### Frontend Setup

```bash
git clone https://github.com/haleygranger/whiteboard
cd whiteboard-frontend
npm install
npm start
```

The app will be available via `http://localhost:3000`

### Backend Setup

1. Deploy WebSocket API via AWS API Gateway.

[Here's a helpful link for that](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)

2. Create and configure Lambda functions for connect, disconnect, and draw events.

[Another helpful link](https://github.com/haleygranger/whiteboard/blob/main/whiteboard-backend/README.md)

3. Set up DynamoDB tables for sessions and strokes.

4. Update environment variables in the frontend (.env) to point your WebSocket endpoint.

## Current Issues/Bugs

- Minor latency errors with multiple users.
- Mobile device support lacking.

_The [issues](https://github.com/haleygranger/whiteboard/issues) is always open for reporting._

## Acknowledgements

- [AWS Documentation](https://aws.amazon.com/documentation-overview/?nc2=h_ql_doc_do)
- [React Documentation](https://react.dev/reference/react)
- Inspiration by the depreciation of [Google Jamboard](https://support.google.com/jamboard/answer/14084927)
- Westfield State University CS program
