import React, { useState, useEffect, useRef } from "react";
import {
  Palette, Type, Sparkles, Plus, Trash2, UploadCloud, CheckCircle2,
  X, Globe, Info, Sliders, Volume2, Layout, FileText, ChevronRight,
  ChevronDown, RefreshCw, Download, Link, Activity, AlertCircle, Edit, Save, ArrowRight
} from "lucide-react";
import { CanvasService } from "../services/canvas.service";
import { fabric } from "fabric";
import { api } from "@/config/axios";

interface BrandColorType {
  id?: string;
  type: "PRIMARY" | "SECONDARY" | "ACCENT" | "NEUTRAL" | "SUCCESS" | "WARNING" | "ERROR";
  name: string;
  hex: string;
  rgb: string;
  hsl: string;
}

interface BrandFontType {
  id?: string;
  type: "HEADING" | "SUBHEADING" | "BODY" | "CAPTION";
  fontFamily: string;
  weight: string;
  sizeScale: number;
  lineHeight: number;
  letterSpacing: number;
}

interface BrandGradientType {
  id?: string;
  name: string;
  stops: Array<{ color: string; offset: number }>;
  direction: string;
}

interface BrandVoiceType {
  id?: string;
  tone: string;
  writingStyle: string;
  keywords: string[];
  values: string[];
}

interface BrandAssetType {
  id?: string;
  name: string;
  assetUrl: string;
  type: "LOGO" | "IMAGE" | "VIDEO" | "SHAPE" | "ICON" | "STICKER" | "FONT";
  mimeType: string;
  size?: number;
  tags?: string[];
}

interface BrandTemplateType {
  id?: string;
  name: string;
  width: number;
  height: number;
  canvasJson: string;
}

interface BrandKitType {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  tagline?: string | null;
  industry?: string | null;
  logoPrimary?: string | null;
  logoSecondary?: string | null;
  logoIcon?: string | null;
  logoWhite?: string | null;
  logoDark?: string | null;
  logoHorizontal?: string | null;
  logoVertical?: string | null;
  favicon?: string | null;
  colors: BrandColorType[];
  fonts: BrandFontType[];
  gradients: BrandGradientType[];
  voice?: BrandVoiceType | null;
  assets: BrandAssetType[];
  templates: BrandTemplateType[];
}

interface BrandKitPanelProps {
  canvas: fabric.Canvas | null;
  brandAssets: any[]; // Retained from parent signature
  selectedObject: fabric.Object | null;
}

const TABS = [
  { id: "overview", label: "Profile" },
  { id: "logos", label: "Logos" },
  { id: "colors", label: "Colors" },
  { id: "fonts", label: "Fonts" },
  { id: "gradients", label: "Gradients" },
  { id: "voice", label: "Voice" },
  { id: "assets", label: "Assets" },
  { id: "templates", label: "Templates" },
];

const POPULAR_FONTS = [
  "Inter",
  "Outfit",
  "Poppins",
  "Roboto",
  "Playfair Display",
  "Montserrat",
  "Lora",
  "Oswald",
  "Merriweather",
  "Open Sans",
  "Raleway",
];

const LOGO_TYPES = [
  { key: "logoPrimary", label: "Primary Logo" },
  { key: "logoSecondary", label: "Secondary Logo" },
  { key: "logoIcon", label: "Icon Logo" },
  { key: "logoWhite", label: "White Logo (Transparent)" },
  { key: "logoDark", label: "Dark Logo" },
  { key: "logoHorizontal", label: "Horizontal Logo" },
  { key: "logoVertical", label: "Vertical Logo" },
];

const MOCK_FALLBACK_KIT: BrandKitType = {
  id: "ba_local_1",
  name: "Default Brand Kit",
  description: "Standard starter assets, typography guidelines, and color systems.",
  tagline: "Simplify Design Operations",
  website: "https://example.com",
  industry: "Design & Technology",
  colors: [
    { id: "c1", type: "PRIMARY", name: "Primary Indigo", hex: "#6366F1", rgb: "rgb(99, 102, 241)", hsl: "hsl(239, 84%, 67%)" },
    { id: "c2", type: "SECONDARY", name: "Secondary Slate", hex: "#475569", rgb: "rgb(71, 85, 105)", hsl: "hsl(215, 19%, 35%)" },
    { id: "c3", type: "ACCENT", name: "Accent Pink", hex: "#EC4899", rgb: "rgb(236, 72, 153)", hsl: "hsl(330, 81%, 60%)" },
    { id: "c4", type: "NEUTRAL", name: "Neutral Slate", hex: "#F8FAF8", rgb: "rgb(248, 250, 248)", hsl: "hsl(120, 10%, 98%)" },
    { id: "c5", type: "SUCCESS", name: "Emerald Success", hex: "#10B981", rgb: "rgb(16, 185, 129)", hsl: "hsl(160, 84%, 39%)" },
    { id: "c6", type: "WARNING", name: "Amber Warning", hex: "#F59E0B", rgb: "rgb(245, 158, 11)", hsl: "hsl(38, 92%, 50%)" },
    { id: "c7", type: "ERROR", name: "Rose Error", hex: "#EF4444", rgb: "rgb(239, 68, 68)", hsl: "hsl(0, 84%, 60%)" }
  ],
  fonts: [
    { id: "f1", type: "HEADING", fontFamily: "Outfit", weight: "700", sizeScale: 48, lineHeight: 1.2, letterSpacing: -0.02 },
    { id: "f2", type: "SUBHEADING", fontFamily: "Outfit", weight: "600", sizeScale: 28, lineHeight: 1.3, letterSpacing: -0.01 },
    { id: "f3", type: "BODY", fontFamily: "Inter", weight: "400", sizeScale: 16, lineHeight: 1.5, letterSpacing: 0.0 },
    { id: "f4", type: "CAPTION", fontFamily: "Inter", weight: "400", sizeScale: 12, lineHeight: 1.4, letterSpacing: 0.01 }
  ],
  gradients: [
    { id: "g1", name: "Ocean Blue", direction: "to right", stops: [{ color: "#2563EB", offset: 0 }, { color: "#06B6D4", offset: 100 }] },
    { id: "g2", name: "Sunset Orange", direction: "to right", stops: [{ color: "#F59E0B", offset: 0 }, { color: "#EF4444", offset: 100 }] },
    { id: "g3", name: "Purple Glow", direction: "to right", stops: [{ color: "#8B5CF6", offset: 0 }, { color: "#EC4899", offset: 100 }] }
  ],
  voice: {
    tone: "Modern",
    writingStyle: "Clean, professional, and bold.",
    keywords: ["innovative", "premium", "dynamic"],
    values: ["design quality", "accessibility", "visual impact"]
  },
  assets: [],
  templates: [],
};

