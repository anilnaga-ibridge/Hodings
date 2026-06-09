import React, { useState } from "react";
import { Download, X, FileImage, FileCode, CheckCircle2 } from "lucide-react";
import { ExportService } from "../services/export.service";
import { fabric } from "fabric";

interface ExportModalProps {
  canvas: fabric.Canvas | null;
  filename: string;
  canvasWidth: number;
  canvasHeight: number;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  canvas,
  filename,
  canvasWidth,
  canvasHeight,
  onClose,
}) => {
  const [outputName, setOutputName] = useState(filename);
  const [format, setFormat] = useState<"png" | "jpeg" | "svg" | "pdf">("png");
  const [multiplier, setMultiplier] = useState<number>(2);
  const [transparent, setTransparent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!canvas) return null;

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (format === "png" || format === "jpeg") {
        ExportService.exportAsImage(canvas, outputName, format, multiplier, transparent);
      } else if (format === "svg") {
        ExportService.exportAsSVG(canvas, outputName);
      } else if (format === "pdf") {
        ExportService.exportAsPDF(canvas, outputName, canvasWidth, canvasHeight);
      }
      setIsExporting(false);
      onClose();
    }, 800); // Small delay for UX transition
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white border border-purple-100 rounded-3xl w-[450px] shadow-2xl p-6 flex flex-col space-y-5 pointer-events-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-purple-50 pb-3">
          <span className="font-extrabold text-slate-805 text-base flex items-center space-x-2">
            <Download className="w-5 h-5 text-purple-650" />
            <span>Download Campaign Layout</span>
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* Filename */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">File Name</label>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              className="w-full bg-slate-50 border border-purple-100 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:bg-white focus:border-purple-400 transition"
              placeholder="Filename"
            />
          </div>

          {/* Format selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">File Format</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: "png", label: "PNG Image", desc: "Best for sharing" },
                { type: "jpeg", label: "JPG Photo", desc: "Small file size" },
                { type: "svg", label: "SVG Vector", desc: "Scalable vector" },
                { type: "pdf", label: "PDF Print", desc: "High quality print" }
              ].map((fmt) => (
                <button
                  key={fmt.type}
                  onClick={() => setFormat(fmt.type as any)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                    format === fmt.type
                      ? "bg-purple-50/70 border-purple-350 shadow-sm"
                      : "bg-slate-50 border-purple-100/50 hover:bg-purple-50/20 hover:border-purple-200"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-700">{fmt.label}</span>
                  <span className="text-[9.5px] text-slate-400 mt-0.5">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PNG/JPG resolution multiplier */}
          {(format === "png" || format === "jpeg") && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Resolution Quality</label>
                <span className="text-xs font-bold text-purple-650">{multiplier}x ({canvasWidth * multiplier} × {canvasHeight * multiplier} px)</span>
              </div>
              <div className="flex items-center space-x-2">
                {[1, 2, 4, 8].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    className={`flex-1 text-center py-2 rounded-lg text-xs font-bold border transition ${
                      multiplier === m
                        ? "bg-purple-600 border-purple-550 text-white"
                        : "bg-slate-50 border-purple-100 hover:bg-purple-50 hover:text-purple-750"
                    }`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transparency options (PNG / SVG only) */}
          {(format === "png" || format === "svg") && (
            <div className="flex items-center justify-between bg-slate-50 border border-purple-100/55 rounded-xl p-3 shadow-inner">
              <div>
                <span className="text-xs font-bold text-slate-705 block">Transparent Background</span>
                <span className="text-[9.5px] text-slate-400">Remove white canvas background</span>
              </div>
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="w-4.5 h-4.5 accent-purple-650 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-50 border border-purple-150 hover:bg-slate-100 text-slate-650 py-2.5 rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-650 text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center space-x-1.5"
          >
            <Download className="w-4 h-4 animate-bounce" />
            <span>{isExporting ? "Exporting..." : "Download File"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
