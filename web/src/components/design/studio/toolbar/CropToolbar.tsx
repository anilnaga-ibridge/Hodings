"use client";
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { Crop, Check, X } from "lucide-react";

interface CropToolbarProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onCropDone: () => void;
  onCropCancel: () => void;
}

/**
 * Non-destructive image crop via Fabric.js clipPath.
 *
 * How it works:
 *  1. When mounted, a semi-transparent "vignette" rect overlay is drawn on the canvas
 *     plus a bright dashed cropRect (also fabric.Rect but not added to canvas — used
 *     as clipPath).
 *  2. The user drags the cropRect handles (corners) via mouse events on a DOM overlay.
 *  3. "Apply Crop" sets img.clipPath = cropFabricRect and re-renders.
 *  4. "Cancel" removes the overlay without touching the image.
 */
export const CropToolbar: React.FC<CropToolbarProps> = ({
  canvas,
  selectedObject,
  onCropDone,
  onCropCancel,
}) => {
  // Track the crop rect state in canvas-space coordinates (relative to image)
  const [cropRect, setCropRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const overlayRectRef = useRef<fabric.Rect | null>(null);
  const isDraggingRef = useRef(false);
  const dragCornerRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; rect: typeof cropRect } | null>(null);

  const img = selectedObject as fabric.Image | null;

  // Initialize crop rect to cover the full image bounds
  useEffect(() => {
    if (!canvas || !img || img.type !== "image") return;

    img.setCoords();
    const bound = img.getBoundingRect(true);

    const initialRect = {
      left: bound.left,
      top: bound.top,
      width: bound.width,
      height: bound.height,
    };
    setCropRect(initialRect);

    // Add a semi-transparent dark vignette overlay to dim the "cropped away" areas
    const vignette = new fabric.Rect({
      left: bound.left,
      top: bound.top,
      width: bound.width,
      height: bound.height,
      fill: "rgba(0,0,0,0.45)",
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.45,
    } as any);
    (vignette as any).__isCropVignette = true;
    canvas.add(vignette);

    // Dashed crop selection rect on canvas
    const selRect = new fabric.Rect({
      left: bound.left,
      top: bound.top,
      width: bound.width,
      height: bound.height,
      fill: "transparent",
      stroke: "#7C3AED",
      strokeWidth: 2,
      strokeDashArray: [6, 3],
      selectable: false,
      evented: false,
      excludeFromExport: true,
    } as any);
    (selRect as any).__isCropOverlay = true;
    overlayRectRef.current = selRect;
    canvas.add(selRect);
    canvas.bringToFront(selRect);
    canvas.renderAll();

    return () => {
      // Cleanup vignette + overlay on unmount
      canvas.getObjects().forEach((obj) => {
        if ((obj as any).__isCropVignette || (obj as any).__isCropOverlay) {
          canvas.remove(obj);
        }
      });
      canvas.renderAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the overlay rect in sync with cropRect state
  useEffect(() => {
    if (!canvas || !cropRect || !overlayRectRef.current) return;
    overlayRectRef.current.set(cropRect);
    overlayRectRef.current.setCoords();
    canvas.renderAll();
  }, [canvas, cropRect]);

  const handleApply = () => {
    if (!canvas || !img || !cropRect) return;

    img.setCoords();
    const bound = img.getBoundingRect(true);
    const scaleX = (img.scaleX || 1);
    const scaleY = (img.scaleY || 1);
    const imgW = (img.width || 1);
    const imgH = (img.height || 1);

    // Convert canvas-space crop rect to image-local space
    const localLeft = (cropRect.left - bound.left) / scaleX - imgW / 2;
    const localTop = (cropRect.top - bound.top) / scaleY - imgH / 2;
    const localWidth = cropRect.width / scaleX;
    const localHeight = cropRect.height / scaleY;

    const clipRect = new fabric.Rect({
      left: localLeft,
      top: localTop,
      width: Math.max(1, localWidth),
      height: Math.max(1, localHeight),
      absolutePositioned: false,
    });

    img.clipPath = clipRect;
    img.setCoords();

    // Remove overlays
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).__isCropVignette || (obj as any).__isCropOverlay) {
        canvas.remove(obj);
      }
    });

    canvas.setActiveObject(img);
    canvas.renderAll();
    onCropDone();
  };

  const handleCancel = () => {
    if (!canvas) return;
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).__isCropVignette || (obj as any).__isCropOverlay) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
    onCropCancel();
  };

  // Handle mouse drag on a corner handle
  const startDrag = (e: React.MouseEvent, corner: string) => {
    if (!canvas || !cropRect) return;
    e.stopPropagation();
    isDraggingRef.current = true;
    dragCornerRef.current = corner;
    dragStartRef.current = { x: e.clientX, y: e.clientY, rect: { ...cropRect } };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      const { rect } = dragStartRef.current;
      const zoom = canvas.getZoom();
      const dxC = dx / zoom;
      const dyC = dy / zoom;

      let { left, top, width, height } = rect!;
      const MIN = 20;

      switch (dragCornerRef.current) {
        case "tl":
          left = Math.min(left + dxC, left + width - MIN);
          top = Math.min(top + dyC, top + height - MIN);
          width = rect!.width - dxC;
          height = rect!.height - dyC;
          break;
        case "tr":
          top = Math.min(top + dyC, top + height - MIN);
          width = Math.max(MIN, rect!.width + dxC);
          height = rect!.height - dyC;
          break;
        case "bl":
          left = Math.min(left + dxC, left + width - MIN);
          width = rect!.width - dxC;
          height = Math.max(MIN, rect!.height + dyC);
          break;
        case "br":
          width = Math.max(MIN, rect!.width + dxC);
          height = Math.max(MIN, rect!.height + dyC);
          break;
      }

      setCropRect({
        left,
        top,
        width: Math.max(MIN, width),
        height: Math.max(MIN, height),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Compute DOM overlay positions (canvas-space → screen-space)
  const getScreenPos = () => {
    if (!canvas || !cropRect) return null;
    const canvasEl = canvas.getElement();
    if (!canvasEl) return null;
    const rect = canvasEl.getBoundingClientRect();
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zoom = canvas.getZoom();

    const sx = cropRect.left * zoom + vpt[4] + rect.left;
    const sy = cropRect.top * zoom + vpt[5] + rect.top;
    const sw = cropRect.width * zoom;
    const sh = cropRect.height * zoom;
    return { sx, sy, sw, sh };
  };

  const screenPos = getScreenPos();
  const HANDLE_SIZE = 12;

  return (
    <>
      {/* Corner handles rendered as fixed DOM elements over the canvas */}
      {screenPos && (
        <>
          {(["tl", "tr", "bl", "br"] as const).map((corner) => {
            const hx =
              corner.includes("l")
                ? screenPos.sx - HANDLE_SIZE / 2
                : screenPos.sx + screenPos.sw - HANDLE_SIZE / 2;
            const hy =
              corner.includes("t")
                ? screenPos.sy - HANDLE_SIZE / 2
                : screenPos.sy + screenPos.sh - HANDLE_SIZE / 2;
            return (
              <div
                key={corner}
                onMouseDown={(e) => startDrag(e, corner)}
                className="fixed z-50 rounded-sm bg-purple-600 border-2 border-white shadow-md cursor-pointer hover:bg-purple-500 transition-colors select-none"
                style={{
                  left: hx,
                  top: hy,
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  cursor:
                    corner === "tl" || corner === "br"
                      ? "nwse-resize"
                      : "nesw-resize",
                }}
              />
            );
          })}
        </>
      )}

      {/* Crop toolbar — fixed above the canvas area */}
      <div
        id="crop-toolbar"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center bg-slate-900/95 backdrop-blur-sm text-white rounded-2xl shadow-2xl px-4 py-2.5 space-x-3 border border-slate-700 animate-fade-in pointer-events-auto"
      >
        <Crop className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-slate-300">Crop Image</span>
        <span className="text-[10px] text-slate-500 font-mono">
          {cropRect ? `${Math.round(cropRect.width)} × ${Math.round(cropRect.height)}` : ""}
        </span>
        <div className="h-4 w-px bg-slate-700" />
        <button
          onClick={handleApply}
          className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-xl text-xs font-bold transition"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply Crop</span>
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
      </div>
    </>
  );
};
