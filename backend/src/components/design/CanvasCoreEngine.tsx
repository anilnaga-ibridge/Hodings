import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";
import { useEditorStore } from "@/store/useEditorStore";

// --- FABRIC.JS 5.x BUG FIX ---
// Prevents `Cannot read properties of undefined (reading '0')` in `stylesToArray`
// when serializing IText/Textbox objects that have undefined `styles`.
const utilAny = fabric.util as any;
if (utilAny && utilAny.stylesToArray) {
  const originalStylesToArray = utilAny.stylesToArray;
  utilAny.stylesToArray = function (styles: any, text: any) {
    return originalStylesToArray(styles || {}, text || "");
  };
}
// -----------------------------

interface CanvasCoreEngineProps {
  initialCanvasJson?: string;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export const CanvasCoreEngine: React.FC<CanvasCoreEngineProps> = ({
  initialCanvasJson,
  onCanvasReady,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const onCanvasReadyRef = useRef(onCanvasReady);
  onCanvasReadyRef.current = onCanvasReady;

  const {
    setZoom,
    setPan,
    snapToGrid,
    canvasWidth,
    canvasHeight,
  } = useEditorStore();

  // Store snapToGrid in a ref so the object:moving handler always reads the latest value
  const snapToGridRef = useRef(snapToGrid);
  snapToGridRef.current = snapToGrid;

  // Initialize Fabric Canvas — runs ONCE per mount
  useEffect(() => {
    if (!canvasElRef.current || !containerRef.current) return;

    // If already initialized (React strict mode re-run), just re-notify parent
    if (fabricRef.current) {
      if (onCanvasReadyRef.current) {
        onCanvasReadyRef.current(fabricRef.current);
      }
      return;
    }

    const fabricCanvas = new fabric.Canvas(canvasElRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });

    fabricRef.current = fabricCanvas;

    if (onCanvasReadyRef.current) {
      onCanvasReadyRef.current(fabricCanvas);
    }

    // Load initial JSON data if provided
    if (initialCanvasJson) {
      try {
        const parsed = JSON.parse(initialCanvasJson);
        fabricCanvas.loadFromJSON(parsed, () => {
          fabricCanvas.renderAll();
        });
      } catch (err) {
        console.error("Failed to load initial canvas JSON", err);
      }
    }

    // Center and scale to viewport initially
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scaleX = cw / canvasWidth;
    const scaleY = ch / canvasHeight;
    const initialScale = Math.min(scaleX, scaleY, 1.0) * 0.9;

    const centerPanX = (cw - canvasWidth * initialScale) / 2;
    const centerPanY = (ch - canvasHeight * initialScale) / 2;

    setZoom(initialScale);
    setPan(centerPanX, centerPanY);

    fabricCanvas.setZoom(initialScale);
    fabricCanvas.absolutePan(new fabric.Point(-centerPanX, -centerPanY));

    // ── Pan & Zoom via Mouse ──
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    fabricCanvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      if (evt.altKey || evt.shiftKey || opt.target === null) {
        isDragging = true;
        fabricCanvas.selection = false;
        lastX = evt.clientX || (evt as any).touches?.[0]?.clientX;
        lastY = evt.clientY || (evt as any).touches?.[0]?.clientY;
      }
    });

    fabricCanvas.on("mouse:move", (opt) => {
      if (isDragging) {
        const evt = opt.e;
        const currentX = evt.clientX || (evt as any).touches?.[0]?.clientX;
        const currentY = evt.clientY || (evt as any).touches?.[0]?.clientY;
        fabricCanvas.relativePan(new fabric.Point(currentX - lastX, currentY - lastY));
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) setPan(vpt[4], vpt[5]);
        lastX = currentX;
        lastY = currentY;
      }
    });

    fabricCanvas.on("mouse:up", () => {
      isDragging = false;
      fabricCanvas.selection = true;
    });

    // Zoom on wheel
    fabricCanvas.on("mouse:wheel", (opt) => {
      let targetZoom = fabricCanvas.getZoom() * 0.999 ** opt.e.deltaY;
      if (targetZoom > 20) targetZoom = 20;
      if (targetZoom < 0.05) targetZoom = 0.05;
      fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, targetZoom);
      setZoom(targetZoom);
      const vpt = fabricCanvas.viewportTransform;
      if (vpt) setPan(vpt[4], vpt[5]);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Snap to grid (reads from ref so the effect doesn't need snapToGrid as a dep)
    fabricCanvas.on("object:moving", (options) => {
      if (!snapToGridRef.current) return;
      const target = options.target;
      if (!target) return;
      const gridSize = 20;
      target.set({
        left: Math.round((target.left || 0) / gridSize) * gridSize,
        top: Math.round((target.top || 0) / gridSize) * gridSize,
      });
    });

    const handleResize = () => { /* placeholder */ };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      fabricCanvas.dispose();
      fabricRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fabricRef.current && containerRef.current) {
      fabricRef.current.setWidth(canvasWidth);
      fabricRef.current.setHeight(canvasHeight);

      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const scaleX = cw / canvasWidth;
      const scaleY = ch / canvasHeight;
      const initialScale = Math.min(scaleX, scaleY, 1.0) * 0.9;

      const centerPanX = (cw - canvasWidth * initialScale) / 2;
      const centerPanY = (ch - canvasHeight * initialScale) / 2;

      setZoom(initialScale);
      setPan(centerPanX, centerPanY);

      fabricRef.current.setZoom(initialScale);
      fabricRef.current.absolutePan(new fabric.Point(-centerPanX, -centerPanY));
      fabricRef.current.renderAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth, canvasHeight]);

  // ── Drag & Drop ──
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const canvas = fabricRef.current;
    if (!canvas) return;

    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const rect = canvas.getElement().getBoundingClientRect();
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      const canvasX = (e.clientX - rect.left - vpt[4]) / vpt[0];
      const canvasY = (e.clientY - rect.top - vpt[5]) / vpt[3];

      let obj: fabric.Object | null = null;

      if (data.type === "text") {
        obj = new fabric.IText(data.content || "Double click to edit", {
          left: canvasX, top: canvasY,
          fontFamily: data.fontFamily || "Inter",
          fontSize: data.fontSize || 32,
          fill: data.fill || "#000000",
          styles: {},
        });
      } else if (data.type === "rect") {
        obj = new fabric.Rect({
          left: canvasX, top: canvasY,
          width: data.width || 150, height: data.height || 150,
          fill: data.fill || "#3B82F6",
        });
      } else if (data.type === "circle") {
        obj = new fabric.Circle({
          left: canvasX, top: canvasY,
          radius: data.radius || 75,
          fill: data.fill || "#10B981",
        });
      } else if (data.type === "image" && data.src) {
        fabric.Image.fromURL(data.src, (img) => {
          img.set({ left: canvasX, top: canvasY });
          img.scaleToWidth(data.width || 300);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        }, { crossOrigin: "anonymous" });
        return;
      }

      if (obj) {
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
      }
    } catch (err) {
      console.error("Drop payload decoding failed", err);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#f8fafc] overflow-hidden flex items-center justify-center border border-slate-200 rounded-lg shadow-inner select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="shadow-2xl border border-slate-300 overflow-hidden bg-white">
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
};
