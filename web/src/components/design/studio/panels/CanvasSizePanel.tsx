"use client";
import React, { useState } from "react";
import { fabric } from "fabric";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { Monitor, Square, Smartphone, FileText, LayoutTemplate, Check } from "lucide-react";

interface CanvasSizePanelProps {
  canvas: fabric.Canvas | null;
}

interface SizePreset {
  label: string;
  description: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  category: string;
}

const PRESETS: SizePreset[] = [
  // Billboard / OOH
  {
    label: "Billboard 14×48ft",
    description: "Standard Bulletin",
    width: 4032,
    height: 1152,
    icon: <LayoutTemplate className="w-4 h-4" />,
    category: "Billboard",
  },
  {
    label: "Poster 24×36",
    description: "Large Format Print",
    width: 2400,
    height: 3600,
    icon: <LayoutTemplate className="w-4 h-4" />,
    category: "Billboard",
  },
  {
    label: "Junior Poster",
    description: "6×12ft",
    width: 1728,
    height: 864,
    icon: <LayoutTemplate className="w-4 h-4" />,
    category: "Billboard",
  },
  // Digital
  {
    label: "HD 16:9",
    description: "1920 × 1080px",
    width: 1920,
    height: 1080,
    icon: <Monitor className="w-4 h-4" />,
    category: "Digital",
  },
  {
    label: "4K UHD",
    description: "3840 × 2160px",
    width: 3840,
    height: 2160,
    icon: <Monitor className="w-4 h-4" />,
    category: "Digital",
  },
  {
    label: "Square 1:1",
    description: "1080 × 1080px",
    width: 1080,
    height: 1080,
    icon: <Square className="w-4 h-4" />,
    category: "Digital",
  },
  {
    label: "Instagram Story",
    description: "1080 × 1920px",
    width: 1080,
    height: 1920,
    icon: <Smartphone className="w-4 h-4" />,
    category: "Social",
  },
  {
    label: "Twitter/X Banner",
    description: "1500 × 500px",
    width: 1500,
    height: 500,
    icon: <Monitor className="w-4 h-4" />,
    category: "Social",
  },
  // Print
  {
    label: "A4 Portrait",
    description: "2480 × 3508px",
    width: 2480,
    height: 3508,
    icon: <FileText className="w-4 h-4" />,
    category: "Print",
  },
  {
    label: "A3 Landscape",
    description: "4961 × 3508px",
    width: 4961,
    height: 3508,
    icon: <FileText className="w-4 h-4" />,
    category: "Print",
  },
];

const CATEGORIES = ["Billboard", "Digital", "Social", "Print"];

export const CanvasSizePanel: React.FC<CanvasSizePanelProps> = ({ canvas }) => {
  const { canvasWidth, canvasHeight, setDimensions, setZoom, setPan } = useDesignStudioStore();

  const [customW, setCustomW] = useState(canvasWidth);
  const [customH, setCustomH] = useState(canvasHeight);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Billboard");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [applied, setApplied] = useState(false);

  const applySize = (width: number, height: number, label?: string) => {
    if (!canvas) return;

    setDimensions(width, height);
    canvas.setWidth(width);
    canvas.setHeight(height);
    canvas.setBackgroundColor(bgColor, () => canvas.renderAll());

    // Re-center and fit to viewport
    const container = canvas.getElement()?.parentElement?.parentElement?.parentElement;
    if (container) {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaleX = cw / width;
      const scaleY = ch / height;
      const newZoom = Math.min(scaleX, scaleY, 1.0) * 0.85;
      const panX = (cw - width * newZoom) / 2;
      const panY = (ch - height * newZoom) / 2;

      setZoom(newZoom);
      setPan(panX, panY);
    }

    canvas.renderAll();
    if (label) setSelectedPreset(label);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const filteredPresets = PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto pr-1 pb-8 space-y-5">
      {/* Header */}
      <div>
        <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
          <LayoutTemplate className="w-4 h-4 text-purple-600" />
          <span>Canvas Size</span>
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Current: {canvasWidth} × {canvasHeight} px
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              activeCategory === cat
                ? "bg-purple-600 text-white shadow"
                : "bg-slate-100 text-slate-500 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div className="space-y-1.5">
        {filteredPresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setCustomW(preset.width);
              setCustomH(preset.height);
              setSelectedPreset(preset.label);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-left ${
              selectedPreset === preset.label
                ? "border-purple-500 bg-purple-50 shadow-sm"
                : "border-purple-100 bg-slate-50 hover:bg-purple-50/40 hover:border-purple-300"
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <span
                className={`${
                  selectedPreset === preset.label ? "text-purple-600" : "text-slate-400"
                }`}
              >
                {preset.icon}
              </span>
              <div>
                <p className="text-[11px] font-bold text-slate-700">{preset.label}</p>
                <p className="text-[9.5px] text-slate-400">{preset.description}</p>
              </div>
            </div>
            <span className="text-[9px] font-mono text-slate-400">
              {preset.width}×{preset.height}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-purple-100 pt-4 space-y-3">
        {/* Custom dimensions */}
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Custom Size
        </p>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <label className="text-[9.5px] text-slate-400 font-semibold block mb-1">Width (px)</label>
            <input
              type="number"
              value={customW}
              min={100}
              max={10000}
              onChange={(e) => {
                setCustomW(parseInt(e.target.value) || 1920);
                setSelectedPreset(null);
              }}
              className="w-full bg-slate-50 border border-purple-100 text-slate-700 text-xs px-2.5 py-2 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-white transition"
            />
          </div>
          <span className="text-slate-300 font-bold mt-4">×</span>
          <div className="flex-1">
            <label className="text-[9.5px] text-slate-400 font-semibold block mb-1">Height (px)</label>
            <input
              type="number"
              value={customH}
              min={100}
              max={10000}
              onChange={(e) => {
                setCustomH(parseInt(e.target.value) || 1080);
                setSelectedPreset(null);
              }}
              className="w-full bg-slate-50 border border-purple-100 text-slate-700 text-xs px-2.5 py-2 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-semibold">Background Color</span>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[9.5px] font-mono text-slate-400 uppercase">{bgColor}</span>
          </div>
        </div>

        {/* Aspect Ratio Display */}
        <div className="bg-slate-50 border border-purple-100 rounded-xl p-3 flex items-center justify-between">
          <div
            className="bg-purple-100 border-2 border-purple-300 rounded flex-shrink-0"
            style={{
              width: Math.min(60, (customW / Math.max(customW, customH)) * 60),
              height: Math.min(40, (customH / Math.max(customW, customH)) * 40),
              minWidth: 20,
              minHeight: 10,
            }}
          />
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-700">
              {customW} × {customH}
            </p>
            <p className="text-[9.5px] text-slate-400">
              Ratio:{" "}
              {(() => {
                const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
                const g = gcd(customW, customH);
                return `${customW / g}:${customH / g}`;
              })()}
            </p>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={() => applySize(customW, customH, selectedPreset || undefined)}
          className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-2 ${
            applied
              ? "bg-emerald-500 text-white"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {applied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Applied!</span>
            </>
          ) : (
            <>
              <LayoutTemplate className="w-4 h-4" />
              <span>Apply & Center Canvas</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
