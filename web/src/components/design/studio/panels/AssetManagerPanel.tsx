import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud, Folder, Image, Video, Music, Star, Clock, Search, Grid, List,
  MoreVertical, Download, Trash2, Copy, ChevronRight, Plus, X, AlertCircle,
  Loader2, Sparkles, Filter, ArrowUpDown, Check, Volume2, FolderOpen, FileText, Tag,
  ExternalLink, Share2, Maximize2, RefreshCw
} from "lucide-react";
import { fabric } from "fabric";
import axios from "axios";

// API helper setup
const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to inject jwt token if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

interface AssetTag {
  id: string;
  name: string;
}

interface AssetFolder {
  id: string;
  name: string;
  parentFolderId?: string | null;
  _count?: {
    assets: number;
  };
}

interface Asset {
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  url: string;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  size: number;
  uploadedAt: string | Date;
  favorite: boolean;
  folderId?: string | null;
  tags: AssetTag[];
}

interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "success" | "error" | "cancelled";
  errorMsg?: string;
}

interface AssetManagerPanelProps {
  canvas: fabric.Canvas | null;
}

// Preset tags for autocomplete/filtering
const PRESET_TAGS = ["logo", "banner", "social", "marketing", "product", "background", "mockup", "high-res", "bg-removed"];

