import React, { useEffect, useState, useRef } from "react";
import { api } from "@/config/axios";
import { fabric } from "fabric";

// Canvas Sub-components
import { CanvasArea } from "../components/design/studio/canvas/CanvasArea";
import { WorkspaceToolbar } from "../components/design/studio/toolbar/WorkspaceToolbar";
import { FloatingToolbar } from "../components/design/studio/toolbar/FloatingToolbar";
import { ContextMenu } from "../components/design/studio/toolbar/ContextMenu";
import { ToolPalette } from "../components/design/studio/toolbar/ToolPalette";
import { CropToolbar } from "../components/design/studio/toolbar/CropToolbar";

// Panels
import { TemplatesPanel } from "../components/design/studio/panels/TemplatesPanel";
import { BrandKitPanel } from "../components/design/studio/panels/BrandKitPanel";
import { ElementsPanel } from "../components/design/studio/panels/ElementsPanel";
import { LayersPanel } from "../components/design/studio/panels/LayersPanel";
import { CanvasSizePanel } from "../components/design/studio/panels/CanvasSizePanel";
import { useSearchParams } from "next/navigation";
import { SavedDesignsPanel, saveDesignToLocal, loadSavedDesigns } from "../components/design/studio/panels/SavedDesignsPanel";
import { AssetManagerPanel } from "../components/design/studio/panels/AssetManagerPanel";
import { AiStudioPanel } from "../components/design/studio/panels/AiStudioPanel";

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
  FolderPlus, Layers, Eye, Download, Save, Plus, X, Search,
  Maximize2, BookImage, CheckCircle2,
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
  const [isCropMode, setIsCropMode] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  
  // Modals & Panels Active state
  const [isMockupOpen, setIsMockupOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
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
  const searchParams = useSearchParams();
  const queryDesignId = searchParams?.get("designId");

  // Load design on mount if designId query param is present
  useEffect(() => {
    if (canvas && queryDesignId) {
      const saved = loadSavedDesigns();
      const design = saved.find((d) => d.id === queryDesignId);
      if (design) {
        try {
          canvas.loadFromJSON(JSON.parse(design.canvasJson), () => {
            canvas.renderAll();
            setDesignName(design.name);
            setActiveDesignId(design.id);
            registerState();
          });
        } catch (err) {
          console.error("Failed to parse or load canvas JSON:", err);
        }
      }
    }
  }, [canvas, queryDesignId, setDesignName, setActiveDesignId, registerState]);

  // Ctrl+S → save design snapshot + flash notification
  useEffect(() => {
    const handleCtrlS = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (canvas) {
          saveDesignToLocal(canvas, designName, activeDesignId || undefined);
          saveToBackendImmediate();
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 2500);
        }
      }
    };
    window.addEventListener("keydown", handleCtrlS);
    return () => window.removeEventListener("keydown", handleCtrlS);
  }, [canvas, designName, activeDesignId, saveToBackendImmediate]);

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
    if (!canvasEl) return;
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
    try {
      return canvas.toDataURL({ format: "png", quality: 0.8 });
    } catch (err) {
      console.warn("Failed to export canvas data URL due to CORS or tainted canvas:", err);
      // Return a beautiful purple inline SVG fallback preview image
      return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><rect width='100%' height='100%' fill='%237c3aed'/><text x='50%' y='50%' font-family='Outfit, sans-serif' font-size='48' font-weight='bold' fill='white' dominant-baseline='middle' text-anchor='middle'>Design Workspace Preview</text></svg>";
    }
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
            { id: "mydesigns", label: "My Designs", icon: BookImage },
            { id: "folders", label: "Folders", icon: Folder },
            { id: "resize", label: "Resize", icon: Maximize2 },
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

        {/* Tool Palette — vertical strip between nav and aside */}
        <ToolPalette canvas={canvas} />

        {/* Tab Drawer Details */}
        <aside className={`${
          activeTab === "brandkit" ? "w-[420px]" : "w-80"
        } bg-white border-r border-purple-100/80 flex flex-col z-15 relative shrink-0 p-5 transition-all duration-300 overflow-hidden h-full`}>
          
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
            <div className="flex-1 overflow-y-auto pr-1 pb-8 space-y-6">
              <BrandKitPanel
                canvas={canvas}
                brandAssets={brandAssets}
                selectedObject={selectedObject}
              />
            </div>
          )}

          {/* Elements Panel */}
          {activeTab === "elements" && (
            <div className="flex-1 overflow-y-auto pr-1 pb-8">
              <ElementsPanel canvas={canvas} />
            </div>
          )}

          {/* Layers Panel */}
          {activeTab === "layers" && (
            <div className="flex-1 overflow-y-auto pr-1 pb-8">
              <LayersPanel canvas={canvas} />
            </div>
          )}

          {/* Resize / Canvas Size Panel */}
          {activeTab === "resize" && (
            <CanvasSizePanel canvas={canvas} />
          )}

          {/* My Designs / Saved Gallery Panel */}
          {activeTab === "mydesigns" && (
            <SavedDesignsPanel
              canvas={canvas}
              designName={designName}
              activeDesignId={activeDesignId}
              onLoadDesign={(design) => {
                setDesignName(design.name);
                setActiveDesignId(design.id);
                registerState();
              }}
            />
          )}


          {activeTab === "uploads" && (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              <AssetManagerPanel canvas={canvas} />
            </div>
          )}

          {/* Folders Panel */}
          {activeTab === "folders" && (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-8">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <Folder className="w-4 h-4 text-purple-655" />
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
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              <AiStudioPanel canvas={canvas} />
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

          {/* 4. Contextual Floating Toolbar OR Crop Toolbar */}
          {isCropMode && selectedObject?.type === "image" ? (
            <CropToolbar
              canvas={canvas}
              selectedObject={selectedObject}
              onCropDone={() => {
                setIsCropMode(false);
              }}
              onCropCancel={() => setIsCropMode(false)}
            />
          ) : (
            selectedObject && (
              <FloatingToolbar
                canvas={canvas}
                selectedObject={selectedObject}
                onDelete={deleteActiveObject}
                onStartCrop={
                  selectedObject?.type === "image"
                    ? () => setIsCropMode(true)
                    : undefined
                }
              />
            )
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

          {/* 6. Saved Flash Notification */}
          {savedFlash && (
            <div className="absolute top-4 right-4 z-50 pointer-events-none animate-fade-in">
              <div className="flex items-center space-x-2.5 bg-emerald-500 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-emerald-400/30">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Design Saved!</p>
                  <p className="text-[10px] text-emerald-100">Snapshot added to My Designs</p>
                </div>
              </div>
            </div>
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
