import React, { useRef, useState } from "react";
import { Eye, X } from "lucide-react";
import { getHomographyMatrix3d } from "@/utils/homography";

interface MockupModalProps {
  canvasDataUrl: string;
  onClose: () => void;
}

export const MockupModal: React.FC<MockupModalProps> = ({
  canvasDataUrl,
  onClose,
}) => {
  const mockupContainerRef = useRef<HTMLDivElement>(null);
  const [activeCorner, setActiveCorner] = useState<"p0" | "p1" | "p2" | "p3" | null>(null);

  // Corner handle points relative to the 800x533 Times Square street image
  const [corners, setCorners] = useState({
    p0: { x: 236, y: 110 }, // Top-left
    p1: { x: 574, y: 154 }, // Top-right
    p2: { x: 574, y: 394 }, // Bottom-right
    p3: { x: 236, y: 350 }, // Bottom-left
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeCorner || !mockupContainerRef.current) return;
    const rect = mockupContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, 800));
    const y = Math.max(0, Math.min(e.clientY - rect.top, 533));
    
    setCorners((prev) => ({
      ...prev,
      [activeCorner]: { x, y },
    }));
  };

  const handleReset = () => {
    setCorners({
      p0: { x: 236, y: 110 },
      p1: { x: 574, y: 154 },
      p2: { x: 574, y: 394 },
      p3: { x: 236, y: 350 },
    });
  };

  // Compute 3D homography transform matrix
  const computedMatrix = getHomographyMatrix3d(
    1920, // source canvas width
    1080, // source canvas height
    corners.p0,
    corners.p1,
    corners.p2,
    corners.p3
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white border border-purple-100 rounded-3xl w-[900px] shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-50 flex justify-between items-center bg-purple-50/50">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-purple-650 animate-pulse" />
            <span className="font-bold text-slate-800 text-base">3D Street Billboard Homography Simulation</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-purple-100/50 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewport */}
        <div className="p-6 flex flex-col items-center bg-[#FAF9FE]">
          <p className="text-xs text-slate-500 mb-4 text-center max-w-lg leading-normal">
            Drag the yellow circular handles on the street scene below to project your canvas design perfectly onto the billboard hoarding perspective bounds!
          </p>

          {/* Homography Interactive Viewer stage */}
          <div 
            ref={mockupContainerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setActiveCorner(null)}
            onMouseLeave={() => setActiveCorner(null)}
            className="relative w-[800px] h-[533px] select-none border border-purple-150 rounded-2xl overflow-hidden bg-slate-950 shadow-lg"
          >
            {/* Street background image */}
            <img
              src="https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=1200"
              alt="Street billboard background"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
            />

            {/* Matrix transform canvas preview image */}
            <div
              style={{
                position: "absolute",
                width: "1920px",
                height: "1080px",
                left: 0,
                top: 0,
                transformOrigin: "0 0",
                transform: computedMatrix,
                pointerEvents: "none",
                boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                border: "2px solid #a855f7"
              }}
            >
              <img
                src={canvasDataUrl}
                alt="Canvas mockup overlay"
                className="w-full h-full object-fill opacity-95 filter brightness-105 contrast-95"
              />
            </div>

            {/* Corners Control Handles */}
            {(["p0", "p1", "p2", "p3"] as const).map((p) => (
              <div
                key={p}
                onMouseDown={() => setActiveCorner(p)}
                className={`absolute w-5.5 h-5.5 rounded-full border border-black cursor-move z-20 flex items-center justify-center shadow-xl -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95 ${
                  activeCorner === p ? "bg-amber-400" : "bg-yellow-400"
                }`}
                style={{ left: corners[p].x, top: corners[p].y }}
              />
            ))}
          </div>

          {/* Matrix coordinates readouts */}
          <div className="mt-4 flex space-x-6 text-[10.5px] text-slate-400 font-mono select-none">
            <span>P1: ({corners.p0.x}, {corners.p0.y})</span>
            <span>P2: ({corners.p1.x}, {corners.p1.y})</span>
            <span>P3: ({corners.p2.x}, {corners.p2.y})</span>
            <span>P4: ({corners.p3.x}, {corners.p3.y})</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-purple-50 bg-purple-50/20 flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="bg-white border border-purple-150 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            Reset Calibration
          </button>
          
          <button
            onClick={onClose}
            className="bg-purple-650 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition"
          >
            Done Previewing
          </button>
        </div>

      </div>
    </div>
  );
};
