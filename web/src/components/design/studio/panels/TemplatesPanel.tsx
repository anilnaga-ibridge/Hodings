import React, { useState } from "react";
import { Layout, Search, X, Plus } from "lucide-react";
import { TemplateType } from "../types/canvas.types";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { fabric } from "fabric";

interface TemplatesPanelProps {
  canvas: fabric.Canvas | null;
  templates: TemplateType[];
  onInsertTemplate: (tpl: TemplateType) => void;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  canvas,
  templates,
  onInsertTemplate,
}) => {
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  const { setDimensions, clearStoreState, saveHistoryState } = useDesignStudioStore();

  const TEMPLATE_CATEGORIES = ["all", "Billboard", "Banner", "Poster", "Promotion", "Real Estate", "Fitness", "Fashion", "Food", "Tech"];

  interface TemplateMeta {
    gradient: string;
    accent: string;
    category: string;
    badge: string;
    badgeBg: string;
  }

  const TEMPLATE_META: Record<string, TemplateMeta> = {
    template_001: { gradient: "from-slate-900 via-slate-800 to-purple-950", accent: "#ec4899", category: "Billboard", badge: "Modern", badgeBg: "#7c3aed" },
    template_002: { gradient: "from-[#0f0920] via-[#1a0c3a] to-[#0f0920]", accent: "#7c3aed", category: "Billboard", badge: "Tech", badgeBg: "#06b6d4" },
    template_003: { gradient: "from-[#110a05] via-[#2a1205] to-[#0d0802]", accent: "#ea580c", category: "Billboard", badge: "Food", badgeBg: "#ea580c" },
    template_004: { gradient: "from-[#0a0905] via-[#1c1710] to-[#0a0905]", accent: "#ca8a04", category: "Real Estate", badge: "Luxury", badgeBg: "#ca8a04" },
    template_005: { gradient: "from-[#0a0010] via-[#1a0020] to-[#0f0018]", accent: "#ef4444", category: "Fitness", badge: "Gym", badgeBg: "#ef4444" },
    template_006: { gradient: "from-[#050b10] via-[#0a1825] to-[#050b10]", accent: "#14b8a6", category: "Agency", badge: "Creative", badgeBg: "#14b8a6" },
  };

  const DEFAULT_META: TemplateMeta = { 
    gradient: "from-slate-900 via-slate-800 to-slate-900", 
    accent: "#7c3aed", 
    category: "Design", 
    badge: "Template", 
    badgeBg: "#7c3aed" 
  };

  const filteredTemplates = templates.filter((tpl) => {
    const meta = TEMPLATE_META[tpl.id] ?? DEFAULT_META;
    const matchSearch = tpl.name.toLowerCase().includes(templateSearch.toLowerCase());
    const matchCat = templateCategory === "all" || meta.category === templateCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Search Header */}
      <div className="pb-3 border-b border-purple-50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <Layout className="w-4 h-4 text-purple-600" />
            Templates
          </h3>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search templates…"
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            className="w-full bg-slate-50 border border-purple-100 text-slate-700 text-xs pl-8 pr-8 py-2 rounded-lg focus:outline-none focus:border-purple-400 focus:bg-white transition"
          />
          {templateSearch && (
            <button onClick={() => setTemplateSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1 px-1 py-3 shrink-0 border-b border-purple-50 max-h-24 overflow-y-auto">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setTemplateCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide transition ${
              templateCategory === cat
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            {cat === "all" ? "✦ All" : cat}
          </button>
        ))}
      </div>

      {/* Scrollable Templates Grid */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-3 pb-8 pr-1">
        
        {/* Custom Size / Blank Canvas setup */}
        {showCustomSize ? (
          <div className="w-full rounded-xl border-2 border-purple-300 bg-purple-50/50 p-4 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                Custom Dimensions
              </span>
              <button onClick={() => setShowCustomSize(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1">
                <label className="text-[9px] text-slate-500 font-bold mb-1 block">Width (px)</label>
                <input 
                  type="number" 
                  value={customWidth} 
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-full text-xs p-1.5 border border-purple-200 rounded text-center focus:outline-none focus:border-purple-400"
                />
              </div>
              <span className="text-slate-300 mt-4">x</span>
              <div className="flex-1">
                <label className="text-[9px] text-slate-500 font-bold mb-1 block">Height (px)</label>
                <input 
                  type="number" 
                  value={customHeight} 
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-full text-xs p-1.5 border border-purple-200 rounded text-center focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                if (canvas) {
                  setDimensions(customWidth, customHeight);
                  canvas.setWidth(customWidth);
                  canvas.setHeight(customHeight);
                  canvas.clear();
                  canvas.setBackgroundColor("#ffffff", () => {
                    canvas.renderAll();
                    clearStoreState();
                    saveHistoryState(JSON.stringify(canvas.toJSON()));
                  });
                  setShowCustomSize(false);
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded text-xs transition shadow-sm"
            >
              Create New Canvas
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomSize(true)}
            className="w-full group rounded-xl border border-dashed border-purple-200 bg-gradient-to-br from-purple-50/60 to-slate-50 p-2.5 cursor-pointer hover:border-purple-500 hover:from-purple-50 hover:to-purple-50/40 transition-all duration-200"
          >
            <div className="aspect-video w-full rounded-lg bg-white flex flex-col items-center justify-center border border-purple-100 group-hover:border-purple-300 transition">
              <div className="w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 transition flex items-center justify-center mb-1.5">
                <Plus className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-[10px] font-bold text-purple-550 group-hover:text-purple-700">Custom Canvas</span>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 text-left">Start from scratch</p>
          </button>
        )}

        {/* Template Cards */}
        {filteredTemplates.map((tpl) => {
          const meta = TEMPLATE_META[tpl.id] ?? DEFAULT_META;
          return (
            <div
              key={tpl.id}
              onClick={() => onInsertTemplate(tpl)}
              className="group relative rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:border-purple-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className={`aspect-video w-full bg-gradient-to-br ${meta.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full w-2/5 opacity-80" style={{ backgroundColor: meta.accent }} />
                    <div className="h-3.5 bg-white rounded-md w-full opacity-90" />
                    <div className="h-3 bg-white/70 rounded-md w-4/5" />
                  </div>
                  <div className="h-5 w-16 rounded-md opacity-90" style={{ backgroundColor: meta.accent }} />
                </div>
                {/* Category badge */}
                <div className="absolute top-2 left-2">
                  <span className="text-white text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: meta.badgeBg + "cc" }}>
                    {meta.badge}
                  </span>
                </div>
                <div className="absolute inset-0 bg-purple-950/0 group-hover:bg-purple-950/65 transition-all duration-200 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-white text-purple-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg transition duration-200">
                    Apply Template
                  </span>
                </div>
              </div>
              <div className="px-3 py-2 bg-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-700 truncate max-w-44">{tpl.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{meta.category} · {tpl.width}×{tpl.height}</p>
                </div>
                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">Free</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
