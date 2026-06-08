import React, { useEffect, useState, useRef } from "react";
import { api } from "@/config/axios";
import { CanvasCoreEngine } from "@/components/design/CanvasCoreEngine";
import { useEditorStore } from "@/store/useEditorStore";
import type { CanvasElement } from "@/store/useEditorStore";
import { getHomographyMatrix3d } from "@/utils/homography";
import { fabric } from "fabric";
import { 
  Palette, 
  Type, 
  Folder, 
  Layout, 
  UploadCloud, 
  Sparkles, 
  Maximize2, 
  Undo, 
  Redo, 
  Grid, 
  FolderPlus, 
  Layers, 
  Eye, 
  Download, 
  Save, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  CornerUpLeft, 
  CornerUpRight,
  Smile,
  X,
  Search,
  MessageSquare,
  Presentation
} from "lucide-react";

type TabType = "templates" | "brandkit" | "elements" | "uploads" | "folders" | "aitools";

interface Workspace {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  canvasJson: string;
  isTemplate: boolean;
  categoryId?: string | null;
}

interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
}

interface FolderType {
  id: string;
  name: string;
  workspaceId: string;
  parentId?: string | null;
}

interface BrandAssetType {
  id: string;
  name: string;
  logoUrl?: string | null;
  assetUrl: string;
  colorPalette?: { primary: string; secondary: string; accent: string } | null;
  typography?: { headings: string; body: string } | null;
}

