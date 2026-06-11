"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Search,
  Grid,
  List,
  Clock,
  Layers,
  TrendingUp,
  AlertCircle,
  Trash2,
  ExternalLink,
  Copy,
  Share2,
  CheckCircle2,
  Activity,
  FileText,
  ChevronRight,
  Image as ImageIcon,
  Video,
  Smartphone,
  Target,
  Award,
  ShieldCheck,
  Terminal,
  Bookmark,
  Filter,
  ArrowUpDown,
  BookOpen,
  Check,
  Zap,
  Sliders,
  BarChart3,
  Layers3,
  Briefcase,
  Upload,
  RefreshCw,
  FolderKanban,
  FileSpreadsheet,
} from "lucide-react";
import { loadSavedDesigns, persistDesigns, SavedDesign } from "../design/studio/panels/SavedDesignsPanel";

export const CreativeCommandCenter: React.FC = () => {
  const router = useRouter();

  // --- Core State ---
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [activeView, setActiveView] = useState<"grid" | "list" | "masonry" | "timeline">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterFavoriteOnly, setFilterFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Custom Interaction States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [duplicatedFlash, setDuplicatedFlash] = useState<string | null>(null);
  const [publishingDesign, setPublishingDesign] = useState<SavedDesign | null>(null);
  const [publishStep, setPublishStep] = useState(1);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // --- Seed Initial Data on Mount ---
  useEffect(() => {
    const loaded = loadSavedDesigns();
    setDesigns(loaded);
    
    // Load favorites from local storage
    try {
      const favs = localStorage.getItem("cmd_center_favorites");
      if (favs) setFavorites(JSON.parse(favs));
    } catch {}

    // Initialize mock database entries if localStorage is completely empty
    if (loaded.length === 0) {
      const mockDesigns: SavedDesign[] = [
        {
          id: "design_mock_1",
          name: "Global Summer Campaign Ad",
          canvasJson: JSON.stringify({ objects: [] }),
          thumbnailDataUrl: "https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=600&auto=format&fit=crop",
          width: 1920,
          height: 1080,
          savedAt: Date.now() - 3600000 * 2, // 2h ago
          uploadedToHodings: true,
          uploadedAt: Date.now() - 3600000,
        },
        {
          id: "design_mock_2",
          name: "Automotive Brand Launch Billboard",
          canvasJson: JSON.stringify({ objects: [] }),
          thumbnailDataUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop",
          width: 1400,
          height: 700,
          savedAt: Date.now() - 86400000, // Yesterday
          uploadedToHodings: false,
        },
        {
          id: "design_mock_3",
          name: "Organic Coffee Retail Banner",
          canvasJson: JSON.stringify({ objects: [] }),
          thumbnailDataUrl: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?q=80&w=600&auto=format&fit=crop",
          width: 1080,
          height: 1080,
          savedAt: Date.now() - 86400000 * 3, // 3d ago
          uploadedToHodings: true,
          uploadedAt: Date.now() - 86400000 * 2,
        }
      ];
      setDesigns(mockDesigns);
      persistDesigns(mockDesigns);
    }
  }, []);

  // --- Ctrl + K Command Palette Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- Actions & Helpers ---
  const handleOpen = (id: string) => {
    window.open(`/design-studio?designId=${id}`, "_blank");
  };

  const handleDuplicate = (design: SavedDesign) => {
    const now = Date.now();
    const duplicate: SavedDesign = {
      ...design,
      id: `design_${now}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${design.name} (Copy)`,
      savedAt: now,
      uploadedToHodings: false,
      uploadedAt: undefined,
    };

    const updated = [duplicate, ...designs];
    setDesigns(updated);
    persistDesigns(updated);
    
    setDuplicatedFlash(duplicate.name);
    setTimeout(() => setDuplicatedFlash(null), 3000);
    triggerNotification(`Duplicated "${design.name}" successfully!`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this design?")) {
      const updated = designs.filter((d) => d.id !== id);
      setDesigns(updated);
      persistDesigns(updated);
      triggerNotification("Design deleted.");
    }
  };

  const handleShare = (id: string) => {
    const shareLink = `${window.location.origin}/design-studio?designId=${id}`;
    navigator.clipboard.writeText(shareLink);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    triggerNotification("Copied layout share link to clipboard!");
  };

  const toggleFavorite = (id: string) => {
    const isFav = favorites.includes(id);
    let updated;
    if (isFav) {
      updated = favorites.filter((f) => f !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("cmd_center_favorites", JSON.stringify(updated));
    triggerNotification(isFav ? "Removed from favorites." : "Added to favorites!");
  };

  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 4000);
  };

  // --- Filtering & Sorting Logic ---
  const filteredDesigns = useMemo(() => {
    return designs
      .filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFav = !filterFavoriteOnly || favorites.includes(d.id);
        const matchesCat = filterCategory === "all" || (d.uploadedToHodings && filterCategory === "published") || (!d.uploadedToHodings && filterCategory === "drafts");
        return matchesSearch && matchesFav && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return b.savedAt - a.savedAt;
        if (sortBy === "oldest") return a.savedAt - b.savedAt;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [designs, searchQuery, filterFavoriteOnly, filterCategory, sortBy, favorites]);

  // --- Computed Stats ---
  const stats = useMemo(() => {
    const total = designs.length;
    const published = designs.filter((d) => d.uploadedToHodings).length;
    const drafts = total - published;
    return {
      total,
      published,
      drafts,
      activeCampaigns: published > 0 ? Math.ceil(published * 1.5) : 1,
      storageUsed: (total * 0.45).toFixed(1), // mock storage calculation MB
    };
  }, [designs]);

  // --- Command Palette Filtered Commands ---
  const commands = [
    { name: "Create New Design Layout", shortcut: "N", action: () => window.open("/design-studio", "_blank") },
    { name: "Generate with AI Designer", shortcut: "G", action: () => window.open("/design-studio?tab=aitools", "_blank") },
    { name: "Browse Template Marketplace", shortcut: "T", action: () => { setActiveView("grid"); setFilterCategory("all"); } },
    { name: "View Active Billboard Inventory", shortcut: "I", action: () => router.push("/billboards") },
    { name: "Show Favorites only", shortcut: "F", action: () => setFilterFavoriteOnly(true) },
    { name: "Toggle Grid View layout", shortcut: "V", action: () => setActiveView("grid") },
    { name: "Toggle List View layout", shortcut: "L", action: () => setActiveView("list") },
  ];

  const filteredCommands = commands.filter((c) =>
    c.name.toLowerCase().includes(cmdSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-8 space-y-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden transition-all duration-300">
      
      {/* Decorative Luxury Background Glows */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-700/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-700/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Global Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-[120] flex items-center space-x-3 bg-slate-900/90 border border-purple-500/30 text-white px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in">
          <Zap className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
          <p className="text-xs font-semibold">{showNotification}</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO GREETING & GENERAL STATS */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-800 pb-8 relative z-10">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/25 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300">Intelligent Studio OS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-450 bg-clip-text text-transparent">
            Welcome Back, Designer
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage campaigns, creative assets, drafts, templates, and billboard deployments from one premium command workspace.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full lg:w-auto">
          <button
            onClick={() => window.open("/design-studio", "_blank")}
            className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-550 hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Design</span>
          </button>
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-350 text-xs font-semibold transition"
          >
            <Terminal className="w-4 h-4" />
            <span>Command Palette</span>
            <kbd className="bg-slate-800 text-[10px] px-2 py-0.5 rounded border border-slate-700 font-mono text-slate-400">Ctrl+K</kbd>
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
        {[
          { label: "Total Designs", value: stats.total, sub: "Saved Snapshot Files", icon: Sliders, color: "text-purple-400" },
          { label: "Active Campaigns", value: stats.activeCampaigns, sub: "Running Analytics", icon: TrendingUp, color: "text-emerald-400" },
          { label: "Published Billboards", value: stats.published, sub: "Live Deployments", icon: Award, color: "text-indigo-400" },
          { label: "Draft Layouts", value: stats.drafts, sub: "Recoverable Drafts", icon: Clock, color: "text-amber-400" },
          { label: "Storage Capacity", value: `${stats.storageUsed} MB`, sub: "100 MB Limit", icon: Layers, color: "text-cyan-400", progress: (parseFloat(stats.storageUsed) / 100) * 100 },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-750 hover:shadow-xl transition group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="text-xl md:text-2xl font-black mt-2 text-slate-100 group-hover:scale-105 transition-transform origin-left">
              {item.value}
            </div>
            <p className="text-[9px] text-slate-400 mt-1">{item.sub}</p>

            {item.progress !== undefined && (
              <div className="w-full bg-slate-850 h-1 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT - SIDEBAR GRID LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        
        {/* Left Side: Main Command Sections (Vault, Templates, Campaigns) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* A. RECENTLY OPENED PROJECTS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Recently Edited / Opened</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {designs.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  className="bg-slate-900/35 border border-slate-800 rounded-2xl p-3 flex items-center space-x-3.5 hover:border-slate-700 hover:shadow-lg transition group cursor-pointer"
                  onClick={() => handleOpen(d.id)}
                >
                  <div className="w-16 h-12 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shrink-0 relative">
                    <img src={d.thumbnailDataUrl} alt={d.name} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-200 truncate group-hover:text-purple-400 transition-colors">
                      {d.name}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Open in Studio →
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. THE DESIGN VAULT GALLERY */}
          <div className="space-y-6">
            
            {/* Vault Filter Header */}
            <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2.5xl flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center space-x-3 shrink-0">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <h2 className="text-base font-bold text-slate-100">Design Vault Gallery</h2>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Search */}
                <div className="relative max-w-xs">
                  <input
                    type="text"
                    placeholder="Search designs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 pl-8 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                </div>

                {/* Category filters */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  {[
                    { id: "all", label: "All Assets" },
                    { id: "published", label: "Published" },
                    { id: "drafts", label: "Drafts" }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setFilterCategory(btn.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition ${
                        filterCategory === btn.id
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* View Selector */}
                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setActiveView("grid")}
                    className={`p-1.5 rounded-lg transition ${
                      activeView === "grid" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-350"
                    }`}
                    title="Grid layout"
                  >
                    <Grid className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => setActiveView("list")}
                    className={`p-1.5 rounded-lg transition ${
                      activeView === "list" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-350"
                    }`}
                    title="List layout"
                  >
                    <List className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Favorite filter toggle */}
                <button
                  onClick={() => setFilterFavoriteOnly(!filterFavoriteOnly)}
                  className={`p-2 border rounded-xl transition ${
                    filterFavoriteOnly 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                      : "bg-slate-955 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                  title="Favorites"
                >
                  <Zap className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Empty State check */}
            {filteredDesigns.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-purple-500/20 animate-pulse">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white">Your Creative Empire Starts Here</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Build, manage, and publish world-class billboard campaigns from one intelligent command workspace.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => window.open("/design-studio", "_blank")}
                    className="px-4.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-650 rounded-xl font-bold text-xs hover:opacity-95 transition"
                  >
                    Create Design
                  </button>
                  <button
                    onClick={() => window.open("/design-studio?tab=aitools", "_blank")}
                    className="px-4.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-855 rounded-xl font-bold text-xs text-purple-400 transition"
                  >
                    Generate with AI
                  </button>
                </div>
              </div>
            ) : (
              /* Gallery view render */
              <div className={
                activeView === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in" 
                  : "flex flex-col gap-4 animate-fade-in"
              }>
                {filteredDesigns.map((design) => {
                  const isFav = favorites.includes(design.id);
                  return (
                    <div
                      key={design.id}
                      className={`bg-slate-900/40 border rounded-2.5xl overflow-hidden group shadow-md transition-all duration-300 relative ${
                        activeView === "grid" 
                          ? "hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-700 flex flex-col justify-between"
                          : "flex items-center justify-between p-4 gap-4 hover:border-slate-700"
                      } ${design.uploadedToHodings ? "border-indigo-500/20" : "border-slate-800"}`}
                    >
                      {/* Grid View specific image top block */}
                      {activeView === "grid" && (
                        <div
                          className="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer border-b border-slate-850"
                          onClick={() => handleOpen(design.id)}
                        >
                          <img
                            src={design.thumbnailDataUrl}
                            alt={design.name}
                            className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-102"
                          />
                          {/* Published state overlay flag */}
                          {design.uploadedToHodings && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500/80 to-teal-500/80 text-white text-[8px] font-black tracking-widest px-2.5 py-1 rounded-full shadow-lg uppercase">
                              Published
                            </div>
                          )}
                          
                          {/* Favorite float button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(design.id); }}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/60 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-amber-400 hover:scale-110 transition"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isFav ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>

                          {/* Hover Mask layout */}
                          <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3.5 z-10">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpen(design.id); }}
                              className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:scale-105 active:scale-95 transition"
                            >
                              Open Studio
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDuplicate(design); }}
                              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                              title="Duplicate Design"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Info & Metadata row */}
                      <div className={activeView === "grid" ? "p-5 space-y-4" : "flex-1 min-w-0"}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-200 group-hover:text-purple-400 transition-colors truncate">
                              {design.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">
                              Modified: {new Date(design.savedAt).toLocaleString()}
                            </p>
                          </div>
                          {activeView === "list" && design.uploadedToHodings && (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded uppercase">
                              Published
                            </span>
                          )}
                        </div>

                        {activeView === "grid" ? (
                          <div className="flex items-center justify-between border-t border-slate-850 pt-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
                                {design.width}x{design.height}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleShare(design.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                                title="Share"
                              >
                                {copiedId === design.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDelete(design.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // List view metadata layout
                          <div className="flex items-center space-x-4 mt-1 text-[10px] text-slate-400">
                            <span>Resolution: <strong>{design.width}x{design.height}</strong></span>
                            <span>•</span>
                            <span>File ID: <strong className="font-mono">{design.id.slice(0, 12)}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* List View specific quick action bar right side */}
                      {activeView === "list" && (
                        <div className="flex items-center space-x-2.5 shrink-0">
                          <button
                            onClick={() => handleOpen(design.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-purple-650 hover:bg-purple-600 text-white font-bold text-xs transition"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => handleDuplicate(design)}
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleShare(design.id)}
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(design.id)}
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* C. TEMPLATE MARKETPLACE CAROUSEL */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-purple-400" />
                <span>Featured Templates Marketplace</span>
              </h3>
              <span className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer" onClick={() => window.open("/design-studio?tab=templates", "_blank")}>Browse All Templates →</span>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800">
              {[
                { name: "Neon Urban Billboard", category: "Retail", img: "https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=400" },
                { name: "Coffee Shop POS Banner", category: "Restaurants", img: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?q=80&w=400" },
                { name: "Corporate Launch Flyer", category: "Corporate", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=400" },
                { name: "Luxury Estate Display", category: "Real Estate", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="w-56 shrink-0 bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden hover:border-slate-700 transition cursor-pointer"
                  onClick={() => window.open("/design-studio?tab=templates", "_blank")}
                >
                  <div className="h-28 bg-slate-950 overflow-hidden relative">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-purple-600/90 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                    <p className="text-[9px] text-slate-500 mt-1">Quick Apply Layout →</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. LIVE CAMPAIGN CENTER & ANALYTICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-2.5xl p-5 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Live Campaign Center</span>
              </h3>
              
              <div className="space-y-3">
                {[
                  { name: "Times Square Digital Mega-Screen", status: "Active", count: "3 Billboards", value: "94% CTR" },
                  { name: "Sunset Blvd Highway Panel", status: "Scheduled", count: "1 Billboard", value: "Pending" },
                  { name: "Hollywood Archway Billboard", status: "In Review", count: "2 Billboards", value: "Reviewing" },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-850">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{item.name}</p>
                      <p className="text-[9px] text-slate-550 mt-0.5">{item.count}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      item.status === "Active" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                      item.status === "Scheduled" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/20 border border-slate-800/80 rounded-2.5xl p-5 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Design Performance Analytics</span>
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Impressions</p>
                  <p className="text-base font-black text-slate-200 mt-1">1.2M</p>
                  <span className="text-[8px] text-green-500 font-bold">+12.4%</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Total Views</p>
                  <p className="text-base font-black text-slate-200 mt-1">840K</p>
                  <span className="text-[8px] text-green-500 font-bold">+8.9%</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Total Reach</p>
                  <p className="text-base font-black text-slate-200 mt-1">620K</p>
                  <span className="text-[8px] text-indigo-400 font-bold">Targeted</span>
                </div>
              </div>

              {/* Sparkline Visual Simulation */}
              <div className="h-16 flex items-end justify-between px-2 pt-2 gap-1.5 border-t border-slate-850">
                {[45, 60, 50, 75, 90, 85, 110, 95, 120].map((val, idx) => (
                  <div
                    key={idx}
                    className="bg-indigo-500/80 rounded-t w-full transition-all duration-550"
                    style={{ height: `${val / 1.3}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* Right Side: Wow Factor Widgets & Creative Side Panel */}
        {/* ========================================================================= */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* A. FLOATING AI ASSISTANT WIDGET */}
          <div className="bg-gradient-to-tr from-purple-900/20 via-indigo-900/15 to-slate-900 border border-purple-500/30 rounded-3xl p-5 shadow-xl shadow-purple-650/5 space-y-5 relative">
            <div className="absolute top-4 right-4 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
            
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-100">AI Design Assistant</h3>
                <p className="text-[8.5px] text-purple-300 font-bold uppercase tracking-wider">Ready for Feedback</p>
              </div>
            </div>

            {/* Smart Score Indicators */}
            <div className="grid grid-cols-2 gap-4.5 pt-1 border-t border-slate-850">
              <div className="flex flex-col items-center p-3 bg-slate-950/60 rounded-2xl border border-slate-850">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent flex items-center justify-center font-black text-xs text-emerald-400">
                  94%
                </div>
                <span className="text-[9px] text-slate-450 uppercase font-extrabold tracking-wider mt-2">Design Health</span>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-slate-950/60 rounded-2xl border border-slate-850">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent flex items-center justify-center font-black text-xs text-indigo-400">
                  97%
                </div>
                <span className="text-[9px] text-slate-450 uppercase font-extrabold tracking-wider mt-2">Publish Score</span>
              </div>
            </div>

            {/* Specific AI Insights List */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Smart Recommendations</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-start space-x-2 p-2.5 bg-slate-950/40 rounded-xl border border-slate-850">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-slate-300">
                    Your Summer Campaign layout has <strong className="text-white">low contrast</strong> in the CTA button.
                  </p>
                </div>
                
                <div className="flex items-start space-x-2 p-2.5 bg-slate-950/40 rounded-xl border border-slate-850">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-slate-300">
                    Optimal output detected. Recommended billboard export size is <strong className="text-white">1920x1080</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestions Checklist */}
            <div className="space-y-2.5 pt-2">
              <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">AI Optimization List</p>
              <ul className="space-y-1.5 text-[10.5px] text-slate-350">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>Improve readability of subtitle text</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>Increase CTA button font size by 20%</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>Adjust grid element margins</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => window.open("/design-studio?tab=aitools", "_blank")}
              className="w-full py-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/35 rounded-xl text-purple-300 font-bold text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
            >
              Consult AI Studio Tools
            </button>
          </div>

          {/* B. BRAND KIT SUMMARY SUMMARY */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Brand Kit Summary</span>
              </h3>
              <span className="text-[9px] text-slate-500 hover:text-slate-300 font-bold hover:underline cursor-pointer" onClick={() => router.push("/dashboard?tab=brands")}>Manage →</span>
            </div>

            <div className="space-y-3 bg-slate-950/40 rounded-2xl p-4 border border-slate-850">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center font-extrabold text-purple-400 text-xs">
                  B
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Default Brand Profile</p>
                  <p className="text-[9px] text-slate-500">Corporate Kit v1</p>
                </div>
              </div>

              {/* Swatch list */}
              <div className="flex space-x-2.5 pt-1.5">
                {["#7C3AED", "#4F46E5", "#EC4899", "#1E293B"].map((col, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-1">
                    <div className="w-7 h-7 rounded-full border border-slate-800 shadow" style={{ backgroundColor: col }} />
                    <span className="text-[8px] font-mono text-slate-500">{col}</span>
                  </div>
                ))}
              </div>

              {/* Fonts info */}
              <div className="flex justify-between text-[10px] text-slate-455 border-t border-slate-850/80 pt-2.5 mt-1 font-mono">
                <span>Headings: <strong>Outfit</strong></span>
                <span>Body: <strong>Inter</strong></span>
              </div>
            </div>

            <button
              onClick={() => window.open("/design-studio?tab=brandkit", "_blank")}
              className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-855 rounded-xl text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              Quick Apply to Canvas
            </button>
          </div>

          {/* C. CLIENT WORKSPACE & APPROVALS */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Client Workspace Reviews</span>
            </h3>

            <div className="space-y-3">
              {[
                { client: "Acme Corporates", project: "Summer Campaign", status: "Pending Review" },
                { client: "Apex Vehicles", project: "Highway Archway", status: "Approved" },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-250">{item.client}</p>
                    <p className="text-[9px] text-slate-500">{item.project}</p>
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    item.status === "Approved" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* D. ACTIVITY LOG / CREATIVE TIMELINE */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Creative Activity Log</span>
            </h3>
            
            <div className="relative border-l border-slate-800 pl-4.5 space-y-5 ml-1 text-xs">
              {[
                { time: "09:42 AM", text: "Published Summer Campaign to marketplace listings" },
                { time: "Yesterday", text: "Created New Billboard Layout draft document" },
                { time: "2 Days Ago", text: "Imported 4 PNG brand kit asset files" },
              ].map((act, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border border-purple-500/60" />
                  <p className="text-[10px] text-slate-500 font-bold font-mono">{act.time}</p>
                  <p className="text-slate-350 leading-relaxed mt-0.5 text-[11px]">{act.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* E. DRAFT RECOVERY CENTER */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Draft Recovery Center</span>
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Unsaved snapshots or auto-saves are stored locally for recovery.
            </p>
            <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-200 truncate">Autosave_coffee_ad</p>
                <p className="text-[9px] text-slate-500 font-mono">1h 12m ago</p>
              </div>
              <button
                onClick={() => window.open("/design-studio", "_blank")}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-550/20 text-amber-400 text-[10px] font-bold rounded-lg transition"
              >
                Restore
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. Global Interactive Command Palette Dialog (`Ctrl+K`) */}
      {/* ========================================================================= */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
            
            {/* Search row */}
            <div className="flex items-center px-4.5 py-3.5 border-b border-slate-850 gap-3">
              <Search className="w-4.5 h-4.5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Search command actions..."
                value={cmdSearch}
                onChange={(e) => setCmdSearch(e.target.value)}
                className="w-full bg-transparent border-none text-slate-100 text-xs focus:outline-none focus:ring-0 placeholder-slate-500"
                autoFocus
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-slate-200"
              >
                esc
              </button>
            </div>

            {/* Actions list */}
            <div className="p-2.5 max-h-72 overflow-y-auto space-y-1">
              {filteredCommands.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No action commands found.</p>
              ) : (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      cmd.action();
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex justify-between items-center text-xs text-slate-300 px-4 py-3 rounded-2xl hover:bg-purple-600 hover:text-white transition text-left"
                  >
                    <span className="font-semibold">{cmd.name}</span>
                    <span className="bg-slate-850 px-2 py-0.5 rounded text-[10px] font-mono group-hover:bg-purple-700">
                      {cmd.shortcut}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Foot note */}
            <div className="px-4.5 py-2.5 bg-slate-950/50 border-t border-slate-855 text-[10px] text-slate-500 text-center">
              Creative Operating System Palette. Press shortcut or click to action.
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
