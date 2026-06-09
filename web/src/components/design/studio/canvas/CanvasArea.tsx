import React, { useRef, useEffect } from "react";
import { useFabricCanvas } from "../hooks/useFabricCanvas";
import { Rulers } from "./Rulers";
import { ZoomControls } from "./ZoomControls";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { fabric } from "fabric";

interface CanvasAreaProps {
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onSelectionChanged: (obj: fabric.Object | null) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  onCanvasReady,
  onSelectionChanged,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const canvas = useFabricCanvas({
    canvasEl: canvasElRef.current,
    containerEl: containerRef.current,
    onSelectionChanged,
  });

  const { showGrid, showRulers, handMode, setHandMode } = useDesignStudioStore();

  // Notify parent component when canvas is ready
  useEffect(() => {
    if (canvas) {
      onCanvasReady(canvas);
    }
  }, [canvas, onCanvasReady]);

  // Spacebar pan listener (Hold space to pan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        setHandMode(true);
        if (canvas) {
          canvas.defaultCursor = "grab";
        }
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setHandMode(false);
        if (canvas) {
          canvas.defaultCursor = "default";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [canvas, setHandMode]);

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full bg-[#f8fafc] overflow-hidden flex items-center justify-center select-none ${
        handMode ? "cursor-grab" : ""
      }`}
    >
      {/* 1. Rulers */}
      <Rulers scrollWidth={2000} scrollHeight={2000} />

      {/* 2. Background Grid Overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:20px_20px] z-0" />
      )}

      {/* Grid pattern if not showing explicit grid line overlay */}
      {!showGrid && (
        <div className="absolute inset-0 pointer-events-none opacity-15 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
      )}

      {/* 3. Canvas Container */}
      <div 
        className={`relative shadow-2xl border border-slate-350 overflow-hidden bg-white z-10 transition-transform ${
          showRulers ? "mt-[20px] ml-[20px]" : ""
        }`}
      >
        <canvas ref={canvasElRef} />
      </div>

      {/* 4. Zoom Controls Overlay */}
      <ZoomControls canvas={canvas} />
    </div>
  );
};
