import React from "react";
import "./App.css";

// Define the types for the props
interface MenuProps {
    setLineColor: (color: string) => void;
    setLineWidth: (width: number) => void;
    setLineOpacity: (opacity: number) => void;
}

const Menu: React.FC<MenuProps> = ({ setLineColor, setLineWidth, setLineOpacity }) => {
    return (
        <div className="Menu">
            <label>Brush Color </label>
            <input
                type="color"
                onChange={(e) => {
                    setLineColor(e.target.value);
                }}
            />
            <label>Brush Width </label>
            <input
                type="range"
                min="3"
                max="20"
                onChange={(e) => {
                    setLineWidth(Number(e.target.value));
                }}
            />
            <label>Brush Opacity</label>
            <input
                type="range"
                min="1"
                max="100"
                onChange={(e) => {
                    setLineOpacity(Number(e.target.value) / 100);
                }}
            />
        </div>
    );
};

export default Menu;
