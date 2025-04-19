
import { useState } from "react";
import "./App.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

// PROPS
interface MenuProps {
    sessionId: string;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    isShapesActive : boolean;

    handleFullErase: () => void;
    handleLoad: () => void;
    handleSave: () => void;
    setIsShapesActive: (b:boolean) => void;
    setLineColor: (color: string) => void;
    setLineWidth: (width: number) => void;
    setSelectedShape: (shape: string | null) => void;
}

const Menu: React.FC<MenuProps> = ({ setLineColor, setLineWidth, sessionId, handleFullErase, handleSave, handleLoad, setSelectedShape, setIsShapesActive, isShapesActive}) => {
    // STATES
    const [activeShape, setActiveShape] = useState<string | null>(null);
    const [isEraserActive, setIsEraserActive] = useState(false);
    const [selectedWidth, setSelectedWidth] = useState<number | null>(8);
    const [showShapeMenu,setShowShapeMenu] = useState(false);
    
    // VARIABLES
    const sizes = [
        { label: "small", value: 3 },
        { label: "medium", value: 8 },
        { label: "large", value: 15 },
    ];

    const handleColor = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsEraserActive(false);
        setIsShapesActive(false);
        setLineColor(e.target.value)
    }

    const handleEraser = () => {
        setLineColor("white"); 
        setActiveShape(null);
        setIsEraserActive(true);
        setIsShapesActive(false);
    };

    // Function to generate a shareable URL and display the QR code inside the modal
    const handleShareClick = () => {
        const shareableUrl = `https://main.d3nwftw9t1phgg.amplifyapp.com/whiteboard?sessionId=${sessionId}`;
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

    const handleSizeClick = (value: number) => {
        setLineWidth(value);
        setSelectedWidth(value);
        setIsEraserActive(false);
    };

    const selectShape = (shape: string) => {
        setIsShapesActive(true);
        setSelectedShape(shape);
        setActiveShape(shape);
        setShowShapeMenu(false);
    };

    const toggleShapeMenu = () => {
        setShowShapeMenu(prev => !prev);
    }

    return (
        <div className="menu">
            <div className={`color-picker`}>
                <input
                    type="color"
                    onChange={(e) => handleColor(e)}
                    title="Color Picker"
                />
            </div>
            <div className="size-picker">
                <div className="size-buttons">
                {sizes.map((size) => (
                    <button
                        key={size.label}
                        onClick={() => handleSizeClick(size.value)}
                        className={`circle-button ${selectedWidth === size.value ? "highlighted" : ""}`}
                        style={{
                            width: `${size.value * 2}px`,
                            height: `${size.value * 2}px`,
                        }}
                        aria-label={size.label}
                    />
                ))}
                </div>
            </div>
            <div className="shapes-wrapper">
                <button className={`button-base shapes-button ${isShapesActive ? "highlighted" : ""}`} title="Shapes" onClick={toggleShapeMenu}>
                    <i className="fas fa-shapes"></i>
                </button>

                {showShapeMenu && (
                    <div className="shape-dropdown">
                        <button onClick={() => selectShape("rectangle")} className={activeShape === "rectangle" ? "highlighted" : ""}>
                            <i className="fa fa-square" style={{ color: "#454342" }}/>
                        </button>
                        <button onClick={() => selectShape("circle")} className={activeShape === "circle" ? "highlighted" : ""}>
                            <i className="fa fa-circle" style={{ color: "#454342" }}/>
                        </button>
                        <button onClick={() => selectShape("triangle")} className={activeShape === "triangle" ? "highlighted" : ""}>
                            <i className="fa fa-play" style={{ color: "#454342" }}/>
                        </button>
                        
                    </div>
                )}
            </div>
            <div>
                <button className={`button-base eraser-button ${isEraserActive ? "highlighted" : ""}`} onClick={handleEraser} title="Eraser">
                    <i className="fa fa-eraser" />
                </button>
            </div>
            <div>
                <button className="button-base erase-all-button" onClick={handleFullErase} title="Clear">
                    <i className="fa fa-bomb"/>
                </button>
            </div>
            <div className="grid-item">

            </div>
            <div className="save-load-container">
                <button className="button-base save-button"  title="Save" onClick={handleSave}>
                    <i className="fas fa-save"></i>
                </button>
                <button className="button-base load-button" title="Load" onClick={handleLoad}>
                    <i className="fa fa-upload" aria-hidden="true"/>
                </button>
            </div>
            <div>
            <button className="button-base share-button" onClick={handleShareClick} title="Share">
                <i className="fas fa-share-square"></i>                
            </button>
            </div>
        </div>

    );
};

export default Menu;
