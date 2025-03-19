import React, { useEffect, useState } from "react";
import TypingComponent from "./TypingComponent"; // Import TypingComponent
import { useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const Whiteboard: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const auth = useAuth();

  const [sessionId, setSessionId] = useState("");
  const [userId, setUserId] = useState("guest");

  useEffect(() => {
    // Check if sessionId is in URL query params, otherwise use localStorage
    const urlSessionId = params.get("sessionId");
    const storedSessionId = localStorage.getItem("sessionId");

    if (urlSessionId) {
      setSessionId(urlSessionId);
    } else if (storedSessionId) {
      setSessionId(storedSessionId);
      localStorage.removeItem("sessionId"); // Clean up after use
    }
  }, [params]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      // You can choose between auth.user.profile.sub or auth.user.profile.email
      const cognitoUserId = auth.user.profile.sub || "unknown";
      setUserId(cognitoUserId);
    }
  }, [auth]);

  console.log("sessionId from Whiteboard.tsx: " + sessionId);
  console.log("userId from Whiteboard.tsx: " + userId);

  return (
    <div>
      <h1>Whiteboard</h1>
      <TypingComponent sessionId={sessionId} userName={userId} />
    </div>
  );
};

export default Whiteboard;
