import React, { useState, useEffect } from "react";
import {
  Search, Star, Clock, Folder, Smartphone, Laptop, Tablet, Monitor,
  Image, Grid, Play, Type, Sparkles, Plus, Crown, Trophy, Rocket,
  Heart, CheckCircle2, ChevronRight, Layout, Sliders, Volume2,
  Palette, FileText, Info, Layers, RefreshCw, X, ArrowRight, Grid3X3, Trash2,
  Bookmark, Award, ThumbsUp, HelpCircle, Check, ArrowUpRight
} from "lucide-react";
import { fabric } from "fabric";

interface ElementItem {
  id: string;
  name: string;
  category: "shape" | "line" | "icon" | "sticker" | "illustration" | "text" | "frame" | "grid" | "component";
  type: string;
  path?: string; // For SVG paths
  previewColor?: string;
  iconName?: string;
  textStyles?: any; // For text presets
  customDraw?: (canvas: fabric.Canvas) => void; // For complex shapes/grids
}

interface ElementsPanelProps {
  canvas: fabric.Canvas | null;
}

const SHAPE_CATEGORIES = [
  { id: "BASIC", label: "Basic Shapes" },
  { id: "ADVANCED", label: "Advanced Shapes" },
];

const GRAPHIC_CATEGORIES = [
  { id: "ICON", label: "Icons" },
  { id: "STICKER", label: "Stickers" },
  { id: "ILLUSTRATION", label: "Illustrations" },
];

const TEXT_CATEGORIES = [
  { id: "BASIC", label: "Basic Text" },
  { id: "PROFESSIONAL", label: "Professional Layouts" },
  { id: "SOCIAL", label: "Social Media headers" },
];

// Placeholder nature image pattern for frames/mockups
const LANDSCAPE_IMAGE_PLACEHOLDER = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop";

