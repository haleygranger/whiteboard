import { useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import "./App.css";

// Define event types for drawing events
interface MouseEventWithOffset extends React.MouseEvent<HTMLCanvasElement> {
    nativeEvent: MouseEvent;
}

interface WhiteboardProps {
    sessionId: string;
    userId: string;
}

interface DrawingData{
    userId: string;
    path: {x:number; y:number}[];
    lineWidth: number;
    lineColor: string;
}

const WhiteboardComponent: React.FC<WhiteboardProps> = ({ sessionId, userId }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [lineWidth, setLineWidth] = useState<number>(5);
    const [lineColor, setLineColor] = useState<string>("black");
    const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
    const [path, setPath] = useState<{ x: number; y: number }[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // Initialization when the component mounts
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

    const startDrawing = (e: MouseEventWithOffset): void => {
        if (ctxRef.current) {
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        }
        updateCursor(e);
        setIsDrawing(true);
    };

    const endDrawing = (): void => {
        if (ctxRef.current) {
            ctxRef.current.closePath();
        }
        setIsDrawing(false);

        console.log("userId from WhiteboardComponent.tsx:", userId);

        if (ws && path.length > 0) {
            ws.send(
                JSON.stringify({
                    sessionId,
                    drawingData: {
                        userId,
                        path,
                        lineWidth,
                        lineColor,
                    },
                })
            );
            console.log("Sent data: "+ sessionId + " drawingData: " + 
                    userId,
                    path,
                    lineWidth,
                    lineColor)
            setPath([]); // Clear after sending
        }
    };

    const draw = (e: MouseEventWithOffset): void => {
        if (!isDrawing || !ctxRef.current) {
            return;
        }
        const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        ctxRef.current.lineTo(point.x, point.y);
        ctxRef.current.stroke();
        updateCursor(e);
        setPath((prev) => [...prev, point]);
    };

    const updateCursor = (e: MouseEventWithOffset) => {
        setCursorPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    };

    const updateCanvasFromServer = (drawingUsers: DrawingData[]) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        drawingUsers.forEach((userStroke) => {
            if (!userStroke.path) return;

            ctx.strokeStyle = userStroke.lineColor || "black";
            ctx.lineWidth = userStroke.lineWidth || 2;
            ctx.beginPath();

            userStroke.path.forEach((point: { x: number; y: number }, index: number) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        });
    };

    useEffect(() => {
        const queryParams = new URLSearchParams({
            sessionId,
            userId,
        });

        const webSocket = new WebSocket(`wss://it1jqs927h.execute-api.us-east-2.amazonaws.com/production?${queryParams}`);

        webSocket.onopen = () => {
            console.log("WebSocket Connected");
        };

        webSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Received WebSocket message:", data);

                if (data.sessionId && data.drawingData) {
                    console.log("Updating Whiteboard.")
                    updateCanvasFromServer([data.drawingData]);
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        setWs(webSocket);

        return () => {
            webSocket.close();
        };
    }, [sessionId, userId]);

    return (
        <div className="App">
            <div className="draw-area">
                <Menu setLineColor={setLineColor} setLineWidth={setLineWidth} sessionId={sessionId} />
                <canvas onMouseDown={startDrawing} onMouseUp={endDrawing} onMouseMove={draw} ref={canvasRef} width={1280} height={720} />
                {isDrawing && cursorPosition && (
                    <div
                        className="cursor"
                        style={{
                            left: `${cursorPosition.x}px`,
                            top: `${cursorPosition.y + 80}px`,
                        }}
                    >
                        {userId}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhiteboardComponent;
