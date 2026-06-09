import React, { useState } from "react";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { useHistory } from "../hooks/useHistory";
import { 
  Undo, Redo, Save, Eye, Download, 
  Menu, ChevronDown, CheckCircle2, RefreshCw 
} from "lucide-react";
import { fabric } from "fabric";

interface WorkspaceToolbarProps {
  canvas: fabric.Canvas | null;
  onOpenMockup: () => void;
  onOpenExport: () => void;
  onManualSave: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  canvas,
  onOpenMockup,
  onOpenExport,
  onManualSave,
}) => {
  const { 
    designName, setDesignName, 
    workspaces, selectedWorkspaceId, setSelectedWorkspaceId,
    isSaving, isDirty, setActiveTab
  } = useDesignStudioStore();

  const { undo, redo, canUndo, canRedo } = useHistory(canvas);
  const [activeDropMenu, setActiveDropMenu] = useState<"file" | "edit" | "view" | null>(null);

  const toggleDropMenu = (menu: "file" | "edit" | "view") => {
    setActiveDropMenu(activeDropMenu === menu ? null : menu);
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white/85 backdrop-blur-md border-b border-purple-100 shadow-sm select-none z-30 relative">
      
      {/* 1. Left Section: Logo & File/Edit dropdown menus */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-150 px-3 py-1.5 rounded-xl shadow-inner shrink-0">
          <div className="h-6 w-6 overflow-hidden flex items-center justify-center rounded-lg bg-white p-0.5 shrink-0 border border-purple-200">
            <img 
              src="/logo.png" 
              alt="Billboardify" 
              className="h-12 w-auto max-w-none" 
              style={{
                clipPath: "inset(4% 35% 42% 35%)",
                transform: "scale(1.7) translateY(-3px)"
              }}
            />
          </div>
          <span className="font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-750 to-indigo-650 text-[10px] uppercase">Studio</span>
        </div>

        {/* Text Menus */}
        <div className="flex items-center space-x-1 pl-4 border-l border-purple-100/80">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropMenu("file")}
              className="text-xs font-semibold px-3 py-2 rounded-lg hover:bg-purple-50/70 text-slate-655 hover:text-purple-750 transition flex items-center space-x-1"
            >
              <span>File</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropMenu === "file" && (
              <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white border border-purple-100 p-1.5 shadow-2xl z-50 animate-fade-in">
                <button
                  onClick={() => { onManualSave(); setActiveDropMenu(null); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded-lg transition"
                >
                  Save Draft (Ctrl+S)
                </button>
                <button
                  onClick={() => {
                    if (canvas) {
                      canvas.clear();
                      canvas.setBackgroundColor("#ffffff", () => canvas.renderAll());
                    }
                    setActiveDropMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded-lg transition"
                >
                  Create New Design
                </button>
                <div className="border-t border-purple-50 my-1" />
                <button
                  onClick={() => { onOpenExport(); setActiveDropMenu(null); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded-lg transition"
                >
                  Download As...
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropMenu("edit")}
              className="text-xs font-semibold px-3 py-2 rounded-lg hover:bg-purple-50/70 text-slate-655 hover:text-purple-750 transition flex items-center space-x-1"
            >
              <span>Edit</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropMenu === "edit" && (
              <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white border border-purple-100 p-1.5 shadow-2xl z-50 animate-fade-in">
                <button
                  onClick={() => { undo(); setActiveDropMenu(null); }}
                  disabled={!canUndo}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded-lg transition disabled:opacity-40"
                >
                  Undo (Ctrl+Z)
                </button>
                <button
                  onClick={() => { redo(); setActiveDropMenu(null); }}
                  disabled={!canRedo}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded-lg transition disabled:opacity-40"
                >
                  Redo (Ctrl+Y)
                </button>
                <div className="border-t border-purple-50 my-1" />
                <button
                  onClick={() => {
                    if (canvas) {
                      const active = canvas.getActiveObject();
                      if (active) {
                        canvas.remove(active);
                        canvas.discardActiveObject().renderAll();
                      }
                    }
                    setActiveDropMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/50 rounded-lg transition"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropMenu("view")}
              className="text-xs font-semibold px-3 py-2 rounded-lg hover:bg-purple-50/70 text-slate-655 hover:text-purple-750 transition flex items-center space-x-1"
            >
              <span>View</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropMenu === "view" && (
              <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white border border-purple-100 p-1.5 shadow-2xl z-50 animate-fade-in">
                <button
                  onClick={() => {
                    useDesignStudioStore.getState().setSnapToGrid(!useDesignStudioStore.getState().snapToGrid);
                    setActiveDropMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded-lg transition flex items-center justify-between"
                >
                  <span>Snap to Grid</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-750 font-bold uppercase">
                    {useDesignStudioStore.getState().snapToGrid ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    useDesignStudioStore.getState().setSnapToObjects(!useDesignStudioStore.getState().snapToObjects);
                    setActiveDropMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded-lg transition flex items-center justify-between"
                >
                  <span>Smart Guides</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-750 font-bold uppercase">
                    {useDesignStudioStore.getState().snapToObjects ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    useDesignStudioStore.getState().setShowRulers(!useDesignStudioStore.getState().showRulers);
                    setActiveDropMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded-lg transition flex items-center justify-between"
                >
                  <span>Show Rulers</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-750 font-bold uppercase">
                    {useDesignStudioStore.getState().showRulers ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Center Section: Project title, workspace selector, & Auto-save status */}
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-center">
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="bg-transparent hover:bg-purple-50/40 text-slate-800 font-bold px-3 py-1.5 rounded-lg border border-transparent hover:border-purple-100 focus:bg-white focus:border-purple-400 focus:outline-none transition text-sm w-48 text-center"
            placeholder="Name your campaign design"
          />
          {/* Save Status Indicators */}
          <div className="flex items-center space-x-1.5 mt-0.5">
            {isSaving ? (
              <>
                <RefreshCw className="w-3 h-3 text-purple-550 animate-spin" />
                <span className="text-[10px] text-slate-400 font-medium">Autosaving...</span>
              </>
            ) : isDirty ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-medium">Unsaved drafts</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-slate-400 font-medium">
                  {typeof window !== "undefined" && localStorage.getItem("accessToken") ? "Saved to cloud" : "Saved locally"}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-purple-100/80" />

        <select
          value={selectedWorkspaceId}
          onChange={(e) => setSelectedWorkspaceId(e.target.value)}
          className="bg-slate-50 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg border border-purple-100 focus:outline-none cursor-pointer hover:bg-slate-100 transition shadow-inner"
        >
          {workspaces.map((wsp) => (
            <option key={wsp.id} value={wsp.id}>{wsp.name}</option>
          ))}
        </select>
      </div>

      {/* 3. Right Section: Collaborative / Mockup / Save / Download actions */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-slate-500 hover:text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-30 transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-slate-500 hover:text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-30 transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-purple-100/80 mx-1" />

        <button
          onClick={onOpenMockup}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-cyan-600/10 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <Eye className="w-4 h-4" />
          <span>3D Mockup</span>
        </button>

        <button
          onClick={onManualSave}
          className="flex items-center space-x-1.5 bg-white border border-purple-150 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Save Draft</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-650 hover:opacity-95 text-white px-4.5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-purple-605/15 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Share / Download</span>
        </button>
      </div>
    </header>
  );
};
