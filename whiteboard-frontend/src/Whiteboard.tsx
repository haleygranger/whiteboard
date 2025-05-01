// IMPORTS
import React, { useEffect, useState } from "react";
import WhiteboardComponent from "./WhiteboardComponent";
import { useLocation, useNavigate } from "react-router-dom";

// PROPS
interface WhiteboardProps {
  isAuth: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ isAuth }) => {
  
  // HOOKS
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  
  // COMPONENT STATES
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Checks that URL is all correct
  useEffect(() => {
    // Get sessionId from URL
    const urlSessionId = params.get("sessionId");
    console.log("URL Session ID:", urlSessionId); // Check if sessionId is being passed correctly

    // Check if sessionId is stored in local storage
    const storedSessionId = localStorage.getItem("sessionId");
    const urlUserId = params.get("userId");
    const storedUserId = localStorage.getItem("userId");

    if (!urlSessionId) {
        console.log("Getting here: !urlSessionId.")
        navigate("/GuestSignInSession");
        return;
    }

    // In instances of a user sharing the URL the userId wont exist.
    // Check if sessionId exists, otherwise redirect to GuestSignInSession
    if (!urlUserId) {
        navigate(`/GuestSignInSession?sessionId=${urlSessionId}`);
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
      <WhiteboardComponent sessionId={sessionId} userId={userId} isAuth={isAuth}/>
    </div>
  );
};

export default Whiteboard;
