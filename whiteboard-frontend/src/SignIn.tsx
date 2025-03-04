import { useNavigate } from "react-router-dom";

function SignIn() {
  const navigate = useNavigate();

  const joinAsGuest = () => {
    navigate("/whiteboard"); // Redirect to the whiteboard page
  };

  return (
    <div>
      <h1>Welcome to the Whiteboard</h1>
      <button onClick={joinAsGuest}>Continue as Guest</button>
      <button>Sign In</button> {/* We'll handle this later */}
    </div>
  );
}

export default SignIn;
