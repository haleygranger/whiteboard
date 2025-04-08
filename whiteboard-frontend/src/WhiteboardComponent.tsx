import { useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import "./App.css";
import { useNavigate } from "react-router-dom";

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
    isAuth: boolean;
}

interface DrawingData {
    userId: string;
    path: { x: number; y: number }[];
    filteredPath : {x:number; y:number}[];
    lineWidth: number;
    lineColor: string;
}

interface CursorData {
    userId: string;
    position: { x: number; y: number };
}

const WhiteboardComponent: React.FC<WhiteboardProps> = ({ sessionId, userId, isAuth }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [lineWidth, setLineWidth] = useState<number>(8);
    const [lineColor, setLineColor] = useState<string>("black");
    const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
    const [path, setPath] = useState<{ x: number; y: number }[]>([]); console.log(path);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [sentTime, setSentTime] = useState<number>(Date.now());
    const pathBuffer = useRef<{ x: number; y: number }[]>([]);
    const MESSAGE_SEND_TIME = 100;
    const [otherCursors, setOtherCursors] = useState<CursorData[]>([]);
    const navigate = useNavigate();
    const [selectedShape,setSelectedShape] = useState<string|null>(null);
    const [startPoint, setStartPoint] =  useState<{ x: number; y: number } | null>(null);

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
        updateCursor(offset);
        
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

    const endDrawing = (e?: MouseEventWithOffset | TouchEventWithOffset): void => {
        setIsDrawing(false);

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
                cursorData :
                    {
                        position: end,
                        userId
                    },
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

    const draw = (e: MouseEventWithOffset | TouchEventWithOffset): void => {
        if (!isDrawing || !ctxRef.current) {
            return;
        }
        const offset = getOffset(e);
        ctxRef.current.lineTo(offset.x, offset.y);
        ctxRef.current.stroke();
        updateCursor(offset);
        pathBuffer.current.push(offset); // Storing path in the buffer
        setPath((prev) => [...prev, offset]);
        sendDrawing(offset);
    };

    const drawShape = (
        start: { x: number; y: number },
        end: { x: number; y: number },
        shape: string,
        strokeColor:string,
        strokeWidth: number
    ) => {
        if (!ctxRef.current) return;
        const ctx = ctxRef.current;
    
        const width = end.x - start.x;
        const height = end.y - start.y;
    
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
    
        if (shape === "rectangle") {
            ctx.rect(start.x, start.y, width, height);
        } else if (shape === "circle") {
            const radius = Math.sqrt(width ** 2 + height ** 2) / 2;
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
        updateCursor(end);
    };

    const sendDrawing = (offset: {x: number; y: number;}) =>
    {
        updateCursor(offset);
        const position = cursorPosition;
        if (ws && Date.now() - sentTime > MESSAGE_SEND_TIME && pathBuffer.current.length > 0) {
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
                        position,
                        userId,
                    }
                    
                })
            );
            pathBuffer.current = [offset];
            setSentTime(Date.now());
        }
    }

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
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setPath([]);
        }
    };

    const handleShapes = () => {
        alert("Shape development in progress.");
    }

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

    // WebSocket Stuff
    useEffect(() => {
        const queryParams = new URLSearchParams({
            sessionId,
            userId,
        });

        const webSocket = new WebSocket(`wss://it1jqs927h.execute-api.us-east-2.amazonaws.com/production?${queryParams}`);

        webSocket.onopen = () => {
            console.log("WebSocket Connected - WB COMPONENT");
            webSocket.send(
                JSON.stringify({
                    newUser: true,
                    sessionId: sessionId
                })
            )
            console.log("Sending newUser" + JSON.stringify({
                newUser: true,
                sessionId: sessionId
            }));
        };

        webSocket.onmessage = (event) => {
            console.log("Received WebSocket message:", event.data);

            // Check if the message is JSON
            try {
                // If new user event = loadPrevious
                const data = JSON.parse(event.data);
                if (data.drawingData) {
                    console.log("Received previous drawings:", data.drawingData);
                    updateCanvasFromServer(data.drawingData); // Call drawing function
                }
                if (data.position) {
                    // Handle cursor update
                    setOtherCursors((prevCursors) => {
                        const updatedCursors = [...prevCursors];
                        const existingCursorIndex = updatedCursors.findIndex(
                            (cursor) => cursor.userId === data.userId
                        );
                        if (existingCursorIndex !== -1) {
                            updatedCursors[existingCursorIndex] = {
                                userId: data.userId,
                                position: data.position,  // Use position from the message
                            };
                        } else {
                            updatedCursors.push({
                                userId: data.userId,
                                position: data.position,  // Add new cursor with userId and position
                            });
                        }
                        return updatedCursors;
                    });
                    console.log("Updated Other Cursors:", otherCursors);
                }

                if (data && Array.isArray(data.path)) {
                    updateCanvasFromServer([data]);
                }
                if (data.shapeData){
                    const startPointNew = data.shapeData.start;
                    const endNew = data.shapeData.end;
                    const selectedShapeNew = data.shapeData.type;
                    const lineWidthNew = data.shapeData.lineWidth;
                    const lineColorNew = data.shapeData.lineColor;
                    console.log(startPointNew, endNew, selectedShapeNew);
                    drawShape(startPointNew, endNew, selectedShapeNew, lineColorNew, lineWidthNew);
                }
                // Handle full erase event
                else if (data.erase) {
                    const ctx = canvasRef.current?.getContext("2d");
                    if (ctx && canvasRef.current) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        setPath([]); // Clear local path
                    }
                }
            } catch (error) {
                console.warn("Non-JSON WebSocket message received:", event.data);
            }
        };

        setWs(webSocket);

        return () => {
            webSocket.close();
            console.log("Websocket Disconnected - WB COMPONENT");
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
                    handleShapes={handleShapes}
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
                    width={1280}
                    height={720}
                />
                {isDrawing && cursorPosition && (
                    <div
                        className="cursor"
                        style={{
                            left: `${cursorPosition.x}px`,
                            top: `${cursorPosition.y + 120}px`,
                        }}
                    >
                        {userId}
                    </div>
                )}
                {otherCursors.map((cursor) => (
                    <div
                        key={cursor.userId}
                        className="other-cursor"
                        style={{
                            left: `${cursor.position.x}px`,
                            top: `${cursor.position.y + 120}px`,
                            color: "blue", 
                        }}
                    >
                        {cursor.userId}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WhiteboardComponent;
