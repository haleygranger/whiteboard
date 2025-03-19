import React, { useEffect, useState } from "react";
import TypingComponent from "./TypingComponent"; // Import TypingComponent
import { useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const Whiteboard: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const auth = useAuth();

  const [sessionId, setSessionId] = useState("0");
  const [userId, setUserId] = useState("0");

  // Only run once to handle session ID from URL or localStorage
  useEffect(() => {
    const urlSessionId = params.get("sessionId");
    const storedSessionId = localStorage.getItem("sessionId");

    if (urlSessionId) {
      setSessionId(urlSessionId);
    } else if (storedSessionId) {
      setSessionId(storedSessionId);
      localStorage.removeItem("sessionId"); // Clean up after use
    }
  }, [params]);

  // UseEffect to set guest userId or auth userId
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const cognitoUserId = auth.user.profile.sub || "unknown";
      setUserId(cognitoUserId);
    } else {
      const random = getRandomNumber(1, 99999999).toString();
      setUserId(random);
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