export const AssetManagerPanel: React.FC<AssetManagerPanelProps> = ({ canvas }) => {
  // Navigation & View States
  const [activeSection, setActiveSection] = useState<string>("all");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Root" }
  ]);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date_desc"); // "date_desc" | "date_asc" | "size_desc" | "size_asc" | "name_asc" | "name_desc"

  // Data States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Selected Asset details sidebar
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  // Upload Queue States
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Custom Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; asset: Asset } | null>(null);

  // Modal Dialogs
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [movingAsset, setMovingAsset] = useState<Asset | null>(null);
  const [renamingAsset, setRenamingAsset] = useState<Asset | null>(null);
  const [renameText, setRenameText] = useState<string>("");

  // Determine auth status
  const isAuth = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

  // Load Initial Data
  useEffect(() => {
    fetchData();
  }, [currentFolderId, activeSection, sortBy, searchQuery, selectedTag]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isAuth) {
        // Authenticated Session: Fetch folders & assets from PostgreSQL via APIs
        const folderRes = await api.get("/assets/folders", {
          params: { parentFolderId: currentFolderId || "null" }
        });
        setFolders(folderRes.data.data || []);

        const assetParams: any = {
          folderId: currentFolderId || "null",
          sort: sortBy,
        };
        if (searchQuery) assetParams.search = searchQuery;
        if (selectedTag) assetParams.tag = selectedTag;
        if (activeSection === "favorites") assetParams.favorite = "true";
        if (activeSection !== "all" && activeSection !== "favorites" && activeSection !== "recently_used") {
          assetParams.type = activeSection.toUpperCase();
        }

        const assetRes = await api.get("/assets", { params: assetParams });
        let fetchedAssets = assetRes.data.data || [];

        // In-memory recents filter
        if (activeSection === "recently_used") {
          const recents = localStorage.getItem("recently_used_asset_ids");
          if (recents) {
            const ids: string[] = JSON.parse(recents);
            fetchedAssets = fetchedAssets.filter((a: Asset) => ids.includes(a.id));
          }
        }

        setAssets(fetchedAssets);
      } else {
        // Guest Demo Session: Fallback to Local Storage in-memory simulated database
        initializeLocalMockData();
      }
    } catch (err) {
      console.error("Failed to load asset manager data. Initializing fallback mode.", err);
      initializeLocalMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const initializeLocalMockData = () => {
    // Check local storage for assets database seed
    let localAssets: Asset[] = [];
    let localFolders: AssetFolder[] = [];

    const storedAssets = localStorage.getItem("local_assets");
    const storedFolders = localStorage.getItem("local_folders");

    if (storedAssets && storedFolders) {
      localAssets = JSON.parse(storedAssets);
      localFolders = JSON.parse(storedFolders);
    } else {
      // Seed default mock items
      localFolders = [
        { id: "fold_logos", name: "Logos", parentFolderId: null },
        { id: "fold_social", name: "Social Media", parentFolderId: null },
        { id: "fold_bg", name: "Backgrounds", parentFolderId: null },
        { id: "fold_mockups", name: "Mockups", parentFolderId: null }
      ];

      localAssets = [
        {
          id: "mock_asset_1",
          name: "Modern Billboard Graphic.jpg",
          type: "IMAGE",
          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&fit=crop&q=80",
          thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80",
          width: 1920,
          height: 1080,
          size: 1530200,
          uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          favorite: true,
          folderId: "fold_social",
          tags: [{ id: "tag_1", name: "social" }, { id: "tag_2", name: "banner" }]
        },
        {
          id: "mock_asset_2",
          name: "Billboardify Secondary Logo.png",
          type: "IMAGE",
          url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&fit=crop&q=80",
          thumbnailUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=150&h=150&fit=crop&q=80",
          width: 800,
          height: 800,
          size: 204800,
          uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          favorite: false,
          folderId: "fold_logos",
          tags: [{ id: "tag_3", name: "logo" }]
        },
        {
          id: "mock_asset_3",
          name: "Abstract Fluid Painting.svg",
          type: "IMAGE",
          url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&fit=crop&q=80",
          thumbnailUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&h=150&fit=crop&q=80",
          width: 1200,
          height: 900,
          size: 98400,
          uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          favorite: false,
          folderId: "fold_bg",
          tags: [{ id: "tag_4", name: "background" }]
        },
        {
          id: "mock_asset_4",
          name: "Ambient Background Music.mp3",
          type: "AUDIO",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          thumbnailUrl: null,
          size: 6200000,
          uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          favorite: true,
          folderId: null,
          tags: [{ id: "tag_5", name: "audio" }]
        }
      ];

      localStorage.setItem("local_assets", JSON.stringify(localAssets));
      localStorage.setItem("local_folders", JSON.stringify(localFolders));
    }

    // Filter local folders by parentFolderId
    const currentFolders = localFolders.filter((f) => f.parentFolderId === currentFolderId);
    setFolders(currentFolders);

    // Apply Filters to local assets
    let filtered = localAssets;
    
    // Parent folder filter
    if (activeSection !== "favorites" && activeSection !== "recently_used") {
      filtered = filtered.filter((a) => a.folderId === currentFolderId);
    }

    // Section Type filters
    if (activeSection === "favorites") {
      filtered = filtered.filter((a) => a.favorite);
    } else if (activeSection === "recently_used") {
      const recents = localStorage.getItem("recently_used_asset_ids");
      if (recents) {
        const ids: string[] = JSON.parse(recents);
        filtered = filtered.filter((a) => ids.includes(a.id));
      } else {
        filtered = [];
      }
    } else if (activeSection !== "all") {
      filtered = filtered.filter((a) => a.type === activeSection.toUpperCase());
    }

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.tags.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter((a) => a.tags.some((t) => t.name.toLowerCase() === selectedTag.toLowerCase()));
    }

    // Sort order filters
    filtered.sort((a, b) => {
      if (sortBy === "date_asc") return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      if (sortBy === "size_desc") return b.size - a.size;
      if (sortBy === "size_asc") return a.size - b.size;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(); // default date_desc
    });

    setAssets(filtered);
  };

  // Navigating nested folders
  const openFolder = (folder: AssetFolder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  // Add folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      if (isAuth) {
        await api.post("/assets/folders", {
          name: newFolderName,
          parentFolderId: currentFolderId,
        });
      } else {
        const localFolders: AssetFolder[] = JSON.parse(localStorage.getItem("local_folders") || "[]");
        const newFolder: AssetFolder = {
          id: `fold_${Date.now()}`,
          name: newFolderName,
          parentFolderId: currentFolderId,
        };
        localFolders.push(newFolder);
        localStorage.setItem("local_folders", JSON.stringify(localFolders));
      }
      setNewFolderName("");
      setShowFolderModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate Check & Uploader Trigger
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isFolder = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Add files to the upload queue
    const queueItems: UploadQueueItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Perform client-side duplicate checks matching name and size
      const isDuplicate = assets.some((a) => a.name === file.name && a.size === file.size);
      if (isDuplicate) {
        alert(`Duplicate detected: "${file.name}" is already in this library folder.`);
        continue;
      }

      queueItems.push({
        id: `upl_${Date.now()}_${i}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading",
      });
    }

    if (queueItems.length === 0) return;

    setUploadQueue((prev) => [...queueItems, ...prev]);
    queueItems.forEach((item) => startSimulatedUpload(item));
  };

  const startSimulatedUpload = (item: UploadQueueItem) => {
    let currentProgress = 0;
    const interval = setInterval(async () => {
      currentProgress += Math.floor(Math.random() * 20) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Finalize completed item
        try {
          const fileType = detectFileType(item.file);
          
          // Generate a base64 FileReader string representing preview
          const reader = new FileReader();
          reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            
            let uploadedAsset: Asset;

            if (isAuth) {
              // Server-side REST update
              const res = await api.post("/assets", {
                name: item.name,
                type: fileType,
                url: dataUrl,
                thumbnailUrl: fileType === "IMAGE" ? dataUrl : null,
                size: item.size,
                folderId: currentFolderId,
                width: 400,
                height: 400,
                favorite: false,
                tags: [fileType.toLowerCase(), "upload"]
              });
              uploadedAsset = res.data.asset;
            } else {
              // Local fallback creation
              const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
              uploadedAsset = {
                id: `local_asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: item.name,
                type: fileType as any,
                url: dataUrl,
                thumbnailUrl: fileType === "IMAGE" ? dataUrl : null,
                width: 400,
                height: 400,
                size: item.size,
                uploadedAt: new Date().toISOString(),
                favorite: false,
                folderId: currentFolderId,
                tags: [{ id: `t_${Date.now()}`, name: fileType.toLowerCase() }, { id: `t2_${Date.now()}`, name: "upload" }]
              };
              localAssets.push(uploadedAsset);
              localStorage.setItem("local_assets", JSON.stringify(localAssets));
            }

            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: 100, status: "success" } : q))
            );

            // Re-fetch visual grid and auto-clear queue after 3s
            fetchData();
            setTimeout(() => {
              setUploadQueue((prev) => prev.filter((q) => q.id !== item.id));
            }, 3000);
          };
          reader.readAsDataURL(item.file);

        } catch (err) {
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "error", errorMsg: "Upload failed" } : q))
          );
        }
      } else {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: currentProgress } : q))
        );
      }
    }, 200);
  };

  const detectFileType = (file: File): "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" => {
    const mime = file.type;
    if (mime.startsWith("image/")) return "IMAGE";
    if (mime.startsWith("video/")) return "VIDEO";
    if (mime.startsWith("audio/")) return "AUDIO";
    return "DOCUMENT";
  };

  const cancelUpload = (id: string) => {
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "cancelled", progress: 0 } : q))
    );
    setTimeout(() => {
      setUploadQueue((prev) => prev.filter((q) => q.id !== id));
    }, 1500);
  };

  const retryUpload = (item: UploadQueueItem) => {
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 0 } : q))
    );
    startSimulatedUpload(item);
  };

  // Drag-and-drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const syntheticEvent = {
        target: { files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(syntheticEvent);
    }
  };

  // Asset Metadata Actions
  const toggleFavoriteAsset = async (asset: Asset) => {
    try {
      const updatedFav = !asset.favorite;
      if (isAuth) {
        await api.put(`/assets/${asset.id}`, { favorite: updatedFav });
      } else {
        const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
        const idx = localAssets.findIndex((a) => a.id === asset.id);
        if (idx !== -1) {
          localAssets[idx].favorite = updatedFav;
          localStorage.setItem("local_assets", JSON.stringify(localAssets));
        }
      }
      
      // Sync local selection state
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset({ ...selectedAsset, favorite: updatedFav });
      }

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset? This cannot be undone.")) return;
    try {
      if (isAuth) {
        await api.delete(`/assets/${id}`);
      } else {
        const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
        const filtered = localAssets.filter((a) => a.id !== id);
        localStorage.setItem("local_assets", JSON.stringify(filtered));
      }
      
      if (selectedAsset?.id === id) {
        setSelectedAsset(null);
        setShowDetailPanel(false);
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const renameAsset = async () => {
    if (!renamingAsset || !renameText.trim()) return;
    try {
      if (isAuth) {
        await api.put(`/assets/${renamingAsset.id}`, { name: renameText });
      } else {
        const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
        const idx = localAssets.findIndex((a) => a.id === renamingAsset.id);
        if (idx !== -1) {
          localAssets[idx].name = renameText;
          localStorage.setItem("local_assets", JSON.stringify(localAssets));
        }
      }
      
      if (selectedAsset?.id === renamingAsset.id) {
        setSelectedAsset({ ...selectedAsset, name: renameText });
      }
      setRenamingAsset(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const duplicateAsset = async (asset: Asset) => {
    try {
      if (isAuth) {
        await api.post(`/assets/${asset.id}`);
      } else {
        const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
        const dupName = `${asset.name.split(".")[0]} Copy.${asset.name.split(".").pop() || "png"}`;
        const duplicated: Asset = {
          ...asset,
          id: `local_asset_${Date.now()}`,
          name: dupName,
          uploadedAt: new Date().toISOString(),
          favorite: false,
        };
        localAssets.push(duplicated);
        localStorage.setItem("local_assets", JSON.stringify(localAssets));
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const moveAsset = async (asset: Asset, targetFolderId: string | null) => {
    try {
      if (isAuth) {
        await api.put(`/assets/${asset.id}`, { folderId: targetFolderId });
      } else {
        const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
        const idx = localAssets.findIndex((a) => a.id === asset.id);
        if (idx !== -1) {
          localAssets[idx].folderId = targetFolderId;
          localStorage.setItem("local_assets", JSON.stringify(localAssets));
        }
      }
      setMovingAsset(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // AI Power Tools Integrations
  const runAiFeature = async (action: "remove-background" | "enhance" | "upscale" | "auto-tag") => {
    if (!selectedAsset) return;
    setIsAiProcessing(true);
    try {
      if (isAuth) {
        const res = await api.post("/assets/ai-process", {
          assetId: selectedAsset.id,
          action,
        });
        setSelectedAsset(res.data.data);
      } else {
        // Local simulation of AI
        await new Promise((r) => setTimeout(r, 1200));
        const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
        const idx = localAssets.findIndex((a) => a.id === selectedAsset.id);
        
        if (idx !== -1) {
          const item = localAssets[idx];
          
          if (action === "remove-background") {
            item.name = `${item.name.split(".")[0]} (No BG).png`;
            // Add tags
            const newTags = [...item.tags];
            if (!newTags.some(t => t.name === "bg-removed")) newTags.push({ id: `t_${Date.now()}`, name: "bg-removed" });
            if (!newTags.some(t => t.name === "transparent")) newTags.push({ id: `t2_${Date.now()}`, name: "transparent" });
            item.tags = newTags;
            // Simulated transparent image url replacement for preview
            item.url = "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&fit=crop&q=80"; 
            item.thumbnailUrl = "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=150&h=150&fit=crop&q=80";
          } else if (action === "enhance") {
            const newTags = [...item.tags];
            if (!newTags.some(t => t.name === "enhanced")) newTags.push({ id: `t_${Date.now()}`, name: "enhanced" });
            item.tags = newTags;
          } else if (action === "upscale") {
            item.width = item.width ? item.width * 2 : 3840;
            item.height = item.height ? item.height * 2 : 2160;
            item.size = Math.round(item.size * 1.6);
            const newTags = [...item.tags];
            if (!newTags.some(t => t.name === "high-res")) newTags.push({ id: `t_${Date.now()}`, name: "high-res" });
            item.tags = newTags;
          } else if (action === "auto-tag") {
            const newTags = [...item.tags];
            const inferred = item.name.toLowerCase().includes("logo") ? "logo" : "marketing";
            if (!newTags.some(t => t.name === inferred)) newTags.push({ id: `t_${Date.now()}`, name: inferred });
            item.tags = newTags;
          }

          localAssets[idx] = item;
          localStorage.setItem("local_assets", JSON.stringify(localAssets));
          setSelectedAsset(item);
        }
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert("AI processing error.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Add tag manually
  const handleAddTag = async (tagName: string) => {
    if (!selectedAsset || !tagName.trim()) return;
    try {
      const currentTags = selectedAsset.tags.map((t) => t.name);
      if (currentTags.includes(tagName.trim().toLowerCase())) return;
      
      const newTags = [...currentTags, tagName.trim().toLowerCase()];

      if (isAuth) {
        const res = await api.put(`/assets/${selectedAsset.id}`, { tags: newTags });
        setSelectedAsset(res.data.data);
      } else {
        const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
        const idx = localAssets.findIndex((a) => a.id === selectedAsset.id);
        if (idx !== -1) {
          const item = localAssets[idx];
          item.tags.push({ id: `tag_${Date.now()}`, name: tagName.trim().toLowerCase() });
          localAssets[idx] = item;
          localStorage.setItem("local_assets", JSON.stringify(localAssets));
          setSelectedAsset(item);
        }
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!selectedAsset) return;
    try {
      const remainingTags = selectedAsset.tags.filter((t) => t.id !== tagId).map((t) => t.name);
      
      if (isAuth) {
        const res = await api.put(`/assets/${selectedAsset.id}`, { tags: remainingTags });
        setSelectedAsset(res.data.data);
      } else {
        const localAssets: Asset[] = JSON.parse(localStorage.getItem("local_assets") || "[]");
        const idx = localAssets.findIndex((a) => a.id === selectedAsset.id);
        if (idx !== -1) {
          const item = localAssets[idx];
          item.tags = item.tags.filter((t) => t.id !== tagId);
          localAssets[idx] = item;
          localStorage.setItem("local_assets", JSON.stringify(localAssets));
          setSelectedAsset(item);
        }
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Right-Click Context Menu Triggers
  const handleContextMenuTrigger = (e: React.MouseEvent, asset: Asset) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      asset,
    });
  };

  // Close context menu on click
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Canvas Workspace Integrations
  const handleInsertToCanvas = (asset: Asset) => {
    if (!canvas) return;
    
    // Add to Recently Used IDs
    const recents = localStorage.getItem("recently_used_asset_ids") || "[]";
    const ids: string[] = JSON.parse(recents);
    const updated = [asset.id, ...ids.filter((id) => id !== asset.id)].slice(0, 10);
    localStorage.setItem("recently_used_asset_ids", JSON.stringify(updated));

    if (asset.type === "IMAGE") {
      const isDataOrBlob = asset.url.startsWith("data:") || asset.url.startsWith("blob:");
      fabric.Image.fromURL(asset.url, (img) => {
        const center = canvas.getVpCenter();
        img.set({
          left: center.x - 150,
          top: center.y - 150,
        });
        img.scaleToWidth(300);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      }, isDataOrBlob ? {} : { crossOrigin: "anonymous" });
    } else {
      // Create text shape details for documents/videos/audio
      const text = new fabric.IText(`[${asset.type}: ${asset.name}]`, {
        left: 100,
        top: 100,
        fontSize: 20,
        fontFamily: "Outfit",
        fill: "#4f46e5"
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    }
  };

  const handleReplaceSelectedImage = (asset: Asset) => {
    if (!canvas || asset.type !== "IMAGE") return;
    const activeObj = canvas.getActiveObject();
    
    if (activeObj && activeObj.type === "image") {
      const activeImage = activeObj as fabric.Image;
      const imgElement = new window.Image();
      if (!asset.url.startsWith("data:") && !asset.url.startsWith("blob:")) {
        imgElement.crossOrigin = "anonymous";
      }
      imgElement.onload = () => {
        activeImage.setElement(imgElement);
        canvas.renderAll();
      };
      imgElement.src = asset.url;
    } else {
      alert("Please select an image on the canvas to replace.");
    }
  };

  const handleSetAsBackground = (asset: Asset) => {
    if (!canvas || asset.type !== "IMAGE") return;
    
    const isDataOrBlob = asset.url.startsWith("data:") || asset.url.startsWith("blob:");
    fabric.Image.fromURL(asset.url, (img) => {
      // scale to cover canvas width/height
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      
      const scaleX = canvasWidth / img.width!;
      const scaleY = canvasHeight / img.height!;
      const scale = Math.max(scaleX, scaleY);
      
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: scale,
        scaleY: scale,
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: "center",
        originY: "center"
      });
    }, isDataOrBlob ? {} : { crossOrigin: "anonymous" });
  };

  // Helper utility file size formatter
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs relative select-none">
      
      {/* 1. Header with View Controls & Upload Button */}
      <div className="flex flex-col space-y-2.5 pb-3 border-b border-purple-100/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-4 h-4 text-purple-600 animate-pulse" />
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Media Asset Manager</h3>
            {!isAuth && (
              <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Guest Demo
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* View Mode Selectors */}
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg border transition ${viewMode === "grid" ? "bg-purple-100/50 text-purple-700 border-purple-200" : "bg-transparent text-slate-400 border-transparent hover:text-slate-600"}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg border transition ${viewMode === "list" ? "bg-purple-100/50 text-purple-700 border-purple-200" : "bg-transparent text-slate-400 border-transparent hover:text-slate-600"}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={() => setShowFolderModal(true)}
              className="p-1.5 rounded-lg border border-purple-100 hover:bg-purple-50 text-purple-600 font-bold transition flex items-center space-x-1"
              title="New Folder"
            >
              <Plus className="w-3.5 h-3.5" />
              <Folder className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search, Sort and Filter Toolbar */}
        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-6 relative">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-purple-100 rounded-xl pl-8 pr-6 py-1.5 text-[10px] focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <div className="col-span-3 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-purple-100 rounded-xl px-2 py-1.5 text-[9px] text-slate-600 focus:outline-none appearance-none"
            >
              <option value="date_desc">Newest</option>
              <option value="date_asc">Oldest</option>
              <option value="size_desc">Largest</option>
              <option value="size_asc">Smallest</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
            <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="col-span-3 relative">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full bg-slate-50 border border-purple-100 rounded-xl px-2 py-1.5 text-[9px] text-slate-600 focus:outline-none appearance-none"
            >
              <option value="">All Tags</option>
              {PRESET_TAGS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <Filter className="w-2.5 h-2.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Drag & Drop Uploader Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-2.5 border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer relative flex flex-col items-center justify-center shrink-0 ${
          isDragOver
            ? "border-purple-600 bg-purple-50/50 shadow-inner"
            : "border-purple-200 bg-slate-50/60 hover:bg-purple-50/20 hover:border-purple-400"
        }`}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e, false)}
          className="hidden"
        />
        <input
          type="file"
          {...{ webkitdirectory: "true" } as any}
          ref={folderInputRef}
          onChange={(e) => handleFileUpload(e, true)}
          className="hidden"
        />

        <div onClick={() => fileInputRef.current?.click()} className="w-full py-1">
          <UploadCloud className="w-6 h-6 text-purple-600 mx-auto mb-1 opacity-80" />
          <p className="text-[10px] font-bold text-slate-700">Drag & Drop Files Here</p>
          <p className="text-[8.5px] text-slate-400 mt-0.5">Images, Video, Audio or PDF</p>
        </div>

        <div className="flex space-x-2 mt-2 pt-2 border-t border-purple-100/40 w-full justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="text-[9px] bg-purple-600 text-white font-bold px-2 py-1 rounded-lg hover:bg-purple-700 transition"
          >
            Upload Files
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
            className="text-[9px] bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg hover:bg-slate-300 transition"
          >
            Upload Directory
          </button>
        </div>
      </div>

      {/* 3. Uploading Queue */}
      {uploadQueue.length > 0 && (
        <div className="bg-slate-50 border border-purple-100 rounded-xl p-2 mt-2 max-h-24 overflow-y-auto space-y-1.5 shrink-0">
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Uploading Assets Queue</p>
          {uploadQueue.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-[9px] bg-white border border-purple-50 p-1.5 rounded-lg">
              <div className="flex items-center space-x-1.5 truncate max-w-[65%]">
                <Loader2 className={`w-3 h-3 text-purple-600 ${item.status === "uploading" ? "animate-spin" : ""}`} />
                <span className="truncate font-semibold text-slate-700">{item.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[8px] text-slate-400 font-mono">{formatBytes(item.size)}</span>
                
                {item.status === "uploading" && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[8px] font-bold text-purple-600">{item.progress}%</span>
                    <button onClick={() => cancelUpload(item.id)} className="text-rose-500 hover:text-rose-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {item.status === "success" && <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />}
                
                {item.status === "error" && (
                  <button onClick={() => retryUpload(item)} className="text-amber-600 hover:text-amber-800">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}

                {item.status === "cancelled" && <span className="text-slate-400 text-[8px]">Cancelled</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Section Quick Switcher Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto py-2.5 border-b border-purple-100/20 shrink-0 scrollbar-none select-none">
        {[
          { id: "all", label: "All Assets", icon: <Grid className="w-3 h-3" /> },
          { id: "images", label: "Images", icon: <Image className="w-3 h-3" /> },
          { id: "logos", label: "Logos", icon: <Share2 className="w-3 h-3" /> },
          { id: "backgrounds", label: "Backgrounds", icon: <FolderOpen className="w-3 h-3" /> },
          { id: "videos", label: "Videos", icon: <Video className="w-3 h-3" /> },
          { id: "audio", label: "Audio", icon: <Volume2 className="w-3 h-3" /> },
          { id: "favorites", label: "Favorites", icon: <Star className="w-3 h-3" /> },
          { id: "recently_used", label: "Recents", icon: <Clock className="w-3 h-3" /> },
        ].map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id);
                setSelectedTag("");
                setCurrentFolderId(null);
                setBreadcrumbs([{ id: null, name: "Root" }]);
              }}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full border transition shrink-0 ${
                isActive
                  ? "bg-purple-600 text-white border-purple-600 font-bold shadow-sm"
                  : "bg-slate-50 text-slate-500 border-purple-100/10 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              <span className="text-[9px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Breadcrumb folder navigation */}
      {breadcrumbs.length > 1 && (
        <div className="flex items-center space-x-1.5 py-2 shrink-0 bg-slate-50/50 px-2 rounded-xl border border-purple-100/30 text-[9px]">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-2.5 h-2.5 text-slate-400" />}
              <button
                onClick={() => navigateToBreadcrumb(idx)}
                className={`font-semibold transition hover:text-purple-700 ${idx === breadcrumbs.length - 1 ? "text-purple-600 font-bold" : "text-slate-500"}`}
              >
                {bc.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 6. Folders and Media Grid Panel */}
      <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 pb-20 select-none">
        
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            <span className="text-[10px]">Loading Asset Library...</span>
          </div>
        ) : (
          <>
            {/* Folder Grid (only visible in hierarchical views) */}
            {folders.length > 0 && activeSection !== "favorites" && activeSection !== "recently_used" && (
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Directories</span>
                <div className="grid grid-cols-2 gap-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onDoubleClick={() => openFolder(folder)}
                      className="flex items-center justify-between bg-white border border-purple-100 hover:border-purple-400 hover:bg-purple-50/10 rounded-xl p-2.5 cursor-pointer transition shadow-sm group"
                    >
                      <div className="flex items-center space-x-2 truncate pr-2" onClick={() => openFolder(folder)}>
                        <Folder className="w-4 h-4 text-purple-500 fill-purple-100 shrink-0" />
                        <span className="font-bold text-slate-700 truncate text-[10px]">{folder.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <span className="text-[8px] text-slate-400 bg-slate-50 px-1 py-0.5 rounded font-mono">
                          {folder._count?.assets || 0}
                        </span>
                        
                        {/* Folder Delete Action */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Delete folder "${folder.name}"?`)) {
                              if (isAuth) await api.delete(`/assets/folders/${folder.id}`);
                              else {
                                const local: AssetFolder[] = JSON.parse(localStorage.getItem("local_folders") || "[]");
                                localStorage.setItem("local_folders", JSON.stringify(local.filter((f) => f.id !== folder.id)));
                              }
                              fetchData();
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5"
                          title="Delete Folder"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Assets Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Media Library ({assets.length})
                </span>
              </div>

              {assets.length === 0 && folders.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-dashed rounded-2xl p-4 flex flex-col items-center justify-center space-y-2">
                  <Image className="w-8 h-8 text-purple-300 opacity-60" />
                  <p className="text-[10px] font-bold">This folder is empty</p>
                  <p className="text-[8px] text-slate-400">Drag files here or use upload buttons to seed assets.</p>
                </div>
              ) : (
                <>
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-3 gap-2">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowDetailPanel(true);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleInsertToCanvas(asset);
                          }}
                          onContextMenu={(e) => handleContextMenuTrigger(e, asset)}
                          className={`group aspect-square relative border bg-white rounded-xl overflow-hidden cursor-pointer transition flex flex-col shadow-sm ${
                            selectedAsset?.id === asset.id ? "border-purple-600 ring-1 ring-purple-600" : "border-purple-100 hover:border-purple-400"
                          }`}
                        >
                          {/* Top bar controls */}
                          <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteAsset(asset);
                              }}
                              className="p-1 rounded bg-white/80 hover:bg-white text-slate-500 shadow-sm"
                            >
                              <Star className={`w-3 h-3 ${asset.favorite ? "fill-amber-500 text-amber-500" : ""}`} />
                            </button>
                          </div>

                          {/* Image preview / Icon placeholder */}
                          <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                            {asset.type === "IMAGE" && asset.thumbnailUrl ? (
                              <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                            ) : asset.type === "VIDEO" ? (
                              <Video className="w-6 h-6 text-purple-500" />
                            ) : asset.type === "AUDIO" ? (
                              <Volume2 className="w-6 h-6 text-indigo-500" />
                            ) : (
                              <FileText className="w-6 h-6 text-teal-500" />
                            )}
                            
                            {/* Format label overlay */}
                            <span className="absolute bottom-1 right-1 text-[7px] bg-slate-900/60 text-white px-1 py-0.2 rounded font-mono">
                              {asset.name.split(".").pop()?.toUpperCase() || asset.type}
                            </span>
                          </div>

                          {/* Asset Name footer */}
                          <div className="p-1 bg-white border-t border-purple-50/50 shrink-0 text-center truncate">
                            <span className="text-[8px] font-bold text-slate-700 truncate block w-full">{asset.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewMode === "list" && (
                    <div className="space-y-1.5">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowDetailPanel(true);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleInsertToCanvas(asset);
                          }}
                          onContextMenu={(e) => handleContextMenuTrigger(e, asset)}
                          className={`flex items-center justify-between p-2 rounded-xl border bg-white cursor-pointer transition group shadow-sm ${
                            selectedAsset?.id === asset.id ? "border-purple-600" : "border-purple-100 hover:border-purple-400"
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate max-w-[70%]">
                            <div className="w-8 h-8 rounded border border-purple-50 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                              {asset.type === "IMAGE" && asset.thumbnailUrl ? (
                                <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              ) : asset.type === "VIDEO" ? (
                                <Video className="w-4 h-4 text-purple-500" />
                              ) : asset.type === "AUDIO" ? (
                                <Volume2 className="w-4 h-4 text-indigo-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-teal-500" />
                              )}
                            </div>
                            <div className="truncate text-left">
                              <p className="font-bold text-slate-700 truncate text-[10px]">{asset.name}</p>
                              <p className="text-[8px] text-slate-400 font-mono">{formatBytes(asset.size)}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteAsset(asset);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-500"
                            >
                              <Star className={`w-3.5 h-3.5 ${asset.favorite ? "fill-amber-500 text-amber-500" : ""}`} />
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenuTrigger(e, asset);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 7. Right-Click Floating Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white border border-purple-100 rounded-2xl shadow-xl p-1.5 w-44 space-y-0.5 text-slate-700 select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { handleInsertToCanvas(contextMenu.asset); setContextMenu(null); }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 font-bold transition flex items-center space-x-2 text-[10px]"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600" />
            <span>Add to Canvas</span>
          </button>
          
          {contextMenu.asset.type === "IMAGE" && (
            <>
              <button
                onClick={() => { handleReplaceSelectedImage(contextMenu.asset); setContextMenu(null); }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 font-bold transition flex items-center space-x-2 text-[10px]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                <span>Replace Selected Image</span>
              </button>
              
              <button
                onClick={() => { handleSetAsBackground(contextMenu.asset); setContextMenu(null); }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 font-bold transition flex items-center space-x-2 text-[10px]"
              >
                <Image className="w-3.5 h-3.5 text-teal-600" />
                <span>Use as Background</span>
              </button>
            </>
          )}

          <div className="border-t border-purple-50 my-1"></div>

          <button
            onClick={() => { duplicateAsset(contextMenu.asset); setContextMenu(null); }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition flex items-center space-x-2 text-[10px]"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Duplicate</span>
          </button>
          
          <button
            onClick={() => { toggleFavoriteAsset(contextMenu.asset); setContextMenu(null); }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition flex items-center space-x-2 text-[10px]"
          >
            <Star className={`w-3.5 h-3.5 ${contextMenu.asset.favorite ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
            <span>{contextMenu.asset.favorite ? "Unstar" : "Favorite"}</span>
          </button>

          <button
            onClick={() => { setMovingAsset(contextMenu.asset); setContextMenu(null); }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition flex items-center space-x-2 text-[10px]"
          >
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            <span>Move to Folder</span>
          </button>

          <button
            onClick={() => {
              setRenamingAsset(contextMenu.asset);
              setRenameText(contextMenu.asset.name);
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition flex items-center space-x-2 text-[10px]"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Rename File</span>
          </button>

          <div className="border-t border-purple-50 my-1"></div>

          <button
            onClick={() => { deleteAsset(contextMenu.asset.id); setContextMenu(null); }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition flex items-center space-x-2 text-[10px] font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* 8. Asset Detail Side Drawer Overlay */}
      {showDetailPanel && selectedAsset && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-purple-100 shadow-2xl z-20 flex flex-col overflow-hidden text-slate-700 animate-in slide-in-from-right duration-200">
          
          {/* Detail Header */}
          <div className="p-3 border-b border-purple-100 flex items-center justify-between shrink-0">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Asset Properties</span>
            <button
              onClick={() => { setShowDetailPanel(false); setSelectedAsset(null); }}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
            {/* Visual Preview */}
            <div className="aspect-video bg-slate-50 border border-purple-100 rounded-xl overflow-hidden relative flex items-center justify-center">
              {selectedAsset.type === "IMAGE" ? (
                <img src={selectedAsset.url} alt="" className="max-h-full max-w-full object-contain" />
              ) : selectedAsset.type === "AUDIO" ? (
                <div className="flex flex-col items-center space-y-2 p-4">
                  <Volume2 className="w-10 h-10 text-indigo-500 animate-bounce" />
                  <audio src={selectedAsset.url} controls className="w-full h-8 max-w-[200px]" />
                </div>
              ) : selectedAsset.type === "VIDEO" ? (
                <video src={selectedAsset.url} controls className="max-h-full max-w-full object-contain" />
              ) : (
                <FileText className="w-12 h-12 text-teal-600" />
              )}
            </div>

            {/* Quick Canvas Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleInsertToCanvas(selectedAsset)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 rounded-xl transition shadow-sm text-[10px]"
              >
                Insert Canvas
              </button>
              {selectedAsset.type === "IMAGE" && (
                <button
                  onClick={() => handleSetAsBackground(selectedAsset)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 rounded-xl transition shadow-sm text-[10px]"
                >
                  Set Background
                </button>
              )}
            </div>

            {/* AI Power Tools drawer */}
            <div className="bg-purple-50/40 border border-purple-100 p-3 rounded-2xl space-y-2.5">
              <div className="flex items-center space-x-1.5 text-purple-800">
                <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                <span className="font-extrabold text-[10px] tracking-wider uppercase">AI Power Tools (Pro)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5">
                {selectedAsset.type === "IMAGE" && (
                  <>
                    <button
                      onClick={() => runAiFeature("remove-background")}
                      disabled={isAiProcessing}
                      className="bg-white hover:bg-purple-50/50 border border-purple-200 text-slate-700 text-[9px] font-bold p-1.5 rounded-xl transition flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                    >
                      {isAiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Maximize2 className="w-3 h-3" />}
                      <span>BG Remover</span>
                    </button>
                    <button
                      onClick={() => runAiFeature("enhance")}
                      disabled={isAiProcessing}
                      className="bg-white hover:bg-purple-50/50 border border-purple-200 text-slate-700 text-[9px] font-bold p-1.5 rounded-xl transition flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Enhance</span>
                    </button>
                    <button
                      onClick={() => runAiFeature("upscale")}
                      disabled={isAiProcessing}
                      className="bg-white hover:bg-purple-50/50 border border-purple-200 text-slate-700 text-[9px] font-bold p-1.5 rounded-xl transition flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3 text-emerald-500" />
                      <span>4K Upscale</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => runAiFeature("auto-tag")}
                  disabled={isAiProcessing}
                  className="bg-white hover:bg-purple-50/50 border border-purple-200 text-slate-700 text-[9px] font-bold p-1.5 rounded-xl transition flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50 col-span-1"
                >
                  <Tag className="w-3 h-3 text-indigo-500" />
                  <span>Auto Tag</span>
                </button>
              </div>
            </div>

            {/* Asset Metadata details */}
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">File Details</span>
              
              <div className="bg-slate-50 rounded-2xl p-3 space-y-2 border border-purple-100/30 font-mono text-[9px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="font-bold text-slate-800 text-right truncate max-w-[70%]">{selectedAsset.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="font-bold text-slate-800">{selectedAsset.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Size</span>
                  <span className="font-bold text-slate-800">{formatBytes(selectedAsset.size)}</span>
                </div>
                {selectedAsset.width && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resolution</span>
                    <span className="font-bold text-slate-800">{selectedAsset.width} × {selectedAsset.height} px</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Uploaded</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedAsset.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Tagging management */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Asset Tags</span>
              
              {/* Tags display list */}
              <div className="flex flex-wrap gap-1">
                {selectedAsset.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-purple-50 text-purple-700 font-bold text-[8.5px] pl-2 pr-1 py-0.5 rounded-full border border-purple-100 flex items-center space-x-1"
                  >
                    <span>{tag.name}</span>
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="text-purple-400 hover:text-purple-700 font-extrabold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add tags input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem("tagInput") as HTMLInputElement;
                  handleAddTag(input.value);
                  input.value = "";
                }}
                className="flex items-center space-x-1 mt-1.5"
              >
                <input
                  type="text"
                  name="tagInput"
                  placeholder="Add custom tag..."
                  className="bg-slate-50 border border-purple-100 rounded-lg px-2 py-1 flex-1 text-[9px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="bg-slate-100 border border-purple-100 p-1 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </form>
            </div>

            {/* File actions */}
            <div className="space-y-2 pt-2 border-t border-purple-100/40">
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = selectedAsset.url;
                  link.download = selectedAsset.name;
                  link.click();
                }}
                className="w-full text-left bg-slate-50 hover:bg-purple-50/30 border border-purple-100/50 p-2.5 rounded-xl transition flex items-center space-x-2 font-bold text-slate-700"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span>Download Local File</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedAsset.url);
                  alert("Asset link copied to clipboard!");
                }}
                className="w-full text-left bg-slate-50 hover:bg-purple-50/30 border border-purple-100/50 p-2.5 rounded-xl transition flex items-center space-x-2 font-bold text-slate-700"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy File URL Link</span>
              </button>

              <button
                onClick={() => deleteAsset(selectedAsset.id)}
                className="w-full text-left bg-rose-50 hover:bg-rose-100/40 border border-rose-100/50 p-2.5 rounded-xl transition flex items-center space-x-2 font-bold text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 9. Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-80 shadow-2xl border border-purple-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                <Folder className="w-4 h-4 text-purple-600" />
                <span>Create Directory Folder</span>
              </h4>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Folder Name (e.g. Mockups, Logos)..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-slate-50 border border-purple-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none mb-4"
            />

            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-3.5 py-1.5 border border-purple-100 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. File Rename Modal */}
      {renamingAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-80 shadow-2xl border border-purple-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Rename Asset File</span>
              </h4>
              <button onClick={() => setRenamingAsset(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <input
              type="text"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              className="w-full bg-slate-50 border border-purple-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none mb-4"
            />

            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => setRenamingAsset(null)}
                className="px-3.5 py-1.5 border border-purple-100 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={renameAsset}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-sm"
              >
                Save Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Move Asset Modal Selector */}
      {movingAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-80 shadow-2xl border border-purple-100 max-h-[400px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-700">
            
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-purple-600" />
                <span>Move to Directory...</span>
              </h4>
              <button onClick={() => setMovingAsset(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-slate-400 mb-2 font-semibold truncate shrink-0">
              Target Asset: <span className="text-slate-600">{movingAsset.name}</span>
            </p>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 py-1 border border-purple-50 bg-slate-50/30 rounded-2xl p-2.5">
              <button
                onClick={() => moveAsset(movingAsset, null)}
                className={`w-full text-left p-2 rounded-xl transition flex items-center space-x-2 font-bold ${
                  movingAsset.folderId === null
                    ? "bg-purple-100 text-purple-700"
                    : "hover:bg-purple-50 text-slate-700"
                }`}
              >
                <Folder className="w-4 h-4 text-purple-600 fill-purple-100 shrink-0" />
                <span>[Root Directory]</span>
              </button>
              
              {/* Load folders dynamically */}
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => moveAsset(movingAsset, f.id)}
                  className={`w-full text-left p-2 rounded-xl transition flex items-center space-x-2 font-bold ${
                    movingAsset.folderId === f.id
                      ? "bg-purple-100 text-purple-700"
                      : "hover:bg-purple-50 text-slate-700"
                  }`}
                >
                  <Folder className="w-4 h-4 text-purple-500 fill-purple-50 shrink-0" />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            <div className="flex space-x-2 justify-end mt-4 shrink-0">
              <button
                onClick={() => setMovingAsset(null)}
                className="px-4 py-1.5 border border-purple-100 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition text-[10px]"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
