import React, { useEffect, useState, useRef } from "react";
import { api } from "@/config/axios";
import { fabric } from "fabric";

// Canvas Sub-components
import { CanvasArea } from "../components/design/studio/canvas/CanvasArea";
import { WorkspaceToolbar } from "../components/design/studio/toolbar/WorkspaceToolbar";
import { FloatingToolbar } from "../components/design/studio/toolbar/FloatingToolbar";
import { ContextMenu } from "../components/design/studio/toolbar/ContextMenu";

// Panels
import { TemplatesPanel } from "../components/design/studio/panels/TemplatesPanel";
import { BrandKitPanel } from "../components/design/studio/panels/BrandKitPanel";
import { ElementsPanel } from "../components/design/studio/panels/ElementsPanel";
import { LayersPanel } from "../components/design/studio/panels/LayersPanel";

// Modals
import { MockupModal } from "../components/design/studio/modals/MockupModal";
import { ExportModal } from "../components/design/studio/modals/ExportModal";

// Hooks
import { useHistory } from "../components/design/studio/hooks/useHistory";
import { useAutosave } from "../components/design/studio/hooks/useAutosave";
import { useDesignStudioStore } from "../components/design/studio/stores/designStudio.store";
import { CanvasElement, TemplateType, WorkspaceConfig } from "../components/design/studio/types/canvas.types";

// Icons
import { 
  Palette, Type, Folder, Layout, UploadCloud, Sparkles, 
  FolderPlus, Layers, Eye, Download, Save, Plus, X, Search 
} from "lucide-react";

