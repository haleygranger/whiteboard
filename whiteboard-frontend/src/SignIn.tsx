import { useNavigate } from "react-router-dom";
import { Amplify } from 'aws-amplify';
import { signInWithRedirect, signOut } from '@aws-amplify/auth';
import "./App.css";
import { useState, useEffect } from "react";
import { getCurrentUser } from 'aws-amplify/auth';

const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: userPoolClientId,
      userPoolId: userPoolId,
      loginWith: {
        oauth: {
          domain: 'us-east-2sv64gr3vo.auth.us-east-2.amazoncognito.com',
          scopes: ['openid', 'email', 'phone'],
          redirectSignIn: ['http://localhost:5173/', 'https://main.d3nwftw9t1phgg.amplifyapp.com/'], // Both local and prod
          redirectSignOut: ['http://localhost:5173/', 'https://main.d3nwftw9t1phgg.amplifyapp.com/'], // Both local and prod
          responseType: 'code',
        },
        username: true,
        email: false,
      }
    }
  }
});

function SignIn() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null); // use string or null for clarity
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId && userId) {
      // Once both sessionId and userId are set, navigate
      navigate(`/whiteboard?sessionId=${sessionId}&userId=${encodeURIComponent(userId)}`);
    }
  }, [sessionId, userId, navigate]);

  const handleGuestClick = async () => {
    navigate(`/GuestSignIn`); // Redirect to the Guest Sign-in page
  };

  const handleSignIn = async () => {
    try {
      await signOut();
      await signInWithRedirect();
      // Check if the user is authenticated
      const user = await getCurrentUser();
      setUserId(user.username);

      const newSessionId = await createConnection();
      setSessionId(newSessionId); // Update sessionId state after getting it
      console.log("Getting here");

    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const createConnection = async () => {
    const response = await fetch("https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/create-session", {
      method: "POST",
    });

    const data = await response.json();
    const sessionId = data.sessionId;
    console.log("sessionId from createConnection: " + sessionId);
    return sessionId; // Return the sessionId
  };

  return (
    <div className="sign-in-container">
      <button onClick={handleGuestClick}>Continue as Guest</button>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}

export default SignIn;
