import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { useEditorStore } from "@/store/useEditorStore";

interface CanvasCoreEngineProps {
  initialCanvasJson?: string;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export const CanvasCoreEngine: React.FC<CanvasCoreEngineProps> = ({
  initialCanvasJson,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasInstance, setCanvasInstance] = useState<fabric.Canvas | null>(null);

  const {
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
    snapToGrid,
    canvasWidth,
    canvasHeight,
  } = useEditorStore();

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });

    setCanvasInstance(fabricCanvas);
    if (onCanvasReady) {
      onCanvasReady(fabricCanvas);
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
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const scaleX = containerWidth / canvasWidth;
    const scaleY = containerHeight / canvasHeight;
    const initialScale = Math.min(scaleX, scaleY, 1.0) * 0.9; // 90% size

    const centerPanX = (containerWidth - canvasWidth * initialScale) / 2;
    const centerPanY = (containerHeight - canvasHeight * initialScale) / 2;

    setZoom(initialScale);
    setPan(centerPanX, centerPanY);

    fabricCanvas.setZoom(initialScale);
    fabricCanvas.absolutePan(new fabric.Point(-centerPanX, -centerPanY));

    // Handle Pan & Zoom via Mouse Events
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    fabricCanvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      // Spacebar or Middle mouse click to drag/pan
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
        const deltaX = currentX - lastX;
        const deltaY = currentY - lastY;
        
        fabricCanvas.relativePan(new fabric.Point(deltaX, deltaY));
        
        // Sync pan back to store
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          setPan(vpt[4], vpt[5]);
        }
        
        lastX = currentX;
        lastY = currentY;
      }
    });

    fabricCanvas.on("mouse:up", () => {
      isDragging = false;
      fabricCanvas.selection = true;
    });

    // Zoom on wheel (Ctrl + Wheel)
    fabricCanvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let targetZoom = fabricCanvas.getZoom();
      targetZoom *= 0.999 ** delta;
      
      // Constraints
      if (targetZoom > 20) targetZoom = 20;
      if (targetZoom < 0.05) targetZoom = 0.05;

      fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, targetZoom);
      setZoom(targetZoom);

      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        setPan(vpt[4], vpt[5]);
      }

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Handle snaps to grid when objects are moving
    fabricCanvas.on("object:moving", (options) => {
      if (!snapToGrid) return;
      const target = options.target;
      if (!target) return;

      const gridSize = 20;
      
      // Snap positions
      const snappedLeft = Math.round((target.left || 0) / gridSize) * gridSize;
      const snappedTop = Math.round((target.top || 0) / gridSize) * gridSize;

      target.set({
        left: snappedLeft,
        top: snappedTop,
      });
    });

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvas) return;
      // Optionally update canvas element container size
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      fabricCanvas.dispose();
    };
  }, [canvasWidth, canvasHeight, snapToGrid]);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drag & Drop to Create Elements
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasInstance) return;

    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const rect = canvasInstance.getElement().getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Transform coordinate system from screen to canvas using viewport transform
      const vpt = canvasInstance.viewportTransform;
      if (!vpt) return;

      const canvasX = (clientX - vpt[4]) / vpt[0];
      const canvasY = (clientY - vpt[5]) / vpt[3];

      let newObject: fabric.Object | null = null;

      if (data.type === "text") {
        newObject = new fabric.IText(data.content || "Double click to edit", {
          left: canvasX,
          top: canvasY,
          fontFamily: data.fontFamily || "Inter",
          fontSize: data.fontSize || 32,
          fill: data.fill || "#000000",
        });
      } else if (data.type === "rect") {
        newObject = new fabric.Rect({
          left: canvasX,
          top: canvasY,
          width: data.width || 150,
          height: data.height || 150,
          fill: data.fill || "#3B82F6",
        });
      } else if (data.type === "circle") {
        newObject = new fabric.Circle({
          left: canvasX,
          top: canvasY,
          radius: data.radius || 75,
          fill: data.fill || "#10B981",
        });
      } else if (data.type === "image" && data.src) {
        fabric.Image.fromURL(
          data.src,
          (img) => {
            img.set({
              left: canvasX,
              top: canvasY,
            });
            img.scaleToWidth(data.width || 300);
            canvasInstance.add(img);
            canvasInstance.setActiveObject(img);
            canvasInstance.renderAll();
          },
          { crossOrigin: "anonymous" }
        );
        return;
      }

      if (newObject) {
        canvasInstance.add(newObject);
        canvasInstance.setActiveObject(newObject);
        canvasInstance.renderAll();
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
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
