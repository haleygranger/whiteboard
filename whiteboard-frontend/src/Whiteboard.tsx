import React, { useState } from "react";
import TypingComponent from "./TypingComponent"; // Import TypingComponent

const Whiteboard: React.FC = () => {
  const [sessionId] = useState("session123");
  const [userName] = useState("user123");

  return (
    <div>
      <h1>Whiteboard</h1>
      <TypingComponent sessionId={sessionId} userName={userName} />
    </div>
  );
};

export default Whiteboard;
