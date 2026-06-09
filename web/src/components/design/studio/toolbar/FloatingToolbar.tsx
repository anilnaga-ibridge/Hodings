import React, { useEffect, useState } from "react";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { CanvasService } from "../services/canvas.service";
import { 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, 
  Trash2, RotateCw, RefreshCw, Type, Layers, Maximize,
  ChevronDown, Paintbrush, Sliders, Grid 
} from "lucide-react";
import { fabric } from "fabric";

interface FloatingToolbarProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onDelete: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  canvas,
  selectedObject,
  onDelete,
}) => {
  const { zoom, panX, panY } = useDesignStudioStore();
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  
  // Custom editing panel dropdown toggles
  const [activeDropdown, setActiveDropdown] = useState<"font" | "spacing" | "borders" | "shadows" | "filters" | null>(null);

  // Formatting state cache for sync
  const [fontSize, setFontSize] = useState<number>(32);
  const [fontFamily, setFontFamily] = useState<string>("Outfit");
  const [fillColor, setFillColor] = useState<string>("#000000");
  const [strokeColor, setStrokeColor] = useState<string>("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  const [cornerRadius, setCornerRadius] = useState<number>(0);
  const [charSpacing, setCharSpacing] = useState<number>(0);
  const [lineHeight, setLineHeight] = useState<number>(1);
  const [opacity, setOpacity] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);

  // List of preloaded premium Google Fonts
  const FONTS_LIST = ["Outfit", "Inter", "Roboto", "Montserrat", "Playfair Display", "Dancing Script", "Oswald", "Lora"];

  // Calculate coordinates
  useEffect(() => {
    if (!canvas || !selectedObject) return;

    const updatePosition = () => {
      selectedObject.setCoords();
      const bound = selectedObject.getBoundingRect();
      const canvasEl = canvas.getElement();
      const canvasRect = canvasEl.getBoundingClientRect();
      const containerRect = canvasEl.parentElement?.getBoundingClientRect();

      if (!containerRect) return;

      // Position above object bounding box, centered
      const topOffset = canvasRect.top - containerRect.top + bound.top - 55;
      const leftOffset = canvasRect.left - containerRect.left + bound.left + (bound.width / 2) - 200;

      setCoords({
        top: Math.max(15, topOffset),
        left: Math.max(15, Math.min(leftOffset, containerRect.width - 420)),
      });
    };

    // Sync state properties from selected Fabric object to React toolbar states
    const syncObjectProperties = () => {
      setFillColor((selectedObject.get("fill") as string) || "#000000");
      setOpacity(selectedObject.get("opacity") || 1);
      
      if (selectedObject.type === "i-text" || selectedObject.type === "textbox") {
        const txt = selectedObject as any;
        setFontSize(txt.get("fontSize") || 32);
        setFontFamily(txt.get("fontFamily") || "Outfit");
        setCharSpacing(txt.get("charSpacing") || 0);
        setLineHeight(txt.get("lineHeight") || 1);
      } else if (selectedObject.type === "rect") {
        const rect = selectedObject as fabric.Rect;
        setCornerRadius(rect.rx || 0);
        setStrokeColor(rect.stroke || "#ffffff");
        setStrokeWidth(rect.strokeWidth || 0);
      }
    };

    updatePosition();
    syncObjectProperties();

    canvas.on("object:moving", updatePosition);
    canvas.on("object:scaling", updatePosition);
    canvas.on("object:rotating", updatePosition);
    
    return () => {
      canvas.off("object:moving", updatePosition);
      canvas.off("object:scaling", updatePosition);
      canvas.off("object:rotating", updatePosition);
    };
  }, [canvas, selectedObject, zoom, panX, panY]);

  if (!canvas || !selectedObject) return null;

  const handleFontFamilyChange = async (font: string) => {
    setFontFamily(font);
    await CanvasService.loadGoogleFont(font);
    selectedObject.set("fontFamily" as any, font);
    canvas.renderAll();
    setActiveDropdown(null);
  };

  const handleTextStyleToggle = (style: "bold" | "italic" | "underline") => {
    if (selectedObject.type === "i-text") {
      const text = selectedObject as fabric.IText;
      if (style === "bold") {
        const isBold = text.fontWeight === "bold";
        text.set("fontWeight", isBold ? "normal" : "bold");
      } else if (style === "italic") {
        const isItalic = text.fontStyle === "italic";
        text.set("fontStyle", isItalic ? "normal" : "italic");
      } else if (style === "underline") {
        text.set("underline", !text.underline);
      }
      canvas.renderAll();
    }
  };

  const handleTextAlign = (align: "left" | "center" | "right") => {
    if (selectedObject.type === "i-text" || selectedObject.type === "textbox") {
      selectedObject.set("textAlign" as any, align);
      canvas.renderAll();
    }
  };

  const handleRotate = () => {
    const currentAngle = selectedObject.angle || 0;
    selectedObject.rotate((currentAngle + 90) % 360);
    selectedObject.setCoords();
    canvas.renderAll();
  };

  const handleFlip = (direction: "h" | "v") => {
    if (direction === "h") {
      selectedObject.set("flipX", !selectedObject.flipX);
    } else {
      selectedObject.set("flipY", !selectedObject.flipY);
    }
    canvas.renderAll();
  };

  const isText = selectedObject.type === "i-text" || selectedObject.type === "textbox";
  const isShape = selectedObject.type === "rect" || selectedObject.type === "circle";
  const isImage = selectedObject.type === "image";

  return (
    <div
      style={{ top: coords.top, left: coords.left }}
      className="absolute z-40 flex items-center bg-white border border-purple-150 rounded-2xl shadow-2xl p-1.5 space-x-1.5 select-none animate-fade-in pointer-events-auto shrink-0 max-w-[420px]"
    >
      
      {/* ── Text Specific Controls ── */}
      {isText && (
        <>
          {/* Font dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "font" ? null : "font")}
              className="flex items-center space-x-1 px-2.5 py-1.5 hover:bg-purple-50 text-xs font-bold text-slate-700 rounded-xl transition"
            >
              <span className="truncate max-w-16">{fontFamily}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            
            {activeDropdown === "font" && (
              <div className="absolute bottom-11 left-0 bg-white border border-purple-100 rounded-xl p-1.5 shadow-2xl w-36 flex flex-col z-50 animate-fade-in max-h-48 overflow-y-auto">
                {FONTS_LIST.map((font) => (
                  <button
                    key={font}
                    onClick={() => handleFontFamilyChange(font)}
                    className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-[11px] font-semibold text-slate-705 rounded-lg transition"
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-purple-100/80" />

          {/* Font Size control */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-purple-100 rounded-xl px-1.5 py-0.5">
            <button
              onClick={() => {
                const ns = Math.max(10, fontSize - 2);
                setFontSize(ns);
                selectedObject.set("fontSize" as any, ns);
                canvas.renderAll();
              }}
              className="px-1 text-slate-400 hover:text-slate-700 font-bold"
            >
              -
            </button>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => {
                const ns = parseInt(e.target.value) || 12;
                setFontSize(ns);
                selectedObject.set("fontSize" as any, ns);
                canvas.renderAll();
              }}
              className="w-8 bg-transparent text-center text-[11px] font-bold text-slate-700 focus:outline-none"
            />
            <button
              onClick={() => {
                const ns = Math.min(200, fontSize + 2);
                setFontSize(ns);
                selectedObject.set("fontSize" as any, ns);
                canvas.renderAll();
              }}
              className="px-1 text-slate-400 hover:text-slate-700 font-bold"
            >
              +
            </button>
          </div>

          <div className="h-5 w-px bg-purple-100/80" />

          {/* Text alignment controls */}
          <button
            onClick={() => handleTextStyleToggle("bold")}
            className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleTextStyleToggle("italic")}
            className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleTextAlign("center")}
            className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          
          <div className="h-5 w-px bg-purple-100/80" />

          {/* Letter / Line Spacing dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "spacing" ? null : "spacing")}
              className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
              title="Typography Spacing"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            
            {activeDropdown === "spacing" && (
              <div className="absolute bottom-11 right-0 bg-white border border-purple-100 rounded-2xl p-4 shadow-2xl w-48 flex flex-col z-50 animate-fade-in space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Letter Spacing: {charSpacing}</label>
                  <input
                    type="range"
                    min="-50"
                    max="150"
                    value={charSpacing}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setCharSpacing(v);
                      selectedObject.set("charSpacing" as any, v);
                      canvas.renderAll();
                    }}
                    className="w-full accent-purple-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Line Height: {lineHeight.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setLineHeight(v);
                      selectedObject.set("lineHeight" as any, v);
                      canvas.renderAll();
                    }}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Shape Specific Controls ── */}
      {isShape && (
        <>
          {/* Borders / Corner Radius dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "borders" ? null : "borders")}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 hover:bg-purple-50 text-xs font-bold text-slate-700 rounded-xl transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Borders</span>
            </button>

            {activeDropdown === "borders" && (
              <div className="absolute bottom-11 left-0 bg-white border border-purple-100 rounded-2xl p-4 shadow-2xl w-48 flex flex-col z-50 animate-fade-in space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Border Width: {strokeWidth}px</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setStrokeWidth(v);
                      selectedObject.set("strokeWidth", v);
                      canvas.renderAll();
                    }}
                    className="w-full accent-purple-600"
                  />
                </div>
                
                {selectedObject.type === "rect" && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Corner Radius: {cornerRadius}px</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={cornerRadius}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setCornerRadius(v);
                        const rect = selectedObject as fabric.Rect;
                        rect.set({ rx: v, ry: v });
                        canvas.renderAll();
                      }}
                      className="w-full accent-purple-600"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-purple-50 pt-2">
                  <span className="text-[10px] text-slate-500 font-semibold">Border Color:</span>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => {
                      setStrokeColor(e.target.value);
                      selectedObject.set("stroke", e.target.value);
                      canvas.renderAll();
                    }}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Image Specific Controls ── */}
      {isImage && (
        <>
          {/* Image Filters dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "filters" ? null : "filters")}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 hover:bg-purple-50 text-xs font-bold text-slate-700 rounded-xl transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {activeDropdown === "filters" && (
              <div className="absolute bottom-11 left-0 bg-white border border-purple-100 rounded-2xl p-4 shadow-2xl w-48 flex flex-col z-50 animate-fade-in space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Brightness: {brightness}</label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={brightness}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setBrightness(v);
                      CanvasService.applyImageFilter(canvas, selectedObject as fabric.Image, "brightness", v);
                    }}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Contrast: {contrast}</label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={contrast}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setContrast(v);
                      CanvasService.applyImageFilter(canvas, selectedObject as fabric.Image, "contrast", v);
                    }}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Blur: {blur}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={blur}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setBlur(v);
                      CanvasService.applyImageFilter(canvas, selectedObject as fabric.Image, "blur", v);
                    }}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-purple-100/80" />

          {/* Rotate/Flip controls */}
          <button
            onClick={handleRotate}
            className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
            title="Rotate 90deg"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => handleFlip("h")}
            className="flex items-center space-x-1 px-2.5 py-1.5 hover:bg-purple-50 text-xs font-semibold text-slate-500 hover:text-purple-750 rounded-xl transition"
            title="Flip Horizontal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Flip H</span>
          </button>
        </>
      )}

      {/* ── Global Fill color picker (only for non-images) ── */}
      {!isImage && (
        <>
          <div className="h-5 w-px bg-purple-100/80" />
          <div className="flex items-center space-x-1.5 px-2 hover:bg-purple-50 rounded-xl py-0.5">
            <span className="text-[10px] font-semibold text-slate-400">Fill:</span>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => {
                setFillColor(e.target.value);
                selectedObject.set("fill", e.target.value);
                canvas.renderAll();
              }}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </>
      )}

      {/* ── Global Opacity control ── */}
      <div className="h-5 w-px bg-purple-100/80" />
      <div className="flex items-center space-x-1 px-2">
        <span className="text-[10px] font-semibold text-slate-400">Opacity:</span>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1"
          value={opacity}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setOpacity(val);
            selectedObject.set("opacity", val);
            canvas.renderAll();
          }}
          className="w-12 accent-purple-650"
        />
      </div>

      <div className="h-5 w-px bg-purple-100/80" />

      {/* ── Delete Button ── */}
      <button
        onClick={onDelete}
        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
        title="Delete Object"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

    </div>
  );
};
