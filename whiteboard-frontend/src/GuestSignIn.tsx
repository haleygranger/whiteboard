import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";

function GuestSignIn() {
    // HOOKS
    const navigate = useNavigate();

    // STATES
    const [guestUsername, setGuestUsername] = useState("");
    const [sessionId, setSessionId] = useState(""); console.log("Guest joining sessionId: ", sessionId);

    // Returns sessionId
    const createConnection = async () => {
        const response = await fetch("https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/create-session", {
        method: "POST",
        });

        const data = await response.json();
        return data.sessionId;
    };

    // Navigates to Whiteboard with sessionId and userId
    const handleJoin = async () => {
        if (!guestUsername.trim()) {
            alert("Please enter a username to continue.");
            return;
        }
    
        try {
            const newSessionId = await createConnection();
            setSessionId(newSessionId); // Updates state
            navigate(`/whiteboard?sessionId=${newSessionId}&userId=${encodeURIComponent(guestUsername)}`);
        } catch (error) {
            alert("Error creating session. Please try again.");
        }
    };

    return (
        <div className="sign-in-container">
            <h1>Create a Whiteboard!</h1>
            <input
                type="text"
                className={`guest-signin-text`}
                placeholder="Enter Username"
                value={guestUsername}
                onChange={(e) => setGuestUsername(e.target.value)}
            />
            <button onClick={handleJoin}>Join</button>
        </div>
    );
}

    export default GuestSignIn;
