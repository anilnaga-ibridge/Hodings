import React, { useState } from "react";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { Plus, Minus, Maximize } from "lucide-react";
import { fabric } from "fabric";

interface ZoomControlsProps {
  canvas: fabric.Canvas | null;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ canvas }) => {
  const { zoom, setZoom, setPan, canvasWidth, canvasHeight, panX, panY } = useDesignStudioStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleZoomIn = () => {
    if (!canvas) return;
    const newZoom = Math.min(5.0, zoom + 0.1);
    
    // Zoom relative to viewport center
    const parent = canvas.getElement()?.parentElement?.parentElement?.parentElement;
    if (parent) {
      const cw = parent.clientWidth || 800;
      const ch = parent.clientHeight || 600;
      const mouseX = cw / 2;
      const mouseY = ch / 2;
      const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    } else {
      setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const newZoom = Math.max(0.1, zoom - 0.1);
    
    // Zoom relative to viewport center
    const parent = canvas.getElement()?.parentElement?.parentElement?.parentElement;
    if (parent) {
      const cw = parent.clientWidth || 800;
      const ch = parent.clientHeight || 600;
      const mouseX = cw / 2;
      const mouseY = ch / 2;
      const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    } else {
      setZoom(newZoom);
    }
  };

  const handleZoomFit = () => {
    if (!canvas) return;
    const parent = canvas.getElement()?.parentElement?.parentElement?.parentElement;
    if (!parent) return;
    const cw = parent.clientWidth || 800;
    const ch = parent.clientHeight || 600;

    const scaleX = cw / canvasWidth;
    const scaleY = ch / canvasHeight;
    const initialScale = Math.min(scaleX, scaleY, 1.0) * 0.85;

    const centerPanX = (cw - canvasWidth * initialScale) / 2;
    const centerPanY = (ch - canvasHeight * initialScale) / 2;

    setZoom(initialScale);
    setPan(centerPanX, centerPanY);
  };

  const handleZoomSelect = (val: number) => {
    if (!canvas) return;
    
    // Zoom relative to viewport center
    const parent = canvas.getElement()?.parentElement?.parentElement?.parentElement;
    if (parent) {
      const cw = parent.clientWidth || 800;
      const ch = parent.clientHeight || 600;
      const mouseX = cw / 2;
      const mouseY = ch / 2;
      const newPanX = mouseX - (mouseX - panX) * (val / zoom);
      const newPanY = mouseY - (mouseY - panY) * (val / zoom);
      setZoom(val);
      setPan(newPanX, newPanY);
    } else {
      setZoom(val);
    }
    setShowDropdown(false);
  };

  return (
    <div className="absolute bottom-6 right-6 z-30 flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-purple-100 select-none">
      <button
        onClick={handleZoomOut}
        className="p-1.5 hover:bg-purple-50 text-slate-500 hover:text-purple-700 rounded-lg transition"
        title="Zoom Out"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition min-w-16 text-center"
        >
          {Math.round(zoom * 100)}%
        </button>

        {showDropdown && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white border border-purple-100 rounded-xl p-1 shadow-2xl w-24 flex flex-col z-50 animate-fade-in">
            {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0].map((v) => (
              <button
                key={v}
                onClick={() => handleZoomSelect(v)}
                className="w-full text-center py-1.5 hover:bg-purple-50 text-[10px] font-bold text-slate-700 hover:text-purple-750 rounded-lg transition"
              >
                {Math.round(v * 100)}%
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleZoomIn}
        className="p-1.5 hover:bg-purple-50 text-slate-500 hover:text-purple-700 rounded-lg transition"
        title="Zoom In"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-purple-100/80 mx-1" />

      <button
        onClick={handleZoomFit}
        className="p-1.5 hover:bg-purple-50 text-slate-500 hover:text-purple-700 rounded-lg transition flex items-center space-x-1"
        title="Fit Canvas to Screen"
      >
        <Maximize className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold">Fit</span>
      </button>
    </div>
  );
};
