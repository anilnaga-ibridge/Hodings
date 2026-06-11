import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { EditorLayer } from "../types/layer.types";
import { SmartGuides } from "../canvas/SmartGuides";

// Patch fabric.util.stylesToArray to prevent TypeError when styles is undefined
const util = fabric.util as any;
if (fabric && util && !util.stylesToArray?.__patched) {
  const originalStylesToArray = util.stylesToArray;
  if (originalStylesToArray) {
    util.stylesToArray = function (styles: any, text: string) {
      if (!styles) {
        return [];
      }
      return originalStylesToArray.call(this, styles, text);
    };
    util.stylesToArray.__patched = true;
  }
}

// Patch fabric IText.prototype.removeStyleFromTo to guard against undefined
// _unwrappedTextLines entries. When text is typed or deleted rapidly, the
// _unwrappedTextLines array can lag behind styles, causing:
//   TypeError: Cannot read properties of undefined (reading '0')
// at klass.removeStyleFromTo (fabric.js:~23370)
// called by klass.onInput (fabric.js:~24004)
const iTextProto = (fabric.IText as any).prototype;
if (iTextProto && !iTextProto.removeStyleFromTo?.__patched) {
  const originalRemoveStyleFromTo = iTextProto.removeStyleFromTo;
  iTextProto.removeStyleFromTo = function (start: number, end: number) {
    // Ensure _unwrappedTextLines is populated before delegating.
    // If it's missing or empty, re-generate it so the original function
    // has the data it needs.
    if (!this._unwrappedTextLines || this._unwrappedTextLines.length === 0) {
      if (typeof this._splitTextIntoLines === "function") {
        try {
          this._unwrappedTextLines = this._splitTextIntoLines(this.text || "").lines;
        } catch (_) {
          // If even that fails, bail out gracefully rather than crash.
          return;
        }
      } else {
        return;
      }
    }
    try {
      originalRemoveStyleFromTo.call(this, start, end);
    } catch (err) {
      // Swallow the error so the text object stays interactive.
      // The style data may be slightly inconsistent for one frame but
      // Fabric will self-heal on the next render/input cycle.
      console.warn("[fabric patch] removeStyleFromTo swallowed error:", err);
    }
  };
  iTextProto.removeStyleFromTo.__patched = true;
}

interface UseFabricCanvasProps {
  canvasEl: HTMLCanvasElement | null;
  containerEl: HTMLDivElement | null;
  onSelectionChanged?: (obj: fabric.Object | null) => void;
}

