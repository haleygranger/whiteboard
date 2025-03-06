import React, { useEffect, useState } from 'react';

interface TypingComponentProps {
  sessionId: string;
  userName: string;
}

const TypingComponent: React.FC<TypingComponentProps> = ({ sessionId, userName }) => {
  const [message, setMessage] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket when the component mounts
    const webSocket = new WebSocket('wss://it1jqs927h.execute-api.us-east-2.amazonaws.com/production/');

    webSocket.onopen = () => {
      console.log('WebSocket Connected');
    };

    // Receive messages and update typing users
    webSocket.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      if (receivedData.sessionId === sessionId) {
        // Update typing users with the received message
        setTypingUsers(receivedData.typingUsers);
      }
    };

    setWs(webSocket);

    return () => {
      // Clean up WebSocket connection on component unmount
      webSocket.close();
    };
  }, [sessionId]);

  // Update the message input and send typing status
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = event.target.value;
    setMessage(newMessage);

    // Send typing update over WebSocket to all users
    if (ws) {
      ws.send(
        JSON.stringify({
          sessionId: sessionId,
          typingUsers: [userName], // Send the current user's name
          text: newMessage,
        })
      );
    }
  };

  return (
    <div>
      <div>
        <textarea
          value={message}
          onChange={handleInputChange}
          placeholder="Type something..."
        ></textarea>
      </div>
      <div>
        <h4>Other Users Typing:</h4>
        {typingUsers.length > 0 ? (
          <ul>
            {typingUsers.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
        ) : (
          <p>No one is typing.</p>
        )}
      </div>
    </div>
  );
};

export default TypingComponent;
