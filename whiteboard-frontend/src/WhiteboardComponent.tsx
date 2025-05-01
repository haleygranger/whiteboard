import { useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import "./App.css";
import { useNavigate } from "react-router-dom";

// TYPES
export type DrawingData = 
    | {
        type: "drawing";
        path: { x: number; y: number }[];
        lineColor?: string;
        lineWidth?: number;
    }
    | {
        type: "shape";
        shapeType: "rectangle" | "circle"; // you can add more shapes later
        start: { x: number; y: number };
        end: { x: number; y: number };
        lineColor?: string;
        lineWidth?: number;
    };

// INTERFACES
interface MouseEventWithOffset extends React.MouseEvent<HTMLCanvasElement> {
    nativeEvent: MouseEvent;
}

interface TouchEventWithOffset extends React.TouchEvent<HTMLCanvasElement> {
    nativeEvent: TouchEvent;
}

// PROPS
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
    const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const cursorPositionRef = useRef<{ x: number; y: number } | null>(null);
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null); // Look into this
    const pathBuffer = useRef<{ x: number; y: number }[]>([]);
    const pathRef = useRef<{ x: number; y: number }[]>([]);
    const sentTimeRef = useRef<number>(Date.now());
    const topCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // STATES
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [isShapesActive, setIsShapesActive] = useState(false);
    const [lineColor, setLineColor] = useState<string>("black");
    const [lineWidth, setLineWidth] = useState<number>(8);
    const [otherCursors, setOtherCursors] = useState<Record<string, { x: number; y: number }>>(() => ({}));
    const [selectedShape,setSelectedShape] = useState<string|null>(null);
    const [startPoint, setStartPoint] =  useState<{ x: number; y: number } | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // Initialization when the component mounts
    /* 
    Sets init info:
        - Base and top canvas
        - Pen color (Black)
        - Pen size (8)
    */
    useEffect(() => {
        const baseCanvas = baseCanvasRef.current;
        const topCanvas = topCanvasRef.current;
        if (baseCanvas && topCanvas) {
            const baseCtx = baseCanvas.getContext("2d");
            const topCtx = topCanvas.getContext("2d");
            if (baseCtx) {
                baseCtx.lineCap = "round";
                baseCtx.lineJoin = "round";
                baseCtx.strokeStyle = lineColor;
                baseCtx.lineWidth = lineWidth;
                ctxRef.current = baseCtx;
            }
            if (topCtx){
                topCtx.lineCap = "round";
                topCtx.lineJoin = "round";
                topCtx.strokeStyle = lineColor;
                topCtx.lineWidth = lineWidth;
            }
        }
    }, [lineColor, lineWidth]);

    // WebSocket Stuff
    useEffect(() => {
        const PING_INTERVAL = 30000;
        let interval: NodeJS.Timeout;
        let lastPongTime = Date.now();
        let reconnectTimeout: NodeJS.Timeout;
        let webSocket : WebSocket;

        const connectWebSocket = () => {
            const queryParams = new URLSearchParams({
                sessionId,
                userId,
            });
            webSocket = new WebSocket(`wss://it1jqs927h.execute-api.us-east-2.amazonaws.com/production?${queryParams}`);

            // ON CONNECTION
            webSocket.onopen = () => {
                console.log("WebSocket Connected");
                setWs(webSocket);
                lastPongTime = Date.now();
        
                webSocket.send(JSON.stringify({
                    newUser: true,
                    sessionId: sessionId
                }));

                // PING PONG functionality
                if (interval) clearInterval(interval); // Clear previous interval if any
                interval = setInterval(() => {
                    if (webSocket.readyState === WebSocket.OPEN) {
                        webSocket.send(JSON.stringify({ type: "ping" }));
                        console.log("PING!");
                        if (Date.now() - lastPongTime > 60000) {
                            console.log("No PONG received. Closing connection.");
                            webSocket.close();
                        }
                    }
                }, PING_INTERVAL);
            };

            // ON NEW MESSAGE
            webSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type == "pong"){
                    console.log("PONG!")
                    lastPongTime = Date.now();
                }
                // DRAWING DATA
                if (data.drawingData) {
                    updateCanvasFromServer(data.drawingData); // Call drawing function
                }
                // CURSOR DATA
                if (data.position) {
                    setOtherCursors((prevCursors) => ({
                        ...prevCursors,
                        [data.userId]: data.position, // Add or update the userId's position
                    }));
                }
                // USER DISCONNECT
                if (data.type == "user-disconnect")
                {
                    setOtherCursors((prevCursors) => {
                        const updatedCursors = { ...prevCursors };
                        delete updatedCursors[data.userId]; // Remove the disconnected user's cursor
                        return updatedCursors;
                    });
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
                    drawShape(startPointNew, endNew, selectedShapeNew, lineColorNew, lineWidthNew);
                    updateCanvasFromServer(data.shapeData);
                }
                // CLEAR
                else if (data.erase) {
                    const baseCanvas = baseCanvasRef.current;
                    const topCanvas = topCanvasRef.current;
                    if (!baseCanvas || !topCanvas) return;

                    const baseCtx = baseCanvas.getContext("2d");
                    const topCtx = topCanvas.getContext("2d");

                    if (baseCtx && topCtx) {
                        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
                        topCtx.clearRect(0,0,topCanvas.width,topCanvas.height);
                        pathRef.current = []; // Clear local path
                    }
                }
            } catch (error) {
                console.warn("Non-JSON WebSocket message received:", event.data);
            }
        };

        // ON LEAVING - DISCONNECTION
        webSocket.onclose = () => {
            console.warn("WebSocket closed. Attempting to reconnect...");
            clearInterval(interval);
            reconnectTimeout = setTimeout(() => {
                connectWebSocket(); // Reconnect after delay
            }, PING_INTERVAL);
        };

        // On ERROR - DISCONNECT
        webSocket.onerror = (err) => {
            console.error("WebSocket error", err);
            webSocket.close();
        };
    };

    connectWebSocket();
    return () => {
        if (interval) clearInterval(interval);
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        webSocket?.close();
        console.log("WebSocket Disconnected");
        };
    }, [sessionId, userId]);

    // Drawing functionality and shapes preview
    const draw = (e: MouseEventWithOffset | TouchEventWithOffset): void => {
        if (selectedShape && startPoint) {
            const topCanvas = topCanvasRef.current;
            if (!topCanvas) return;
            const ctx = topCanvas.getContext("2d");
            if (!ctx) return;
    
            const offset = getOffset(e);
    
            // Clear the top canvas before drawing preview
            ctx.clearRect(0, 0, topCanvas.width, topCanvas.height);
    
            // Preview the shape
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
    
            ctx.beginPath();
    
            const width = offset.x - startPoint.x;
            const height = offset.y - startPoint.y;
    
            if (selectedShape === "rectangle") {
                ctx.rect(startPoint.x, startPoint.y, width, height);
            } else if (selectedShape === "circle") {
                const radius = Math.sqrt(width ** 2 + height ** 2) / 2;
                const centerX = startPoint.x + width / 2;
                const centerY = startPoint.y + height / 2;
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            } else if (selectedShape === "triangle") {
                ctx.moveTo(startPoint.x + width / 2, startPoint.y); // Top
                ctx.lineTo(startPoint.x, startPoint.y + height);    // Bottom left
                ctx.lineTo(startPoint.x + width, startPoint.y + height); // Bottom right
                ctx.closePath();
            }
    
            ctx.stroke();
    
            updateCursor(offset);
        } else {
            // Default freehand drawing
            if (!isDrawing) return;
    
            const topCanvas = topCanvasRef.current;
            if (!topCanvas) return;
            const ctx = topCanvas.getContext("2d");
            if (!ctx) return;
    
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
    
            const offset = getOffset(e);
            ctx.lineTo(offset.x, offset.y);
            ctx.stroke();
    
            updateCursor(offset);
    
            pathBuffer.current.push(offset);
            sendDrawing(offset);
        }
    };

    // Shape drawing functionality
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
        
        const width = end.x - start.x; // Width = X coordinates
        const height = end.y - start.y; // Height = Y coordinates

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
        setIsShapesActive(false);
    };

    // On end of drawing
    const endDrawing = (e?: MouseEventWithOffset | TouchEventWithOffset): void => {
        setIsDrawing(false);

        const topCanvas = topCanvasRef.current;
        const baseCanvas = baseCanvasRef.current;
        if (!topCanvas || !baseCanvas) return;

        const baseCtx = baseCanvas.getContext("2d");
        const topCtx = topCanvas.getContext("2d");

        if (baseCtx && topCtx) {
            baseCtx.drawImage(topCanvas, 0, 0); // Smoosh top drawing ontop of base drawing
            topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height); // Clear top drawing
            topCtx.closePath();
        }

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
        
        pathBuffer.current = [];
    };

    const getOffset = (e: MouseEventWithOffset | TouchEventWithOffset) => {
        const canvas = topCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
    
        const rect = canvas.getBoundingClientRect();
    
        if ("touches" in e.nativeEvent || "changedTouches" in e.nativeEvent) {
            const nativeTouch = e.nativeEvent as TouchEvent;
            const touchList = nativeTouch.touches.length > 0
                ? nativeTouch.touches
                : nativeTouch.changedTouches;
            const touch = touchList[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top,
            };
        } else {
            const mouse = e.nativeEvent as MouseEvent;
            return {
                x: mouse.clientX - rect.left,
                y: mouse.clientY - rect.top,
            };
        }
    };
    

    // Clear the board and send this to API
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

        const baseCanvas = baseCanvasRef.current;
        const topCanvas = topCanvasRef.current;
        if (!baseCanvas || !topCanvas) return;

        const baseCtx = baseCanvas.getContext("2d");
        const topCtx = topCanvas.getContext("2d");

        if (baseCtx && topCtx) {
            baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
            topCtx.clearRect(0,0,topCanvas.width,topCanvas.height);
            pathRef.current = []; // Clear local path
        }
    };

    // Send userId and sessionId to API to save whiteboard info
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

    // Navigate to loading screen
    const handleLoad = async () =>{
        if (isAuth){
            navigate(`/load-saved-boards?sessionId=${sessionId}&userId=${encodeURIComponent(userId)}`);
        }
        else{
            alert("Loading only permitted to signed in users.")
        }
    }

    // Sends drawing information to API
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

    // Get offset and being drawing functionality
    const startDrawing = (e: MouseEventWithOffset | TouchEventWithOffset): void => {
        const offset = getOffset(e);
        updateCursor(offset);

        const topCanvas = topCanvasRef.current;
        if (!topCanvas) return;

        const ctx = topCanvas.getContext("2d");
        if (!ctx) return; // No drawing if it doesn't exist

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        
        if (selectedShape){
            setStartPoint(offset); // Get start of shape
        } else {
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(offset.x, offset.y);
            }
            setIsDrawing(true);
        }
    };

    // Change the cursor position
    const updateCursor = (position: { x: number; y: number }) => {
        cursorPositionRef.current = position;
        if (cursorRef.current) {
            cursorRef.current.style.left = `${position.x}px`;
            cursorRef.current.style.top = `${position.y }px`;
        }
    };

    // Get the message from the (WebSocket) API and handle it. It handles freehand and shapes.
    const updateCanvasFromServer = (drawingUsers: DrawingData[]) => {
        // console.log("Drawing data", drawingUsers);
        const baseCanvas = baseCanvasRef.current;
        if (!baseCanvas) return;
        const ctx = baseCanvas.getContext("2d");
        if (!ctx) return; // If canvas doesn't exist - don't update
    
        drawingUsers.forEach((item) => {
            //console.log("ITEM: ",item);
            if (item.type === "shape") {
                // Handle shapes (rectangles, circles, etc.)
                ctx.strokeStyle = item.lineColor || "black";
                ctx.lineWidth = item.lineWidth || 2;
    
                const startX = item.start?.x ?? 0;
                const startY = item.start?.y ?? 0;
                const endX = item.end?.x ?? 0;
                const endY = item.end?.y ?? 0;
    
                const width = endX - startX;
                const height = endY - startY;
    
                ctx.beginPath();
                if (item.shapeType === "rectangle") {
                    ctx.strokeRect(startX, startY, width, height);
                } else if (item.shapeType === "circle") {
                    const radius = Math.sqrt(width * width + height * height);
                    ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }
                ctx.closePath();
    
            } else if (item.path && Array.isArray(item.path)) {
                // Handle freehand drawings
                ctx.strokeStyle = item.lineColor || "black";
                ctx.lineWidth = item.lineWidth || 2;
                ctx.beginPath();
    
                let isNewStroke = true;
    
                item.path.forEach((point: { x: number; y: number }) => {
                    if (point.x === -1 && point.y === -1) {
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
                console.error("Invalid item received:", item);
            }
        });
    };    


    return (
        <div className="App">
            <Menu 
                    setLineColor={setLineColor} 
                    setLineWidth={setLineWidth} 
                    sessionId={sessionId}
                    canvasRef={baseCanvasRef} 
                    handleFullErase={handleFullErase}
                    handleSave={handleSave}
                    handleLoad={handleLoad}
                    setSelectedShape={setSelectedShape}
                    setIsShapesActive={setIsShapesActive}
                    isShapesActive={isShapesActive}
                />
            <div className="draw-area" >
                <canvas
                    ref={baseCanvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
                />
                <canvas
                    onMouseDown={startDrawing}
                    onMouseUp={endDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={endDrawing}
                    onTouchMove={draw}
                    ref={topCanvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
                />
                {isDrawing && cursorPositionRef.current && (
                    <div
                        className="cursor"
                        style={{
                            left: `${cursorPositionRef.current.x}px`,
                            top: `${cursorPositionRef.current.y+50}px`,
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
                            top: `${position.y+50}px`,
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
