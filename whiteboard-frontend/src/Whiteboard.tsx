import React, { useEffect, useState } from "react";
import WhiteboardComponent from "./WhiteboardComponent";
import { useLocation, useNavigate } from "react-router-dom";

const Whiteboard: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const urlSessionId = params.get("sessionId");
    console.log("URL Session ID:", urlSessionId); // Check if sessionId is being passed correctly

    const storedSessionId = localStorage.getItem("sessionId");
    const urlUserId = params.get("userId");
    const storedUserId = localStorage.getItem("userId");

    // Check if sessionId exists, otherwise redirect to GuestSignInSession
    if (!urlSessionId && !storedSessionId) {
        navigate("/GuestSignInSession");
        return;
    }

    if (!urlUserId && !storedUserId) {
        navigate(`/GuestSignInSession?sessionId=${urlSessionId}`); //This is for when user joins thru url
        return;
    }

    // Set sessionId from URL or localStorage
    setSessionId(urlSessionId || storedSessionId);
    localStorage.removeItem("sessionId");

    // Set userId from URL or localStorage
    setUserId(urlUserId || storedUserId);
    localStorage.removeItem("userId");

}, [params, navigate]);

  // Prevent rendering if sessionId or userId is not set yet
  if (!sessionId || !userId) {
    return <div>Loading...</div>; // Prevents rendering the WhiteboardComponent before redirecting
  }

  return (
    <div>
      <WhiteboardComponent sessionId={sessionId} userId={userId} />
    </div>
  );
};

export default Whiteboard;
