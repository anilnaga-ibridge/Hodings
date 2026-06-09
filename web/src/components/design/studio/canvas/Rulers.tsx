import React, { useEffect, useRef } from "react";
import { useDesignStudioStore } from "../stores/designStudio.store";

interface RulersProps {
  scrollWidth: number;
  scrollHeight: number;
}

export const Rulers: React.FC<RulersProps> = () => {
  const topCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { zoom, panX, panY, canvasWidth, canvasHeight, showRulers } = useDesignStudioStore();

  const drawRulers = () => {
    const topCanvas = topCanvasRef.current;
    const leftCanvas = leftCanvasRef.current;
    if (!topCanvas || !leftCanvas) return;

    const topCtx = topCanvas.getContext("2d");
    const leftCtx = leftCanvas.getContext("2d");
    if (!topCtx || !leftCtx) return;

    // Get parent bounds
    const topW = topCanvas.parentElement?.clientWidth || 800;
    const leftH = leftCanvas.parentElement?.clientHeight || 600;

    // Set high-DPI scale
    const dpr = window.devicePixelRatio || 1;
    topCanvas.width = topW * dpr;
    topCanvas.height = 20 * dpr;
    topCanvas.style.width = `${topW}px`;
    topCanvas.style.height = `20px`;
    topCtx.scale(dpr, dpr);

    leftCanvas.width = 20 * dpr;
    leftCanvas.height = leftH * dpr;
    leftCanvas.style.width = `20px`;
    leftCanvas.style.height = `${leftH}px`;
    leftCtx.scale(dpr, dpr);

    // Style configs
    topCtx.strokeStyle = "#cbd5e1";
    topCtx.fillStyle = "#64748b";
    topCtx.font = "9px sans-serif";
    topCtx.lineWidth = 1;

    leftCtx.strokeStyle = "#cbd5e1";
    leftCtx.fillStyle = "#64748b";
    leftCtx.font = "9px sans-serif";
    leftCtx.lineWidth = 1;

    // Clear
    topCtx.clearRect(0, 0, topW, 20);
    leftCtx.clearRect(0, 0, 20, leftH);

    // Draw borders
    topCtx.beginPath();
    topCtx.moveTo(0, 19.5);
    topCtx.lineTo(topW, 19.5);
    topCtx.stroke();

    leftCtx.beginPath();
    leftCtx.moveTo(19.5, 0);
    leftCtx.lineTo(19.5, leftH);
    leftCtx.stroke();

    // Ruler settings based on Zoom level
    let gap = 50;
    if (zoom < 0.25) gap = 200;
    else if (zoom < 0.5) gap = 100;
    else if (zoom > 2) gap = 10;
    else if (zoom > 4) gap = 5;

    const startX = Math.floor((-panX / zoom) / gap) * gap;
    const endX = startX + (topW / zoom) + gap;

    // 1. Draw Horizontal (Top) Ruler ticks & text
    topCtx.beginPath();
    for (let x = startX; x <= endX; x += gap) {
      if (x < 0 || x > canvasWidth) continue; // Out of bounds of actual canvas
      
      const canvasPos = x * zoom + panX;
      
      // Major tick
      topCtx.moveTo(canvasPos, 10);
      topCtx.lineTo(canvasPos, 20);
      
      // Label
      topCtx.fillText(x.toString(), canvasPos + 3, 12);

      // Minor ticks
      const subTicks = 5;
      const subGap = gap / subTicks;
      for (let s = 1; s < subTicks; s++) {
        const sx = x + s * subGap;
        const sPos = sx * zoom + panX;
        topCtx.moveTo(sPos, 15);
        topCtx.lineTo(sPos, 20);
      }
    }
    topCtx.stroke();

    // 2. Draw Vertical (Left) Ruler ticks & text
    const startY = Math.floor((-panY / zoom) / gap) * gap;
    const endY = startY + (leftH / zoom) + gap;

    leftCtx.beginPath();
    for (let y = startY; y <= endY; y += gap) {
      if (y < 0 || y > canvasHeight) continue; // Out of bounds of actual canvas
      
      const canvasPos = y * zoom + panY;

      // Major tick
      leftCtx.moveTo(10, canvasPos);
      leftCtx.lineTo(20, canvasPos);

      // Label (rotated vertically)
      leftCtx.save();
      leftCtx.translate(4, canvasPos + 3);
      leftCtx.fillText(y.toString(), 0, 0);
      leftCtx.restore();

      // Minor ticks
      const subTicks = 5;
      const subGap = gap / subTicks;
      for (let s = 1; s < subTicks; s++) {
        const sy = y + s * subGap;
        const sPos = sy * zoom + panY;
        leftCtx.moveTo(15, sPos);
        leftCtx.lineTo(20, sPos);
      }
    }
    leftCtx.stroke();
  };

  useEffect(() => {
    if (showRulers) {
      drawRulers();
      window.addEventListener("resize", drawRulers);
    }
    return () => window.removeEventListener("resize", drawRulers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, panX, panY, canvasWidth, canvasHeight, showRulers]);

  if (!showRulers) return null;

  return (
    <>
      {/* Top ruler bar container */}
      <div className="absolute top-0 left-[20px] right-0 h-5 bg-white select-none z-20">
        <canvas ref={topCanvasRef} />
      </div>
      {/* Left ruler bar container */}
      <div className="absolute top-[20px] left-0 bottom-0 w-5 bg-white select-none z-20">
        <canvas ref={leftCanvasRef} />
      </div>
      {/* Corner block where top & left rulers intersect */}
      <div className="absolute top-0 left-0 w-5 h-5 bg-white border-r border-b border-slate-200 z-30 flex items-center justify-center">
        <span className="text-[7px] text-slate-400 font-bold select-none">px</span>
      </div>
    </>
  );
};