export const useFabricCanvas = ({
  canvasEl,
  containerEl,
  onSelectionChanged,
}: UseFabricCanvasProps) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  
  const {
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
    snapToGrid,
    canvasWidth,
    canvasHeight,
    handMode,
    setLayers,
    saveHistoryState,
  } = useDesignStudioStore();

  const onSelectionChangedRef = useRef(onSelectionChanged);
  onSelectionChangedRef.current = onSelectionChanged;

  const handModeRef = useRef(handMode);
  handModeRef.current = handMode;

  const canvasWidthRef = useRef(canvasWidth);
  canvasWidthRef.current = canvasWidth;

  const canvasHeightRef = useRef(canvasHeight);
  canvasHeightRef.current = canvasHeight;

  // Initialize Canvas
  useEffect(() => {
    if (!canvasEl || !containerEl) return;

    const fabricCanvas = new fabric.Canvas(canvasEl, {
      width: canvasWidthRef.current,
      height: canvasHeightRef.current,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });

    setCanvas(fabricCanvas);

    // Prevent browser default zoom and scroll behaviors, and perform pan & zoom relative to workspace container
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();

      const isZoomEvent = e.ctrlKey || e.metaKey;
      const currentZoom = useDesignStudioStore.getState().zoom;
      const currentPanX = useDesignStudioStore.getState().panX;
      const currentPanY = useDesignStudioStore.getState().panY;

      if (isZoomEvent) {
        // Zoom (dampened exponential zoom curve adjusted for trackpad pinch vs mouse wheel)
        const delta = e.deltaY;
        let factor = 0.002;
        if (Math.abs(delta) < 20) {
          factor = 0.01; // higher sensitivity for trackpad pinch
        }
        
        let targetZoom = currentZoom * Math.exp(-delta * factor);
        
        // Bound between 10% and 500%
        if (targetZoom > 5.0) targetZoom = 5.0;
        if (targetZoom < 0.1) targetZoom = 0.1;
        
        // Zoom to point under cursor relative to container
        const rect = containerEl.getBoundingClientRect();
        const rulerOffset = useDesignStudioStore.getState().showRulers ? 20 : 0;
        const mouseX = e.clientX - rect.left - rulerOffset;
        const mouseY = e.clientY - rect.top - rulerOffset;
        
        const newPanX = mouseX - (mouseX - currentPanX) * (targetZoom / currentZoom);
        const newPanY = mouseY - (mouseY - currentPanY) * (targetZoom / currentZoom);
        
        setZoom(targetZoom);
        setPan(newPanX, newPanY);
      } else {
        // Scroll panning
        setPan(currentPanX - e.deltaX, currentPanY - e.deltaY);
      }
    };
    containerEl.addEventListener("wheel", handleNativeWheel, { passive: false });

    // Setup initial scale & positioning (center within viewport)
    const cw = containerEl.clientWidth;
    const ch = containerEl.clientHeight;
    const scaleX = cw / canvasWidthRef.current;
    const scaleY = ch / canvasHeightRef.current;
    const initialScale = Math.min(scaleX, scaleY, 1.0) * 0.85;

    const centerPanX = (cw - canvasWidthRef.current * initialScale) / 2;
    const centerPanY = (ch - canvasHeightRef.current * initialScale) / 2;

    setZoom(initialScale);
    setPan(centerPanX, centerPanY);

    fabricCanvas.renderAll();

    // Panning State variables
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    // Selection changes
    fabricCanvas.on("selection:created", (e) => {
      if (onSelectionChangedRef.current) onSelectionChangedRef.current(e.selected?.[0] || null);
    });
    fabricCanvas.on("selection:updated", (e) => {
      if (onSelectionChangedRef.current) onSelectionChangedRef.current(e.selected?.[0] || null);
    });
    fabricCanvas.on("selection:cleared", () => {
      if (onSelectionChangedRef.current) onSelectionChangedRef.current(null);
    });

    // Mouse Panning
    fabricCanvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      // Pan if holding Spacebar (handMode), Alt/Shift, or middle mouse click (which is button === 1)
      const isMiddleClick = (evt as MouseEvent).button === 1;
      
      if (handModeRef.current || evt.altKey || evt.shiftKey || isMiddleClick) {
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
        
        const currentPanX = useDesignStudioStore.getState().panX;
        const currentPanY = useDesignStudioStore.getState().panY;
        setPan(currentPanX + deltaX, currentPanY + deltaY);
        
        lastX = currentX;
        lastY = currentY;
      }
    });

    // Zoom and pan are handled natively above to support zooming and panning outside the canvas sheet bounds

    // Snapping Grid & Smart Guides
    fabricCanvas.on("object:moving", (options) => {
      const target = options.target;
      if (!target) return;
      
      const snapObjects = useDesignStudioStore.getState().snapToObjects;
      if (snapObjects) {
        SmartGuides.alignMovingObject(
          fabricCanvas,
          target,
          canvasWidthRef.current,
          canvasHeightRef.current
        );
      } else {
        const snapGrid = useDesignStudioStore.getState().snapToGrid;
        if (snapGrid) {
          const gridSize = 20;
          target.set({
            left: Math.round((target.left || 0) / gridSize) * gridSize,
            top: Math.round((target.top || 0) / gridSize) * gridSize,
          });
        }
      }
    });

    fabricCanvas.on("mouse:up", () => {
      isDragging = false;
      fabricCanvas.selection = true;
      SmartGuides.clear(fabricCanvas);
    });

    // Sync layers structure on changes
    const syncLayers = () => {
      const objects = fabricCanvas.getObjects();
      const currentLayers: EditorLayer[] = objects
        .filter((o) => !(o as any).isCanvasBackground)
        .map((o) => ({
          id: (o as any).id || `layer_${Math.random().toString(36).substr(2, 9)}`,
          name: (o as any).name || (o.type === "i-text" ? `Text: ${(o as any).text.substring(0, 15)}` : o.type?.toUpperCase() || "Element"),
          type: o.type || "element",
          visible: o.visible !== false,
          locked: o.lockMovementX === true,
          active: fabricCanvas.getActiveObject() === o,
        }))
        .reverse(); // top element of stack is first in the list
      
      setLayers(currentLayers);
    };

    const syncHistory = () => {
      const isSaving = useDesignStudioStore.getState().isSaving;
      if (isSaving) return;
      const json = JSON.stringify(fabricCanvas.toJSON());
      useDesignStudioStore.getState().setIsDirty(true);
      useDesignStudioStore.getState().saveHistoryState(json);
    };

    fabricCanvas.on("object:added", (e) => {
      const obj = e.target;
      if (obj && !(obj as any).id) {
        (obj as any).id = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      }
      syncLayers();
      if (!obj || !(obj as any).isCanvasBackground) {
        syncHistory();
      }
    });

    fabricCanvas.on("object:removed", () => {
      syncLayers();
      syncHistory();
    });
    
    fabricCanvas.on("object:modified", () => {
      syncLayers();
      syncHistory();
    });
    
    fabricCanvas.on("selection:cleared", syncLayers);
    fabricCanvas.on("selection:created", syncLayers);
    fabricCanvas.on("selection:updated", syncLayers);

    return () => {
      containerEl.removeEventListener("wheel", handleNativeWheel);
      fabricCanvas.dispose();
      setCanvas(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasEl]);

  // Handle outside size changes
  useEffect(() => {
    if (!canvas || !(canvas as any).contextContainer) return;
    canvas.setWidth(canvasWidth);
    canvas.setHeight(canvasHeight);
    canvas.renderAll();
  }, [canvasWidth, canvasHeight, canvas]);

  return canvas;
};
