import React, { useEffect } from "react";
import { CanvasService } from "../services/canvas.service";
import { fabric } from "fabric";

interface ContextMenuProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  canvas,
  selectedObject,
  x,
  y,
  onClose,
  onDelete,
}) => {
  // Close menu on click outside
  useEffect(() => {
    const handleOutsideClick = () => onClose();
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [onClose]);

  if (!canvas) return null;

  const handleLayerOrder = (action: "front" | "back" | "forward" | "backward") => {
    if (!selectedObject) return;
    switch (action) {
      case "front":
        CanvasService.bringToFront(canvas, selectedObject);
        break;
      case "back":
        CanvasService.sendToBack(canvas, selectedObject);
        break;
      case "forward":
        CanvasService.bringForward(canvas, selectedObject);
        break;
      case "backward":
        CanvasService.sendBackward(canvas, selectedObject);
        break;
    }
    onClose();
  };

  const handleDuplicate = () => {
    if (!selectedObject) return;
    selectedObject.clone((cloned: fabric.Object) => {
      canvas.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 30,
        top: (cloned.top || 0) + 30,
      });
      (cloned as any).id = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
    onClose();
  };

  const handleLock = () => {
    if (!selectedObject) return;
    const isLocked = !selectedObject.lockMovementX;
    selectedObject.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      lockRotation: isLocked,
      hasControls: !isLocked,
      selectable: !isLocked,
    });
    canvas.discardActiveObject();
    canvas.renderAll();
    onClose();
  };

  return (
    <div
      style={{ top: y, left: x }}
      className="absolute z-50 bg-white border border-purple-100 rounded-xl shadow-2xl p-1.5 w-44 flex flex-col animate-fade-in font-sans pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {selectedObject ? (
        <>
          <button
            onClick={handleDuplicate}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-750 rounded-lg transition"
          >
            Duplicate Element
          </button>
          
          <button
            onClick={handleLock}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-750 rounded-lg transition"
          >
            {selectedObject.lockMovementX ? "Unlock Element" : "Lock Position"}
          </button>

          <div className="border-t border-purple-50 my-1" />

          {/* Layer Ordering sub-menu */}
          <button
            onClick={() => handleLayerOrder("front")}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-705 rounded-lg transition"
          >
            Bring to Front
          </button>
          <button
            onClick={() => handleLayerOrder("back")}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-750 rounded-lg transition"
          >
            Send to Back
          </button>
          <button
            onClick={() => handleLayerOrder("forward")}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-750 rounded-lg transition"
          >
            Bring Forward
          </button>
          <button
            onClick={() => handleLayerOrder("backward")}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-750 rounded-lg transition"
          >
            Send Backward
          </button>

          <div className="border-t border-purple-50 my-1" />

          <button
            onClick={() => { onDelete(); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-xs font-bold text-rose-600 rounded-lg transition"
          >
            Delete Element
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => {
              // Create default rectangle at context coords
              const rect = new fabric.Rect({
                left: x - canvas.getElement().getBoundingClientRect().left,
                top: y - canvas.getElement().getBoundingClientRect().top,
                width: 150,
                height: 150,
                fill: "#6366F1",
              });
              canvas.add(rect);
              canvas.setActiveObject(rect);
              canvas.renderAll();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-750 rounded-lg transition"
          >
            Add Rectangle
          </button>
          <button
            onClick={() => {
              // Create default text at context coords
              const text = new fabric.IText("Double click to edit", {
                left: x - canvas.getElement().getBoundingClientRect().left,
                top: y - canvas.getElement().getBoundingClientRect().top,
                fontSize: 32,
                fontFamily: "Outfit",
                fill: "#1E293B",
              });
              canvas.add(text);
              canvas.setActiveObject(text);
              canvas.renderAll();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-750 rounded-lg transition"
          >
            Add Text Block
          </button>
        </>
      )}
    </div>
  );
};
