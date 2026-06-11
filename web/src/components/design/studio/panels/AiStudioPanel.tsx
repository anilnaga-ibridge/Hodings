import React, { useState, useEffect } from "react";
import {
  Sparkles, Type, Image, Layout, HelpCircle, FileText, Send, Clock, Play, Plus,
  Check, Copy, ArrowRight, RotateCw, Trash2, Heart, Award, AlertTriangle, ShieldCheck,
  Maximize2, Eye, LayoutGrid, CheckSquare, Palette, RefreshCw, Volume2, Loader2
} from "lucide-react";
import { fabric } from "fabric";
import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

interface AiStudioPanelProps {
  canvas: fabric.Canvas | null;
}

interface PromptHistoryItem {
  id: string;
  action: string;
  prompt: string;
  timestamp: string;
  favorite: boolean;
}

export const AiStudioPanel: React.FC<AiStudioPanelProps> = ({ canvas }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>("copywriter");

  // Prompts & Generation parameters
  const [promptInput, setPromptInput] = useState<string>("");
  const [tone, setTone] = useState<string>("modern");
  const [type, setType] = useState<string>("headline");
  const [audience, setAudience] = useState<string>("general");
  const [length, setLength] = useState<string>("short");
  const [language, setLanguage] = useState<string>("English");

  // Output States
  const [copyResults, setCopyResults] = useState<string[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Design Review Diagnostics
  const [reviewResults, setReviewResults] = useState<{
    overallScore: number;
    categories: { alignment: number; contrast: number; spacing: number };
    issues: string[];
    suggestions: string[];
  } | null>(null);

  // Brand recommendation outputs
  const [brandKitId, setBrandKitId] = useState<string>("");
  const [brandReview, setBrandReview] = useState<{
    recommendations: string;
    fonts: string[];
    colors: string[];
    layouts: string[];
  } | null>(null);

  // Social Creator inputs & concepts
  const [productName, setProductName] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [offerDetails, setOfferDetails] = useState<string>("");
  const [socialConcepts, setSocialConcepts] = useState<{
    title: string;
    theme: string;
    background: string;
    headline: string;
    elements: string[];
  }[]>([]);

  // Prompt History
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Load Prompt History
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; url: string; timestamp: string }>>([]);
  const [templatePrompt, setTemplatePrompt] = useState<string>("");
  
  // Helper to load gallery from localStorage
  const loadGallery = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ai_image_gallery");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setGalleryImages(parsed);
        } catch (e) {
          console.warn("Failed to parse gallery JSON", e);
        }
      }
    }
  };
  
  // Helper to save a new image URL to gallery
  const saveImageToGallery = (url: string) => {
    if (!url) return;
    const newEntry = {
      id: `img_${Date.now()}`,
      url,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    // Use functional update to ensure latest state
    setGalleryImages((prev) => {
      const updated = [newEntry, ...prev].slice(0, 30);
      if (typeof window !== "undefined") {
        localStorage.setItem("ai_image_gallery", JSON.stringify(updated));
      }
      return updated;
    });
    alert("Image saved to your personal gallery.");
  };
  
  // Load gallery once on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ai_prompt_history");
      if (stored) {
        try { setHistory(JSON.parse(stored)); } catch {}
      }
    }
    loadGallery();
  }, []);

  const savePromptToHistory = (action: string, promptText: string) => {
    if (!promptText.trim()) return;
    const newItem: PromptHistoryItem = {
      id: `hist_${Date.now()}`,
      action,
      prompt: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      favorite: false
    };
    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("ai_prompt_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("ai_prompt_history");
  };

  // 1. AI COPYWRITER SUBMISSION
  const handleCopywriterSubmit = async () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);
    setCopyResults([]);
    try {
      savePromptToHistory("Copywriter", promptInput);
      const res = await api.post("/ai", {
        action: "copywriter",
        prompt: promptInput,
        type,
        tone,
        audience,
        length,
        language
      });
      setCopyResults(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. AI IMAGE STUDIO SUBMISSION (Text-to-Image)
  const handleImageSubmit = async () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);
    setGeneratedImageUrl("");
    try {
      savePromptToHistory("Text-To-Image", promptInput);
      const res = await api.post("/ai", {
        action: "text-to-image",
        prompt: promptInput,
      });
      setGeneratedImageUrl(res.data.url || "");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. AI DESIGN REVIEW DIAGNOSTICS
  const handleDesignReview = async () => {
    if (!canvas) return;
    setIsGenerating(true);
    setReviewResults(null);
    try {
      const canvasJson = canvas.toJSON();
      const res = await api.post("/ai", {
        action: "design-review",
        canvasJson,
      });
      setReviewResults(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto layout repair actions based on review suggestions
  const handleRepairAction = (suggestion: string) => {
    if (!canvas) return;
    
    if (suggestion.includes("background")) {
      // Set solid canvas background
      canvas.setBackgroundImage(null as any, canvas.renderAll.bind(canvas));
      canvas.setBackgroundColor("#F8FAFC", () => {
        canvas.renderAll();
        alert("Design review recommendation applied: Set a bright solid background fill.");
        handleDesignReview(); // re-evaluate
      });
    } else if (suggestion.includes("align") || suggestion.includes("center")) {
      // Auto center all elements horizontally
      const objects = canvas.getObjects();
      objects.forEach((obj) => {
        canvas.centerObjectH(obj);
      });
      canvas.renderAll();
      alert("Design review recommendation applied: Centered active typography nodes.");
      handleDesignReview(); // re-evaluate
    } else if (suggestion.includes("text") || suggestion.includes("header")) {
      // Add heading preset
      const text = new fabric.IText("RECOMENDED COPYWRITING", {
        left: 150,
        top: 250,
        fontSize: 32,
        fontFamily: "Outfit",
        fontWeight: "bold",
        fill: "#1E293B"
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      handleDesignReview(); // re-evaluate
    }
  };

  // 4. AI BRAND ASSISTANT SUGGESTIONS
  const handleBrandAssistant = async () => {
    setIsGenerating(true);
    setBrandReview(null);
    try {
      // Retrieve locally active brand kit or fallback seed
      let localKit = {};
      if (typeof window !== "undefined") {
        const activeKit = localStorage.getItem("active_brand_kit_state");
        if (activeKit) localKit = JSON.parse(activeKit);
      }

      const res = await api.post("/ai", {
        action: "brand-assistant",
        brandKit: localKit,
      });
      setBrandReview(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply suggested color palette from brand suggestions
  const handleApplyBrandPalette = (colors: string[]) => {
    if (!canvas || colors.length === 0) return;
    
    // Apply primary to canvas background
    canvas.setBackgroundColor(colors[0], () => {
      // Apply secondary/accent to existing shapes
      const objects = canvas.getObjects();
      objects.forEach((obj) => {
        if (obj.type === "rect" || obj.type === "circle" || obj.type === "triangle") {
          obj.set("fill", colors[1] || colors[0]);
        } else if (obj.type?.includes("text")) {
          obj.set("fill", colors[2] || "#FFFFFF");
        }
      });
      canvas.renderAll();
      alert("Design system palette colors applied to canvas elements!");
    });
  };

  // 5. AI SOCIAL MEDIA CONCEPT CREATOR
  const handleSocialCreatorSubmit = async () => {
    if (!productName.trim()) return;
    setIsGenerating(true);
    setSocialConcepts([]);
    try {
      savePromptToHistory("Social Concept", productName);
      const res = await api.post("/ai", {
        action: "social-creator",
        prompt: productName,
        audience: targetAudience,
        type: offerDetails, // use type for offer
      });
      setSocialConcepts(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto layout rendering macro for social concepts
  const handleApplyConceptLayout = (concept: any) => {
    if (!canvas) return;

    // Clear existing canvas objects
    canvas.clear();

    // 1. Render Background Fill
    let bgFill = "#FFFFFF";
    if (concept.background.toLowerCase().includes("indigo") || concept.background.toLowerCase().includes("blue")) {
      bgFill = "#1e1b4b";
    } else if (concept.background.toLowerCase().includes("rose") || concept.background.toLowerCase().includes("sand")) {
      bgFill = "#faf5ff";
    } else if (concept.background.toLowerCase().includes("charcoal") || concept.background.toLowerCase().includes("dark")) {
      bgFill = "#0f172a";
    }
    canvas.setBackgroundColor(bgFill, () => {
      // 2. Render Headline Copy
      const headline = new fabric.IText(concept.headline.toUpperCase(), {
        left: 80,
        top: 250,
        fontSize: 72,
        fontWeight: "black",
        fontFamily: "Outfit",
        fill: bgFill === "#FFFFFF" || bgFill === "#faf5ff" ? "#1E293B" : "#FFFFFF",
      });
      canvas.add(headline);

      // 3. Render Product Sub-Text details
      const sub = new fabric.IText(`[AI THEME: ${concept.theme.toUpperCase()}]`, {
        left: 80,
        top: 180,
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "Inter",
        fill: "#a855f7",
      });
      canvas.add(sub);

      // 4. Render Decorative Shapes elements
      if (concept.elements && concept.elements.length > 0) {
        concept.elements.forEach((elName: string, idx: number) => {
          if (elName.toLowerCase().includes("circle") || elName.toLowerCase().includes("accent")) {
            const decObj = new fabric.Circle({
              left: 1200,
              top: 100 + (idx * 200),
              radius: 120,
              fill: "#ec4899",
              opacity: 0.8,
            });
            canvas.add(decObj);
          } else {
            const decObj = new fabric.Rect({
              left: 80,
              top: 500,
              width: 320,
              height: 12,
              fill: "#06b6d4",
              rx: 6,
              ry: 6,
            });
            canvas.add(decObj);
          }
        });
      }

      canvas.renderAll();
      alert(`AI concept plan "${concept.title}" has been painted onto the design sheet.`);
    });
  };

  // AI DESIGN GENERATOR MACRO (One click full design template)
  const handleInsertDesignGenerator = () => {
    if (!canvas) return;

    // Clear workspace
    canvas.clear();

    // Set background color
    canvas.setBackgroundColor("#020617", () => {
      // Add gradient glow circle shape
      const glow = new fabric.Circle({
        left: 1300,
        top: -100,
        radius: 350,
        fill: "#6366F1",
        opacity: 0.65,
        selectable: false
      });
      canvas.add(glow);

      // Add template description text if provided
      if (templatePrompt && templatePrompt.trim()) {
        const promptText = new fabric.IText(templatePrompt, {
          left: 100,
          top: 200,
          fontSize: 24,
          fontFamily: "Outfit",
          fill: "#FFFFFF",
          fontWeight: "bold",
          width: 800,
          textAlign: "center"
        });
        canvas.add(promptText);
        canvas.centerObjectH(promptText);
        canvas.renderAll();
      }

      // Add AI Heading Large
      const title = new fabric.IText("PURE SKINCARE", {
        left: 100,
        top: 250,
        fontSize: 90,
        fontWeight: "bold",
        fontFamily: "Outfit",
        fill: "#FFFFFF",
      });
      canvas.add(title);

      // Add AI Subtitle text
      const desc = new fabric.IText("Modern Organic Skincare formula for natural skin recovery.", {
        left: 100,
        top: 380,
        fontSize: 28,
        fontFamily: "Inter",
        fill: "#94A3B8"
      });
      canvas.add(desc);

      // Add button elements
      const btnBg = new fabric.Rect({
        width: 280,
        height: 64,
        fill: "#EC4899",
        rx: 32,
        ry: 32,
      });
      const btnTxt = new fabric.IText("ORDER NOW - 30% OFF", {
        fontSize: 14,
        fontWeight: "bold",
        fontFamily: "Outfit",
        fill: "#FFFFFF",
        originX: "center",
        originY: "center",
        left: 140,
        top: 32,
      });
      const btnGroup = new fabric.Group([btnBg, btnTxt], {
        left: 100,
        top: 520,
      });
      canvas.add(btnGroup);

      canvas.renderAll();
      alert("AI Design Generator: Skincare Instagram layout template inserted successfully!");
    });
  };

  // AI Magic Resize calculations (Maintain aspect margins)
  const handleMagicResize = (aspect: "story" | "banner" | "thumbnail" | "post") => {
    if (!canvas) return;

    let targetWidth = 1920;
    let targetHeight = 1080;

    if (aspect === "story") {
      targetWidth = 1080;
      targetHeight = 1920;
    } else if (aspect === "thumbnail") {
      targetWidth = 1280;
      targetHeight = 720;
    } else if (aspect === "post") {
      targetWidth = 1080;
      targetHeight = 1080;
    }

    // Set canvas dimensions
    canvas.setDimensions({ width: targetWidth, height: targetHeight });
    
    // Distribute margins horizontally and vertically on children items
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      // Scale positions based on new boundaries
      if (obj.left) obj.set("left", Math.max(20, Math.min(targetWidth - 100, obj.left)));
      if (obj.top) obj.set("top", Math.max(20, Math.min(targetHeight - 100, obj.top)));
    });

    canvas.renderAll();
    alert(`Magic Resize Complete: Converted workspace dimensions to ${targetWidth} x ${targetHeight} px.`);
  };

  // Canvas insertions helper
  const handleInsertText = (val: string) => {
    if (!canvas) return;
    const center = canvas.getVpCenter();
    const txt = new fabric.IText(val, {
      left: center.x - 120,
      top: center.y - 40,
      fontSize: 48,
      fontFamily: "Outfit",
      fontWeight: "bold",
      fill: "#1E293B"
    });
    canvas.add(txt);
    canvas.setActiveObject(txt);
    canvas.renderAll();
  };

  const handleInsertImage = (url: string) => {
    if (!canvas) return;
    const isDataOrBlob = url.startsWith("data:") || url.startsWith("blob:");
    fabric.Image.fromURL(url, (img) => {
      const center = canvas.getVpCenter();
      img.set({
        left: center.x - 150,
        top: center.y - 150
      });
      img.scaleToWidth(300);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    }, isDataOrBlob ? {} : { crossOrigin: "anonymous" });
  };

  const handleSetBackground = (url: string) => {
    if (!canvas) return;
    const isDataOrBlob = url.startsWith("data:") || url.startsWith("blob:");
    fabric.Image.fromURL(url, (img) => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs relative select-none">
      
      {/* 1. Magic Studio Tabs Switcher */}
      <div className="flex flex-col space-y-2.5 pb-2.5 border-b border-purple-100/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-purple-700">
            <Sparkles className="w-4 h-4 animate-pulse text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">AI Design Studio</h3>
          </div>
          
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded-lg border transition ${showHistory ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-transparent text-slate-400 border-transparent hover:text-slate-600"}`}
              title="History"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Categories Tab Selector Grid */}
        <div className="grid grid-cols-3 gap-1 select-none">
          {[
            { id: "copywriter", label: "Copywriter", icon: <Type className="w-3 h-3" /> },
            { id: "imagestudio", label: "Image Studio", icon: <Image className="w-3 h-3" /> },
            { id: "generator", label: "Templates", icon: <Layout className="w-3 h-3" /> },
            { id: "social", label: "Social", icon: <LayoutGrid className="w-3 h-3" /> },
            { id: "brand", label: "Brand Kit", icon: <Palette className="w-3 h-3" /> },
            { id: "review", label: "Design Review", icon: <HelpCircle className="w-3 h-3" /> },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id && !showHistory;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id);
                  setShowHistory(false);
                  setPromptInput("");
                  setCopyResults([]);
                  setGeneratedImageUrl("");
                }}
                className={`flex items-center space-x-1 px-1.5 py-1.5 rounded-xl border transition ${
                  isActive
                    ? "bg-purple-600 text-white border-purple-600 font-bold shadow-sm"
                    : "bg-slate-50 text-slate-500 border-purple-100/10 hover:bg-slate-100"
                }`}
              >
                {tab.icon}
                <span className="text-[8.5px] truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Generation Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 py-3.5 space-y-4 pb-20 select-none">
        
        {/* VIEW: PROMPT HISTORY */}
        {showHistory && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Prompt History</span>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[9px] text-rose-500 font-bold hover:text-rose-700">Clear</button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed rounded-2xl p-4">
                No recent prompts. Actions you take inside the AI Studio will be cached here.
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 border border-purple-100/30 rounded-xl flex items-start justify-between">
                    <div className="text-left space-y-0.5 pr-2 max-w-[85%]">
                      <div className="flex items-center space-x-1">
                        <span className="bg-purple-100 text-purple-700 text-[8px] font-bold px-1 rounded uppercase">{item.action}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-700 font-medium leading-relaxed">{item.prompt}</p>
                    </div>
                    <button
                      onClick={() => {
                        setPromptInput(item.prompt);
                        setShowHistory(false);
                        if (item.action.toLowerCase().includes("image")) {
                          setActiveSubTab("imagestudio");
                        } else {
                          setActiveSubTab("copywriter");
                        }
                      }}
                      className="text-purple-600 hover:text-purple-800 p-1"
                      title="Reuse Prompt"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: AI COPYWRITER */}
        {activeSubTab === "copywriter" && !showHistory && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Creative Topic Prompt</span>
              <textarea
                placeholder="E.g., Huge Clearance Summer Sale on Swimsuits..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full bg-slate-50 border border-purple-100 text-slate-800 text-xs p-2.5 rounded-xl focus:outline-none h-20 resize-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
            </div>

            {/* Form settings */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Text Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 border border-purple-100 rounded-xl px-2 py-1.5 text-[10px] focus:outline-none"
                >
                  <option value="headline">Headline</option>
                  <option value="subheading">Subheading</option>
                  <option value="description">Description</option>
                  <option value="cta">Call-to-Action</option>
                  <option value="social">Social Caption</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Tone of Voice</span>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-slate-50 border border-purple-100 rounded-xl px-2 py-1.5 text-[10px] focus:outline-none"
                >
                  <option value="friendly">Friendly</option>
                  <option value="luxury">Luxury</option>
                  <option value="modern">Modern</option>
                  <option value="bold">Bold</option>
                  <option value="professional">Professional</option>
                  <option value="playful">Playful</option>
                  <option value="corporate">Corporate</option>
                  <option value="creative">Creative</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Audience</span>
                <input
                  type="text"
                  placeholder="E.g., Teenagers, Professionals"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-slate-50 border border-purple-100 rounded-xl px-2 py-1.5 text-[10px] focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 border border-purple-100 rounded-xl px-2 py-1.5 text-[10px] focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCopywriterSubmit}
              disabled={isGenerating || !promptInput}
              className="w-full bg-purple-600 hover:bg-purple-750 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Writing Variants...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Copy Variants</span>
                </>
              )}
            </button>

            {/* Variations Display List */}
            {copyResults.length > 0 && (
              <div className="space-y-2 mt-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Variants</span>
                <div className="space-y-2">
                  {copyResults.map((text, idx) => (
                    <div key={idx} className="bg-white border border-purple-100 rounded-2xl p-3 shadow-sm hover:border-purple-300 transition text-left space-y-2">
                      <p className="text-slate-800 text-[11px] font-medium leading-relaxed">{text}</p>
                      
                      <div className="flex space-x-2 pt-1 border-t border-purple-50/50">
                        <button
                          onClick={() => handleInsertText(text)}
                          className="text-[9px] text-purple-600 font-bold hover:text-purple-800 transition flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insert to Canvas</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(text)}
                          className="text-[9px] text-slate-400 hover:text-slate-600 transition flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: AI IMAGE STUDIO */}
        {activeSubTab === "imagestudio" && !showHistory && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Describe Image Concept</span>
              <textarea
                placeholder="E.g., Luxury gold perfume bottle standing on a polished mirror background with sunset light..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full bg-slate-50 border border-purple-100 text-slate-800 text-xs p-2.5 rounded-xl focus:outline-none h-20 resize-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
            </div>

            <button
              onClick={handleImageSubmit}
              disabled={isGenerating || !promptInput}
              className="w-full bg-purple-600 hover:bg-purple-750 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Painting Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate DALL-E Image</span>
                </>
              )}
            </button>

            {/* Generated Image Preview Area */}
            {generatedImageUrl && (
              <div className="bg-white border border-purple-100 rounded-2xl p-3 shadow-sm hover:border-purple-300 transition text-left space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Generated Visual Scene</span>
                
                <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative border border-purple-50 flex items-center justify-center">
                  <img src={generatedImageUrl} alt="AI output" className="w-full h-full object-cover" />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => handleInsertImage(generatedImageUrl)}
                    className="bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 font-bold py-1.5 rounded-lg text-[9px] transition"
                  >
                    Add Image to Canvas
                  </button>
                  <button
                    onClick={() => handleSetBackground(generatedImageUrl)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 rounded-lg text-[9px] transition"
                  >
                    Set as Background
                  </button>
                  <button
                    onClick={() => saveImageToGallery(generatedImageUrl)}
                    className="col-span-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold py-1.5 rounded-lg text-[9px] transition"
                  >
                    Save Image to Gallery
                  </button>
                </div>
                
			{/* Gallery Thumbnails */}
			{galleryImages.length > 0 && (
				<div className="mt-4 pt-4 border-t border-purple-50 overflow-auto max-h-64">
					<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Your Image Gallery</span>
					<div className="grid grid-cols-4 gap-2 mt-2">
						{galleryImages.map((img) => (
							<div key={img.id} className="relative aspect-square border border-purple-100 rounded-lg overflow-hidden cursor-pointer group">
								<img src={img.url} alt="saved" className="w-full h-full object-contain" />
								<div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
									<button onClick={() => handleInsertImage(img.url)} className="bg-white text-purple-700 text-[8px] px-1 py-0.5 rounded mr-0.5">Ins</button>
									<button onClick={() => handleSetBackground(img.url)} className="bg-white text-purple-700 text-[8px] px-1 py-0.5 rounded">BG</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
          </div>
        )}
          </div>
        )}

        {/* TAB: AI DESIGN GENERATOR */}
        {activeSubTab === "design" && !showHistory && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-2 text-left">
              <h4 className="text-[11px] font-extrabold text-purple-800 flex items-center space-x-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span>AI Creative Template Generator</span>
              </h4>
              <p className="text-[9.5px] text-slate-500 leading-relaxed">
                Describe the template you want to generate and click the button to create it.
              </p>
              <textarea
                placeholder="e.g., Elegant skincare product showcase with pastel colors"
                value={templatePrompt}
                onChange={(e) => setTemplatePrompt(e.target.value)}
                className="w-full bg-slate-50 border border-purple-100 text-slate-800 text-xs p-2.5 rounded-xl focus:outline-none h-24 resize-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 mb-2"
              />
            </div>

            <button
              onClick={handleInsertDesignGenerator}
              className="w-full bg-purple-600 hover:bg-purple-750 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New Design Template</span>
            </button>

            {/* Magic Resize Drawer */}
            <div className="pt-4 border-t border-purple-100/40 space-y-2 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Magic Resize</span>
              <p className="text-[9.5px] text-slate-400 leading-relaxed mb-3">Convert active canvas bounds while adapting positions:</p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleMagicResize("story")}
                  className="bg-white hover:bg-purple-50 border border-purple-150 p-2.5 rounded-xl transition font-bold text-slate-700 text-center"
                >
                  <span className="block text-[10px] font-bold">Instagram Story</span>
                  <span className="text-[8px] text-slate-400 font-mono">1080 &times; 1920</span>
                </button>
                <button
                  onClick={() => handleMagicResize("post")}
                  className="bg-white hover:bg-purple-50 border border-purple-150 p-2.5 rounded-xl transition font-bold text-slate-700 text-center"
                >
                  <span className="block text-[10px] font-bold">Instagram Post</span>
                  <span className="text-[8px] text-slate-400 font-mono">1080 &times; 1080</span>
                </button>
                <button
                  onClick={() => handleMagicResize("thumbnail")}
                  className="bg-white hover:bg-purple-50 border border-purple-150 p-2.5 rounded-xl transition font-bold text-slate-700 text-center"
                >
                  <span className="block text-[10px] font-bold">YT Thumbnail</span>
                  <span className="text-[8px] text-slate-400 font-mono">1280 &times; 720</span>
                </button>
                <button
                  onClick={() => handleMagicResize("banner")}
                  className="bg-white hover:bg-purple-50 border border-purple-150 p-2.5 rounded-xl transition font-bold text-slate-700 text-center"
                >
                  <span className="block text-[10px] font-bold">FB / Banner</span>
                  <span className="text-[8px] text-slate-400 font-mono">1920 &times; 1080</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AI SOCIAL MEDIA CREATOR */}
        {activeSubTab === "social" && !showHistory && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Details</span>
              <input
                type="text"
                placeholder="E.g., Organic Hydrating Cleanser..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-slate-50 border border-purple-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Audience</span>
              <input
                type="text"
                placeholder="E.g., Women 20-35 seeking glowing skin..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-slate-50 border border-purple-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Campaign Offer</span>
              <input
                type="text"
                placeholder="E.g., Get 30% Off this weekend only!"
                value={offerDetails}
                onChange={(e) => setOfferDetails(e.target.value)}
                className="w-full bg-slate-50 border border-purple-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-400 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSocialCreatorSubmit}
              disabled={isGenerating || !productName}
              className="w-full bg-purple-600 hover:bg-purple-750 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Planning Ad Concepts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Campaign Concepts</span>
                </>
              )}
            </button>

            {/* Generated Campaign Layout Cards */}
            {socialConcepts.length > 0 && (
              <div className="space-y-2 mt-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Concept Outlines</span>
                <div className="space-y-2.5">
                  {socialConcepts.map((concept, idx) => (
                    <div key={idx} className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm hover:border-purple-300 transition text-left space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-tight">{concept.title}</h4>
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-bold">Theme: {concept.theme}</span>
                        </div>
                        <button
                          onClick={() => handleApplyConceptLayout(concept)}
                          className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold px-2 py-1 rounded text-[8px] transition"
                        >
                          Paint Canvas
                        </button>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono space-y-1 bg-slate-50 p-2.5 rounded-xl border border-purple-50/50">
                        <div><span className="text-slate-400 font-bold">BG:</span> {concept.background}</div>
                        <div><span className="text-slate-400 font-bold">Headline:</span> {concept.headline}</div>
                        <div><span className="text-slate-400 font-bold">Elements:</span> {concept.elements.join(", ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: AI BRAND ASSISTANT */}
        {activeSubTab === "brand" && !showHistory && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-2 text-left">
              <h4 className="text-[11px] font-extrabold text-purple-800 flex items-center space-x-1.5 uppercase">
                <Award className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span>AI Brand Style Analyst</span>
              </h4>
              <p className="text-[9.5px] text-slate-500 leading-relaxed">
                Connects directly to your saved Brand Kit profiles. Triggers customized color combinations, typography guidelines, and structural layouts matching your industry tagline.
              </p>
            </div>

            <button
              onClick={handleBrandAssistant}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-750 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Analyze Active Brand kit</span>
            </button>

            {brandReview && (
              <div className="space-y-3 mt-4 text-left">
                <div className="bg-white border border-purple-150 p-4 rounded-2xl shadow-sm space-y-3">
                  <span className="text-[9.5px] font-bold text-purple-700 uppercase tracking-wider block">Recommended Palette</span>
                  
                  <div className="flex space-x-1">
                    {brandReview.colors.map((c, idx) => (
                      <div key={idx} className="flex-1 h-8 rounded border border-purple-100/50 shadow-inner" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                  <button
                    onClick={() => handleApplyBrandPalette(brandReview.colors)}
                    className="w-full bg-slate-50 hover:bg-purple-50/50 border border-purple-150 py-1.5 rounded-lg text-[9px] font-bold text-slate-600 transition"
                  >
                    Apply Palette Colors to Canvas
                  </button>

                  <div className="border-t border-purple-50/50 pt-2.5 space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Typography Scale</span>
                    <div className="flex flex-wrap gap-1">
                      {brandReview.fonts.map((f, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[8.5px] font-mono">{f}</span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-purple-50/50 pt-2.5 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Layout Guidelines</span>
                    <p className="text-[9.5px] text-slate-600 leading-relaxed font-medium">{brandReview.recommendations}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: AI DESIGN REVIEW */}
        {activeSubTab === "review" && !showHistory && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-2 text-left">
              <h4 className="text-[11px] font-extrabold text-purple-800 flex items-center space-x-1.5 uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span>AI Layout Inspector</span>
              </h4>
              <p className="text-[9.5px] text-slate-500 leading-relaxed">
                Evaluates active coordinates positions, element counts, typography nodes, and visual contrast values. Returns a detailed visual balance grade score.
              </p>
            </div>

            <button
              onClick={handleDesignReview}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-750 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
              <span>Run Layout Review Diagnostics</span>
            </button>

            {reviewResults && (
              <div className="space-y-3.5 mt-4 text-left">
                {/* Score Circular Meter */}
                <div className="bg-white border border-purple-150 p-4 rounded-2xl shadow-sm text-center space-y-3 flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24 flex items-center justify-center border-8 border-purple-100 rounded-full">
                    <div className="absolute text-2xl font-black text-purple-700 font-mono">{reviewResults.overallScore}%</div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wide">Design Quality Score</h4>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">Weighted on Alignment, Contrast, and spacing</p>
                  </div>
                  
                  {/* Category meters */}
                  <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-purple-50/50 font-mono text-[8px]">
                    <div>
                      <div className="text-slate-400 uppercase font-bold">Align</div>
                      <div className="font-bold text-slate-800">{reviewResults.categories.alignment}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase font-bold">Contrast</div>
                      <div className="font-bold text-slate-800">{reviewResults.categories.contrast}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase font-bold">Spacing</div>
                      <div className="font-bold text-slate-800">{reviewResults.categories.spacing}%</div>
                    </div>
                  </div>
                </div>

                {/* Issues list */}
                {reviewResults.issues.length > 0 && (
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-2xl space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="font-bold text-[9px] uppercase tracking-wider">Identified Issues ({reviewResults.issues.length})</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[9px] text-rose-700">
                      {reviewResults.issues.map((issue, idx) => (
                        <li key={idx} className="leading-relaxed">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions list */}
                {reviewResults.suggestions.length > 0 && (
                  <div className="bg-purple-50/50 border border-purple-100 p-3.5 rounded-2xl space-y-2">
                    <span className="font-bold text-[9px] text-purple-800 uppercase tracking-wider block">Fix Suggestions</span>
                    <div className="space-y-1.5">
                      {reviewResults.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRepairAction(sug)}
                          className="w-full text-left bg-white border border-purple-100 hover:border-purple-300 p-2 rounded-xl transition flex justify-between items-center text-[9px] text-slate-700 font-bold"
                        >
                          <span className="pr-2 leading-relaxed">{sug}</span>
                          <ArrowRight className="w-3 h-3 text-purple-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
