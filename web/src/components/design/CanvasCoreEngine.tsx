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

// Prevents `Cannot read properties of undefined (reading '0')` in
// `removeStyleFromTo` when _unwrappedTextLines lags behind styles during rapid
// typing/deletion inside an IText or Textbox object.
const iTextAny = (fabric.IText as any).prototype;
if (iTextAny && !iTextAny.removeStyleFromTo?.__patched) {
  const origRemove = iTextAny.removeStyleFromTo;
  iTextAny.removeStyleFromTo = function (start: number, end: number) {
    if (!this._unwrappedTextLines || this._unwrappedTextLines.length === 0) {
      if (typeof this._splitTextIntoLines === "function") {
        try {
          this._unwrappedTextLines = this._splitTextIntoLines(this.text || "").lines;
        } catch (_) {
          return;
        }
      } else {
        return;
      }
    }
    try {
      if (!this.styles) {
        this.styles = {};
      }
      const originalStyles = this.styles;
      const proxyStyles = new Proxy(originalStyles, {
        get(target, prop) {
          if (typeof prop === "string" && !isNaN(Number(prop)) && !target[prop]) {
            return {};
          }
          return Reflect.get(target, prop);
        }
      });
      this.styles = proxyStyles;
      try {
        origRemove.call(this, start, end);
      } finally {
        this.styles = originalStyles;
      }
    } catch (err) {
      // Quietly swallow standard Fabric style index mismatches during rapid edits
    }
  };
  iTextAny.removeStyleFromTo.__patched = true;
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
    zoom,
    panX,
    panY,
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

    const container = containerRef.current;
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();

      const isZoomEvent = e.ctrlKey || e.metaKey;
      const currentZoom = useEditorStore.getState().zoom;
      const currentPanX = useEditorStore.getState().panX;
      const currentPanY = useEditorStore.getState().panY;

      if (isZoomEvent) {
        // Zoom (dampened exponential zoom curve adjusted for trackpad pinch vs mouse wheel)
        const delta = e.deltaY;
        let factor = 0.002;
        if (Math.abs(delta) < 20) {
          factor = 0.01; // higher sensitivity for trackpad pinch
        }
        
        let targetZoom = currentZoom * Math.exp(-delta * factor);
        
        // Bound between 5% and 2000%
        if (targetZoom > 20) targetZoom = 20;
        if (targetZoom < 0.05) targetZoom = 0.05;
        
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newPanX = mouseX - (mouseX - currentPanX) * (targetZoom / currentZoom);
        const newPanY = mouseY - (mouseY - currentPanY) * (targetZoom / currentZoom);
        
        setZoom(targetZoom);
        setPan(newPanX, newPanY);
      } else {
        // Scroll panning
        setPan(currentPanX - e.deltaX, currentPanY - e.deltaY);
      }
    };
    container.addEventListener("wheel", handleNativeWheel, { passive: false });

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

    fabricCanvas.renderAll();

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
        
        const deltaX = currentX - lastX;
        const deltaY = currentY - lastY;
        
        const currentPanX = useEditorStore.getState().panX;
        const currentPanY = useEditorStore.getState().panY;
        setPan(currentPanX + deltaX, currentPanY + deltaY);
        
        lastX = currentX;
        lastY = currentY;
      }
    });

    fabricCanvas.on("mouse:up", () => {
      isDragging = false;
      fabricCanvas.selection = true;
    });

    // Zoom and pan are handled natively above to support zooming and panning outside the canvas sheet bounds

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
      container.removeEventListener("wheel", handleNativeWheel);
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
      const canvasEl = canvas.getElement();
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const currentZoom = useEditorStore.getState().zoom;

      const canvasX = (e.clientX - rect.left) / currentZoom;
      const canvasY = (e.clientY - rect.top) / currentZoom;

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
        const isDataOrBlob = data.src.startsWith("data:") || data.src.startsWith("blob:");
        fabric.Image.fromURL(data.src, (img) => {
          img.set({ left: canvasX, top: canvasY });
          img.scaleToWidth(data.width || 300);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        }, isDataOrBlob ? {} : { crossOrigin: "anonymous" });
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
      <div
        className="absolute shadow-2xl border border-slate-300 overflow-hidden bg-white"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
          left: "0px",
          top: "0px",
        }}
      >
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
};
