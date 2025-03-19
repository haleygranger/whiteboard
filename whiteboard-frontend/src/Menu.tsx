import "./App.css";

interface MenuProps {
    setLineColor: (color: string) => void;
    setLineWidth: (width: number) => void;
    sessionId: string;
}

const Menu: React.FC<MenuProps> = ({ setLineColor, setLineWidth, sessionId}) => {
    const sizes = [
        { label: "small", value: 3 },
        { label: "medium", value: 8 },
        { label: "large", value: 15 },
    ];

    const handleEraser = () => {
        setLineColor("white");
        setLineWidth(15); 
    };

    // Function to generate a shareable URL and copy it to clipboard
    const handleShareClick = () => {
        const shareableUrl = `https://main.dbiwmhwrvdu84.amplifyapp.com/whiteboard?sessionId=${sessionId}`;
        
        // Copy the URL to the clipboard
        navigator.clipboard.writeText(shareableUrl).then(() => {
        alert('Session URL copied to clipboard.');
        }).catch(err => {
        console.error('Failed to copy URL: ', err);
        });
    };

    return (
        <div className="Menu">
            <div className="color-picker">
                <label>Brush Color</label>
                <input
                    type="color"
                    onChange={(e) => setLineColor(e.target.value)}
                />
            </div>
            <div>
                <button className="eraser-button" onClick={handleEraser}>Eraser</button>
            </div>
            <div>
            <button className="share-button" onClick={handleShareClick}>Share</button>
            </div>
            <div className="size-picker">
                <label>Brush Size</label>
                <div className="size-buttons">
                    {sizes.map((size) => (
                        <button
                            key={size.label}
                            onClick={() => setLineWidth(size.value)}
                            className="circle-button"
                            style={{
                                width: `${size.value * 2}px`,
                                height: `${size.value * 2}px`,
                            }}
                            aria-label={size.label}
                        />
                    ))}
                </div>
            </div>
        </div>

    );
};

export default Menu;
