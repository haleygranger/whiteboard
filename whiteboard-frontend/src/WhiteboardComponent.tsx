import { useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import "./App.css";

// Define event types for drawing events
interface MouseEventWithOffset extends React.MouseEvent<HTMLCanvasElement> {
    nativeEvent: MouseEvent;
}
interface WhiteboardProps{
    sessionId: string;
    userId: string;
}

const WhiteboardComponent: React.FC<WhiteboardProps> = ({ sessionId, userId }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [lineWidth, setLineWidth] = useState<number>(5);
    const [lineColor, setLineColor] = useState<string>("black");

    // Initialization when the component mounts for the first time
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = lineWidth;
                ctxRef.current = ctx;
            }
        }
    }, [lineColor, lineWidth]);

    // Function for starting the drawing
    const startDrawing = (e: MouseEventWithOffset): void => {
        if (ctxRef.current) {
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        }
        setIsDrawing(true);
    };

    // Function for ending the drawing
    const endDrawing = (): void => {
        if (ctxRef.current) {
            ctxRef.current.closePath();
        }
        setIsDrawing(false);
    };

    // Function for drawing
    const draw = (e: MouseEventWithOffset): void => {
        if (!isDrawing || !ctxRef.current) {
            return;
        }
        ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctxRef.current.stroke();

        // Send drawing data over WebSocket
        if (ws) {
            ws.send(
                JSON.stringify({
                    sessionId: sessionId,
                    drawingData: {
                        userId,
                        x: e.nativeEvent.offsetX,
                        y: e.nativeEvent.offsetY,
                        lineWidth,
                        lineColor,
                    },
                })
            );
        }
    };

    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        // Connect to WebSocket when the component mounts
        const webSocket = new WebSocket('wss://it1jqs927h.execute-api.us-east-2.amazonaws.com/production/');
    
        webSocket.onopen = () => {
            console.log('WebSocket Connected');
        };
    
        // Receive messages and update drawing
        webSocket.onmessage = (event) => {
            const receivedData = JSON.parse(event.data);
            console.log(receivedData);
            // You can handle drawing updates from other users here
        };

        setWs(webSocket);

        return () => {
            // Clean up WebSocket connection on component unmount
            webSocket.close();
        };
    }, [sessionId]);

    return (
        <div className="App">
            <div className="draw-area">
                <Menu
                    setLineColor={setLineColor}
                    setLineWidth={setLineWidth}
                    sessionId={sessionId}
                />
                <canvas
                    onMouseDown={startDrawing}
                    onMouseUp={endDrawing}
                    onMouseMove={draw}
                    ref={canvasRef}
                    width={1280}
                    height={720}
                />
            </div>
        </div>
    );
}

export default WhiteboardComponent;
