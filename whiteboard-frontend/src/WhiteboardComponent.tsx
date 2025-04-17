import { useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import "./App.css";
import { useNavigate } from "react-router-dom";

// INTERFACE

interface CursorData {
    userId: string;
    position: { x: number; y: number };
}
interface DrawingData {
    userId: string;
    path: { x: number; y: number }[];
    filteredPath : {x:number; y:number}[];
    lineWidth: number;
    lineColor: string;
}
interface MouseEventWithOffset extends React.MouseEvent<HTMLCanvasElement> {
    nativeEvent: MouseEvent;
}

interface TouchEventWithOffset extends React.TouchEvent<HTMLCanvasElement> {
    nativeEvent: TouchEvent;
}

interface WhiteboardProps {
    sessionId: string;
    userId: string;
    isAuth: boolean;
}

const WhiteboardComponent: React.FC<WhiteboardProps> = ({ sessionId, userId, isAuth }) => {
    // CONSTANTS
    const MESSAGE_SEND_TIME = 50;

    // HOOKS
    const navigate = useNavigate();

    // REFERENCES
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cursorPositionRef = useRef<{ x: number; y: number } | null>(null);
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const pathBuffer = useRef<{ x: number; y: number }[]>([]);
    const pathRef = useRef<{ x: number; y: number }[]>([]);
    const sentTimeRef = useRef<number>(Date.now());

    // STATES
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [lineColor, setLineColor] = useState<string>("black");
    const [lineWidth, setLineWidth] = useState<number>(8);
    const [otherCursors, setOtherCursors] = useState<Record<string, { x: number; y: number }>>(() => ({}));
    const [selectedShape,setSelectedShape] = useState<string|null>(null);
    const [startPoint, setStartPoint] =  useState<{ x: number; y: number } | null>(null);
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

    // WebSocket Stuff
    useEffect(() => {
        const queryParams = new URLSearchParams({
            sessionId,
            userId,
        });

        const webSocket = new WebSocket(`wss://it1jqs927h.execute-api.us-east-2.amazonaws.com/production?${queryParams}`);

        // ON CONNECTION
        webSocket.onopen = () => {
            console.log("WebSocket Connected - WB COMPONENT");
            webSocket.send(
                JSON.stringify({
                    newUser: true,
                    sessionId: sessionId
                })
            )
        };

        // ON NEW MESSAGE
        webSocket.onmessage = (event) => {
            console.log("Received WebSocket message:", event.data);

            try {
                const data = JSON.parse(event.data);
                console.log(data);
                // DRAWING DATA
                if (data.drawingData) {
                    console.log("Received previous drawings:", data.drawingData);
                    updateCanvasFromServer(data.drawingData); // Call drawing function
                }
                // CURSOR DATA
                if (data.position) {
                    setOtherCursors((prevCursors) => ({
                        ...prevCursors,
                        [data.userId]: data.position, // Add or update the userId's position
                    }));
                }
                // 
                if (data && Array.isArray(data.path)) {
                    updateCanvasFromServer([data]);
                }
                // SHAPE DATA
                if (data.shapeData){
                    const startPointNew = data.shapeData.start;
                    const endNew = data.shapeData.end;
                    const selectedShapeNew = data.shapeData.type;
                    const lineWidthNew = data.shapeData.lineWidth;
                    const lineColorNew = data.shapeData.lineColor;
                    console.log(startPointNew, endNew, selectedShapeNew);
                    drawShape(startPointNew, endNew, selectedShapeNew, lineColorNew, lineWidthNew);
                }
                // CLEAR
                else if (data.erase) {
                    const ctx = canvasRef.current?.getContext("2d");
                    if (ctx && canvasRef.current) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        pathRef.current = []; // Clear local path
                    }
                }
            } catch (error) {
                console.warn("Non-JSON WebSocket message received:", event.data);
            }
        };

        setWs(webSocket);
        // ON LEAVING - DISCONNECTION
        return () => {
            webSocket.close();
            console.log("Websocket Disconnected - WB COMPONENT");
        };
    }, [sessionId, userId]);

    const draw = (e: MouseEventWithOffset | TouchEventWithOffset): void => {
        // If not drawing or canvas doesn't exist - don't run
        if (!isDrawing || !ctxRef.current) {
            return;
        }
        // Get cursor posititon
        const offset = getOffset(e);
        // Move to cursor and draw
        ctxRef.current.lineTo(offset.x, offset.y);
        ctxRef.current.stroke();
        // Update cursor label position
        updateCursor(offset);
        // 
        pathBuffer.current.push(offset); // Storing path in the buffer
        sendDrawing(offset);
    };

    const drawShape = (
        start: { x: number; y: number },
        end: { x: number; y: number },
        shape: string,
        strokeColor:string,
        strokeWidth: number
    ) => {
        // If canvas doesnt exist - don't run
        if (!ctxRef.current) return;
        const ctx = ctxRef.current;
        
        // Width = X
        // Height = Y
        const width = end.x - start.x;
        const height = end.y - start.y;

        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
    
        if (shape === "rectangle") {
            ctx.rect(start.x, start.y, width, height);
        } else if (shape === "circle") {
            const radius = Math.sqrt(width ** 2 + height ** 2) / 2; // Pythag theorum (a^2 + b^2 = c^2)
            const centerX = start.x + width / 2;
            const centerY = start.y + height / 2;
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        } else if (shape === "triangle") {
            ctx.moveTo(start.x + width / 2, start.y); // Top
            ctx.lineTo(start.x, start.y + height);    // Bottom left
            ctx.lineTo(start.x + width, start.y + height); // Bottom right
            ctx.closePath();
        }
    
        ctx.stroke();
        updateCursor(end); // Update the cursor
    };

    const endDrawing = (e?: MouseEventWithOffset | TouchEventWithOffset): void => {
        setIsDrawing(false);

        // Handling shapes
        if (ws?.readyState === WebSocket.OPEN && ctxRef.current && selectedShape && startPoint && e){
            const end = getOffset(e);
            drawShape(startPoint, end, selectedShape, lineColor, lineWidth);

            const shapeData = {
                type: selectedShape,
                start: startPoint,
                end: end,
                lineWidth,
                lineColor,
                userId,
            };
            
            ws.send(JSON.stringify({
                sessionId,
                messageType: "shape",
                shapeData,
                cursorData: {
                    position: cursorPositionRef.current,
                    userId,
                }
            })); // Sending drawing and cursor data

            updateCursor(end);

            setStartPoint(null);
            setSelectedShape(null); // Reset after drawing finishes
        }

        if (ctxRef.current) {
            ctxRef.current.closePath();
        }
        
        pathBuffer.current = [];
    };

    const getOffset = (e: MouseEventWithOffset | TouchEventWithOffset) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 }; // If canvas doesn't exist, don't find offset

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

    const handleFullErase = () => {
        if (ws) {
            // Send erase event to WebSocket server
            ws.send(
                JSON.stringify({
                    sessionId,
                    erase: true, // Custom erase flag
                    userId,
                })
            );
        }

        if (canvasRef.current && ctxRef.current) {
            const ctx = ctxRef.current;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Clear the canvas
            pathRef.current = [];
        }
    };

    const handleSave = async () => {
        if (isAuth){
            try {
                const requestBody = {
                    userId: userId,
                    sessionId: sessionId,
                };
        
                const response = await fetch(
                    "https://qdeqrga8ac.execute-api.us-east-2.amazonaws.com/save-whiteboard",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(requestBody),
                    }
                );
        
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
        
                const responseData = await response.json(); // Parse response body
                console.log("Save successful:", responseData);
                alert("Whiteboard Saved Successfully!")
            } catch (error) {
                console.error("Error saving whiteboard:", error);
            }
        }
        else
        {
            alert("Saving only permitted to signed in users.")
        }
    };

    const handleLoad = async () =>{
        if (isAuth){
            navigate(`/load-saved-boards?sessionId=${sessionId}&userId=${encodeURIComponent(userId)}`);
        }
        else{
            alert("Loading only permitted to signed in users.")
        }
    }

    const sendDrawing = (offset: {x: number; y: number;}) =>
        {
            updateCursor(offset);
            if (ws && Date.now() - sentTimeRef.current > MESSAGE_SEND_TIME && pathBuffer.current.length > 0) {
                ws.send(
                    JSON.stringify({
                        sessionId,
                        drawingData: {
                            userId,
                            path : [...pathBuffer.current], // sent the CURRENT buffer
                            lineWidth,
                            lineColor,
                        },
                        cursorData: {
                            position: cursorPositionRef.current,
                            userId,
                        }
                        
                    })
                );
                pathBuffer.current = [offset];
                sentTimeRef.current = Date.now();
            }
        }

    const startDrawing = (e: MouseEventWithOffset | TouchEventWithOffset): void => {
        const offset = getOffset(e);
        updateCursor(offset);

        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return; // No drawing if it doesn't exist

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        
        if (selectedShape){
            setStartPoint(offset); // Get start of shape
        } else {
            if (ctxRef.current) {
                ctxRef.current.beginPath();
                ctxRef.current.moveTo(offset.x, offset.y);
            }
            setIsDrawing(true);
        }
    };

    const updateCursor = (position: { x: number; y: number }) => {
        cursorPositionRef.current = position;
        if (cursorRef.current) {
            cursorRef.current.style.left = `${position.x}px`;
            cursorRef.current.style.top = `${position.y + 120}px`;
        }
    };

    const updateCanvasFromServer = (drawingUsers: DrawingData[]) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return; // If canvas doesn't exist - don't update
    
        drawingUsers.forEach((userStroke) => {
            if (userStroke.path && Array.isArray(userStroke.path)) {
                ctx.strokeStyle = userStroke.lineColor || "black";
                ctx.lineWidth = userStroke.lineWidth || 2;
                ctx.beginPath();
    
                let isNewStroke = true; // Flag to start a new path when needed
    
                userStroke.path.forEach((point: { x: number; y: number }) => {
                    if (point.x === -1 && point.y === -1) {
                        // Breakpoint detected: Close the current path and start a new one
                        ctx.stroke();
                        ctx.beginPath();
                        isNewStroke = true;
                    } else {
                        if (isNewStroke) {
                            ctx.moveTo(point.x, point.y);
                            isNewStroke = false;
                        } else {
                            ctx.lineTo(point.x, point.y);
                        }
                    }
                });
    
                ctx.stroke();
                ctx.closePath();
            } else {
                console.error("Invalid path data:", userStroke.path);
            }
        });
    };

    function useThrottledState<T>(initialValue: T, delay: number) {
        const [state, setState] = useState(initialValue);
        const lastUpdate = useRef(0);
        const throttledSetState = (value: T) => {
            const now = Date.now();
            if (now - lastUpdate.current > delay) {
            setState(value);
            lastUpdate.current = now;
            }
        };
        return [state, throttledSetState] as const;
    }

    return (
        <div className="App">
            <div className="draw-area">
                <Menu 
                    setLineColor={setLineColor} 
                    setLineWidth={setLineWidth} 
                    sessionId={sessionId}
                    canvasRef={canvasRef} 
                    handleFullErase={handleFullErase}
                    handleSave={handleSave}
                    handleLoad={handleLoad}
                    setSelectedShape={setSelectedShape}
                />
                <canvas
                    onMouseDown={startDrawing}
                    onMouseUp={endDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={endDrawing}
                    onTouchMove={draw}
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                />
                {isDrawing && cursorPositionRef.current && (
                    <div
                        className="cursor"
                        style={{
                            left: `${cursorPositionRef.current.x}px`,
                            top: `${cursorPositionRef.current.y + 120}px`,
                        }}
                    >
                        {userId}
                    </div>
                )}
                {Object.entries(otherCursors).map(([id, position]) => (
                    <div
                        key={id}
                        className="other-cursor"
                        style={{
                            left: `${position.x}px`,
                            top: `${position.y + 120}px`,
                            color: "blue",
                        }}>
                        {id}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WhiteboardComponent;
