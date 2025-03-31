
import "./App.css";
import 'font-awesome/css/font-awesome.min.css'; // Import FontAwesome CSS

interface MenuProps {
    setLineColor: (color: string) => void;
    setLineWidth: (width: number) => void;
    sessionId: string;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    handleFullErase: () => void;
}

const Menu: React.FC<MenuProps> = ({ setLineColor, setLineWidth, sessionId, handleFullErase}) => {

    const sizes = [
        { label: "small", value: 3 },
        { label: "medium", value: 8 },
        { label: "large", value: 15 },
    ];

    const handleEraser = () => {
        setLineColor("white"); 
    };

    // Function to generate a shareable URL and display the QR code inside the modal
    const handleShareClick = () => {
        //const shareableUrl = `https://main.d3nwftw9t1phgg.amplifyapp.com/whiteboard?sessionId=${sessionId}`;
        const shareableUrl = `http://localhost:5173/whiteboard?sessionId=${sessionId}`;
        // console.log(sessionId); // This is NOT NULL
        // Construct QR code API URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareableUrl)}`;
    
        // Copy the URL to clipboard
        navigator.clipboard.writeText(shareableUrl).then(() => {
            alert('Session URL copied to clipboard.');
            
            // Open a new window displaying the QR code
            const newWindow = window.open('', '', 'width=300,height=300');
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                        <head>
                            <title>Session QR Code</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                    margin: 20px;
                                    background-color: #f4f4f9;
                                }
                                h2 {
                                    color: #333;
                                    font-size: 18px;
                                    margin-bottom: 20px;
                                }
                                img {
                                    max-width: 200px;
                                    max-height: 200px;
                                    margin-bottom: 20px;
                                }
                                p {
                                    color: #555;
                                    font-size: 16px;
                                    line-height: 1.5;
                                }
                                .container {
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    align-items: center;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h2>Share Session QR Code</h2>
                                <img src="${qrCodeUrl}" alt="QR Code" />
                                <p>Scan this QR code to join the session.</p>
                            </div>
                        </body>
                    </html>
                `);
            }
        }).catch(err => {
            console.error('Failed to copy URL: ', err);
            alert('Failed to copy URL.');
        });
    };

    return (
        <div className="Menu">
            <div className="color-picker">
                <input
                    type="color"
                    onChange={(e) => setLineColor(e.target.value)}
                />
            </div>
            <div className="size-picker">
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
            <div>
                <button className="eraser-button" onClick={handleEraser}>
                    <i className="fa fa-eraser" />
                </button>
            </div>
            <div>
                <button className="erase-all-button" onClick={handleFullErase}>
                    <i className="fa fa-bomb"/>
                </button>
            </div>
            <div>
            <button className="share-button" onClick={handleShareClick}>Share</button>
            </div>
        </div>

    );
};

export default Menu;