export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({
  canvas,
  selectedObject,
}) => {
  const [brandKits, setBrandKits] = useState<BrandKitType[]>([]);
  const [selectedKit, setSelectedKit] = useState<BrandKitType | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form States
  const [profileForm, setProfileForm] = useState({
    name: "",
    tagline: "",
    website: "",
    industry: "",
    description: "",
  });

  // Voice States
  const [voiceTone, setVoiceTone] = useState("Modern");
  const [voiceStyle, setVoiceStyle] = useState("");
  const [voiceKeywords, setVoiceKeywords] = useState<string[]>([]);
  const [voiceValues, setVoiceValues] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newValue, setNewValue] = useState("");

  // Gradient Builder States
  const [gradName, setGradName] = useState("Custom Gradient");
  const [gradDir, setGradDir] = useState("to right");
  const [gradStop1, setGradStop1] = useState("#6366F1");
  const [gradStop2, setGradStop2] = useState("#EC4899");

  // Contrast Checker States
  const [contrastBg, setContrastBg] = useState("#FFFFFF");
  const [contrastFg, setContrastFg] = useState("#6366F1");

  // Assets Search State
  const [assetSearch, setAssetSearch] = useState("");
  const [assetFilter, setAssetFilter] = useState("ALL");

  // Fetch all brand kits
  const fetchKits = async () => {
    const isAuth = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!isAuth) {
      setBrandKits([MOCK_FALLBACK_KIT]);
      setSelectedKit(MOCK_FALLBACK_KIT);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get("/brand-kit");
      if (res.data.success) {
        const kits = res.data.data;
        setBrandKits(kits);
        if (kits.length > 0) {
          // Keep current selection or default to first
          const current = selectedKit ? kits.find((k: any) => k.id === selectedKit.id) : null;
          setSelectedKit(current || kits[0]);
        }
      }
    } catch (err: any) {
      console.error("Error loading brand kits:", err);
      setBrandKits([MOCK_FALLBACK_KIT]);
      setSelectedKit(MOCK_FALLBACK_KIT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKits();
  }, []);

  // Sync profile details
  useEffect(() => {
    if (selectedKit) {
      setProfileForm({
        name: selectedKit.name || "",
        tagline: selectedKit.tagline || "",
        website: selectedKit.website || "",
        industry: selectedKit.industry || "",
        description: selectedKit.description || "",
      });

      if (selectedKit.voice) {
        setVoiceTone(selectedKit.voice.tone || "Modern");
        setVoiceStyle(selectedKit.voice.writingStyle || "");
        setVoiceKeywords(selectedKit.voice.keywords || []);
        setVoiceValues(selectedKit.voice.values || []);
      } else {
        setVoiceTone("Modern");
        setVoiceStyle("");
        setVoiceKeywords([]);
        setVoiceValues([]);
      }
    }
  }, [selectedKit]);

  // Color Utility Helpers
  const hexToRgb = (hex: string): string => {
    let c = hex.substring(1);
    if (c.length === 3) {
      c = c.split("").map((x) => x + x).join("");
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    return `rgb(${r}, ${g}, ${b})`;
  };

  const hexToHsl = (hex: string): string => {
    let c = hex.substring(1);
    if (c.length === 3) {
      c = c.split("").map((x) => x + x).join("");
    }
    let r = parseInt(c.slice(0, 2), 16) / 255;
    let g = parseInt(c.slice(2, 4), 16) / 255;
    let b = parseInt(c.slice(4, 6), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const getLuminance = (r: number, g: number, b: number) => {
    let a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const getContrastRatio = (hex1: string, hex2: string) => {
    const parseHex = (hex: string) => {
      let c = hex.startsWith("#") ? hex.substring(1) : hex;
      if (c.length === 3) c = c.split("").map((x) => x + x).join("");
      const num = parseInt(c, 16);
      return {
        r: (num >> 16) & 0xff,
        g: (num >> 8) & 0xff,
        b: num & 0xff,
      };
    };
    try {
      const color1 = parseHex(hex1);
      const color2 = parseHex(hex2);
      const l1 = getLuminance(color1.r, color1.g, color1.b);
      const l2 = getLuminance(color2.r, color2.g, color2.b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    } catch {
      return 1.0;
    }
  };

  // AI Suggestions Palette generator
  const handleAISuggestions = () => {
    if (!selectedKit) return;
    const primaryColor = selectedKit.colors.find((c) => c.type === "PRIMARY")?.hex || "#6366F1";
    
    // Parse HSL from base
    const hslStr = hexToHsl(primaryColor);
    const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return;
    let h = parseInt(match[1]);
    let s = parseInt(match[2]);
    let l = parseInt(match[3]);

    const toHex = (hVal: number, sVal: number, lVal: number) => {
      hVal = (hVal % 360 + 360) % 360;
      const sNum = sVal / 100;
      const lNum = lVal / 100;
      const c = (1 - Math.abs(2 * lNum - 1)) * sNum;
      const x = c * (1 - Math.abs((hVal / 60) % 2 - 1));
      const m = lNum - c / 2;
      let r = 0, g = 0, b = 0;
      if (hVal >= 0 && hVal < 60) { r = c; g = x; }
      else if (hVal >= 60 && hVal < 120) { r = x; g = c; }
      else if (hVal >= 120 && hVal < 180) { g = c; b = x; }
      else if (hVal >= 180 && hVal < 240) { g = x; b = c; }
      else if (hVal >= 240 && hVal < 300) { r = x; b = c; }
      else if (hVal >= 300 && hVal < 360) { r = c; b = x; }
      const rHex = Math.round((r + m) * 255).toString(16).padStart(2, "0");
      const gHex = Math.round((g + m) * 255).toString(16).padStart(2, "0");
      const bHex = Math.round((b + m) * 255).toString(16).padStart(2, "0");
      return `#${rHex}${gHex}${bHex}`;
    };

    const suggested = [
      { type: "PRIMARY", name: "Primary Brand", hex: primaryColor, rgb: hexToRgb(primaryColor), hsl: hslStr },
      { type: "SECONDARY", name: "Secondary Analogous", hex: toHex(h + 30, Math.max(s - 15, 10), Math.min(l + 5, 85)), rgb: hexToRgb(toHex(h + 30, Math.max(s - 15, 10), Math.min(l + 5, 85))), hsl: hexToHsl(toHex(h + 30, Math.max(s - 15, 10), Math.min(l + 5, 85))) },
      { type: "ACCENT", name: "Accent pop", hex: toHex(h + 180, s, l), rgb: hexToRgb(toHex(h + 180, s, l)), hsl: hexToHsl(toHex(h + 180, s, l)) },
      { type: "NEUTRAL", name: "Neutral Background", hex: toHex(h, 8, 97), rgb: hexToRgb(toHex(h, 8, 97)), hsl: hexToHsl(toHex(h, 8, 97)) },
      { type: "SUCCESS", name: "Success Green", hex: "#10B981", rgb: "rgb(16, 185, 129)", hsl: "hsl(160, 84%, 39%)" },
      { type: "WARNING", name: "Warning Yellow", hex: "#F59E0B", rgb: "rgb(245, 158, 11)", hsl: "hsl(38, 92%, 50%)" },
      { type: "ERROR", name: "Error Red", hex: "#EF4444", rgb: "rgb(239, 68, 68)", hsl: "hsl(0, 84%, 60%)" },
    ];

    saveBrandKit({
      ...selectedKit,
      colors: suggested as any,
    });
  };

  // Create Brand Kit
  const handleCreateKit = async () => {
    const isAuth = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!isAuth) {
      const newKit: BrandKitType = {
        ...MOCK_FALLBACK_KIT,
        id: `local_${Date.now()}`,
        name: `Brand Kit ${brandKits.length + 1}`,
      };
      setBrandKits([...brandKits, newKit]);
      setSelectedKit(newKit);
      setActiveSubTab("overview");
      return;
    }

    try {
      const res = await api.post("/brand-kit", {
        name: `Brand Kit ${brandKits.length + 1}`,
        description: "A centralized Design System manager.",
      });
      if (res.data.success) {
        await fetchKits();
        setActiveSubTab("overview");
      }
    } catch (err) {
      console.error("Error creating brand kit:", err);
    }
  };

  // Delete Brand Kit
  const handleDeleteKit = async () => {
    if (!selectedKit) return;
    if (confirm(`Are you sure you want to delete "${selectedKit.name}"?`)) {
      const isAuth = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
      if (!isAuth) {
        const kits = brandKits.filter((k) => k.id !== selectedKit.id);
        setBrandKits(kits);
        setSelectedKit(kits.length > 0 ? kits[0] : null);
        return;
      }

      try {
        const res = await api.delete(`/brand-kit/${selectedKit.id}`);
        if (res.data.success) {
          const kits = brandKits.filter((k) => k.id !== selectedKit.id);
          setBrandKits(kits);
          setSelectedKit(kits.length > 0 ? kits[0] : null);
        }
      } catch (err) {
        console.error("Error deleting brand kit:", err);
      }
    }
  };

  // Save Brand Kit Data
  const saveBrandKit = async (updatedData: Partial<BrandKitType>) => {
    if (!selectedKit) return;
    
    // Merge locally first
    const merged = { ...selectedKit, ...updatedData } as BrandKitType;
    setBrandKits(brandKits.map((k) => (k.id === selectedKit.id ? merged : k)));
    setSelectedKit(merged);

    const isAuth = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!isAuth) {
      return; // Offline/demo mode
    }

    setSaving(true);
    try {
      const res = await api.put(`/brand-kit/${selectedKit.id}`, updatedData);
      if (res.data.success) {
        const saved = res.data.data;
        setBrandKits(brandKits.map((k) => (k.id === saved.id ? saved : k)));
        setSelectedKit(saved);
      }
    } catch (err) {
      console.error("Error updating brand kit:", err);
    } finally {
      setSaving(false);
    }
  };

  // Save profile changes
  const saveProfile = () => {
    if (!selectedKit) return;
    saveBrandKit({
      name: profileForm.name,
      tagline: profileForm.tagline,
      website: profileForm.website,
      industry: profileForm.industry,
      description: profileForm.description,
    });
  };

  // Save Voice changes
  const saveVoice = () => {
    if (!selectedKit) return;
    saveBrandKit({
      voice: {
        tone: voiceTone,
        writingStyle: voiceStyle,
        keywords: voiceKeywords,
        values: voiceValues,
      },
    });
  };

  // File uploading helper
  const handleLogoUpload = async (key: string, file: File) => {
    if (!selectedKit) return;
    const isAuth = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!isAuth) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const url = e.target?.result as string;
        await saveBrandKit({
          [key]: url,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "logo");

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        const url = res.data.data.url;
        await saveBrandKit({
          [key]: url,
        });
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      alert("Failed to upload logo file. Make sure size <= 5MB and format is JPG/PNG/SVG.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoDelete = (key: string) => {
    if (!selectedKit) return;
    if (confirm("Are you sure you want to delete this logo asset?")) {
      saveBrandKit({
        [key]: null,
      });
    }
  };

  // Add logo to canvas
  const addLogoToCanvas = (url: string) => {
    if (!canvas) return;
    const isDataOrBlob = url.startsWith("data:") || url.startsWith("blob:");
    fabric.Image.fromURL(url, (img) => {
      img.set({
        left: 150,
        top: 150,
        scaleX: 0.4,
        scaleY: 0.4,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    }, isDataOrBlob ? {} : { crossOrigin: "anonymous" });
  };

  // Color actions
  const updateColorHex = (type: string, hex: string) => {
    if (!selectedKit) return;
    const rgb = hexToRgb(hex);
    const hsl = hexToHsl(hex);
    const updatedColors = selectedKit.colors.map((c) =>
      c.type === type ? { ...c, hex, rgb, hsl } : c
    );
    saveBrandKit({
      colors: updatedColors,
    });
  };

  const updateColorName = (type: string, name: string) => {
    if (!selectedKit) return;
    const updatedColors = selectedKit.colors.map((c) =>
      c.type === type ? { ...c, name } : c
    );
    saveBrandKit({
      colors: updatedColors,
    });
  };

  const applyColorToCanvas = (color: string) => {
    if (!canvas) return;
    if (selectedObject) {
      selectedObject.set("fill", color);
      canvas.requestRenderAll();
      canvas.fire("object:modified", { target: selectedObject });
    } else {
      canvas.setBackgroundColor(color, () => {
        canvas.requestRenderAll();
        canvas.fire("object:modified");
      });
    }
  };

  // Font actions
  const updateFontField = (type: string, field: string, value: any) => {
    if (!selectedKit) return;
    const updatedFonts = selectedKit.fonts.map((f) =>
      f.type === type ? { ...f, [field]: value } : f
    );
    saveBrandKit({
      fonts: updatedFonts,
    });
  };

  const applyFontToSelection = async (family: string) => {
    if (!canvas || !selectedObject) return;
    if (selectedObject.type === "i-text" || selectedObject.type === "textbox") {
      await CanvasService.loadGoogleFont(family);
      selectedObject.set("fontFamily" as any, family);
      canvas.requestRenderAll();
      canvas.fire("object:modified", { target: selectedObject });
    }
  };

  const addFontToCanvas = async (font: BrandFontType) => {
    if (!canvas) return;
    await CanvasService.loadGoogleFont(font.fontFamily);
    const textVal = font.type === "HEADING" ? "Heading Bold"
                  : font.type === "SUBHEADING" ? "Subheading Title"
                  : font.type === "BODY" ? "Body description paragraph"
                  : "Caption footnote details";

    const textObj = new fabric.IText(textVal, {
      left: 120,
      top: 150,
      fontFamily: font.fontFamily,
      fontWeight: font.weight,
      fontSize: font.sizeScale,
      lineHeight: font.lineHeight,
      charSpacing: font.letterSpacing * 1000,
      fill: "#1E293B",
    });
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
  };

  // Gradients
  const handleSaveGradient = () => {
    if (!selectedKit) return;
    const newGrad = {
      name: gradName,
      direction: gradDir,
      stops: [
        { color: gradStop1, offset: 0 },
        { color: gradStop2, offset: 100 },
      ],
    };
    saveBrandKit({
      gradients: [...(selectedKit.gradients || []), newGrad],
    });
    setGradName("Custom Gradient");
  };

  const handleDeleteGradient = (id: string) => {
    if (!selectedKit) return;
    saveBrandKit({
      gradients: selectedKit.gradients.filter((g) => g.id !== id),
    });
  };

  const applyGradientToCanvas = (grad: BrandGradientType) => {
    if (!canvas) return;
    const w = canvas.width || 800;
    const h = canvas.height || 600;
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    if (grad.direction === "to right") x2 = w;
    else if (grad.direction === "to bottom") y2 = h;
    else if (grad.direction === "to top") y1 = h;
    else if (grad.direction === "to left") x1 = w;
    else if (grad.direction === "45deg") { x2 = w; y1 = h; }
    else { x2 = w; y2 = h; }

    const fabricGrad = new fabric.Gradient({
      type: "linear",
      gradientUnits: "pixels",
      coords: { x1, y1, x2, y2 },
      colorStops: grad.stops.map((s) => ({
        offset: s.offset / 100,
        color: s.color,
      })),
    });

    canvas.setBackgroundColor(fabricGrad as any, () => {
      canvas.requestRenderAll();
      canvas.fire("object:modified");
    });
  };

  // Asset actions
  const handleAssetUpload = async (file: File) => {
    if (!selectedKit) return;
    const isAuth = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!isAuth) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const url = e.target?.result as string;
        const newAsset: BrandAssetType = {
          name: file.name,
          assetUrl: url,
          type: file.type.includes("svg") ? "ICON" : "IMAGE",
          mimeType: file.type,
          tags: ["Local"],
        };
        await saveBrandKit({
          assets: [...(selectedKit.assets || []), newAsset],
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "logo"); // repurpose image validation

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        const url = res.data.data.url;
        const newAsset: BrandAssetType = {
          name: file.name,
          assetUrl: url,
          type: file.type.includes("svg") ? "ICON" : "IMAGE",
          mimeType: file.type,
          tags: ["Upload"],
        };
        await saveBrandKit({
          assets: [...(selectedKit.assets || []), newAsset],
        });
      }
    } catch (err) {
      console.error("Asset upload error:", err);
      alert("Failed to upload brand asset file.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = (url: string) => {
    if (!selectedKit) return;
    if (confirm("Delete this brand asset?")) {
      saveBrandKit({
        assets: selectedKit.assets.filter((a) => a.assetUrl !== url),
      });
    }
  };

  // Template actions
  const saveCurrentCanvasAsTemplate = async () => {
    if (!canvas || !selectedKit) return;
    const name = prompt("Enter Brand Template Name:", "Instagram Promo");
    if (!name) return;

    const json = JSON.stringify(canvas.toJSON());
    const newTpl: BrandTemplateType = {
      name,
      width: canvas.width || 800,
      height: canvas.height || 600,
      canvasJson: json,
    };

    saveBrandKit({
      templates: [...(selectedKit.templates || []), newTpl],
    });
  };

  const loadTemplate = (tpl: BrandTemplateType) => {
    if (!canvas) return;
    if (confirm(`Load template "${tpl.name}"? This replaces current canvas content.`)) {
      canvas.clear();
      canvas.loadFromJSON(tpl.canvasJson, () => {
        canvas.renderAll();
        canvas.fire("object:modified");
      });
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (!selectedKit) return;
    saveBrandKit({
      templates: selectedKit.templates.filter((t) => t.id !== id),
    });
  };

  // MASTER QUICK APPLY SYSTEM
  const quickApplyBrandKit = async () => {
    if (!canvas || !selectedKit) return;

    // Load active fonts
    const headFont = selectedKit.fonts.find((f) => f.type === "HEADING");
    const subheadFont = selectedKit.fonts.find((f) => f.type === "SUBHEADING");
    const bodyFont = selectedKit.fonts.find((f) => f.type === "BODY");
    const captFont = selectedKit.fonts.find((f) => f.type === "CAPTION");

    const pColor = selectedKit.colors.find((c) => c.type === "PRIMARY")?.hex || "#6366F1";
    const sColor = selectedKit.colors.find((c) => c.type === "SECONDARY")?.hex || "#475569";
    const aColor = selectedKit.colors.find((c) => c.type === "ACCENT")?.hex || "#EC4899";
    const nColor = selectedKit.colors.find((c) => c.type === "NEUTRAL")?.hex || "#F8FAF8";

    const fontJobs = [];
    if (headFont) fontJobs.push(CanvasService.loadGoogleFont(headFont.fontFamily));
    if (subheadFont) fontJobs.push(CanvasService.loadGoogleFont(subheadFont.fontFamily));
    if (bodyFont) fontJobs.push(CanvasService.loadGoogleFont(bodyFont.fontFamily));
    if (captFont) fontJobs.push(CanvasService.loadGoogleFont(captFont.fontFamily));

    await Promise.all(fontJobs);

    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if (obj.type === "i-text" || obj.type === "textbox") {
        const text = obj as fabric.IText;
        const size = text.fontSize || 16;
        if (size >= 38 && headFont) {
          text.set("fontFamily", headFont.fontFamily);
          text.set("fontWeight", headFont.weight);
          text.set("fill", pColor);
          text.set("lineHeight", headFont.lineHeight);
          text.set("charSpacing", headFont.letterSpacing * 1000);
        } else if (size >= 22 && size < 38 && subheadFont) {
          text.set("fontFamily", subheadFont.fontFamily);
          text.set("fontWeight", subheadFont.weight);
          text.set("fill", sColor);
          text.set("lineHeight", subheadFont.lineHeight);
          text.set("charSpacing", subheadFont.letterSpacing * 1000);
        } else if (bodyFont) {
          text.set("fontFamily", bodyFont.fontFamily);
          text.set("fontWeight", bodyFont.weight);
          text.set("fill", sColor);
          text.set("lineHeight", bodyFont.lineHeight);
          text.set("charSpacing", bodyFont.letterSpacing * 1000);
        }
      } else if (
        obj.type === "rect" ||
        obj.type === "circle" ||
        obj.type === "triangle" ||
        obj.type === "path"
      ) {
        if (obj.fill && obj.fill !== "transparent") {
          obj.set("fill", pColor);
        }
        if (obj.stroke && obj.stroke !== "transparent") {
          obj.set("stroke", sColor);
        }
      }
    });

    // Background Gradient or Solid neutral background
    const defaultGrad = selectedKit.gradients[0];
    if (defaultGrad) {
      applyGradientToCanvas(defaultGrad);
    } else {
      canvas.setBackgroundColor(nColor, () => {
        canvas.requestRenderAll();
        canvas.fire("object:modified");
      });
    }

    canvas.requestRenderAll();
    canvas.fire("object:modified");
  };

  // Rendering
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading Design Systems...</p>
      </div>
    );
  }

  if (errorMsg || !selectedKit) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-xs font-semibold text-rose-700">{errorMsg || "No active Brand Kit available."}</p>
        <button
          onClick={handleCreateKit}
          className="bg-purple-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-purple-700 transition"
        >
          Create New Brand Kit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 flex flex-col h-full overflow-hidden">
      {/* Top Selector Card */}
      <div className="bg-slate-50/80 backdrop-blur-md border border-purple-100/50 p-3 rounded-2xl space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Palette className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Brand Manager</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleCreateKit}
              title="Add New Brand Kit"
              className="p-1 rounded-lg hover:bg-purple-100 text-purple-600 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteKit}
              title="Delete Brand Kit"
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Brand Dropdown */}
        <select
          value={selectedKit.id}
          onChange={(e) => setSelectedKit(brandKits.find((k) => k.id === e.target.value) || selectedKit)}
          className="w-full text-xs font-semibold bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {brandKits.map((kit) => (
            <option key={kit.id} value={kit.id}>
              {kit.name}
            </option>
          ))}
        </select>

        {/* Quick Apply Button */}
        <button
          onClick={quickApplyBrandKit}
          disabled={saving}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs py-2 rounded-xl shadow-md shadow-purple-500/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply Brand to Canvas</span>
        </button>
      </div>

      {/* Tab Navigation Grid */}
      <div className="grid grid-cols-4 gap-2 shrink-0 select-none border-b border-purple-100/50 pb-3">
        {TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          const getTabIcon = (id: string) => {
            switch (id) {
              case "overview": return <Info className="w-3.5 h-3.5" />;
              case "logos": return <UploadCloud className="w-3.5 h-3.5" />;
              case "colors": return <Palette className="w-3.5 h-3.5" />;
              case "fonts": return <Type className="w-3.5 h-3.5" />;
              case "gradients": return <Sliders className="w-3.5 h-3.5" />;
              case "voice": return <Volume2 className="w-3.5 h-3.5" />;
              case "assets": return <FileText className="w-3.5 h-3.5" />;
              case "templates": return <Layout className="w-3.5 h-3.5" />;
              default: return <Info className="w-3.5 h-3.5" />;
            }
          };
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center ${
                isActive
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 scale-[1.02]"
                  : "bg-slate-50 text-slate-500 border-purple-100/10 hover:bg-slate-100/70 hover:text-slate-700"
              }`}
            >
              <span className="mb-1">{getTabIcon(tab.id)}</span>
              <span className="text-[9px] font-bold tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-slate-700 pb-12">
        {/* SUBTAB: OVERVIEW */}
        {activeSubTab === "overview" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brand Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-purple-100/70 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Website</label>
              <input
                type="text"
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                className="w-full bg-slate-50 border border-purple-100/70 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tagline</label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full bg-slate-50 border border-purple-100/70 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Industry</label>
              <input
                type="text"
                value={profileForm.industry}
                onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                className="w-full bg-slate-50 border border-purple-100/70 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
              <textarea
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-50 border border-purple-100/70 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Profile Details"}</span>
            </button>
          </div>
        )}

        {/* SUBTAB: LOGOS */}
        {activeSubTab === "logos" && (
          <div className="space-y-4">
            {LOGO_TYPES.map((logo) => {
              const currentUrl = (selectedKit as any)[logo.key];
              return (
                <div key={logo.key} className="space-y-1 bg-slate-50/50 p-2.5 rounded-2xl border border-purple-100/40">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{logo.label}</span>
                  {currentUrl ? (
                    <div className="relative group border border-purple-200 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-slate-100">
                      <div
                        className="absolute inset-0 opacity-40"
                        style={{
                          backgroundImage: "conic-gradient(#cbd5e1 25%, transparent 25% 50%, #cbd5e1 50% 75%, transparent 75%)",
                          backgroundSize: "12px 12px",
                        }}
                      />
                      <img src={currentUrl} className="max-h-20 max-w-[90%] object-contain relative z-5" alt={logo.label} />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2 z-10">
                        <button
                          onClick={() => addLogoToCanvas(currentUrl)}
                          className="bg-white p-1.5 rounded-lg hover:scale-105 transition text-purple-600 font-semibold text-[10px]"
                        >
                          Add Canvas
                        </button>
                        <a
                          href={currentUrl}
                          download={logo.label}
                          className="bg-white p-1.5 rounded-lg hover:scale-105 transition text-slate-600"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleLogoDelete(logo.key)}
                          className="bg-white p-1.5 rounded-lg hover:scale-105 transition text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-purple-200 hover:border-purple-500 hover:bg-purple-50/20 cursor-pointer rounded-xl h-24 flex flex-col items-center justify-center transition">
                      <UploadCloud className="w-6 h-6 text-purple-400 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-400">Upload JPG, PNG, SVG</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && handleLogoUpload(logo.key, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SUBTAB: COLORS */}
        {activeSubTab === "colors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-purple-50/50 p-2 rounded-xl border border-purple-100">
              <span className="text-[10px] font-semibold text-purple-700">AI Palette suggestions</span>
              <button
                onClick={handleAISuggestions}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2.5 py-1 text-[9px] font-bold flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Suggest</span>
              </button>
            </div>

            {/* Colors Swatch list */}
            <div className="space-y-2">
              {selectedKit.colors.map((color) => (
                <div key={color.id} className="p-2.5 rounded-xl border border-purple-100/50 bg-slate-50 flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <button
                      onClick={() => applyColorToCanvas(color.hex)}
                      className="w-8 h-8 rounded-lg border border-purple-200 hover:scale-105 transition shadow-sm shrink-0"
                      style={{ backgroundColor: color.hex }}
                      title="Click to apply fill"
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => updateColorName(color.type, e.target.value)}
                        className="text-[10px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 w-full truncate"
                      />
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{color.type}</span>
                    </div>
                  </div>
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColorHex(color.type, e.target.value)}
                    className="w-6 h-6 border-none cursor-pointer p-0 bg-transparent rounded shrink-0"
                  />
                </div>
              ))}
            </div>

            {/* Accessibility Checker Widget */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-purple-100/80 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WCAG Contrast Checker</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400">Background</span>
                  <select
                    value={contrastBg}
                    onChange={(e) => setContrastBg(e.target.value)}
                    className="w-full text-[10px] bg-white border rounded-lg p-1 text-slate-600 focus:outline-none"
                  >
                    <option value="#FFFFFF">White</option>
                    <option value="#000000">Black</option>
                    {selectedKit.colors.map((c) => (
                      <option key={c.id} value={c.hex}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400">Foreground</span>
                  <select
                    value={contrastFg}
                    onChange={(e) => setContrastFg(e.target.value)}
                    className="w-full text-[10px] bg-white border rounded-lg p-1 text-slate-600 focus:outline-none"
                  >
                    <option value="#000000">Black</option>
                    <option value="#FFFFFF">White</option>
                    {selectedKit.colors.map((c) => (
                      <option key={c.id} value={c.hex}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Score Display */}
              {(() => {
                const ratio = getContrastRatio(contrastBg, contrastFg);
                const isAAPass = ratio >= 4.5;
                const isAAAPass = ratio >= 7.0;
                return (
                  <div className="pt-1.5 flex items-center justify-between border-t border-purple-100/50">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{ratio.toFixed(2)}:1</span>
                      <span className="text-[9px] text-slate-400">Contrast Ratio</span>
                    </div>
                    <div className="flex space-x-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${isAAPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        AA {isAAPass ? "PASS" : "FAIL"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${isAAAPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        AAA {isAAAPass ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* SUBTAB: FONTS */}
        {activeSubTab === "fonts" && (
          <div className="space-y-4">
            {selectedKit.fonts.map((font) => (
              <div key={font.id} className="p-3 bg-slate-50 border border-purple-100/50 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">{font.type}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => applyFontToSelection(font.fontFamily)}
                      title="Apply to active text"
                      className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded hover:bg-purple-200 transition"
                    >
                      Apply Selection
                    </button>
                    <button
                      onClick={() => addFontToCanvas(font)}
                      className="p-1 rounded bg-white border border-purple-100 hover:bg-purple-50 text-slate-600 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Font Form Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400">Family</span>
                    <select
                      value={font.fontFamily}
                      onChange={(e) => updateFontField(font.type, "fontFamily", e.target.value)}
                      className="w-full text-[10px] bg-white border rounded p-1 text-slate-700 focus:outline-none"
                    >
                      {POPULAR_FONTS.map((fn) => (
                        <option key={fn} value={fn}>{fn}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400">Weight</span>
                    <select
                      value={font.weight}
                      onChange={(e) => updateFontField(font.type, "weight", e.target.value)}
                      className="w-full text-[10px] bg-white border rounded p-1 text-slate-700 focus:outline-none"
                    >
                      <option value="300">Light 300</option>
                      <option value="400">Regular 400</option>
                      <option value="500">Medium 500</option>
                      <option value="600">SemiBold 600</option>
                      <option value="700">Bold 700</option>
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400">Size (px)</span>
                    <input
                      type="number"
                      value={font.sizeScale}
                      onChange={(e) => updateFontField(font.type, "sizeScale", parseInt(e.target.value) || 12)}
                      className="w-full text-[10px] bg-white border rounded p-1 text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400">Line Height</span>
                    <input
                      type="number"
                      step="0.1"
                      value={font.lineHeight}
                      onChange={(e) => updateFontField(font.type, "lineHeight", parseFloat(e.target.value) || 1.2)}
                      className="w-full text-[10px] bg-white border rounded p-1 text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="p-2 border border-dashed rounded-lg bg-white overflow-hidden max-h-12 flex items-center">
                  <p
                    style={{
                      fontFamily: font.fontFamily,
                      fontWeight: font.weight,
                      lineHeight: font.lineHeight,
                      letterSpacing: font.letterSpacing + "em",
                      fontSize: Math.min(font.sizeScale, 20) + "px",
                    }}
                    className="truncate text-slate-800"
                  >
                    Quick Brown Fox
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUBTAB: GRADIENTS */}
        {activeSubTab === "gradients" && (
          <div className="space-y-4">
            {/* Gradient Creator Form */}
            <div className="p-3 bg-slate-50 border border-purple-100 rounded-2xl space-y-2.5">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Gradient Builder</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-400">Color Stop 1</span>
                  <input
                    type="color"
                    value={gradStop1}
                    onChange={(e) => setGradStop1(e.target.value)}
                    className="w-full h-7 border cursor-pointer rounded p-0 bg-transparent"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-400">Color Stop 2</span>
                  <input
                    type="color"
                    value={gradStop2}
                    onChange={(e) => setGradStop2(e.target.value)}
                    className="w-full h-7 border cursor-pointer rounded p-0 bg-transparent"
                  />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400">Direction</span>
                <select
                  value={gradDir}
                  onChange={(e) => setGradDir(e.target.value)}
                  className="w-full text-[10px] bg-white border rounded p-1 text-slate-700 focus:outline-none"
                >
                  <option value="to right">To Right (Horizontal)</option>
                  <option value="to bottom">To Bottom (Vertical)</option>
                  <option value="45deg">45° Diagonal</option>
                  <option value="135deg">135° Diagonal</option>
                </select>
              </div>

              {/* Preview Block */}
              <div
                style={{
                  background: `linear-gradient(${gradDir}, ${gradStop1}, ${gradStop2})`,
                }}
                className="h-10 rounded-lg shadow-inner border border-white"
              />

              <button
                onClick={handleSaveGradient}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-1.5 rounded-xl"
              >
                Add Gradient Stops
              </button>
            </div>

            {/* Saved Gradients Library Grid */}
            {selectedKit.gradients && selectedKit.gradients.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gradient Library</span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedKit.gradients.map((g) => {
                    const stopsCss = g.stops.map((s) => `${s.color} ${s.offset}%`).join(", ");
                    const bgStyle = `linear-gradient(${g.direction}, ${stopsCss})`;
                    return (
                      <div key={g.id} className="relative group border border-purple-100 rounded-xl overflow-hidden h-14 cursor-pointer">
                        <div
                          onClick={() => applyGradientToCanvas(g)}
                          style={{ background: bgStyle }}
                          className="w-full h-full"
                          title="Click to apply gradient background"
                        />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-10">
                          <button
                            onClick={() => g.id && handleDeleteGradient(g.id)}
                            className="bg-white/80 backdrop-blur p-0.5 rounded text-rose-600 shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/45 text-white text-[8px] font-semibold px-1 rounded truncate max-w-[90%]">
                          {g.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB: VOICE */}
        {activeSubTab === "voice" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tone</label>
              <select
                value={voiceTone}
                onChange={(e) => setVoiceTone(e.target.value)}
                className="w-full bg-slate-50 border border-purple-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              >
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Luxury">Luxury</option>
                <option value="Minimalist">Minimalist</option>
                <option value="Bold">Bold / Creative</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Writing Style Guide</label>
              <textarea
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value)}
                rows={3}
                placeholder="We write short, crisp declarations. Emphasize value before cost..."
                className="w-full bg-slate-50 border border-purple-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* Keyword Chips */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keywords (Brand Voice)</label>
              <div className="flex flex-wrap gap-1 p-2 border border-purple-100/50 bg-slate-50/50 rounded-xl min-h-12">
                {voiceKeywords.map((kw, idx) => (
                  <span key={idx} className="bg-purple-100 text-purple-700 rounded-lg text-[9px] px-2 py-0.5 font-bold flex items-center space-x-1">
                    <span>{kw}</span>
                    <button onClick={() => setVoiceKeywords(voiceKeywords.filter((k) => k !== kw))}>
                      <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-1">
                <input
                  type="text"
                  placeholder="New keyword"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newKeyword.trim()) {
                      setVoiceKeywords([...voiceKeywords, newKeyword.trim()]);
                      setNewKeyword("");
                    }
                  }}
                  className="flex-1 bg-slate-50 border border-purple-100 rounded-xl px-3 py-1.5 text-xs"
                />
                <button
                  onClick={() => {
                    if (newKeyword.trim()) {
                      setVoiceKeywords([...voiceKeywords, newKeyword.trim()]);
                      setNewKeyword("");
                    }
                  }}
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 rounded-xl text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Values Chips */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Core Brand Values</label>
              <div className="flex flex-wrap gap-1 p-2 border border-purple-100/50 bg-slate-50/50 rounded-xl min-h-12">
                {voiceValues.map((val, idx) => (
                  <span key={idx} className="bg-purple-100 text-purple-700 rounded-lg text-[9px] px-2 py-0.5 font-bold flex items-center space-x-1">
                    <span>{val}</span>
                    <button onClick={() => setVoiceValues(voiceValues.filter((v) => v !== val))}>
                      <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-1">
                <input
                  type="text"
                  placeholder="New core value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newValue.trim()) {
                      setVoiceValues([...voiceValues, newValue.trim()]);
                      setNewValue("");
                    }
                  }}
                  className="flex-1 bg-slate-50 border border-purple-100 rounded-xl px-3 py-1.5 text-xs"
                />
                <button
                  onClick={() => {
                    if (newValue.trim()) {
                      setVoiceValues([...voiceValues, newValue.trim()]);
                      setNewValue("");
                    }
                  }}
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 rounded-xl text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            <button
              onClick={saveVoice}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Brand Guidelines"}</span>
            </button>
          </div>
        )}

        {/* SUBTAB: ASSETS */}
        {activeSubTab === "assets" && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search assets by tag or name..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="w-full bg-slate-50 border border-purple-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex space-x-1.5 select-none overflow-x-auto pb-1">
                {["ALL", "IMAGE", "ICON"].map((fl) => (
                  <button
                    key={fl}
                    onClick={() => setAssetFilter(fl)}
                    className={`px-2.5 py-1 rounded text-[9px] font-bold transition ${
                      assetFilter === fl
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {fl}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Drag & Drop upload */}
            <label className="border border-dashed border-purple-200 hover:border-purple-500 hover:bg-purple-50/20 cursor-pointer rounded-2xl h-20 flex flex-col items-center justify-center transition shrink-0 select-none">
              <UploadCloud className="w-5 h-5 text-purple-400 mb-0.5" />
              <span className="text-[10px] font-bold text-slate-400">Upload Illustrations & Icons</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleAssetUpload(e.target.files[0])}
                className="hidden"
              />
            </label>

            {/* Asset Grid Display */}
            {(() => {
              const filtered = (selectedKit.assets || []).filter((a) => {
                const matchesSearch =
                  a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
                  (a.tags && a.tags.some((t) => t.toLowerCase().includes(assetSearch.toLowerCase())));
                const matchesFilter = assetFilter === "ALL" || a.type === assetFilter;
                return matchesSearch && matchesFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">
                    No brand assets found matching filters.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((asset, idx) => (
                    <div key={idx} className="relative group border border-purple-100 bg-slate-50/30 rounded-xl overflow-hidden h-24 flex items-center justify-center">
                      <img src={asset.assetUrl} className="max-h-20 max-w-[90%] object-contain" alt={asset.name} />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-1">
                        <button
                          onClick={() => addLogoToCanvas(asset.assetUrl)}
                          className="bg-white text-purple-700 font-bold px-2 py-1 rounded text-[9px] hover:scale-105 transition"
                        >
                          Add Canvas
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.assetUrl)}
                          className="bg-white text-rose-600 p-1 rounded hover:scale-105 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* SUBTAB: TEMPLATES */}
        {activeSubTab === "templates" && (
          <div className="space-y-4">
            <button
              onClick={saveCurrentCanvasAsTemplate}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl shadow"
            >
              <Layout className="w-4 h-4" />
              <span>Save Canvas as Template</span>
            </button>

            {/* Templates library grid */}
            {selectedKit.templates && selectedKit.templates.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedKit.templates.map((tpl) => (
                  <div key={tpl.id} className="relative group border border-purple-100 rounded-xl overflow-hidden h-28 bg-slate-100 flex flex-col justify-end">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 p-2 text-center text-[9px] select-none pointer-events-none">
                      {tpl.width} x {tpl.height} Canvas Model
                    </div>
                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-1 z-10">
                      <button
                        onClick={() => loadTemplate(tpl)}
                        className="bg-white text-purple-700 font-bold px-2 py-1 rounded text-[9px]"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => tpl.id && handleDeleteTemplate(tpl.id)}
                        className="bg-white text-rose-600 p-1.5 rounded hover:scale-105 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="bg-white p-1.5 border-t text-[9px] font-bold text-slate-700 truncate z-5 relative">
                      {tpl.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[10px] text-slate-400 font-semibold border border-dashed rounded-2xl p-4">
                No templates saved yet. Design something on the canvas and click "Save Canvas as Template".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
