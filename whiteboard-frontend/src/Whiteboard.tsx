import React, { useState } from "react";
import TypingComponent from "./TypingComponent";

const Whiteboard = () => {
  const [sessionId, setSessionId] = useState("session123"); // Dummy sessionId
  const [userName, setUserName] = useState("user123"); // Dummy username

  return (
    <div>
      <h2>Welcome to the Whiteboard</h2>
      <TypingComponent sessionId={sessionId} userName={userName} />
    </div>
  );
};

export default Whiteboard;