export const ElementsPanel: React.FC<ElementsPanelProps> = ({ canvas }) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<ElementItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); // Starred Element IDs

  // Load favorites & recents from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedFavs = localStorage.getItem("starred_elements");
      if (storedFavs) {
        try { setFavorites(JSON.parse(storedFavs)); } catch {}
      }
      const storedRecents = localStorage.getItem("recent_elements");
      if (storedRecents) {
        try { setRecentlyUsed(JSON.parse(storedRecents)); } catch {}
      }
      const storedSearches = localStorage.getItem("recent_searches");
      if (storedSearches) {
        try { setRecentSearches(JSON.parse(storedSearches)); } catch {}
      }
    }
  }, []);

  const saveFavoritesToStorage = (updated: string[]) => {
    setFavorites(updated);
    localStorage.setItem("starred_elements", JSON.stringify(updated));
  };

  const saveRecentsToStorage = (updated: ElementItem[]) => {
    setRecentlyUsed(updated);
    localStorage.setItem("recent_elements", JSON.stringify(updated));
  };

  const handleSearchSubmit = (q: string) => {
    if (!q.trim()) return;
    const filtered = recentSearches.filter((s) => s !== q);
    const updated = [q, ...filtered].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
    setSearchQuery(q);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_searches");
  };

  // Toggle Favorite Elements
  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      saveFavoritesToStorage(favorites.filter((f) => f !== id));
    } else {
      saveFavoritesToStorage([...favorites, id]);
    }
  };

  // Track Recently Used Elements
  const trackRecentlyUsed = (item: ElementItem) => {
    const filtered = recentlyUsed.filter((r) => r.id !== item.id);
    const updated = [item, ...filtered].slice(0, 12);
    saveRecentsToStorage(updated);
  };

  // SVG Paths database for Basic and Advanced shapes
  const SHAPES_ITEMS: ElementItem[] = [
    // Basic Shapes
    { id: "shape_rect", name: "Rectangle", category: "shape", type: "rectangle", previewColor: "#3B82F6" },
    { id: "shape_rounded_rect", name: "Rounded Rectangle", category: "shape", type: "rounded_rect", previewColor: "#6366F1" },
    { id: "shape_circle", name: "Circle", category: "shape", type: "circle", previewColor: "#10B981" },
    { id: "shape_ellipse", name: "Ellipse", category: "shape", type: "ellipse", previewColor: "#14B8A6" },
    { id: "shape_triangle", name: "Triangle", category: "shape", type: "triangle", previewColor: "#F59E0B" },
    { id: "shape_diamond", name: "Diamond", category: "shape", type: "diamond", path: "M 100 0 L 200 100 L 100 200 L 0 100 Z", previewColor: "#EF4444" },
    { id: "shape_pentagon", name: "Pentagon", category: "shape", type: "pentagon", path: "M 100 0 L 195 69 L 159 181 L 41 181 L 5 69 Z", previewColor: "#EC4899" },
    { id: "shape_hexagon", name: "Hexagon", category: "shape", type: "hexagon", path: "M 100 0 L 187 50 L 187 150 L 100 200 L 13 150 L 13 50 Z", previewColor: "#8B5CF6" },
    { id: "shape_octagon", name: "Octagon", category: "shape", type: "octagon", path: "M 70 0 L 130 0 L 200 70 L 200 130 L 130 200 L 70 200 L 0 130 L 0 70 Z", previewColor: "#F43F5E" },
    { id: "shape_star", name: "Star", category: "shape", type: "star", path: "M 100 0 L 129 62 L 195 62 L 142 103 L 163 167 L 100 125 L 37 167 L 58 103 L 5 62 L 71 62 Z", previewColor: "#EAB308" },
    { id: "shape_heart", name: "Heart", category: "shape", type: "heart", path: "M 10 30 A 20 20 0, 0, 1, 50 30 A 20 20 0, 0, 1, 90 30 Q 90 60, 50 90 Q 10 60, 10 30 Z", previewColor: "#F43F5E" },
    
    // Advanced Shapes
    { id: "shape_speech", name: "Speech Bubble", category: "shape", type: "speech", path: "M 10 10 h 80 v 40 h -45 l -15 15 v -15 h -20 z", previewColor: "#3B82F6" },
    { id: "shape_ribbon", name: "Ribbon", category: "shape", type: "ribbon", path: "M 10 10 h 80 l -10 15 l 10 15 h -80 l 10 -15 z", previewColor: "#F59E0B" },
    { id: "shape_banner", name: "Banner", category: "shape", type: "banner", path: "M 10 20 l 20 -10 h 140 l 20 10 v 30 l -20 -10 h -140 l -20 10 z", previewColor: "#EC4899" },
    { id: "shape_cloud", name: "Cloud", category: "shape", type: "cloud", path: "M 17 21 A 6 6 0 0 1 11 15 A 7 7 0 0 1 18 8 A 9 9 0 0 1 35 11 A 6 6 0 0 1 41 17 A 5 5 0 0 1 36 22 Z", previewColor: "#60A5FA" },
    { id: "shape_arrow", name: "Arrow Shape", category: "shape", type: "arrow", path: "M 0 40 h 60 v -20 l 40 30 l -40 30 v -20 h -60 z", previewColor: "#10B981" },
    { id: "shape_callout", name: "Callout Banner", category: "shape", type: "callout", path: "M 10 10 h 80 v 40 h -40 l -10 10 v -10 h -30 z", previewColor: "#8B5CF6" },
    { id: "shape_label", name: "Label Card", category: "shape", type: "label", path: "M 20 10 h 60 a 10 10 0 0 1 10 10 v 20 a 10 10 0 0 1 -10 10 h -60 a 10 10 0 0 1 -10 -10 v -20 a 10 10 0 0 1 10 -10 z", previewColor: "#14B8A6" },
    { id: "shape_tag", name: "Price Tag", category: "shape", type: "tag", path: "M 10 10 h 50 l 20 20 l -20 20 h -50 z", previewColor: "#EF4444" },
  ];

  const LINES_ITEMS: ElementItem[] = [
    { id: "line_straight", name: "Straight Line", category: "line", type: "straight" },
    { id: "line_curved", name: "Curved Line", category: "line", type: "curved" },
    { id: "line_dotted", name: "Dotted Line", category: "line", type: "dotted" },
    { id: "line_arrow_single", name: "Single Arrow Line", category: "line", type: "arrow_single" },
    { id: "line_arrow_double", name: "Double Arrow Line", category: "line", type: "arrow_double" },
    { id: "line_arrow_curved", name: "Curved Arrow Line", category: "line", type: "arrow_curved" },
  ];

  const GRAPHICS_ITEMS: ElementItem[] = [
    // Icons
    { id: "icon_briefcase", name: "Business Case", category: "icon", type: "briefcase", iconName: "Business" },
    { id: "icon_chart", name: "Marketing Analytics", category: "icon", type: "chart", iconName: "Marketing" },
    { id: "icon_cpu", name: "Technology CPU", category: "icon", type: "cpu", iconName: "Technology" },
    { id: "icon_dollar", name: "Finance Dollar", category: "icon", type: "dollar", iconName: "Finance" },
    { id: "icon_heart", name: "Healthcare Heart", category: "icon", type: "heart", iconName: "Healthcare" },
    { id: "icon_book", name: "Education Book", category: "icon", type: "book", iconName: "Education" },
    { id: "icon_share", name: "Social Media Share", category: "icon", type: "share", iconName: "Social Media" },
    { id: "icon_cart", name: "E-commerce Cart", category: "icon", type: "cart", iconName: "E-commerce" },
    { id: "icon_plane", name: "Travel Plane", category: "icon", type: "plane", iconName: "Travel" },
    { id: "icon_coffee", name: "Food Coffee", category: "icon", type: "coffee", iconName: "Food" },

    // Stickers
    { id: "sticker_sparkles", name: "Sparkles Glow", category: "sticker", type: "sparkles", previewColor: "#EAB308" },
    { id: "sticker_fire", name: "Fire Flame", category: "sticker", type: "fire", previewColor: "#EF4444" },
    { id: "sticker_crown", name: "Royal Crown", category: "sticker", type: "crown", previewColor: "#F59E0B" },
    { id: "sticker_trophy", name: "Trophy Award", category: "sticker", type: "trophy", previewColor: "#EAB308" },
    { id: "sticker_rocket", name: "Rocket Launch", category: "sticker", type: "rocket", previewColor: "#3B82F6" },
    { id: "sticker_like", name: "Thumbs Up Like", category: "sticker", type: "like", previewColor: "#10B981" },
    { id: "sticker_heart", name: "Verified Heart", category: "sticker", type: "heart_verify", previewColor: "#EC4899" },
    { id: "sticker_verify", name: "Verified Badge", category: "sticker", type: "verify_badge", previewColor: "#60A5FA" },

    // Illustrations
    { id: "ill_remote", name: "Remote Work Office", category: "illustration", type: "remote", previewColor: "#6366F1" },
    { id: "ill_ai", name: "AI Brain Intelligence", category: "illustration", type: "ai", previewColor: "#EC4899" },
    { id: "ill_marketing", name: "Social Marketing Strategy", category: "illustration", type: "marketing", previewColor: "#10B981" },
    { id: "ill_education", name: "E-Learning Graduation", category: "illustration", type: "education", previewColor: "#F59E0B" },
  ];

  const TEXT_ITEMS: ElementItem[] = [
    // Basic Text
    { id: "text_h1", name: "Add Heading", category: "text", type: "h1", textStyles: { fontSize: 48, fontWeight: "bold", fontFamily: "Outfit" } },
    { id: "text_h2", name: "Add Subheading", category: "text", type: "h2", textStyles: { fontSize: 28, fontWeight: "semibold", fontFamily: "Outfit" } },
    { id: "text_body", name: "Add Body Text", category: "text", type: "body", textStyles: { fontSize: 16, fontWeight: "normal", fontFamily: "Inter" } },

    // Professional Layouts
    { id: "text_hero", name: "Hero Title Bold", category: "text", type: "hero", textStyles: { fontSize: 64, fontWeight: "extrabold", fontFamily: "Outfit", fill: "#6366F1" } },
    { id: "text_quote", name: "Quote & Quotations", category: "text", type: "quote", textStyles: { fontSize: 20, fontStyle: "italic", fontFamily: "Lora", fill: "#475569" } },
    { id: "text_cta", name: "Call To Action Text", category: "text", type: "cta", textStyles: { fontSize: 24, fontWeight: "bold", fontFamily: "Outfit", fill: "#EC4899", charSpacing: 100 } },
    { id: "text_pricing", name: "Product Pricing text", category: "text", type: "price", textStyles: { fontSize: 54, fontWeight: "extrabold", fontFamily: "Outfit", fill: "#1E293B" } },

    // Social Media
    { id: "text_insta", name: "Instagram Bold Post", category: "text", type: "insta", textStyles: { fontSize: 36, fontFamily: "Outfit", fontWeight: "bold", fill: "#F43F5E" } },
    { id: "text_yt", name: "YouTube Thumbnail banner", category: "text", type: "yt", textStyles: { fontSize: 44, fontFamily: "Oswald", fontWeight: "black", fill: "#FFFFFF", stroke: "#000000", strokeWidth: 2 } },
  ];

  const FRAMES_ITEMS: ElementItem[] = [
    // Photo Frames
    { id: "frame_circle", name: "Circle Photo Frame", category: "frame", type: "circle" },
    { id: "frame_square", name: "Square Photo Frame", category: "frame", type: "square" },
    { id: "frame_rounded", name: "Rounded Photo Frame", category: "frame", type: "rounded" },

    // Device Mockups
    { id: "mock_phone", name: "Mobile Phone Mockup", category: "frame", type: "phone" },
    { id: "mock_tablet", name: "Tablet Mockup", category: "frame", type: "tablet" },
    { id: "mock_laptop", name: "Laptop Device Mockup", category: "frame", type: "laptop" },

    // Photo Layouts / Grids
    { id: "grid_2col", name: "2 Column Photo Grid", category: "grid", type: "2col" },
    { id: "grid_3col", name: "3 Column Photo Grid", category: "grid", type: "3col" },
    { id: "grid_collage", name: "Portfolio Grid Collage", category: "grid", type: "collage" },
  ];

  const COMPONENTS_ITEMS: ElementItem[] = [
    { id: "comp_button", name: "Premium Pill Button", category: "component", type: "button" },
    { id: "comp_pricing_card", name: "Pricing Display Card", category: "component", type: "pricing_card" },
    { id: "comp_testimonial", name: "Customer Testimonial Block", category: "component", type: "testimonial" },
    { id: "comp_stats", name: "Dashboard Statistics block", category: "component", type: "stats" },
  ];

  // Combine database for Search
  const ALL_ITEMS = [
    ...SHAPES_ITEMS,
    ...LINES_ITEMS,
    ...GRAPHICS_ITEMS,
    ...TEXT_ITEMS,
    ...FRAMES_ITEMS,
    ...COMPONENTS_ITEMS,
  ];

  // Insert Operations
  const handleInsertElement = (item: ElementItem) => {
    if (!canvas) return;
    trackRecentlyUsed(item);

    const center = canvas.getVpCenter();
    const left = center.x - 75;
    const top = center.y - 75;

    // A. Vector Shapes
    if (item.category === "shape") {
      let shapeObj: fabric.Object;

      if (item.type === "rectangle") {
        shapeObj = new fabric.Rect({
          left,
          top,
          width: 150,
          height: 100,
          fill: item.previewColor || "#6366F1",
          rx: 0,
          ry: 0,
        });
      } else if (item.type === "rounded_rect") {
        shapeObj = new fabric.Rect({
          left,
          top,
          width: 150,
          height: 100,
          fill: item.previewColor || "#6366F1",
          rx: 15,
          ry: 15,
        });
      } else if (item.type === "circle") {
        shapeObj = new fabric.Circle({
          left,
          top,
          radius: 60,
          fill: item.previewColor || "#10B981",
        });
      } else if (item.type === "ellipse") {
        shapeObj = new fabric.Ellipse({
          left,
          top,
          rx: 75,
          ry: 45,
          fill: item.previewColor || "#14B8A6",
        });
      } else if (item.type === "triangle") {
        shapeObj = new fabric.Triangle({
          left,
          top,
          width: 120,
          height: 100,
          fill: item.previewColor || "#F59E0B",
        });
      } else {
        // Path based shapes
        shapeObj = new fabric.Path(item.path || "", {
          left,
          top,
          fill: item.previewColor || "#EF4444",
        });
        // Scale to normalize size bounds
        shapeObj.scaleToWidth(120);
      }

      canvas.add(shapeObj);
      canvas.setActiveObject(shapeObj);
      canvas.renderAll();
    }

    // B. Lines & Arrows
    else if (item.category === "line") {
      let lineObj: fabric.Object;

      if (item.type === "straight") {
        lineObj = new fabric.Line([left, top + 50, left + 150, top + 50], {
          stroke: "#1E293B",
          strokeWidth: 4,
        });
      } else if (item.type === "dotted") {
        lineObj = new fabric.Line([left, top + 50, left + 150, top + 50], {
          stroke: "#475569",
          strokeWidth: 4,
          strokeDashArray: [8, 8],
        });
      } else if (item.type === "curved") {
        lineObj = new fabric.Path("M 0 50 Q 75 0, 150 50", {
          left,
          top,
          fill: "transparent",
          stroke: "#6366F1",
          strokeWidth: 4,
        });
      } else if (item.type === "arrow_single") {
        lineObj = new fabric.Path("M 0 10 L 80 10 L 70 0 M 80 10 L 70 20", {
          left,
          top,
          fill: "transparent",
          stroke: "#1E293B",
          strokeWidth: 4,
        });
        lineObj.scaleToWidth(120);
      } else if (item.type === "arrow_double") {
        lineObj = new fabric.Path("M 10 10 L 0 20 L 10 30 M 0 20 L 100 20 L 90 10 L 100 20 L 90 30", {
          left,
          top,
          fill: "transparent",
          stroke: "#1E293B",
          strokeWidth: 4,
        });
        lineObj.scaleToWidth(140);
      } else {
        // Curved arrow
        lineObj = new fabric.Path("M 0 50 Q 60 10, 120 50 m -15 -5 l 15 5 l -5 -15", {
          left,
          top,
          fill: "transparent",
          stroke: "#EC4899",
          strokeWidth: 4,
        });
      }

      canvas.add(lineObj);
      canvas.setActiveObject(lineObj);
      canvas.renderAll();
    }

    // C. Text Presets
    else if (item.category === "text") {
      const textVal = item.type === "quote" ? "“A premium design system changes how campaigns are launched.”"
                    : item.type === "yt" ? "THUMBNAIL TEXT"
                    : item.name;
      const txt = new fabric.IText(textVal, {
        left,
        top,
        ...item.textStyles,
      });

      canvas.add(txt);
      canvas.setActiveObject(txt);
      canvas.renderAll();
    }

    // D. Graphics (Icons, Stickers, Illustrations)
    else if (item.category === "icon" || item.category === "sticker" || item.category === "illustration") {
      // Create high quality shapes/paths
      let pathStr = "M 50 10 L 90 90 L 10 90 Z"; // Fallback triangle

      if (item.type === "sparkles") {
        pathStr = "M 20 0 L 25 15 L 40 20 L 25 25 L 20 40 L 15 25 L 0 20 L 15 15 Z";
      } else if (item.type === "fire") {
        pathStr = "M 25 5 C 25 5, 40 18, 40 28 C 40 36, 33 42, 25 42 C 17 42, 10 36, 10 28 C 10 20, 25 5, 25 5 Z";
      } else if (item.type === "crown") {
        pathStr = "M 5 35 L 10 15 L 20 25 L 30 10 L 40 25 L 50 15 L 55 35 Z";
      } else if (item.type === "rocket") {
        pathStr = "M 20 5 L 30 15 L 30 30 L 35 35 L 25 35 L 20 45 L 15 35 L 5 35 L 10 30 L 10 15 Z";
      } else if (item.type === "verify_badge") {
        pathStr = "M 12 2 L 15 5 L 19 4 L 19 8 L 22 11 L 19 14 L 19 18 L 15 17 L 12 20 L 9 17 L 5 18 L 5 14 L 2 11 L 5 8 L 5 4 L 9 5 Z";
      } else if (item.type === "like") {
        pathStr = "M 5 20 h 5 v 20 h -5 z M 12 20 l 5 -12 a 3 3 0 0 1 6 0 v 6 h 12 a 3 3 0 0 1 0 6 l -5 10 h -18 z";
      } else if (item.type === "cpu") {
        pathStr = "M 10 10 h 30 v 30 h -30 z m -5 10 h 5 m -5 10 h 5 m 30 -10 h 5 m -5 10 h 5";
      } else if (item.type === "cart") {
        pathStr = "M 5 10 h 10 l 10 20 h 20 l 8 -12 h -33";
      }

      const graphicPath = new fabric.Path(pathStr, {
        left,
        top,
        fill: item.previewColor || "#6366F1",
      });
      graphicPath.scaleToWidth(100);

      canvas.add(graphicPath);
      canvas.setActiveObject(graphicPath);
      canvas.renderAll();
    }

    // E. Frames & Mockups (Patterns Image Fills)
    else if (item.category === "frame") {
      fabric.util.loadImage(LANDSCAPE_IMAGE_PLACEHOLDER, (img) => {
        const pattern = new fabric.Pattern({
          source: img,
          repeat: "no-repeat",
        });

        // Set scale for pattern to fit bounding dimensions
        const patternScale = 150 / img.width!;
        pattern.patternTransform = [patternScale, 0, 0, patternScale, 0, 0];

        let frameObj: fabric.Object;

        if (item.type === "circle") {
          frameObj = new fabric.Circle({
            left,
            top,
            radius: 75,
            fill: pattern,
            stroke: "#cbd5e1",
            strokeWidth: 3,
          });
        } else if (item.type === "phone") {
          // Group mobile frame
          const screenRect = new fabric.Rect({
            left: left + 10,
            top: top + 10,
            width: 100,
            height: 180,
            fill: pattern,
          });
          const deviceBorder = new fabric.Rect({
            left,
            top,
            width: 120,
            height: 200,
            fill: "transparent",
            stroke: "#1E293B",
            strokeWidth: 8,
            rx: 20,
            ry: 20,
          });
          frameObj = new fabric.Group([screenRect, deviceBorder], {
            left,
            top,
          });
        } else if (item.type === "laptop") {
          const screen = new fabric.Rect({
            left: left + 10,
            top: top + 10,
            width: 180,
            height: 110,
            fill: pattern,
          });
          const metalBorder = new fabric.Rect({
            left,
            top,
            width: 200,
            height: 130,
            fill: "transparent",
            stroke: "#475569",
            strokeWidth: 8,
            rx: 8,
            ry: 8,
          });
          const base = new fabric.Rect({
            left: left - 20,
            top: top + 125,
            width: 240,
            height: 10,
            fill: "#cbd5e1",
            rx: 2,
            ry: 2,
          });
          frameObj = new fabric.Group([screen, metalBorder, base], {
            left,
            top,
          });
        } else {
          // Standard Square Frame
          frameObj = new fabric.Rect({
            left,
            top,
            width: 150,
            height: 150,
            fill: pattern,
            stroke: "#cbd5e1",
            strokeWidth: 2,
            rx: 6,
            ry: 6,
          });
        }

        canvas.add(frameObj);
        canvas.setActiveObject(frameObj);
        canvas.renderAll();
      }, { crossOrigin: "anonymous" });
    }

    // F. Photo Layouts / Grids
    else if (item.category === "grid") {
      fabric.util.loadImage(LANDSCAPE_IMAGE_PLACEHOLDER, (img) => {
        const pattern = new fabric.Pattern({
          source: img,
          repeat: "no-repeat",
        });
        const patternScale = 120 / img.width!;
        pattern.patternTransform = [patternScale, 0, 0, patternScale, 0, 0];

        let gridGroup: fabric.Group;

        if (item.type === "2col") {
          const col1 = new fabric.Rect({ left: left, top, width: 95, height: 180, fill: pattern, stroke: "#ffffff", strokeWidth: 2 });
          const col2 = new fabric.Rect({ left: left + 100, top, width: 95, height: 180, fill: pattern, stroke: "#ffffff", strokeWidth: 2 });
          gridGroup = new fabric.Group([col1, col2]);
        } else if (item.type === "3col") {
          const col1 = new fabric.Rect({ left: left, top, width: 63, height: 180, fill: pattern, stroke: "#ffffff", strokeWidth: 2 });
          const col2 = new fabric.Rect({ left: left + 66, top, width: 63, height: 180, fill: pattern, stroke: "#ffffff", strokeWidth: 2 });
          const col3 = new fabric.Rect({ left: left + 132, top, width: 63, height: 180, fill: pattern, stroke: "#ffffff", strokeWidth: 2 });
          gridGroup = new fabric.Group([col1, col2, col3]);
        } else {
          // Collage (Grid panel layout)
          const leftRect = new fabric.Rect({ left: left, top, width: 98, height: 180, fill: pattern, stroke: "#ffffff", strokeWidth: 2 });
          const topRight = new fabric.Rect({ left: left + 102, top, width: 98, height: 88, fill: pattern, stroke: "#ffffff", strokeWidth: 2 });
          const bottomRight = new fabric.Rect({ left: left + 102, top: top + 92, width: 98, height: 88, fill: pattern, stroke: "#ffffff", strokeWidth: 2 });
          gridGroup = new fabric.Group([leftRect, topRight, bottomRight]);
        }

        canvas.add(gridGroup);
        canvas.setActiveObject(gridGroup);
        canvas.renderAll();
      }, { crossOrigin: "anonymous" });
    }

    // G. Premade Components (Assembled elements groups)
    else if (item.category === "component") {
      let componentGroup: fabric.Group;

      if (item.type === "button") {
        const bg = new fabric.Rect({
          width: 160,
          height: 48,
          fill: "#6366F1",
          rx: 24,
          ry: 24,
        });
        const text = new fabric.IText("GET STARTED", {
          fontSize: 14,
          fontWeight: "bold",
          fontFamily: "Outfit",
          fill: "#FFFFFF",
          originX: "center",
          originY: "center",
          left: 80,
          top: 24,
        });
        componentGroup = new fabric.Group([bg, text], { left, top });
      } else if (item.type === "stats") {
        const bg = new fabric.Rect({
          width: 180,
          height: 100,
          fill: "#F8FAFC",
          stroke: "#E2E8F0",
          strokeWidth: 1.5,
          rx: 16,
          ry: 16,
        });
        const numText = new fabric.IText("99.9%", {
          fontSize: 36,
          fontWeight: "bold",
          fontFamily: "Outfit",
          fill: "#10B981",
          left: 15,
          top: 15,
        });
        const lblText = new fabric.IText("Platform Uptime rate", {
          fontSize: 11,
          fontWeight: "semibold",
          fontFamily: "Inter",
          fill: "#64748B",
          left: 15,
          top: 60,
        });
        componentGroup = new fabric.Group([bg, numText, lblText], { left, top });
      } else {
        // Standard Simple Pricing Card component
        const bg = new fabric.Rect({
          width: 200,
          height: 220,
          fill: "#FFFFFF",
          stroke: "#E2E8F0",
          strokeWidth: 2,
          rx: 16,
          ry: 16,
        });
        const titleText = new fabric.IText("STANDARD", { fontSize: 12, fontWeight: "bold", fontFamily: "Outfit", fill: "#6366F1", left: 20, top: 20 });
        const valText = new fabric.IText("$49/mo", { fontSize: 32, fontWeight: "extrabold", fontFamily: "Outfit", fill: "#1E293B", left: 20, top: 40 });
        const feature1 = new fabric.IText("• 5 Brand Profiles", { fontSize: 10, fontFamily: "Inter", fill: "#475569", left: 20, top: 90 });
        const feature2 = new fabric.IText("• Auto AI Color Generator", { fontSize: 10, fontFamily: "Inter", fill: "#475569", left: 20, top: 110 });
        
        const btnBg = new fabric.Rect({ width: 160, height: 32, fill: "#1E293B", rx: 8, ry: 8, left: 20, top: 155 });
        const btnTxt = new fabric.IText("UPGRADE", { fontSize: 10, fontWeight: "bold", fontFamily: "Outfit", fill: "#FFFFFF", left: 75, top: 165 });
        
        componentGroup = new fabric.Group([bg, titleText, valText, feature1, feature2, btnBg, btnTxt], { left, top });
      }

      canvas.add(componentGroup);
      canvas.setActiveObject(componentGroup);
      canvas.renderAll();
    }
  };

  // Search filter
  const getSearchedItems = () => {
    if (!searchQuery.trim()) return [];
    return ALL_ITEMS.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const searchResults = getSearchedItems();

  return (
    <div className="space-y-4 flex flex-col h-full overflow-hidden text-slate-700">
      
      {/* Top Search Bar */}
      <div className="relative shrink-0">
        <input
          type="text"
          placeholder="Search elements, shapes, stickers, frames..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(searchQuery)}
          className="w-full bg-slate-50 border border-purple-100 rounded-xl pl-9 pr-8 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Recent Searches (only visible when typing or searching) */}
      {!searchQuery && recentSearches.length > 0 && (
        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-purple-100/30 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Recent Searches</span>
            <button onClick={clearRecentSearches} className="text-[8px] font-bold text-rose-500">Clear</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {recentSearches.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(s)}
                className="bg-white hover:bg-purple-50 text-[10px] text-slate-600 px-2 py-0.5 rounded border border-purple-100/30 flex items-center space-x-1"
              >
                <span>{s}</span>
                <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs navigation grid (Canva style icons) */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0 select-none border-b border-purple-100/50 pb-2.5">
        {[
          { id: "all", label: "All Assets", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
          { id: "shapes", label: "Shapes", icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: "graphics", label: "Graphics", icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: "text", label: "Text Styles", icon: <Type className="w-3.5 h-3.5" /> },
          { id: "frames", label: "Frames", icon: <Laptop className="w-3.5 h-3.5" /> },
          { id: "components", label: "Components", icon: <Layout className="w-3.5 h-3.5" /> },
          { id: "favorites", label: "Favorites", icon: <Star className="w-3.5 h-3.5" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
              }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all text-center ${
                isActive
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-slate-50 text-slate-500 border-purple-100/10 hover:bg-slate-100/70 hover:text-slate-700"
              }`}
            >
              <span className="mb-0.5">{tab.icon}</span>
              <span className="text-[8px] font-bold tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Elements Display Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-12">
        {/* VIEW: SEARCH RESULTS */}
        {searchQuery && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Search Results ({searchResults.length})
            </h4>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching elements found. Try shapes or headers.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="relative group border border-purple-100 bg-white hover:bg-purple-50/20 cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center h-20 transition"
                  >
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-10">
                      <button onClick={(e) => toggleFavorite(e, item.id)}>
                        <Star className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                      </button>
                    </div>
                    {item.category === "shape" && (
                      <div className="w-8 h-8 rounded border border-purple-100" style={{ backgroundColor: item.previewColor }} />
                    )}
                    {item.category === "text" && <Type className="w-6 h-6 text-purple-600" />}
                    {item.category === "line" && <Sliders className="w-6 h-6 text-slate-400" />}
                    {item.category === "frame" && <Monitor className="w-6 h-6 text-teal-600" />}
                    {item.category === "component" && <Layout className="w-6 h-6 text-indigo-500" />}
                    {["icon", "sticker", "illustration"].includes(item.category) && <Sparkles className="w-6 h-6 text-pink-500" />}
                    <span className="text-[9px] font-bold text-slate-600 mt-1.5 text-center truncate w-full">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: ALL TAB */}
        {activeTab === "all" && !searchQuery && (
          <div className="space-y-5">
            {/* Recently Used Horizontal List */}
            {recentlyUsed.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recently Used</span>
                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none select-none">
                  {recentlyUsed.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleInsertElement(item)}
                      className="bg-slate-50 hover:bg-purple-50/30 border border-purple-100/50 p-2 rounded-lg text-center flex flex-col items-center justify-center shrink-0 w-16 h-16 transition"
                    >
                      {item.category === "shape" ? (
                        <div className="w-6 h-6 rounded border border-purple-100" style={{ backgroundColor: item.previewColor }} />
                      ) : (
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      )}
                      <span className="text-[8px] font-bold text-slate-500 truncate w-full mt-1">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Grid of Shapes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shapes Quick Add</span>
                <button onClick={() => setActiveTab("shapes")} className="text-[9px] font-bold text-purple-600 hover:text-purple-800 transition">See All</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SHAPES_ITEMS.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="aspect-square bg-slate-50 hover:bg-purple-50/40 border border-purple-100/40 rounded-xl flex items-center justify-center transition group relative"
                  >
                    <div className="w-8 h-8 rounded border border-purple-200" style={{ backgroundColor: item.previewColor }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Graphics Spotlight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Graphics Marketplace</span>
                <button onClick={() => setActiveTab("graphics")} className="text-[9px] font-bold text-purple-600 hover:text-purple-800 transition">See All</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {GRAPHICS_ITEMS.slice(10, 14).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="p-3 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 rounded-xl flex flex-col items-center justify-center h-20 transition"
                  >
                    <Sparkles className="w-6 h-6 text-pink-500" />
                    <span className="text-[9px] font-bold mt-1.5 text-slate-600">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Components Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Premade Components</span>
                <button onClick={() => setActiveTab("components")} className="text-[9px] font-bold text-purple-600 hover:text-purple-800 transition">See All</button>
              </div>
              <div className="space-y-2">
                {COMPONENTS_ITEMS.slice(0, 2).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="w-full bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 px-4 py-3 rounded-xl flex justify-between items-center transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Layout className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-bold text-slate-700">{item.name}</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SHAPES & LINES TAB */}
        {activeTab === "shapes" && (
          <div className="space-y-6">
            {/* Basic Shapes */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Basic Vector Shapes</span>
              <div className="grid grid-cols-3 gap-2">
                {SHAPES_ITEMS.slice(0, 11).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="relative group border border-purple-100 bg-white hover:bg-purple-50/20 cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center h-20 transition"
                  >
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-10">
                      <button onClick={(e) => toggleFavorite(e, item.id)}>
                        <Star className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                      </button>
                    </div>
                    <div className="w-8 h-8 rounded border border-purple-200" style={{ backgroundColor: item.previewColor }} />
                    <span className="text-[8px] font-bold text-slate-600 mt-1.5 text-center truncate w-full">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Shapes */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Advanced Shapes</span>
              <div className="grid grid-cols-3 gap-2">
                {SHAPES_ITEMS.slice(11).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="relative group border border-purple-100 bg-white hover:bg-purple-50/20 cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center h-20 transition"
                  >
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-10">
                      <button onClick={(e) => toggleFavorite(e, item.id)}>
                        <Star className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                      </button>
                    </div>
                    <div className="w-8 h-8 rounded border border-purple-200" style={{ backgroundColor: item.previewColor }} />
                    <span className="text-[8px] font-bold text-slate-600 mt-1.5 text-center truncate w-full">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lines and Arrows */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lines & Arrows</span>
              <div className="grid grid-cols-2 gap-2">
                {LINES_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="flex items-center space-x-2 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-2.5 rounded-xl text-left text-[10px] font-semibold text-slate-700 transition"
                  >
                    <Sliders className="w-4 h-4 text-purple-600" />
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: GRAPHICS TAB */}
        {activeTab === "graphics" && (
          <div className="space-y-6">
            {/* Icons */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flat Icons</span>
              <div className="grid grid-cols-2 gap-2">
                {GRAPHICS_ITEMS.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="flex items-center space-x-2 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-2.5 rounded-xl text-left text-[10px] font-semibold text-slate-700 transition"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stickers */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stickers & Emblems</span>
              <div className="grid grid-cols-2 gap-2">
                {GRAPHICS_ITEMS.slice(10, 18).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 rounded-xl h-20 transition"
                  >
                    <Sparkles className="w-6 h-6 text-pink-500" />
                    <span className="text-[9px] font-bold mt-1 text-center truncate w-full text-slate-600">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Illustrations */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modern Vector Illustrations</span>
              <div className="grid grid-cols-2 gap-2">
                {GRAPHICS_ITEMS.slice(18).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 rounded-xl h-20 transition"
                  >
                    <Image className="w-6 h-6 text-teal-600" />
                    <span className="text-[9px] font-bold mt-1 text-center truncate w-full text-slate-600">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: TEXT TAB */}
        {activeTab === "text" && (
          <div className="space-y-6">
            {/* Basic Text Presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Basic Text Presets</span>
              {TEXT_ITEMS.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleInsertElement(item)}
                  style={{ fontFamily: item.textStyles.fontFamily }}
                  className="w-full text-left bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 px-4 py-2.5 rounded-xl flex justify-between items-center transition"
                >
                  <span className={item.type === "h1" ? "font-bold text-sm" : item.type === "h2" ? "font-semibold text-xs" : "font-normal text-xs"}>
                    {item.name}
                  </span>
                  <Plus className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </div>

            {/* Professional Text Layouts */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Professional Typographies</span>
              {TEXT_ITEMS.slice(3, 7).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleInsertElement(item)}
                  style={{ fontFamily: item.textStyles.fontFamily }}
                  className="w-full text-left bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 px-4 py-2.5 rounded-xl flex justify-between items-center transition text-purple-700"
                >
                  <span className="font-bold text-xs">{item.name}</span>
                  <Plus className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: FRAMES & GRIDS TAB */}
        {activeTab === "frames" && (
          <div className="space-y-6">
            {/* Photo Frames */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Photo Frames</span>
              <div className="grid grid-cols-3 gap-2">
                {FRAMES_ITEMS.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="border border-purple-100 bg-white hover:bg-purple-50/20 rounded-xl p-3 flex flex-col items-center justify-center h-20 transition"
                  >
                    <Image className="w-6 h-6 text-purple-600" />
                    <span className="text-[8px] font-bold text-slate-500 mt-1">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Device Mockups */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Device Mockups</span>
              <div className="grid grid-cols-3 gap-2">
                {FRAMES_ITEMS.slice(3, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="border border-purple-100 bg-white hover:bg-purple-50/20 rounded-xl p-3 flex flex-col items-center justify-center h-20 transition"
                  >
                    {item.type === "phone" && <Smartphone className="w-6 h-6 text-slate-700" />}
                    {item.type === "tablet" && <Tablet className="w-6 h-6 text-slate-700" />}
                    {item.type === "laptop" && <Laptop className="w-6 h-6 text-slate-700" />}
                    <span className="text-[8px] font-bold text-slate-500 mt-1">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grids */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Photo Grids Layouts</span>
              <div className="grid grid-cols-3 gap-2">
                {FRAMES_ITEMS.slice(6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsertElement(item)}
                    className="border border-purple-100 bg-white hover:bg-purple-50/20 rounded-xl p-3 flex flex-col items-center justify-center h-20 transition"
                  >
                    <Grid className="w-6 h-6 text-indigo-500" />
                    <span className="text-[8px] font-bold text-slate-500 mt-1">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: COMPONENTS TAB */}
        {activeTab === "components" && (
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pre-assembled Layout Cards</span>
            {COMPONENTS_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleInsertElement(item)}
                className="w-full bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-4 rounded-2xl flex justify-between items-center transition"
              >
                <div className="flex items-center space-x-3">
                  <Layout className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-slate-800">{item.name}</p>
                    <p className="text-[9px] text-slate-400">Click to insert pre-grouped component template</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 opacity-50" />
              </button>
            ))}
          </div>
        )}

        {/* VIEW: FAVORITES TAB */}
        {activeTab === "favorites" && (
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starred Elements ({favorites.length})</span>
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs border border-dashed rounded-2xl p-4">
                Star elements in other tabs on hover to save them here.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {favorites.map((favId) => {
                  const item = ALL_ITEMS.find((i) => i.id === favId);
                  if (!item) return null;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleInsertElement(item)}
                      className="relative group border border-purple-100 bg-white hover:bg-purple-50/20 cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center h-20 transition"
                    >
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-10">
                        <button onClick={(e) => toggleFavorite(e, item.id)}>
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        </button>
                      </div>
                      {item.category === "shape" && (
                        <div className="w-8 h-8 rounded border border-purple-100" style={{ backgroundColor: item.previewColor }} />
                      )}
                      {item.category === "text" && <Type className="w-6 h-6 text-purple-600" />}
                      {item.category === "line" && <Sliders className="w-6 h-6 text-slate-400" />}
                      {["icon", "sticker", "illustration"].includes(item.category) && <Sparkles className="w-6 h-6 text-pink-500" />}
                      {item.category === "frame" && <Monitor className="w-6 h-6 text-teal-600" />}
                      {item.category === "component" && <Layout className="w-6 h-6 text-indigo-500" />}
                      <span className="text-[9px] font-bold text-slate-600 mt-1.5 text-center truncate w-full">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
