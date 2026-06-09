import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { EditorLayer } from "../types/layer.types";

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

    fabricCanvas.setZoom(initialScale);
    fabricCanvas.absolutePan(new fabric.Point(-centerPanX, -centerPanY));
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
      
      if (handModeRef.current || evt.altKey || evt.shiftKey || isMiddleClick || opt.target === null) {
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
        if (vpt) {
          setPan(vpt[4], vpt[5]);
        }
        
        lastX = currentX;
        lastY = currentY;
      }
    });

    // Zoom on wheel (Ctrl + Wheel zooms, standard Wheel scrolls)
    fabricCanvas.on("mouse:wheel", (opt) => {
      opt.e.preventDefault();
      opt.e.stopPropagation();

      const evt = opt.e;
      const isZoomEvent = evt.ctrlKey || evt.metaKey;

      if (isZoomEvent) {
        // Zoom
        let targetZoom = fabricCanvas.getZoom() * 0.999 ** evt.deltaY;
        // Bound between 10% and 500%
        if (targetZoom > 5.0) targetZoom = 5.0;
        if (targetZoom < 0.1) targetZoom = 0.1;
        
        fabricCanvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, targetZoom);
        setZoom(targetZoom);
      } else {
        // Scroll panning
        fabricCanvas.relativePan(new fabric.Point(-evt.deltaX, -evt.deltaY));
      }

      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        setPan(vpt[4], vpt[5]);
      }
    });

    // Snapping Grid & Smart Guides
    fabricCanvas.on("object:moving", (options) => {
      const target = options.target;
      if (!target) return;
      
      const snapObjects = useDesignStudioStore.getState().snapToObjects;
      if (snapObjects) {
        import("../canvas/SmartGuides").then(({ SmartGuides }) => {
          SmartGuides.alignMovingObject(
            fabricCanvas,
            target,
            canvasWidthRef.current,
            canvasHeightRef.current
          );
        });
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
      import("../canvas/SmartGuides").then(({ SmartGuides }) => {
        SmartGuides.clear(fabricCanvas);
      });
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

    fabricCanvas.on("object:added", (e) => {
      const obj = e.target;
      if (obj && !(obj as any).id) {
        (obj as any).id = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      }
      syncLayers();
    });

    fabricCanvas.on("object:removed", syncLayers);
    fabricCanvas.on("object:modified", syncLayers);
    fabricCanvas.on("selection:cleared", syncLayers);
    fabricCanvas.on("selection:created", syncLayers);
    fabricCanvas.on("selection:updated", syncLayers);

    return () => {
      fabricCanvas.dispose();
      setCanvas(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasEl]);

  // Handle outside size changes
  useEffect(() => {
    if (!canvas) return;
    canvas.setWidth(canvasWidth);
    canvas.setHeight(canvasHeight);
    canvas.renderAll();
  }, [canvasWidth, canvasHeight, canvas]);

  return canvas;
};
