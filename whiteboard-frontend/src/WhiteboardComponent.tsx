import { useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import "./App.css";

// Define event types for drawing events
interface MouseEventWithOffset extends React.MouseEvent<HTMLCanvasElement> {
    nativeEvent: MouseEvent;
}

interface TouchEventWithOffset extends React.TouchEvent<HTMLCanvasElement> {
    nativeEvent: TouchEvent;
}

interface WhiteboardProps {
    sessionId: string;
    userId: string;
}

interface DrawingData {
    userId: string;
    path: { x: number; y: number }[];
    lineWidth: number;
    lineColor: string;
}

const WhiteboardComponent: React.FC<WhiteboardProps> = ({ sessionId, userId }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [lineWidth, setLineWidth] = useState<number>(8);
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

    const startDrawing = (e: MouseEventWithOffset | TouchEventWithOffset): void => {
        const offset = getOffset(e);
        if (ctxRef.current) {
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(offset.x, offset.y);
        }
        updateCursor(offset);
        setIsDrawing(true);
    };

    const endDrawing = (): void => {
        if (ctxRef.current) {
            ctxRef.current.closePath();
        }
        setIsDrawing(false);

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
            setPath([]); // Clear after sending
        }
    };

    const draw = (e: MouseEventWithOffset | TouchEventWithOffset): void => {
        if (!isDrawing || !ctxRef.current) {
            return;
        }
        const offset = getOffset(e);
        ctxRef.current.lineTo(offset.x, offset.y);
        ctxRef.current.stroke();
        updateCursor(offset);
        setPath((prev) => [...prev, { x: offset.x, y: offset.y }]);
    };

    const getOffset = (e: MouseEventWithOffset | TouchEventWithOffset) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        if ("touches" in e.nativeEvent) {
            const touch = e.nativeEvent.touches[0];
            return {
                x: touch.clientX - canvas.offsetLeft,
                y: touch.clientY - canvas.offsetTop,
            };
        } else {
            return {
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY,
            };
        }
    };

    const updateCursor = (position: { x: number; y: number }) => {
        setCursorPosition(position);
    };

    const updateCanvasFromServer = (drawingUsers: DrawingData[]) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        drawingUsers.forEach((userStroke) => {
            if (userStroke.path && Array.isArray(userStroke.path)) {
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
            } else {
                console.error("Invalid path data:", userStroke.path);
            }
        });
    };

    const handleFullErase = () => {
        if (canvasRef.current && ctxRef.current) {
            const ctx = ctxRef.current;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setPath([]);
        }
    };

    // WebSocket Stuff
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

                if (data && Array.isArray(data.path)) {
                    updateCanvasFromServer([data]);
                } else {
                    console.error("Invalid WebSocket message format:", data);
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
                <Menu 
                    setLineColor={setLineColor} 
                    setLineWidth={setLineWidth} 
                    sessionId={sessionId}
                    canvasRef={canvasRef} 
                    handleFullErase={handleFullErase}
                />
                <canvas
                    onMouseDown={startDrawing}
                    onMouseUp={endDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={endDrawing}
                    onTouchMove={draw}
                    ref={canvasRef}
                    width={1280}
                    height={720}
                />
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
