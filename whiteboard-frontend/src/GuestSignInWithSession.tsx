import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";

function GuestSignInWithSession() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    
    const [guestUsername, setGuestUsername] = useState("");
    const [sessionId, setSessionId] = useState(""); console.log(sessionId);

    console.log("Handling Guest Sign In...");

    // Ensure we correctly set sessionId from URL/localStorage before allowing a user to join
    useEffect(() => {
        const urlSessionId = params.get("sessionId");
        const storedSessionId = localStorage.getItem("sessionId");

        if (urlSessionId) {
            setSessionId(urlSessionId);
        } else if (storedSessionId) {
            setSessionId(storedSessionId);
            localStorage.removeItem("sessionId"); // Clean up after use
        }
    }, []); // Only run once on mount

    const handleJoin = async () => {
        // Use the sessionId from params or localStorage directly instead of relying on state
        const urlSessionId = params.get("sessionId");
        const storedSessionId = localStorage.getItem("sessionId");
        const finalSessionId = urlSessionId || storedSessionId;

        if (!finalSessionId) {
            alert("Error: No session ID found.");
            return;
        }
        if (!guestUsername.trim()) {
            alert("Please enter a username to continue.");
            return;
        }
        
        console.log(`Joining session: ${finalSessionId} as ${guestUsername}`);
        navigate(`/whiteboard?sessionId=${finalSessionId}&userId=${encodeURIComponent(guestUsername)}`);
    };

    return (
        <div className="sign-in-container">
            <h1>Join a Whiteboard!</h1>
            <input
                type="text"
                className="guest-signin-text"
                placeholder="Enter Username"
                value={guestUsername}
                onChange={(e) => setGuestUsername(e.target.value)}
            />
            <button onClick={handleJoin}>Join</button>
        </div>
    );
}

export default GuestSignInWithSession;