export const DesignStudioPage: React.FC = () => {
  // Navigation & Data State
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [templates, setTemplates] = useState<TemplateType[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [brandAssets, setBrandAssets] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadsList, setUploadsList] = useState<string[]>([]);
  
  // Fabric canvas handle & Selection
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  
  // Modals & Panels Active state
  const [isMockupOpen, setIsMockupOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiRemoveBgUrl, setAiRemoveBgUrl] = useState("");
  const [isAiRemoving, setIsAiRemoving] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Zustand stores mappings
  const {
    activeTab,
    setActiveTab,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    setWorkspaces: setStoreWorkspaces,
    designName,
    setDesignName,
    activeDesignId,
    setActiveDesignId,
    setIsDirty,
    canvasWidth,
    canvasHeight,
  } = useDesignStudioStore();

  const { registerState } = useHistory(canvas);
  const { saveToBackendImmediate } = useAutosave(canvas);

  // Seed Mock Local/Fallback data
  const FALLBACK_WORKSPACES: WorkspaceConfig[] = [
    { id: "wsp_local", name: "My Studio Workspace" },
    { id: "wsp_local_2", name: "Campaign Projects" },
  ];

  const FALLBACK_BRAND_ASSETS = [
    {
      id: "ba_local_1",
      name: "Default Brand Kit",
      assetUrl: "#",
      colorPalette: { primary: "#7C3AED", secondary: "#4F46E5", accent: "#EC4899" },
      typography: { headings: "Outfit", body: "Inter" },
    },
  ];

  const FALLBACK_FOLDERS = [
    { id: "fol_local_1", name: "Campaign Assets", workspaceId: "wsp_local" },
    { id: "fol_local_2", name: "Brand Library", workspaceId: "wsp_local" },
  ];

  // Fetch workspaces, folders, templates, brand kits
  useEffect(() => {
    const fetchData = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      if (!token) {
        setWorkspaces(FALLBACK_WORKSPACES);
        setStoreWorkspaces(FALLBACK_WORKSPACES);
        setSelectedWorkspaceId("wsp_local");
        setBrandAssets(FALLBACK_BRAND_ASSETS);
        setFolders(FALLBACK_FOLDERS);
        
        try {
          const tempRes = await api.get("/templates");
          if (tempRes.data.success) {
            setTemplates(tempRes.data.data.templates);
          }
        } catch {}
        return;
      }

      try {
        const wspRes = await api.get("/workspace");
        if (wspRes.data.success) {
          const wsList = wspRes.data.data.length > 0 ? wspRes.data.data : FALLBACK_WORKSPACES;
          setWorkspaces(wsList);
          setStoreWorkspaces(wsList);
          if (wsList.length > 0) {
            setSelectedWorkspaceId(wsList[0].id);
          }
        }
      } catch {
        setWorkspaces(FALLBACK_WORKSPACES);
        setStoreWorkspaces(FALLBACK_WORKSPACES);
        setSelectedWorkspaceId("wsp_local");
      }

      try {
        const brandRes = await api.get("/brand");
        if (brandRes.data.success) {
          setBrandAssets(brandRes.data.data.length > 0 ? brandRes.data.data : FALLBACK_BRAND_ASSETS);
        }
      } catch {
        setBrandAssets(FALLBACK_BRAND_ASSETS);
      }

      try {
        const folderRes = await api.get(`/folders?workspaceId=${selectedWorkspaceId}`);
        if (folderRes.data.success) {
          setFolders(folderRes.data.data);
        }
      } catch {
        setFolders(FALLBACK_FOLDERS);
      }

      try {
        const tempRes = await api.get("/templates");
        if (tempRes.data.success) {
          setTemplates(tempRes.data.data.templates);
        }
      } catch {}
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId]);

  // Hook up Fabric ready status
  const handleCanvasReady = (fabricCanvas: fabric.Canvas) => {
    // Save state on edits
    fabricCanvas.on("object:added", () => registerState());
    fabricCanvas.on("object:modified", () => registerState());
    fabricCanvas.on("object:removed", () => registerState());
  };

  // Selection updates
  const handleSelectionChanged = (obj: fabric.Object | null) => {
    setSelectedObject(obj);
  };

  // Right Click event
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canvas) return;

    const canvasEl = canvas.getElement();
    const rect = canvasEl.getBoundingClientRect();
    
    // Find target at clicked point
    const pointer = canvas.getPointer(e.nativeEvent);
    const target = canvas.findTarget(e.nativeEvent, false);

    if (target && !(target as any).isCanvasBackground) {
      canvas.setActiveObject(target);
      setSelectedObject(target);
    } else {
      canvas.discardActiveObject();
      setSelectedObject(null);
    }
    canvas.renderAll();

    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Add rectangle manually
  const addRectangle = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      fill: "#6366F1",
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  // Add circle manually
  const addCircle = () => {
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 150,
      top: 150,
      radius: 100,
      fill: "#10B981",
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  // Add text block manually
  const addText = (textStr = "Heading Text", fontFam = "Outfit", size = 64) => {
    if (!canvas) return;
    const text = new fabric.IText(textStr, {
      left: 120,
      top: 200,
      fontSize: size,
      fontFamily: fontFam,
      fill: "#1E293B",
      fontWeight: "bold",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // Delete active selection
  const deleteActiveObject = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelectedObject(null);
      setIsDirty(true);
    }
  };

  // Insert template design
  const insertTemplate = (tpl: TemplateType) => {
    if (!canvas) return;
    try {
      canvas.loadFromJSON(JSON.parse(tpl.canvasJson), () => {
        canvas.renderAll();
        registerState();
      });
      setDesignName(tpl.name);
      setActiveDesignId(tpl.id);
      setIsDirty(true);
    } catch (err) {
      alert("Error loading template layout.");
    }
  };

  // Handle local image uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success && canvas) {
        const imgUrl = res.data.data.url;
        fabric.Image.fromURL(imgUrl, (img) => {
          img.set({ left: 100, top: 100 });
          img.scaleToWidth(300);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        }, { crossOrigin: "anonymous" });
        setUploadsList((prev) => [imgUrl, ...prev]);
        setIsDirty(true);
      }
    } catch (err) {
      console.error("Image upload failed", err);
    }
  };

  // AI Tools
  const generateAiDesign = () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      addText(aiPrompt.toUpperCase(), "Outfit", 72);
      setAiPrompt("");
    }, 2000);
  };

  const removeImageBg = () => {
    if (!aiRemoveBgUrl) return;
    setIsAiRemoving(true);
    setTimeout(() => {
      setIsAiRemoving(false);
      if (canvas) {
        fabric.Image.fromURL(aiRemoveBgUrl, (img) => {
          img.set({ left: 150, top: 150 });
          img.scaleToWidth(250);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        }, { crossOrigin: "anonymous" });
      }
      setAiRemoveBgUrl("");
    }, 2000);
  };

  // Create workspace folder
  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    try {
      const res = await api.post("/folders", {
        name: newFolderName,
        workspaceId: selectedWorkspaceId,
      });
      if (res.data.success) {
        setFolders([...folders, res.data.data]);
        setNewFolderName("");
      }
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const getCanvasDataUrl = () => {
    if (!canvas) return "https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=1920";
    return canvas.toDataURL({ format: "png", quality: 0.8 });
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF9FE] text-slate-800 font-sans antialiased overflow-hidden">
      
      {/* 1. Header Toolbar */}
      <WorkspaceToolbar
        canvas={canvas}
        onOpenMockup={() => setIsMockupOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onManualSave={saveToBackendImmediate}
      />

      {/* 2. Main Studio Area */}
      <div className="flex flex-1 overflow-hidden relative" onContextMenu={handleContextMenu}>
        
        {/* Left Side Tab Navigation */}
        <nav className="w-20 bg-white border-r border-purple-100/80 flex flex-col items-center py-6 space-y-5 z-20 shadow-sm shrink-0">
          {[
            { id: "templates", label: "Templates", icon: Layout },
            { id: "brandkit", label: "Brand Kit", icon: Palette },
            { id: "elements", label: "Elements", icon: Type },
            { id: "layers", label: "Layers", icon: Layers },
            { id: "uploads", label: "Uploads", icon: UploadCloud },
            { id: "folders", label: "Folders", icon: Folder },
            { id: "aitools", label: "AI Tools", icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition w-16 h-16 ${
                  activeTab === tab.id 
                    ? "bg-purple-50 text-purple-700 shadow-sm border border-purple-100" 
                    : "text-slate-400 hover:text-purple-600"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[9.5px] font-bold tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Drawer Details */}
        <aside className="w-80 bg-white border-r border-purple-100/80 flex flex-col z-15 relative shrink-0 p-5 overflow-y-auto space-y-6">
          
          {/* Templates Panel */}
          {activeTab === "templates" && (
            <TemplatesPanel
              canvas={canvas}
              templates={templates}
              onInsertTemplate={insertTemplate}
            />
          )}

          {/* Brand Kit Panel */}
          {activeTab === "brandkit" && (
            <BrandKitPanel
              canvas={canvas}
              brandAssets={brandAssets}
              selectedObject={selectedObject}
            />
          )}

          {/* Elements Panel */}
          {activeTab === "elements" && (
            <ElementsPanel canvas={canvas} />
          )}

          {/* Layers Panel */}
          {activeTab === "layers" && (
            <LayersPanel canvas={canvas} />
          )}

          {/* Uploads Panel */}
          {activeTab === "uploads" && (
            <div className="space-y-5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <UploadCloud className="w-4 h-4 text-purple-600" />
                <span>Upload Assets</span>
              </h3>
              
              <div className="border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer relative bg-slate-50 transition shadow-inner">
                <input
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-7 h-7 text-purple-550 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Click or Drag Files to Upload</p>
                <p className="text-[9.5px] text-slate-405 mt-1">PNG, JPG, or SVG up to 10MB</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uploaded Library</p>
                <div className="grid grid-cols-2 gap-2">
                  {uploadsList.map((url, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (canvas) {
                          fabric.Image.fromURL(url, (img) => {
                            img.set({ left: 100, top: 100 });
                            img.scaleToWidth(300);
                            canvas.add(img);
                            canvas.renderAll();
                          }, { crossOrigin: "anonymous" });
                        }
                      }}
                      className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-purple-100 hover:border-purple-400 transition cursor-pointer shadow-sm"
                    >
                      <img src={url} alt="Uploaded block" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  
                  {/* Default fallback upload slot */}
                  <div 
                    onClick={() => {
                      if (canvas) {
                        fabric.Image.fromURL("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop&q=80", (img) => {
                          img.set({ left: 100, top: 100 });
                          img.scaleToWidth(300);
                          canvas.add(img);
                          canvas.renderAll();
                        }, { crossOrigin: "anonymous" });
                      }
                    }}
                    className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-purple-100 hover:border-purple-400 transition cursor-pointer shadow-sm"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80" 
                      alt="Sample" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Folders Panel */}
          {activeTab === "folders" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <Folder className="w-4 h-4 text-purple-650" />
                <span>Saved Layouts folders</span>
              </h3>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Create new folder..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="bg-slate-50 border border-purple-100 text-slate-700 text-xs px-2.5 py-2 rounded-xl focus:outline-none focus:bg-white flex-1"
                />
                <button
                  onClick={handleCreateFolder}
                  className="bg-purple-600 hover:bg-purple-750 text-white px-3.5 rounded-xl shadow-sm transition"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {folders.map((fold) => (
                  <div
                    key={fold.id}
                    className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-purple-100 transition cursor-pointer text-xs font-semibold text-slate-700"
                  >
                    <Folder className="w-4 h-4 text-purple-500" />
                    <span>{fold.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Tools Panel */}
          {activeTab === "aitools" && (
            <div className="space-y-5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-purple-650" />
                <span>AI Creative Assistant</span>
              </h3>

              {/* Tag Generator */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-purple-150 space-y-3 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">AI Heading Generator</h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Generate creative promotional heading layouts</p>
                </div>
                <textarea
                  placeholder="E.g., Huge Midnight Sale 50% Off..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-white border border-purple-100 text-slate-800 text-xs p-2.5 rounded-xl focus:outline-none h-20 resize-none focus:border-purple-400"
                />
                <button
                  onClick={generateAiDesign}
                  disabled={isAiLoading || !aiPrompt}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>{isAiLoading ? "Writing heading..." : "Add AI heading"}</span>
                </button>
              </div>

              {/* Background Removal */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-purple-150 space-y-3 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">AI Background Eraser</h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Isolate photo subjects dynamically via AI</p>
                </div>
                <input
                  type="text"
                  placeholder="Paste image URL to process..."
                  value={aiRemoveBgUrl}
                  onChange={(e) => setAiRemoveBgUrl(e.target.value)}
                  className="w-full bg-white border border-purple-100 text-slate-800 text-xs px-2.5 py-2 rounded-xl focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={removeImageBg}
                  disabled={isAiRemoving || !aiRemoveBgUrl}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiRemoving ? "Removing BG..." : "Remove BG & Insert"}</span>
                </button>
              </div>
            </div>
          )}

        </aside>

        {/* 3. Central Canvas Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Main canvas area mount */}
          <CanvasArea
            onCanvasReady={(c) => {
              setCanvas(c);
              handleCanvasReady(c);
            }}
            onSelectionChanged={handleSelectionChanged}
          />

          {/* 4. Contextual Floating Toolbar */}
          {selectedObject && (
            <FloatingToolbar
              canvas={canvas}
              selectedObject={selectedObject}
              onDelete={deleteActiveObject}
            />
          )}

          {/* 5. Custom Context Menu (Right Click) */}
          {contextMenu && (
            <ContextMenu
              canvas={canvas}
              selectedObject={selectedObject}
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              onDelete={deleteActiveObject}
            />
          )}
        </main>
      </div>

      {/* 3D Billboard perspective Preview Homography Modal */}
      {isMockupOpen && (
        <MockupModal
          canvasDataUrl={getCanvasDataUrl()}
          onClose={() => setIsMockupOpen(false)}
        />
      )}

      {/* Export parameters Configuration Modal */}
      {isExportOpen && (
        <ExportModal
          canvas={canvas}
          filename={designName}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
};

export default DesignStudioPage;
