import { useNavigate } from "react-router-dom";
//import { useAuth } from "react-oidc-context";
import "./App.css";

function SignIn() {
  const navigate = useNavigate();
  //const auth = useAuth();

  const joinAsGuest = async () => {
    const sessionId = await createConnection();
    // const connectionId = 
    navigate(`/whiteboard?sessionId=${sessionId}`); // Redirect to the whiteboard page
  };

  const handleSignIn = async () => {
    const sessionId = await createConnection();
    localStorage.setItem("sessionId", sessionId); // Save sessionId for later bc cognito doesn't like query params :(
    
    console.log("sessionId: " + sessionId);
    const redirectUri = encodeURIComponent(
      "https://main.dbiwmhwrvdu84.amplifyapp.com/whiteboard"
    );
    console.log("redirect_uri: " + redirectUri);
    
    // Cognito Login URL (no sessionId here)
    window.location.href = `https://us-east-2sv64gr3vo.auth.us-east-2.amazoncognito.com/login?client_id=1leh5p4ea4vq0imp5nksudclsa&redirect_uri=${redirectUri}&response_type=code&scope=email+openid+phone`;
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
    <div>
      <h1>Welcome Screen</h1>
      <button onClick={joinAsGuest}>Continue as Guest</button>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}

export default SignIn;
