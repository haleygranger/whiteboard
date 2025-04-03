import { useNavigate } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import "./App.css";

const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: userPoolClientId,
      userPoolId: userPoolId,
      loginWith: {
        oauth: {
          domain: "us-east-2sv64gr3vo.auth.us-east-2.amazoncognito.com",
          scopes: ["openid", "email", "phone"],
          redirectSignIn: ["http://localhost:5173/", "https://main.d3nwftw9t1phgg.amplifyapp.com/"],
          redirectSignOut: ["http://localhost:5173/", "https://main.d3nwftw9t1phgg.amplifyapp.com/"],
          responseType: "code",
        },
        username: true,
        email: false,
      },
    },
  },
});

function SignIn({ setAuthStatus }: { setAuthStatus: (auth: boolean) => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure no one is signed in on load
    const ensureLoggedOut = async () => {
      try {
        await signOut();
        console.log("Signed out on load to ensure fresh login.");
      } catch (error) {
        console.error("Error signing out:", error);
      }
      setLoading(false);
    };
    
    ensureLoggedOut();
  }, []);

  const handleSignIn = async () => {
    try {
      console.log("Redirecting to Cognito...");
      await signInWithRedirect(); // Redirects the user to sign in
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  useEffect(() => {
    // Check if user is authenticated AFTER login redirect
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        console.log("User authenticated:", user);
        setAuthStatus(true);
        // Create a session and navigate to whiteboard
        const sessionId = await createConnection();
        navigate(`/whiteboard?sessionId=${sessionId}&userId=${encodeURIComponent(user.username)}`);
      } catch (error) {
        console.log("User is not authenticated yet.", error);
      }
    };

    checkAuth();
  }, []);

  const createConnection = async () => {
    const response = await fetch("https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/create-session", {
      method: "POST",
    });

    const data = await response.json();
    console.log("sessionId from createConnection:", data.sessionId);
    return data.sessionId;
  };

  const handleGuestClick = async () => {
    navigate(`/GuestSignIn`);
  };

  if (loading) {
    return <div>Loading...</div>; // Prevents UI interaction until sign-out completes
  }

  return (
    <div className="sign-in-container">
      <button onClick={handleGuestClick}>Continue as Guest</button>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}

export default SignIn;

