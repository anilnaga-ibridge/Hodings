"use client";
import React from "react";
import { fabric } from "fabric";
import { useDesignStudioStore, CanvasTool } from "../stores/designStudio.store";
import {
  MousePointer2,
  Hand,
  Type,
  Square,
  Circle,
  Minus,
  PenLine,
  Crop,
  ChevronRight,
} from "lucide-react";

interface ToolPaletteProps {
  canvas: fabric.Canvas | null;
}

interface Tool {
  id: CanvasTool;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

const TOOLS: Tool[] = [
  { id: "select", label: "Select", icon: <MousePointer2 className="w-4 h-4" />, shortcut: "V" },
  { id: "hand", label: "Pan", icon: <Hand className="w-4 h-4" />, shortcut: "H" },
  { id: "text", label: "Text", icon: <Type className="w-4 h-4" />, shortcut: "T" },
  { id: "rect", label: "Rectangle", icon: <Square className="w-4 h-4" />, shortcut: "R" },
  { id: "circle", label: "Circle", icon: <Circle className="w-4 h-4" />, shortcut: "O" },
  { id: "line", label: "Line", icon: <Minus className="w-4 h-4" />, shortcut: "L" },
  { id: "pen", label: "Free Draw", icon: <PenLine className="w-4 h-4" />, shortcut: "P" },
  { id: "crop", label: "Crop", icon: <Crop className="w-4 h-4" />, shortcut: "C" },
];

export const ToolPalette: React.FC<ToolPaletteProps> = ({ canvas }) => {
  const { activeTool, setActiveTool } = useDesignStudioStore();

  const handleToolSelect = (tool: CanvasTool) => {
    if (!canvas) return;

    setActiveTool(tool);

    // Reset drawing mode for all tools by default
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";

    switch (tool) {
      case "select":
        canvas.defaultCursor = "default";
        canvas.hoverCursor = "move";
        break;

      case "hand":
        canvas.defaultCursor = "grab";
        canvas.hoverCursor = "grab";
        canvas.selection = false;
        break;

      case "text":
        canvas.defaultCursor = "text";
        canvas.hoverCursor = "text";
        canvas.selection = false;
        break;

      case "rect":
      case "circle":
      case "line":
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
        canvas.selection = false;
        break;

      case "pen":
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = 3;
          canvas.freeDrawingBrush.color = "#1E293B";
        }
        canvas.defaultCursor = "crosshair";
        break;

      case "crop":
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
        canvas.selection = false;
        break;
    }

    canvas.renderAll();
  };

  return (
    <aside
      id="tool-palette"
      className="w-[52px] bg-white border-r border-purple-100/80 flex flex-col items-center py-4 space-y-1 z-20 shadow-sm shrink-0 relative"
    >
      {/* Thin gradient accent top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500 rounded-b-sm" />

      {TOOLS.map((tool, idx) => {
        const isActive = activeTool === tool.id;
        // Separator before Crop
        const showSep = idx === 6;

        return (
          <React.Fragment key={tool.id}>
            {showSep && <div className="w-8 h-px bg-purple-100 my-1" />}
            <div className="relative group">
              <button
                id={`tool-${tool.id}`}
                onClick={() => handleToolSelect(tool.id)}
                title={`${tool.label} (${tool.shortcut})`}
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all duration-150 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-400/30 scale-105"
                    : "text-slate-400 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                {tool.icon}
                <span className="text-[7px] font-bold mt-0.5 leading-none opacity-70">
                  {tool.shortcut}
                </span>
              </button>

              {/* Tooltip on right */}
              <div className="absolute left-[52px] top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 ml-1">
                <div className="bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl flex items-center space-x-2">
                  <span>{tool.label}</span>
                  <span className="bg-slate-700 px-1 rounded text-[9px] font-mono">{tool.shortcut}</span>
                  <ChevronRight className="w-3 h-3 -ml-1 opacity-50" />
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </aside>
  );
};
