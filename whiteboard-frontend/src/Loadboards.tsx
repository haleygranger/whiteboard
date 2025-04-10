import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface Whiteboard {
    sessionId: { S: string };
    drawingData: any; // Define a better type here based on your drawing data
    timestamp: { N: string };
}

const Loadboards: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const sessionId = queryParams.get("sessionId") ?? "";
    const userId = queryParams.get("userId") ?? "";
    const [savedWhiteboards, setSavedWhiteboards] = useState<Whiteboard[]>([]);
    const [selectedWhiteboard, setSelectedWhiteboard] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); // Error state to display error messages

    const handleBack = () => {
        navigate(`/whiteboard?sessionId=${sessionId}&userId=${encodeURIComponent(userId)}`);
    };

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedWhiteboard(event.target.value);
    };

    const handleOpen = async () => {
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

    useEffect(() => {
        if (userId) {
            getSavedWhiteboards();
        }
    }, [userId]);

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
                                        <strong>Timestamp:</strong> {whiteboard.timestamp.N} <br />
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
            </div>
        </div>
    );
};

export default Loadboards;
