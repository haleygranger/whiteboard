import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface Whiteboard {
    sessionId: { S: string };
    drawingData: any; // Define a better type here based on drawing data
    timestamp: { S: string };
}

const Loadboards: React.FC = () => {

    // HOOKS
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get("sessionId") ?? "";
    const userId = queryParams.get("userId") ?? "";

    // STATES
    const [savedWhiteboards, setSavedWhiteboards] = useState<Whiteboard[]>([]);
    const [selectedWhiteboard, setSelectedWhiteboard] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); // Error state to display error messages

    useEffect(() => {
        if (userId) {
            getSavedWhiteboards();
        }
    }, [userId]);

    // Sends userId to API to get all saved whiteboards
    const getSavedWhiteboards = async () => {
        try {
            setLoading(true);
            setError(null); // Reset error state before the request

            const requestBody = { userId };
            const response = await fetch("https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/load-whiteboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const responseData = await response.json();
            const whiteboards: Whiteboard[] = responseData.data;
            setSavedWhiteboards(whiteboards);
        } catch (error) {
            console.error("Error fetching whiteboards:", error);
            setError("Failed to load saved whiteboards.");
        } finally {
            setLoading(false);
        }
    };

    // Navigates back to session
    const handleBack = () => {
        navigate(`/whiteboard?sessionId=${sessionId}&userId=${encodeURIComponent(userId)}`);
    };
    
    // Sends sessionId to API to delete session from db
    const handleDelete = async () => {
        if (selectedWhiteboard) {
            const requestBody = { sessionId: selectedWhiteboard }; // <-- fix here
            try {
                const response = await fetch("https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/delete-whiteboard", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                });
    
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
                console.log(await response.json());
        
                setSavedWhiteboards(prev => prev.filter(wb => wb.sessionId.S !== selectedWhiteboard));
                setSelectedWhiteboard(null);
    
            } catch (err) {
                console.error("Error deleting whiteboard", err);
                setError("Failed to delete whiteboard.");
            }
        } else {
            setError("Please select a whiteboard.");
        }
    };

    // Sends sessionId to API to restore the session
    const handleOpen = async () => {
        // console.log("selectedWhiteboard: " + selectedWhiteboard);
        if (selectedWhiteboard) {
            const selectedBoard = savedWhiteboards.find(
                (whiteboard) => whiteboard.sessionId.S === selectedWhiteboard
            );
            
            if (selectedBoard) {
                const drawingData = selectedBoard.drawingData;
                const requestBody = { sessionId, drawingData };

                try {
                    const response = await fetch("https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/recreate-table", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                    });

                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                    const responseData = await response.json();
                    console.log(responseData);

                    navigate(`/whiteboard?sessionId=${selectedWhiteboard}&userId=${encodeURIComponent(userId)}`);
                } catch (err) {
                    console.error("Error recreating the session:", err);
                    setError("An error occurred while opening the whiteboard.");
                }
            } else {
                setError("Whiteboard not found.");
            }
        } else {
            setError("Please select a whiteboard.");
        }
    };

    // Handles change to radio buttons
    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedWhiteboard(event.target.value);
    };

    return (
        <div className="whiteboard-container">
            <div>
                <h1>Saved Whiteboards</h1>
            </div>
            {error && <div className="error-message">{error}</div>} {/* Display error message */}

            <div className="whiteboard-list">
                {loading ? (
                    <p>Loading whiteboards...</p>
                ) : savedWhiteboards.length > 0 ? (
                    <form>
                        {savedWhiteboards.map((whiteboard, index) => (
                            <div key={index} className="whiteboard-item">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="whiteboard"
                                        value={whiteboard.sessionId.S}
                                        checked={selectedWhiteboard === whiteboard.sessionId.S}
                                        onChange={handleRadioChange}
                                        className="radio-input"
                                    />
                                    <span className="whiteboard-details">
                                        <strong>Timestamp:</strong> {whiteboard.timestamp.S} <br />
                                        <strong>Session ID:</strong> {whiteboard.sessionId.S}
                                    </span>
                                </label>
                            </div>
                        ))}
                    </form>
                ) : (
                    <p>No whiteboards found.</p>
                )}
            </div>
            <div>
                <button onClick={handleBack}>Back</button>
                <button onClick={handleOpen}>Open</button>
                <button onClick={handleDelete}>Delete</button>
            </div>
        </div>
    );
};

export default Loadboards;
