import { useNavigate } from "react-router-dom";

function SignIn() {
  const navigate = useNavigate();

  const joinAsGuest = () => {
    navigate("/whiteboard"); // Redirect to the whiteboard page
  };

  const handleSignIn = () => {
    window.location.href = "https://us-east-2sv64gr3vo.auth.us-east-2.amazoncognito.com/login/continue?client_id=1leh5p4ea4vq0imp5nksudclsa&redirect_uri=https%3A%2F%2Fmain.dbiwmhwrvdu84.amplifyapp.com%2Fwhiteboard&response_type=code&scope=email+openid+phone" // Hard coded URL - remember to change if url changes
  };

  return (
    <div>
      <h1>Welcome Screen</h1>
      <button onClick={joinAsGuest}>Continue as Guest</button>
      <button onClick={handleSignIn}
        >Sign In</button>
    </div>
  );
}

export default SignIn;