export const DesignStudioPage: React.FC = () => {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<TabType>("templates");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("wsp_001");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [brandAssets, setBrandAssets] = useState<BrandAssetType[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("Untitled Project");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");
  
  // Fabric canvas handle
  const [canvasRef, setCanvasRef] = useState<fabric.Canvas | null>(null);
  const isHistoryChangingRef = useRef(false);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  
  // Modals & Panels
  const [isMockupOpen, setIsMockupOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiRemoveBgUrl, setAiRemoveBgUrl] = useState("");
  const [isAiRemoving, setIsAiRemoving] = useState(false);

  // Comments & Collaboration
  const [isCommentMode, setIsCommentMode] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [activeCommentCoords, setActiveCommentCoords] = useState<{x: number, y: number} | null>(null);

  // Mockup Engine Control Points (representing the corners of the billboard on the background image)
  // Background image is 800x533 Times Square street view
  const [corners, setCorners] = useState({
    p0: { x: 236, y: 110 }, // Top-left
    p1: { x: 574, y: 154 }, // Top-right
    p2: { x: 574, y: 394 }, // Bottom-right
    p3: { x: 236, y: 350 }, // Bottom-left
  });
  const [activeCorner, setActiveCorner] = useState<"p0" | "p1" | "p2" | "p3" | null>(null);
  const mockupContainerRef = useRef<HTMLDivElement>(null);

  // Design studio menu dropdown state
  const [activeMenu, setActiveMenu] = useState<"file" | "edit" | "view" | "share" | "export" | null>(null);

  // Custom blank canvas size state
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  const {
    zoom,
    setZoom,
    snapToGrid,
    toggleSnapToGrid,
    undo,
    redo,
    historyIndex,
    history,
    saveHistory,
    setDimensions,
    clearStore,
    canvasWidth,
    canvasHeight,
  } = useEditorStore();

  // Fallback local data for unauthenticated / guest studio sessions
  const FALLBACK_WORKSPACES: Workspace[] = [
    { id: "wsp_local", name: "My Studio Workspace" },
    { id: "wsp_local_2", name: "Campaign Projects" },
  ];

  const FALLBACK_BRAND_ASSETS: BrandAssetType[] = [
    {
      id: "ba_local_1",
      name: "Default Brand Kit",
      assetUrl: "#",
      colorPalette: { primary: "#7C3AED", secondary: "#4F46E5", accent: "#EC4899" },
      typography: { headings: "Outfit", body: "Inter" },
    },
  ];

  const FALLBACK_FOLDERS: FolderType[] = [
    { id: "fol_local_1", name: "Campaign Assets", workspaceId: "wsp_local" },
    { id: "fol_local_2", name: "Brand Library", workspaceId: "wsp_local" },
  ];

  // Load Workspaces, Folders, BrandAssets, Templates
  useEffect(() => {
    const fetchData = async () => {
      // Check if user has a valid access token before making authenticated calls
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      if (!token) {
        // No token — seed fallback data so the studio works in guest mode
        console.info("[Design Studio] No auth token found — running in guest/offline mode.");
        setWorkspaces(FALLBACK_WORKSPACES);
        setSelectedWorkspaceId("wsp_local");
        setBrandAssets(FALLBACK_BRAND_ASSETS);
        setFolders(FALLBACK_FOLDERS);
        // Still attempt to fetch public templates (no auth required)
        try {
          const tempRes = await api.get("/templates");
          if (tempRes.data.success) {
            setTemplates(tempRes.data.data.templates);
            setCategories(tempRes.data.data.categories);
          }
        } catch {
          // templates endpoint also failed — silent fallback is fine
        }
        return;
      }

      try {
        // Fetch workspaces
        const wspRes = await api.get("/workspace");
        if (wspRes.data.success) {
          setWorkspaces(wspRes.data.data.length > 0 ? wspRes.data.data : FALLBACK_WORKSPACES);
          if (wspRes.data.data.length > 0) {
            setSelectedWorkspaceId(wspRes.data.data[0].id);
          }
        }
      } catch {
        setWorkspaces(FALLBACK_WORKSPACES);
        setSelectedWorkspaceId("wsp_local");
      }

      try {
        // Fetch brand assets
        const brandRes = await api.get("/brand");
        if (brandRes.data.success) {
          setBrandAssets(brandRes.data.data.length > 0 ? brandRes.data.data : FALLBACK_BRAND_ASSETS);
        }
      } catch {
        setBrandAssets(FALLBACK_BRAND_ASSETS);
      }

      try {
        // Fetch folders
        const folderRes = await api.get(`/folders?workspaceId=${selectedWorkspaceId}`);
        if (folderRes.data.success) {
          setFolders(folderRes.data.data);
        }
      } catch {
        setFolders(FALLBACK_FOLDERS);
      }

      try {
        // Fetch templates
        const tempRes = await api.get("/templates");
        if (tempRes.data.success) {
          setTemplates(tempRes.data.data.templates);
          setCategories(tempRes.data.data.categories);
        }
      } catch {
        // templates endpoint failed — silent
      }
    };

    fetchData();
  }, [selectedWorkspaceId]);

  // Hook up canvas events
  const handleCanvasReady = (canvas: fabric.Canvas) => {
    setCanvasRef(canvas);

    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    // Handle canvas click for dropping collaborative comment pins
    canvas.on("mouse:up", (options) => {
      if (isCommentMode && options.absolutePointer) {
        setActiveCommentCoords({
          x: options.absolutePointer.x,
          y: options.absolutePointer.y,
        });
      }
    });

    // History tracking
    canvas.on("object:added", () => {
      if (!isHistoryChangingRef.current) saveHistory(JSON.stringify(canvas.toJSON()));
    });
    canvas.on("object:modified", () => {
      if (!isHistoryChangingRef.current) saveHistory(JSON.stringify(canvas.toJSON()));
    });
    canvas.on("object:removed", () => {
      if (!isHistoryChangingRef.current) saveHistory(JSON.stringify(canvas.toJSON()));
    });
    
    // Save initial state
    saveHistory(JSON.stringify(canvas.toJSON()));
  };

  // Add items programmatically
  const addRectangle = () => {
    if (!canvasRef) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      fill: "#6366F1",
    });
    canvasRef.add(rect);
    canvasRef.setActiveObject(rect);
    canvasRef.renderAll();
  };

  const addCircle = () => {
    if (!canvasRef) return;
    const circle = new fabric.Circle({
      left: 150,
      top: 150,
      radius: 100,
      fill: "#10B981",
    });
    canvasRef.add(circle);
    canvasRef.setActiveObject(circle);
    canvasRef.renderAll();
  };

  const addText = (textStr = "Heading Text", fontFam = "Outfit", size = 64) => {
    if (!canvasRef) return;
    const text = new fabric.IText(textStr, {
      left: 120,
      top: 200,
      fontSize: size,
      fontFamily: fontFam,
      fill: "#1E293B",
      fontWeight: "bold",
      styles: {},
    });
    canvasRef.add(text);
    canvasRef.setActiveObject(text);
    canvasRef.renderAll();
  };

  // Delete active item
  const deleteActiveObject = () => {
    if (!canvasRef) return;
    const active = canvasRef.getActiveObject();
    if (active) {
      canvasRef.remove(active);
      canvasRef.discardActiveObject();
      canvasRef.renderAll();
      setSelectedObject(null);
    }
  };

  // Handle template insertion
  const insertTemplate = (tpl: Template) => {
    if (!canvasRef) {
      alert("Canvas is still loading. Please wait a moment and try again.");
      return;
    }
    try {
      isHistoryChangingRef.current = true;
      canvasRef.loadFromJSON(JSON.parse(tpl.canvasJson), () => {
        canvasRef.renderAll();
        isHistoryChangingRef.current = false;
        saveHistory(tpl.canvasJson);
      });
      setDesignName(tpl.name);
      setActiveDesignId(tpl.id);
    } catch (err) {
      console.error(err);
      alert("Error loading template: " + (err as Error).message);
    }
  };

  // Save design to database (via mock POST /api/v1/designs)
  const handleSaveDesign = async () => {
    if (!canvasRef) return;
    const canvasJson = JSON.stringify(canvasRef.toJSON());
    try {
      if (activeDesignId) {
        await api.put(`/designs/${activeDesignId}`, {
          name: designName,
          canvasJson,
        });
      } else {
        const res = await api.post("/designs", {
          name: designName,
          workspaceId: selectedWorkspaceId,
          width: 1920,
          height: 1080,
          canvasJson,
        });
        if (res.data.success) {
          setActiveDesignId(res.data.data.id);
        }
      }
      alert("Design successfully saved!");
    } catch (err) {
      console.error("Save error", err);
      alert("Error saving design.");
    }
  };

  // Handle local image upload preview insertion
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success && canvasRef) {
        const imgUrl = res.data.data.url;
        fabric.Image.fromURL(imgUrl, (img) => {
          img.set({ left: 100, top: 100 });
          img.scaleToWidth(300);
          canvasRef.add(img);
          canvasRef.setActiveObject(img);
          canvasRef.renderAll();
        }, { crossOrigin: "anonymous" });
      }
    } catch (err) {
      console.error("Upload error", err);
    }
  };

  // AI tools actions
  const generateAiDesign = () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      addText(aiPrompt.toUpperCase(), "Outfit", 72);
      setAiPrompt("");
    }, 2505);
  };

  const removeImageBg = () => {
    if (!aiRemoveBgUrl) return;
    setIsAiRemoving(true);
    setTimeout(() => {
      setIsAiRemoving(false);
      if (canvasRef) {
        // Draw image onto canvas
        fabric.Image.fromURL(aiRemoveBgUrl, (img) => {
          img.set({ left: 150, top: 150 });
          img.scaleToWidth(250);
          canvasRef.add(img);
          canvasRef.setActiveObject(img);
          canvasRef.renderAll();
        }, { crossOrigin: "anonymous" });
      }
      setAiRemoveBgUrl("");
    }, 3000);
  };

  // Export handlers
  const exportAsImage = () => {
    if (!canvasRef) return;
    const dataUrl = canvasRef.toDataURL({
      format: "png",
      quality: 1.0,
      multiplier: 2, // High-DPI double scale!
    });
    const link = document.createElement("a");
    link.download = `${designName.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Create folder inside active workspace
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
      console.error("Folder creation error", err);
    }
  };

  // Collaborative comment insertion
  const submitComment = () => {
    if (!commentContent || !activeCommentCoords) return;
    const newComment = {
      id: `comm_${Date.now()}`,
      content: commentContent,
      x: activeCommentCoords.x,
      y: activeCommentCoords.y,
      createdAt: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
    setCommentContent("");
    setActiveCommentCoords(null);
    setIsCommentMode(false);
  };

  // Perspective Matrix Calculation for Mockup
  const computedMatrix = getHomographyMatrix3d(
    1920, // canvas source width
    1080, // canvas source height
    corners.p0,
    corners.p1,
    corners.p2,
    corners.p3
  );

  // Handle drag for 3D mockup corners
  const handleMockupMouseMove = (e: React.MouseEvent) => {
    if (!activeCorner || !mockupContainerRef.current) return;
    const rect = mockupContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, 800));
    const y = Math.max(0, Math.min(e.clientY - rect.top, 533));
    
    setCorners((prev) => ({
      ...prev,
      [activeCorner]: { x, y },
    }));
  };

  const getCanvasDataUrl = () => {
    if (!canvasRef) return "https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=1920";
    return canvasRef.toDataURL({ format: "png", quality: 0.8 });
  };

  // ─── Template visual metadata (maps template id → thumbnail look) ───────
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
    template_007: { gradient: "from-[#0f0510] via-[#1e0a20] to-[#0f0510]", accent: "#f43f5e", category: "Fashion", badge: "Lifestyle", badgeBg: "#f43f5e" },
    template_008: { gradient: "from-[#180000] via-[#2a0505] to-[#180000]", accent: "#f59e0b", category: "Promotion", badge: "Sale", badgeBg: "#f59e0b" },
    template_009: { gradient: "from-[#0a0a0a] via-[#1a0a0a] to-[#0a0a0a]", accent: "#dc2626", category: "Billboard", badge: "Auto", badgeBg: "#dc2626" },
    template_010: { gradient: "from-[#1a120b] via-[#2a1a10] to-[#1a120b]", accent: "#d97706", category: "Food", badge: "Café", badgeBg: "#d97706" },
    template_011: { gradient: "from-[#0c0a1d] via-[#1a1040] to-[#0c0a1d]", accent: "#fbbf24", category: "Promotion", badge: "E-Com", badgeBg: "#6d28d9" },
    template_012: { gradient: "from-[#f0fdfa] via-[#ccfbf1] to-[#f0fdfa]", accent: "#0d9488", category: "Billboard", badge: "Health", badgeBg: "#0d9488" },
    template_013: { gradient: "from-[#0f172a] via-[#1e293b] to-[#0f172a]", accent: "#3b82f6", category: "Billboard", badge: "Edu", badgeBg: "#1e40af" },
    template_014: { gradient: "from-[#09090b] via-[#1a0a15] to-[#09090b]", accent: "#be123c", category: "Billboard", badge: "Event", badgeBg: "#be123c" },
  };
  const DEFAULT_META: TemplateMeta = { gradient: "from-slate-900 via-slate-800 to-slate-900", accent: "#7c3aed", category: "Design", badge: "Template", badgeBg: "#7c3aed" };

  // ─── Category filters ─────────────────────────────────────────────────────
  const TEMPLATE_CATEGORIES = ["all", "Billboard", "Banner", "Poster", "Promotion", "Real Estate", "Fitness", "Fashion", "Food", "Tech", "Agency"];

  // ─── Filtered templates ───────────────────────────────────────────────────
  const filteredTemplates = templates.filter((tpl) => {
    const meta = TEMPLATE_META[tpl.id] ?? DEFAULT_META;
    const matchSearch = tpl.name.toLowerCase().includes(templateSearch.toLowerCase());
    const matchCat = templateCategory === "all" || meta.category === templateCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col h-screen bg-[#FAF9FE] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Top Header Controls */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-purple-100 shadow-sm">
        <div className="flex items-center space-x-5">
          {/* Logo */}
          <div className="flex items-center space-x-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg shadow-sm shrink-0">
            <div className="h-6 w-6 overflow-hidden flex items-center justify-center rounded bg-white p-0.5 shrink-0 border border-purple-200">
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
            <span className="font-bold tracking-wider text-purple-750 text-[11px] uppercase">Studio</span>
          </div>

          {/* Canva Editor Style Menu Bar */}
          <div className="flex items-center space-x-1 border-l border-purple-100 pl-4">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-purple-50 text-slate-600 hover:text-purple-750 transition"
              >
                File
              </button>
              {activeMenu === "file" && (
                <div className="absolute left-0 mt-2 w-48 rounded-lg bg-white border border-purple-100 p-1 shadow-xl z-50">
                  <button
                    onClick={() => {
                      handleSaveDesign();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Save Design (Ctrl+S)
                  </button>
                  <button
                    onClick={() => {
                      if (canvasRef) {
                        canvasRef.clear();
                        canvasRef.setBackgroundColor("#ffffff", () => canvasRef.renderAll());
                      }
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    New Blank Design
                  </button>
                  <button
                    onClick={() => {
                      exportAsImage();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Export PNG
                  </button>
                  <div className="border-t border-purple-50 my-1" />
                  <button
                    onClick={() => window.close()}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-purple-50 rounded"
                  >
                    Close Studio
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-purple-50 text-slate-600 hover:text-purple-750 transition"
              >
                Edit
              </button>
              {activeMenu === "edit" && (
                <div className="absolute left-0 mt-2 w-48 rounded-lg bg-white border border-purple-100 p-1 shadow-xl z-50">
                  <button
                    onClick={() => {
                      const state = undo();
                      if (state && canvasRef) {
                        isHistoryChangingRef.current = true;
                        canvasRef.loadFromJSON(JSON.parse(state), () => {
                          canvasRef.renderAll();
                          isHistoryChangingRef.current = false;
                        });
                      }
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Undo (Ctrl+Z)
                  </button>
                  <button
                    onClick={() => {
                      const state = redo();
                      if (state && canvasRef) {
                        isHistoryChangingRef.current = true;
                        canvasRef.loadFromJSON(JSON.parse(state), () => {
                          canvasRef.renderAll();
                          isHistoryChangingRef.current = false;
                        });
                      }
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Redo (Ctrl+Y)
                  </button>
                  <button
                    onClick={() => {
                      deleteActiveObject();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-605 hover:bg-purple-50 rounded"
                  >
                    Delete Element
                  </button>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-purple-50 text-slate-600 hover:text-purple-750 transition"
              >
                View
              </button>
              {activeMenu === "view" && (
                <div className="absolute left-0 mt-2 w-48 rounded-lg bg-white border border-purple-100 p-1 shadow-xl z-50">
                  <button
                    onClick={() => {
                      toggleSnapToGrid();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded flex justify-between items-center"
                  >
                    <span>Snap to Grid</span>
                    <span className="text-[10px] text-purple-600 font-mono">{snapToGrid ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setZoom(Math.min(4.0, zoom + 0.1));
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Zoom In (+10%)
                  </button>
                  <button
                    onClick={() => {
                      setZoom(Math.max(0.1, zoom - 0.1));
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Zoom Out (-10%)
                  </button>
                </div>
              )}
            </div>

            {/* Share Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === "share" ? null : "share")}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-purple-50 text-slate-600 hover:text-purple-750 transition"
              >
                Share
              </button>
              {activeMenu === "share" && (
                <div className="absolute left-0 mt-2 w-48 rounded-lg bg-white border border-purple-100 p-1 shadow-xl z-50">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Design studio invite link copied to clipboard!");
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Copy Studio Link
                  </button>
                  <button
                    onClick={() => {
                      setIsCommentMode(!isCommentMode);
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Toggle Review Mode
                  </button>
                </div>
              )}
            </div>

            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === "export" ? null : "export")}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-purple-50 text-slate-600 hover:text-purple-750 transition"
              >
                Export
              </button>
              {activeMenu === "export" && (
                <div className="absolute left-0 mt-2 w-48 rounded-lg bg-white border border-purple-100 p-1 shadow-xl z-50">
                  <button
                    onClick={() => {
                      if (canvasRef) {
                        const dataUrl = canvasRef.toDataURL({ format: "png", quality: 1.0, multiplier: 1 });
                        const link = document.createElement("a");
                        link.download = `${designName.replace(/\s+/g, "_")}_1x.png`;
                        link.href = dataUrl;
                        link.click();
                      }
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    Standard PNG (1x)
                  </button>
                  <button
                    onClick={() => {
                      exportAsImage();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-750 rounded"
                  >
                    High-DPI PNG (2x)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: File Title & Workspace info */}
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium px-3 py-1.5 rounded-md border border-purple-100 focus:border-purple-500 focus:outline-none transition text-sm w-48 text-center"
          />
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs font-semibold py-1.5 px-2.5 rounded-md border border-purple-100 focus:outline-none cursor-pointer"
          >
            {workspaces.map((wsp) => (
              <option key={wsp.id} value={wsp.id}>{wsp.name}</option>
            ))}
          </select>
        </div>

        {/* Action button bar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCommentMode(!isCommentMode)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              isCommentMode 
                ? "bg-purple-600 text-white border-purple-500 shadow-sm" 
                : "bg-slate-50 border-purple-100 text-slate-700 hover:text-purple-750"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isCommentMode ? "Comment Mode Active" : "Comment"}</span>
          </button>

          <button
            onClick={() => setIsMockupOpen(true)}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Eye className="w-4 h-4" />
            <span>3D Billboard Mockup</span>
          </button>

          <button
            onClick={handleSaveDesign}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-purple-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <Save className="w-4 h-4 text-emerald-600" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={exportAsImage}
            className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export high-DPI</span>
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Vertical Left Tab Nav */}
        <nav className="w-20 bg-white border-r border-purple-100 flex flex-col items-center py-6 space-y-5 z-20 shadow-sm">
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              activeTab === "templates" ? "bg-purple-50 text-purple-700" : "text-slate-400 hover:text-purple-600"
            }`}
          >
            <Layout className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Templates</span>
          </button>

          <button
            onClick={() => setActiveTab("brandkit")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              activeTab === "brandkit" ? "bg-purple-50 text-purple-700" : "text-slate-400 hover:text-purple-600"
            }`}
          >
            <Palette className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Brand Kit</span>
          </button>

          <button
            onClick={() => setActiveTab("elements")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              activeTab === "elements" ? "bg-purple-50 text-purple-700" : "text-slate-400 hover:text-purple-600"
            }`}
          >
            <Type className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Elements</span>
          </button>

          <button
            onClick={() => setActiveTab("uploads")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              activeTab === "uploads" ? "bg-purple-50 text-purple-700" : "text-slate-400 hover:text-purple-600"
            }`}
          >
            <UploadCloud className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Uploads</span>
          </button>

          <button
            onClick={() => setActiveTab("folders")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              activeTab === "folders" ? "bg-purple-50 text-purple-700" : "text-slate-400 hover:text-purple-600"
            }`}
          >
            <Folder className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Folders</span>
          </button>

          <button
            onClick={() => setActiveTab("aitools")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              activeTab === "aitools" ? "bg-purple-50 text-purple-700" : "text-slate-400 hover:text-purple-600"
            }`}
          >
            <Sparkles className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">AI Tools</span>
          </button>
        </nav>

        {/* Tab Detail Drawer Panel */}
        <aside 
          data-lenis-prevent="true"
          className={`w-80 bg-white border-r border-purple-100 flex flex-col z-10 relative ${
            activeTab === "templates" 
              ? "overflow-hidden p-0" 
              : "overflow-y-auto px-5 py-6 space-y-6"
          }`}
        >
          
          {/* ── Canva-style Templates Library Drawer ── */}
          {activeTab === "templates" && (
            <div className="flex flex-col absolute inset-0">

              {/* ── Header + Search ── */}
              <div className="px-4 pt-5 pb-3 border-b border-purple-50 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <Layout className="w-4 h-4 text-purple-600" />
                    Templates
                  </h3>
                  <span className="text-[10px] font-semibold text-purple-500 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                    {filteredTemplates.length + 1} designs
                  </span>
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
                    <button
                      onClick={() => setTemplateSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Category Pills ── */}
              <div className="flex flex-wrap gap-1.5 px-4 py-2.5 shrink-0 border-b border-purple-50">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTemplateCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold leading-tight tracking-wide transition ${
                      templateCategory === cat
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    {cat === "all" ? "✦ All" : cat}
                  </button>
                ))}
              </div>

              {/* ── Scrollable Template Grid ── */}
              <div data-lenis-prevent="true" className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 pb-24">

                {/* Blank Canvas Card */}
                {showCustomSize ? (
                  <div className="w-full rounded-xl border-2 border-purple-300 bg-purple-50/50 p-4 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-purple-600" />
                        Custom Size
                      </span>
                      <button onClick={() => setShowCustomSize(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Width (px)</label>
                        <input 
                          type="number" 
                          value={customWidth} 
                          onChange={(e) => setCustomWidth(Number(e.target.value))}
                          className="w-full text-xs p-1.5 border border-purple-200 rounded text-center focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <X className="w-3 h-3 text-slate-300 mt-4" />
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Height (px)</label>
                        <input 
                          type="number" 
                          value={customHeight} 
                          onChange={(e) => setCustomHeight(Number(e.target.value))}
                          className="w-full text-xs p-1.5 border border-purple-200 rounded text-center focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (canvasRef) {
                          setDimensions(customWidth, customHeight);
                          isHistoryChangingRef.current = true;
                          const allObjects = canvasRef.getObjects();
                          canvasRef.remove(...allObjects);
                          canvasRef.setBackgroundColor("#ffffff", () => {
                            canvasRef.renderAll();
                            clearStore();
                            saveHistory(JSON.stringify(canvasRef.toJSON()));
                            isHistoryChangingRef.current = false;
                          });
                          setDesignName("Untitled Design");
                          setActiveDesignId(null);
                          setShowCustomSize(false);
                        } else {
                          alert("Canvas is still loading. Please wait a moment and try again.");
                        }
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded text-xs transition shadow-sm"
                    >
                      Create new design
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomSize(true)}
                    className="w-full group relative rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50/60 to-slate-50 p-2.5 cursor-pointer hover:border-purple-500 hover:from-purple-50 hover:to-purple-50/40 transition-all duration-200"
                  >
                    <div className="aspect-video w-full rounded-lg bg-white/80 flex flex-col items-center justify-center border border-purple-100 group-hover:border-purple-300 transition">
                      <div className="w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 transition flex items-center justify-center mb-1.5">
                        <Plus className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-[10px] font-bold text-purple-500 group-hover:text-purple-700 transition">Blank Canvas</span>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 transition text-left">Start from Scratch</p>
                    <p className="text-[10px] text-slate-400 text-left">Custom dimensions</p>
                  </button>
                )}

                {/* Template Cards */}
                {filteredTemplates.length === 0 && templateSearch && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Search className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">No templates found</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">Try a different search term</p>
                  </div>
                )}

                {filteredTemplates.map((tpl) => {
                  const meta = TEMPLATE_META[tpl.id] ?? DEFAULT_META;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => insertTemplate(tpl)}
                      className="group relative rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:border-purple-400 transition-all duration-200 shadow-sm hover:shadow-lg"
                    >
                      {/* ── Thumbnail Preview ── */}
                      <div className={`aspect-video w-full bg-gradient-to-br ${meta.gradient} relative overflow-hidden`}>
                        {/* Decorative accent circle */}
                        <div
                          className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-50"
                          style={{ backgroundColor: meta.accent }}
                        />
                        <div
                          className="absolute -right-3 -top-3 w-12 h-12 rounded-full opacity-25 border-2"
                          style={{ borderColor: meta.accent }}
                        />
                        {/* Mini design preview lines */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div
                              className="h-1.5 rounded-full w-2/5 opacity-80"
                              style={{ backgroundColor: meta.accent }}
                            />
                            <div className="h-3.5 bg-white rounded-md w-full opacity-90" />
                            <div className="h-3 bg-white/70 rounded-md w-4/5" />
                            <div className="h-2.5 bg-white/40 rounded-md w-3/5" />
                          </div>
                          <div
                            className="h-6 w-20 rounded-lg opacity-90"
                            style={{ backgroundColor: meta.accent }}
                          />
                        </div>
                        {/* Category badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <span
                            className="text-white text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: meta.badgeBg + "cc" }}
                          >
                            {meta.badge}
                          </span>
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-purple-950/0 group-hover:bg-purple-950/65 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                            <span className="bg-white text-purple-700 text-[11px] font-bold px-4 py-2 rounded-full shadow-xl border border-purple-100">
                              Use template
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Card Footer */}
                      <div className="px-3 py-2.5 bg-white flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-[11px] font-semibold text-slate-700 truncate leading-tight">{tpl.name}</p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{meta.category} · {tpl.width}×{tpl.height}</p>
                        </div>
                        <span className="shrink-0 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full mt-0.5">Free</span>
                      </div>
                    </div>
                  );
                })}

                {/* Footer padding */}
                <div className="h-4" />
              </div>
            </div>
          )}

          {/* Brand Kit Drawer */}
          {activeTab === "brandkit" && (
            <div className="space-y-5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Brand Identity Kit</span>
              </h3>
              
              {brandAssets.map((asset) => (
                <div key={asset.id} className="p-4 rounded-lg bg-slate-50 border border-purple-100 space-y-3 shadow-sm">
                  <p className="text-xs font-bold text-slate-700">{asset.name}</p>
                  
                  {asset.colorPalette && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Color Swatches</p>
                      <div className="flex space-x-2">
                        <div 
                          className="w-7 h-7 rounded border border-purple-200 cursor-pointer hover:scale-105 transition shadow-sm" 
                          style={{ backgroundColor: asset.colorPalette.primary }}
                          onClick={() => {
                            if (!canvasRef) return;
                            if (selectedObject) {
                              selectedObject.set("fill", asset.colorPalette?.primary);
                              canvasRef.renderAll();
                            } else {
                              canvasRef.setBackgroundColor(asset.colorPalette?.primary || "#ffffff", () => canvasRef.renderAll());
                            }
                          }}
                          title="Primary Brand Color (applies to selected object or canvas background)"
                        />
                        <div 
                          className="w-7 h-7 rounded border border-purple-200 cursor-pointer hover:scale-105 transition shadow-sm" 
                          style={{ backgroundColor: asset.colorPalette.secondary }}
                          onClick={() => {
                            if (!canvasRef) return;
                            if (selectedObject) {
                              selectedObject.set("fill", asset.colorPalette?.secondary);
                              canvasRef.renderAll();
                            } else {
                              canvasRef.setBackgroundColor(asset.colorPalette?.secondary || "#ffffff", () => canvasRef.renderAll());
                            }
                          }}
                          title="Secondary Brand Color (applies to selected object or canvas background)"
                        />
                        <div 
                          className="w-7 h-7 rounded border border-purple-200 cursor-pointer hover:scale-105 transition shadow-sm" 
                          style={{ backgroundColor: asset.colorPalette.accent }}
                          onClick={() => {
                            if (!canvasRef) return;
                            if (selectedObject) {
                              selectedObject.set("fill", asset.colorPalette?.accent);
                              canvasRef.renderAll();
                            } else {
                              canvasRef.setBackgroundColor(asset.colorPalette?.accent || "#ffffff", () => canvasRef.renderAll());
                            }
                          }}
                          title="Brand Accent Color (applies to selected object or canvas background)"
                        />
                      </div>
                    </div>
                  )}

                  {asset.typography && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Fonts</p>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            if (!canvasRef) return;
                            if (selectedObject && selectedObject.type === "i-text") {
                              (selectedObject as any).set("fontFamily", asset.typography?.headings);
                              canvasRef.renderAll();
                            } else {
                              addText("Brand Title", asset.typography?.headings, 48);
                            }
                          }}
                          className="w-full text-left bg-white hover:bg-purple-50 border border-purple-100 px-3 py-1.5 rounded text-xs font-medium truncate flex justify-between items-center text-slate-700"
                          title="Apply heading font to selected text, or add new text block"
                        >
                          <span>Headings: {asset.typography.headings}</span>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!canvasRef) return;
                            if (selectedObject && selectedObject.type === "i-text") {
                              (selectedObject as any).set("fontFamily", asset.typography?.body);
                              canvasRef.renderAll();
                            } else {
                              addText("Brand body text...", asset.typography?.body, 32);
                            }
                          }}
                          className="w-full text-left bg-white hover:bg-purple-50 border border-purple-100 px-3 py-1.5 rounded text-xs font-medium truncate flex justify-between items-center text-slate-700"
                          title="Apply body font to selected text, or add new text block"
                        >
                          <span>Body: {asset.typography.body}</span>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Elements Drawer */}
          {activeTab === "elements" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <Type className="w-4 h-4 text-purple-600" />
                <span>Design Elements</span>
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-purple-100 bg-slate-50 space-y-2 shadow-sm">
                  <p className="text-xs font-bold text-slate-700">Basic Shapes</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={addRectangle}
                      className="flex items-center space-x-2 bg-white hover:bg-purple-50 border border-purple-100 p-2 rounded text-xs font-semibold text-slate-700 hover:text-purple-750"
                    >
                      <div className="w-4 h-4 bg-purple-500 rounded-sm" />
                      <span>Rectangle</span>
                    </button>

                    <button
                      onClick={addCircle}
                      className="flex items-center space-x-2 bg-white hover:bg-purple-50 border border-purple-100 p-2 rounded text-xs font-semibold text-slate-700 hover:text-purple-750"
                    >
                      <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                      <span>Circle</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-purple-100 bg-slate-50 space-y-2 shadow-sm">
                  <p className="text-xs font-bold text-slate-700">Typography Presets</p>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => addText("Add a Heading", "Outfit", 64)}
                      className="w-full text-left bg-white hover:bg-purple-50 border border-purple-100 px-3 py-2 rounded text-sm font-bold flex justify-between items-center text-slate-800"
                    >
                      <span>Add a Heading</span>
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => addText("Add a Subheading", "Inter", 40)}
                      className="w-full text-left bg-white hover:bg-purple-50 border border-purple-100 px-3 py-2 rounded text-xs font-semibold flex justify-between items-center text-slate-700"
                    >
                      <span>Add a Subheading</span>
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => addText("Add body text content here", "Inter", 24)}
                      className="w-full text-left bg-white hover:bg-purple-50 border border-purple-100 px-3 py-2 rounded text-[11px] font-normal flex justify-between items-center text-slate-550"
                    >
                      <span>Add body text</span>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Uploads Drawer */}
          {activeTab === "uploads" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <UploadCloud className="w-4 h-4 text-purple-600" />
                <span>Upload Media Assets</span>
              </h3>
              
              <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 hover:border-purple-500 transition text-center cursor-pointer relative bg-slate-50 shadow-sm">
                <input
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Click or Drag Files to Upload</p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or SVG up to 10MB</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Uploaded images</p>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    onClick={() => {
                      if (canvasRef) {
                        fabric.Image.fromURL("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop&q=80", (img) => {
                          img.set({ left: 100, top: 100 });
                          img.scaleToWidth(300);
                          canvasRef.add(img);
                          canvasRef.renderAll();
                        }, { crossOrigin: "anonymous" });
                      }
                    }}
                    className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-purple-100 hover:border-purple-400 transition cursor-pointer"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80" 
                      alt="mock-upload"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Folders Drawer */}
          {activeTab === "folders" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <Folder className="w-4 h-4 text-purple-600" />
                <span>Workspace Folders</span>
              </h3>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="New folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="bg-slate-50 border border-purple-100 text-slate-700 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:bg-white flex-1"
                />
                <button
                  onClick={handleCreateFolder}
                  className="bg-purple-600 hover:bg-purple-750 text-white p-2 rounded-md shadow-sm"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                {folders.map((fold) => (
                  <div
                    key={fold.id}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-purple-50/50 border border-purple-100 transition cursor-pointer text-xs font-semibold text-slate-705"
                  >
                    <Folder className="w-4 h-4 text-purple-500" />
                    <span>{fold.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Tools Drawer */}
          {activeTab === "aitools" && (
            <div className="space-y-5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Creative Suite</span>
              </h3>

              <div className="p-4 rounded-lg bg-slate-50 border border-purple-100 space-y-3 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">AI Design Generator</h4>
                  <p className="text-[10px] text-slate-405 mt-0.5">Generate high-converting typography tags instantly</p>
                </div>
                <textarea
                  placeholder="E.g., Grand Opening Sale 70% Off..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-white border border-purple-100 text-slate-800 text-xs p-2.5 rounded-md focus:outline-none h-20 resize-none"
                />
                <button
                  onClick={generateAiDesign}
                  disabled={isAiLoading || !aiPrompt}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-105 disabled:text-slate-400 text-white py-1.5 rounded text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiLoading ? "Generating Tag..." : "Generate Tag Elements"}</span>
                </button>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-purple-100 space-y-3 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">AI Background Removal</h4>
                  <p className="text-[10px] text-slate-405 mt-0.5">Remove photo backgrounds instantly via AI routing</p>
                </div>
                <input
                  type="text"
                  placeholder="Paste target image URL..."
                  value={aiRemoveBgUrl}
                  onChange={(e) => setAiRemoveBgUrl(e.target.value)}
                  className="w-full bg-white border border-purple-100 text-slate-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none"
                />
                <button
                  onClick={removeImageBg}
                  disabled={isAiRemoving || !aiRemoveBgUrl}
                  className="w-full bg-cyan-600 hover:bg-cyan-550 disabled:bg-slate-105 disabled:text-slate-400 text-white py-1.5 rounded text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiRemoving ? "Removing..." : "Remove Background"}</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Central Layout Canvas Viewport Container */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Top Sub-toolbar */}
          <div className="h-12 bg-white border-b border-purple-100 flex items-center justify-between px-6 z-10 shadow-sm">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const state = undo();
                  if (state && canvasRef) {
                    isHistoryChangingRef.current = true;
                    canvasRef.loadFromJSON(JSON.parse(state), () => {
                      canvasRef.renderAll();
                      isHistoryChangingRef.current = false;
                    });
                  }
                }}
                disabled={historyIndex <= 0}
                className="p-1.5 text-slate-500 hover:text-purple-750 rounded hover:bg-purple-50 transition disabled:opacity-30 disabled:hover:bg-transparent"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const state = redo();
                  if (state && canvasRef) {
                    isHistoryChangingRef.current = true;
                    canvasRef.loadFromJSON(JSON.parse(state), () => {
                      canvasRef.renderAll();
                      isHistoryChangingRef.current = false;
                    });
                  }
                }}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-slate-500 hover:text-purple-750 rounded hover:bg-purple-50 transition disabled:opacity-30 disabled:hover:bg-transparent"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-purple-100" />
              
              <button
                onClick={toggleSnapToGrid}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                  snapToGrid ? "bg-purple-50 text-purple-650" : "text-slate-500 hover:text-purple-750"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Snap to grid</span>
              </button>
            </div>

            {/* Selected Element Customizer Tool Actions */}
            {selectedObject && (
              <div className="flex items-center space-x-3 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 animate-fade-in shadow-sm">
                <span className="text-[10px] font-bold text-purple-650 uppercase mr-1">Active Object:</span>
                
                {/* Element Fill Color Input */}
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-505">Color:</span>
                  <input
                    type="color"
                    value={(selectedObject.get("fill") as string) || "#000000"}
                    onChange={(e) => {
                      selectedObject.set("fill", e.target.value);
                      canvasRef?.renderAll();
                    }}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>

                {/* Text specific controls */}
                {selectedObject.type === "i-text" && (
                  <>
                    <div className="h-4 w-px bg-purple-100" />
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-505">Size:</span>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={(selectedObject as any).get("fontSize") || 32}
                        onChange={(e) => {
                          (selectedObject as any).set("fontSize", parseInt(e.target.value));
                          canvasRef?.renderAll();
                        }}
                        className="w-12 bg-white border border-purple-100 text-slate-800 text-[11px] font-bold px-1.5 py-0.5 rounded text-center focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="h-4 w-px bg-purple-100" />
                
                <button
                  onClick={deleteActiveObject}
                  className="p-1 text-rose-600 hover:text-rose-500 rounded hover:bg-purple-50 transition"
                  title="Delete Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Right side controls (Canvas Size & Zoom) */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Canvas:</span>
                
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-400">W</span>
                  <input
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => setDimensions(Number(e.target.value) || 100, canvasHeight)}
                    className="w-14 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold px-1.5 py-0.5 rounded text-center focus:outline-none focus:border-purple-400"
                    title="Canvas Width"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-400">H</span>
                  <input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => setDimensions(canvasWidth, Number(e.target.value) || 100)}
                    className="w-14 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold px-1.5 py-0.5 rounded text-center focus:outline-none focus:border-purple-400"
                    title="Canvas Height"
                  />
                </div>
              </div>

              {/* Zoom scale info */}
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                <span>Scale:</span>
                <span className="text-purple-650">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Canvas Engine component wrapper */}
          <div className="flex-1 p-8 relative flex items-center justify-center">
            {/* Dropped comments markers */}
            {comments.map((c) => (
              <div
                key={c.id}
                className="absolute w-6 h-6 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg pointer-events-auto cursor-help z-10 transition hover:scale-110"
                style={{
                  left: `calc(50% + ${(c.x - 960) * zoom}px)`,
                  top: `calc(50% + ${(c.y - 540) * zoom}px)`,
                }}
                title={c.content}
              >
                C
              </div>
            ))}

            <CanvasCoreEngine onCanvasReady={handleCanvasReady} />

            {/* Comment popover overlay */}
            {activeCommentCoords && (
              <div 
                className="absolute bg-white border border-purple-100 rounded-lg p-3 w-64 shadow-xl z-30 space-y-2"
                style={{
                  left: `calc(50% + ${(activeCommentCoords.x - 960) * zoom}px)`,
                  top: `calc(50% + ${(activeCommentCoords.y - 540) * zoom}px - 70px)`,
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Drop Pin Comment</span>
                  <button onClick={() => setActiveCommentCoords(null)}>
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Feedback details..."
                  className="w-full bg-slate-50 border border-purple-100 text-xs text-slate-800 p-2 rounded focus:outline-none h-16 resize-none"
                />
                <button
                  onClick={submitComment}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1 rounded text-xs font-bold transition"
                >
                  Post Comment
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3D Billboard perspective Homography simulation Modal */}
      {isMockupOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white border border-purple-100 rounded-2xl w-[900px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-purple-50 flex justify-between items-center bg-purple-50/50">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-purple-650" />
                <span className="font-bold text-slate-850 text-base">3D Street Billboard Homography Simulation</span>
              </div>
              <button 
                onClick={() => setIsMockupOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-purple-100/50 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Homography Interactive Viewer Panel */}
            <div className="p-6 flex flex-col items-center bg-[#FAF9FE]">
              <p className="text-xs text-slate-600 mb-4 max-w-lg text-center font-medium">
                Drag the yellow corner control points on the street scene below to fit your canvas campaign perfectly onto the billboard hoarding perspective bounds!
              </p>

              {/* The interactive relative image stage */}
              <div 
                ref={mockupContainerRef}
                onMouseMove={handleMockupMouseMove}
                onMouseUp={() => setActiveCorner(null)}
                className="relative w-[800px] h-[533px] select-none cursor-default border border-purple-150 rounded-lg overflow-hidden bg-slate-950 shadow-md"
              >
                {/* Street background view */}
                <img
                  src="https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=1200"
                  alt="Street billboard scene"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
                />

                {/* Transformed active canvas design output using calculated Matrix3D */}
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
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    border: "2px solid #a855f7"
                  }}
                >
                  <img
                    src={getCanvasDataUrl()}
                    alt="Mockup projection content"
                    className="w-full h-full object-fill opacity-95 filter brightness-105 contrast-95"
                  />
                </div>

                {/* Interactive Yellow Handles */}
                <div
                  className="absolute w-5 h-5 bg-yellow-400 border border-black rounded-full cursor-move z-10 flex items-center justify-center shadow-lg -translate-x-1/2 -translate-y-1/2"
                  style={{ left: corners.p0.x, top: corners.p0.y }}
                  onMouseDown={() => setActiveCorner("p0")}
                />
                <div
                  className="absolute w-5 h-5 bg-yellow-400 border border-black rounded-full cursor-move z-10 flex items-center justify-center shadow-lg -translate-x-1/2 -translate-y-1/2"
                  style={{ left: corners.p1.x, top: corners.p1.y }}
                  onMouseDown={() => setActiveCorner("p1")}
                />
                <div
                  className="absolute w-5 h-5 bg-yellow-400 border border-black rounded-full cursor-move z-10 flex items-center justify-center shadow-lg -translate-x-1/2 -translate-y-1/2"
                  style={{ left: corners.p2.x, top: corners.p2.y }}
                  onMouseDown={() => setActiveCorner("p2")}
                />
                <div
                  className="absolute w-5 h-5 bg-yellow-400 border border-black rounded-full cursor-move z-10 flex items-center justify-center shadow-lg -translate-x-1/2 -translate-y-1/2"
                  style={{ left: corners.p3.x, top: corners.p3.y }}
                  onMouseDown={() => setActiveCorner("p3")}
                />
              </div>

              {/* Pin info readouts */}
              <div className="mt-4 flex space-x-6 text-[10px] text-slate-500 font-mono">
                <span>Top-Left Pin: ({corners.p0.x}, {corners.p0.y})</span>
                <span>Top-Right Pin: ({corners.p1.x}, {corners.p1.y})</span>
                <span>Bottom-Right Pin: ({corners.p2.x}, {corners.p2.y})</span>
                <span>Bottom-Left Pin: ({corners.p3.x}, {corners.p3.y})</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-purple-50 bg-purple-50/30 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCorners({
                    p0: { x: 236, y: 110 },
                    p1: { x: 574, y: 154 },
                    p2: { x: 574, y: 394 },
                    p3: { x: 236, y: 350 },
                  });
                }}
                className="bg-slate-50 hover:bg-slate-100 text-slate-605 border border-purple-100 px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                Reset Calibration
              </button>

              <button
                onClick={() => setIsMockupOpen(false)}
                className="bg-purple-600 hover:bg-purple-750 text-white px-5 py-2 rounded-lg text-xs font-semibold transition"
              >
                Done Previewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DesignStudioPage;
