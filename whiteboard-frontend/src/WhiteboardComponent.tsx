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
    const [cursorPosition, setCursorPosition] = useState<{x: number, y: number} | null>(null);   
    const[path, setPath] = useState<{x:number, y:number}[]>([]);

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
        updateCursor(e);
        setIsDrawing(true);
    };

    // Function for ending the drawing
    const endDrawing = (): void => {
        if (ctxRef.current) {
            ctxRef.current.closePath();
        }
        setIsDrawing(false);

        console.log("userId from WhiteboardComponent.tsx: " + userId);

        if (ws && path.length > 0) {
            ws.send(JSON.stringify({
                sessionId,
                drawingData: {
                    userId,
                    path,
                    lineWidth,
                    lineColor,
                },
            }));
            setPath([]); // Clear after sending
        }
    };

    // Function for drawing
    const draw = (e: MouseEventWithOffset): void => {
        if (!isDrawing || !ctxRef.current) {
            return;
        }
        const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        ctxRef.current.lineTo(point.x, point.y);
        ctxRef.current.stroke();
        updateCursor(e);
        setPath((prev) => [...prev, point]);

        // Send drawing data over WebSocket
/*
        TO DO: send collection of drawing events over websocket to parse, instead of each drawing event.
                Perhaps the path? Or evey couple strokes?
*/
    };
    
    const updateCursor = (e:MouseEventWithOffset) => {
        setCursorPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    }

    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        // Build query string
        const queryParams = new URLSearchParams({
            sessionId: sessionId,
            userId: userId
        });
        console.log("queryParams: " + queryParams);
        // Connect to WebSocket when the component mounts
        const webSocket = new WebSocket(`wss://it1jqs927h.execute-api.us-east-2.amazonaws.com/production?${queryParams.toString()}`);
    
        webSocket.onopen = () => {
            console.log('WebSocket Connected');
        };
    
        // Receive messages and update drawing
        webSocket.onmessage = (event) => {
            const receivedData = JSON.parse(event.data);
            console.log(receivedData);
        };

        setWs(webSocket);

        return () => {
            // Clean up WebSocket connection on component unmount
            webSocket.close();
            webSocket.onclose = () => console.log("WebSocket Closed"); // Debugging - is it closing prematurely?
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
                {isDrawing && cursorPosition && (
                    <div
                        className="cursor"
                        style={{
                            left: `${cursorPosition.x}px`,
                            top: `${cursorPosition.y+80}px`, // Adjusting for the offset on canvas - Hard Coded probably should fix
                        }}
                    >
                        {userId}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WhiteboardComponent;
