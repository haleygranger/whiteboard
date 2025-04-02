import { useNavigate } from "react-router-dom";
import { Amplify } from 'aws-amplify';
import { signInWithRedirect, signOut } from '@aws-amplify/auth';
import { useState, useEffect } from "react";
import { getCurrentUser } from 'aws-amplify/auth';
import "./App.css";

const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;

//console.log("userPoolClientId: "+ userPoolClientId );
//console.log("userPoolId: " + userPoolId);

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        console.log("User authenticated:", user);
        setUserId(user.username);

        // Only create a new session if userId was successfully fetched
        if (user.username) {
          const newSessionId = await createConnection();
          setSessionId(newSessionId);
        }
      } catch (error) {
        console.error("User is not authenticated", error);
      }
    };

    checkAuth();
  }, []); // Run once when component mounts

  // Navigate once both sessionId and userId are set
  useEffect(() => {
    if (sessionId && userId) {
      navigate(`/whiteboard?sessionId=${sessionId}&userId=${encodeURIComponent(userId)}`);
    }
  }, [sessionId, userId, navigate]);

  const handleGuestClick = async () => {
    navigate(`/GuestSignIn`);
  };

  const handleSignIn = async () => {
    try {
      await signOut();  // Ensure fresh login
      await signInWithRedirect(); // Redirects user to Cognito login
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const createConnection = async () => {
    const response = await fetch("https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/create-session", {
      method: "POST",
    });

    const data = await response.json();
    console.log("sessionId from createConnection:", data.sessionId);
    return data.sessionId;
  };

  return (
    <div className="sign-in-container">
      <button onClick={handleGuestClick}>Continue as Guest</button>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}

export default SignIn;
