import { useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import "./App.css";

// Define event types for drawing events
interface MouseEventWithOffset extends React.MouseEvent<HTMLCanvasElement> {
    nativeEvent: MouseEvent;
}

/*
interface WhiteboardProps{
    sessionId: string;
    userName: string;
}
*/

function WhiteboardComponent() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [lineWidth, setLineWidth] = useState<number>(5);
    const [lineColor, setLineColor] = useState<string>("black");
    const [lineOpacity, setLineOpacity] = useState<number>(0.1);

    // Initialization when the component mounts for the first time
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.globalAlpha = lineOpacity;
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = lineWidth;
                ctxRef.current = ctx;
            }
        }
    }, [lineColor, lineOpacity, lineWidth]);

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
    };

    return (
        <div className="App">
            <div className="draw-area">
                <Menu
                    setLineColor={setLineColor}
                    setLineWidth={setLineWidth}
                    setLineOpacity={setLineOpacity}
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
