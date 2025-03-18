import React, { useState } from "react";
import TypingComponent from "./TypingComponent"; // Import TypingComponent
import { useLocation } from "react-router-dom";

const Whiteboard: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("sessionId") || "0";
  const [userName] = useState("user123");

  console.log("sessionId from Whiteboard.tsx: " + sessionId); // Debugging sessionId

  return (
    <div>
      <h1>Whiteboard</h1>
      <TypingComponent sessionId={sessionId} userName={userName} />
    </div>
  );
};

export default Whiteboard;
