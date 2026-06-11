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

  const {
    showGrid,
    showRulers,
    handMode,
    setHandMode,
    activeTool,
    setActiveTool,
    zoom,
    panX,
    panY,
    canvasWidth,
    canvasHeight,
  } = useDesignStudioStore();

  // Notify parent when canvas is ready
  useEffect(() => {
    if (canvas) {
      onCanvasReady(canvas);
    }
  }, [canvas, onCanvasReady]);

  // ── Draw-on-drag refs ───────────────────────────────────────────────────────
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const drawingObjectRef = useRef<fabric.Object | null>(null);
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  // ── Wire mouse events for drawing ──────────────────────────────────────────
  useEffect(() => {
    if (!canvas) return;

    const onMouseDown = (opt: fabric.IEvent) => {
      const tool = activeToolRef.current;

      if (tool === "hand") {
        canvas.selection = false;
        canvas.defaultCursor = "grabbing";
        return;
      }

      if (tool === "text") {
        const pointer = canvas.getPointer(opt.e);
        const text = new fabric.IText("Type here", {
          left: pointer.x,
          top: pointer.y,
          fontSize: 48,
          fontFamily: "Outfit",
          fill: "#1E293B",
          fontWeight: "bold",
          styles: {},
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        setActiveTool("select");
        canvas.defaultCursor = "default";
        canvas.selection = true;
        return;
      }

      if (tool === "rect" || tool === "circle" || tool === "line") {
        const pointer = canvas.getPointer(opt.e);
        isDrawingRef.current = true;
        drawStartRef.current = { x: pointer.x, y: pointer.y };

        if (tool === "rect") {
          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 1,
            height: 1,
            fill: "#6366F1",
            strokeWidth: 0,
            selectable: false,
            evented: false,
            opacity: 0.85,
          });
          drawingObjectRef.current = rect;
          canvas.add(rect);
        } else if (tool === "circle") {
          const ellipse = new fabric.Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 1,
            ry: 1,
            fill: "#10B981",
            selectable: false,
            evented: false,
            opacity: 0.85,
          });
          drawingObjectRef.current = ellipse;
          canvas.add(ellipse);
        } else if (tool === "line") {
          const line = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            {
              stroke: "#1E293B",
              strokeWidth: 3,
              selectable: false,
              evented: false,
            }
          );
          drawingObjectRef.current = line;
          canvas.add(line);
        }
        canvas.renderAll();
      }
    };

    const onMouseMove = (opt: fabric.IEvent) => {
      if (!isDrawingRef.current || !drawStartRef.current || !drawingObjectRef.current) return;
      const pointer = canvas.getPointer(opt.e);
      const { x: sx, y: sy } = drawStartRef.current;
      const tool = activeToolRef.current;

      if (tool === "rect") {
        const rect = drawingObjectRef.current as fabric.Rect;
        rect.set({
          left: Math.min(sx, pointer.x),
          top: Math.min(sy, pointer.y),
          width: Math.abs(pointer.x - sx),
          height: Math.abs(pointer.y - sy),
        });
      } else if (tool === "circle") {
        const ellipse = drawingObjectRef.current as fabric.Ellipse;
        ellipse.set({
          left: Math.min(sx, pointer.x),
          top: Math.min(sy, pointer.y),
          rx: Math.max(1, Math.abs(pointer.x - sx) / 2),
          ry: Math.max(1, Math.abs(pointer.y - sy) / 2),
        });
      } else if (tool === "line") {
        const line = drawingObjectRef.current as fabric.Line;
        line.set({ x1: sx, y1: sy, x2: pointer.x, y2: pointer.y });
        if ((line as any)._calcDimensions) (line as any)._calcDimensions();
      }

      drawingObjectRef.current.setCoords();
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (!isDrawingRef.current || !drawingObjectRef.current) return;
      const tool = activeToolRef.current;
      isDrawingRef.current = false;
      drawStartRef.current = null;

      const obj = drawingObjectRef.current;
      drawingObjectRef.current = null;

      obj.set({ selectable: true, evented: true, opacity: 1 });
      obj.setCoords();

      // Remove tiny accidental clicks
      const bound = obj.getBoundingRect();
      if (tool !== "line" && bound.width < 5 && bound.height < 5) {
        canvas.remove(obj);
        canvas.renderAll();
        return;
      }

      canvas.setActiveObject(obj);
      canvas.renderAll();

      // Return to select after drawing
      setActiveTool("select");
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
      canvas.selection = true;
    };

    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);

    return () => {
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
    };
  }, [canvas, setActiveTool]);

  // ── Sync free-draw pen mode ─────────────────────────────────────────────────
  useEffect(() => {
    if (!canvas) return;
    if (activeTool === "pen") {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = 3;
        canvas.freeDrawingBrush.color = "#1E293B";
      }
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, activeTool]);

  // ── Global keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const SHORTCUT_MAP: Record<string, typeof activeTool> = {
      v: "select",
      h: "hand",
      t: "text",
      r: "rect",
      o: "circle",
      l: "line",
      p: "pen",
      c: "crop",
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) return;

      if (e.code === "Space") {
        setHandMode(true);
        setActiveTool("hand");
        if (canvas) {
          canvas.defaultCursor = "grab";
          canvas.selection = false;
        }
        e.preventDefault();
        return;
      }

      if (e.key === "Escape") {
        setActiveTool("select");
        if (canvas) {
          canvas.defaultCursor = "default";
          canvas.selection = true;
          canvas.isDrawingMode = false;
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (SHORTCUT_MAP[key] && !e.ctrlKey && !e.metaKey) {
        setActiveTool(SHORTCUT_MAP[key] as typeof activeTool);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setHandMode(false);
        setActiveTool("select");
        if (canvas) {
          canvas.defaultCursor = "default";
          canvas.selection = true;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [canvas, setHandMode, setActiveTool]);

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full bg-[#f8fafc] overflow-hidden flex items-center justify-center select-none ${
        handMode ? "cursor-grab" : ""
      }`}
    >
      {/* 1. Rulers */}
      <Rulers scrollWidth={2000} scrollHeight={2000} />

      {/* 2. Grid Overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:20px_20px] z-0" />
      )}
      {!showGrid && (
        <div className="absolute inset-0 pointer-events-none opacity-15 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
      )}

      {/* 3. Canvas */}
      <div
        className={`absolute shadow-2xl border border-slate-350 overflow-hidden bg-white z-10`}
        style={{
          left: showRulers ? "20px" : "0px",
          top: showRulers ? "20px" : "0px",
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <canvas ref={canvasElRef} />
      </div>

      {/* 4. Active tool indicator */}
      {activeTool !== "select" && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center space-x-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="capitalize">{activeTool} tool active</span>
            <span className="text-slate-400 text-[10px]">· Esc or V to cancel</span>
          </div>
        </div>
      )}

      {/* 5. Zoom Controls */}
      <ZoomControls canvas={canvas} />
    </div>
  );
};
