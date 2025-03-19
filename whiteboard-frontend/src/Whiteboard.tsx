import React, { useState } from "react";
import TypingComponent from "./TypingComponent"; // Import TypingComponent
import WhiteboardComponent from "./WhiteboardComponent";

const Whiteboard: React.FC = () => {
  const [sessionId] = useState("session123");
  const [userName] = useState("user123");

  return (
    <div>      
      <WhiteboardComponent></WhiteboardComponent>
    </div>
  );
};

export default Whiteboard;
