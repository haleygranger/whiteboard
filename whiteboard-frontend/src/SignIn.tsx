import { useNavigate } from "react-router-dom";
import "./App.css";

function SignIn() {
  const navigate = useNavigate();

  const handleGuestClick = async () => {
    navigate(`/GuestSignIn`); // Redirect to the Guest Sign in page
  };

  const handleSignIn = async () => {
    alert('Sign-in unavailable until later notice.');
    createConnection(); // TO DO
  };

  const createConnection = async () => {
    const response = await fetch("https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/create-session", {
      method: "POST",
    });

    const data = await response.json();
    const sessionId = data.sessionId;
    console.log("sessionId: " + sessionId);

    return sessionId; // sessionId to identify whiteboard
  }

  return (
    <div className="sign-in-container">
      <button onClick={handleGuestClick}>Continue as Guest</button>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}

export default SignIn;
