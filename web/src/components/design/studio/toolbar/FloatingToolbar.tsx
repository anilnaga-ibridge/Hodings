import React, { useEffect, useState, useRef } from "react";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { CanvasService } from "../services/canvas.service";
import { 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, 
  Trash2, RotateCw, RefreshCw, Type, Layers, Maximize,
  ChevronDown, Paintbrush, Sliders, Grid, Crop,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  AlignStartHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignEndVertical,
  Underline,
  GripVertical,
  Pin,
} from "lucide-react";
import { fabric } from "fabric";

interface FloatingToolbarProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onDelete: () => void;
  onStartCrop?: () => void;
}


export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  canvas,
  selectedObject,
  onDelete,
  onStartCrop,
}) => {
  const { zoom, panX, panY, showRulers } = useDesignStudioStore();
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [userPosition, setUserPosition] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  
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
  const FONTS_LIST = [
    "Outfit", "Inter", "Poppins", "Roboto", "Montserrat", 
    "Open Sans", "Lato", "Oswald", "Lora", 
    "Dancing Script", "Pacifico", "Playfair Display"
  ];

  // Helper: safely extract a hex color string from fill (which may be a gradient/pattern/null)
  const getFillColorStr = (obj: fabric.Object): string => {
    const isLine = obj.type === "line";
    const fill = isLine ? obj.get("stroke") : obj.get("fill");
    if (!fill) return "#000000";
    if (typeof fill === "string") return fill;
    // Gradient/pattern — try to get the first color stop
    if (typeof fill === "object" && "colorStops" in fill) {
      const stops = (fill as any).colorStops;
      if (Array.isArray(stops) && stops.length > 0) return stops[0].color || "#000000";
    }
    return "#000000";
  };

  // Position tracking — runs on zoom/pan/object movement
  useEffect(() => {
    if (!canvas || !selectedObject) return;

    const updatePosition = () => {
      selectedObject.setCoords();
      const bound = selectedObject.getBoundingRect();
      const canvasEl = canvas.getElement();
      if (!canvasEl) return;
      const canvasRect = canvasEl.getBoundingClientRect();
      const containerRect = canvasEl.parentElement?.parentElement?.parentElement?.getBoundingClientRect();

      if (!containerRect) return;

      // Translate the bounding coordinates from scaled screen-space relative to container
      const canvasTopInWorkspace = canvasRect.top - containerRect.top;
      const canvasLeftInWorkspace = canvasRect.left - containerRect.left;

      const objectTopScaled = bound.top * zoom;
      const objectLeftScaled = bound.left * zoom;
      const objectWidthScaled = bound.width * zoom;

      const toolbarWidth = toolbarRef.current?.offsetWidth || 500;
      const topOffset = canvasTopInWorkspace + objectTopScaled - 55;
      const leftOffset = canvasLeftInWorkspace + objectLeftScaled + (objectWidthScaled / 2) - (toolbarWidth / 2);

      setCoords({
        top: Math.max(15, topOffset),
        left: Math.max(15, Math.min(leftOffset, containerRect.width - toolbarWidth - 15)),
      });
    };

    updatePosition();

    canvas.on("object:moving", updatePosition);
    canvas.on("object:scaling", updatePosition);
    canvas.on("object:rotating", updatePosition);
    
    return () => {
      canvas.off("object:moving", updatePosition);
      canvas.off("object:scaling", updatePosition);
      canvas.off("object:rotating", updatePosition);
    };
  }, [canvas, selectedObject, zoom, panX, panY]);

  // Property sync — runs ONLY when the selected object changes, not on zoom/pan
  useEffect(() => {
    if (!canvas || !selectedObject) return;

    setUserPosition(null); // Reset user drag offsets on selection change
    setFillColor(getFillColorStr(selectedObject));
    setOpacity(selectedObject.get("opacity") ?? 1);
    setStrokeColor(selectedObject.get("stroke") as string || "#ffffff");
    setStrokeWidth(selectedObject.get("strokeWidth") ?? 0);
    
    if (selectedObject.type === "i-text" || selectedObject.type === "textbox") {
      const txt = selectedObject as any;
      setFontSize(txt.get("fontSize") || 32);
      setFontFamily(txt.get("fontFamily") || "Outfit");
      setCharSpacing(txt.get("charSpacing") || 0);
      setLineHeight(txt.get("lineHeight") || 1);
    }
    if (selectedObject.type === "rect" || selectedObject.type === "ellipse") {
      const rect = selectedObject as any;
      setCornerRadius(rect.rx || 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject]);

  if (!canvas || !selectedObject) return null;

  const handleFontFamilyChange = async (font: string) => {
    setFontFamily(font);
    await CanvasService.loadGoogleFont(font);
    if (selectedObject && (selectedObject.type === "i-text" || selectedObject.type === "textbox")) {
      selectedObject.set("fontFamily" as any, font);
      selectedObject.setCoords();
      canvas.requestRenderAll();
      canvas.fire("object:modified", { target: selectedObject });
    }
    setActiveDropdown(null);
  };

  const handleTextStyleToggle = (style: "bold" | "italic" | "underline") => {
    if (selectedObject.type === "i-text" || selectedObject.type === "textbox") {
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
      canvas.requestRenderAll();
      canvas.fire("object:modified", { target: selectedObject });
    }
  };

  const handleTextAlign = (align: "left" | "center" | "right") => {
    if (selectedObject.type === "i-text" || selectedObject.type === "textbox") {
      selectedObject.set("textAlign" as any, align);
      canvas.requestRenderAll();
      canvas.fire("object:modified", { target: selectedObject });
    }
  };

  const handleRotate = () => {
    const currentAngle = selectedObject.angle || 0;
    selectedObject.rotate((currentAngle + 90) % 360);
    selectedObject.setCoords();
    canvas.requestRenderAll();
    canvas.fire("object:modified", { target: selectedObject });
  };

  const handleFlip = (direction: "h" | "v") => {
    if (direction === "h") {
      selectedObject.set("flipX", !selectedObject.flipX);
    } else {
      selectedObject.set("flipY", !selectedObject.flipY);
    }
    canvas.requestRenderAll();
    canvas.fire("object:modified", { target: selectedObject });
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const currentTop = userPosition?.top ?? coords.top;
    const currentLeft = userPosition?.left ?? coords.left;

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      
      setUserPosition({
        top: currentTop + dy,
        left: currentLeft + dx,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const isText = selectedObject.type === "i-text" || selectedObject.type === "textbox";
  const isShape = selectedObject.type === "rect" || selectedObject.type === "circle" || selectedObject.type === "ellipse" || selectedObject.type === "line";
  const isImage = selectedObject.type === "image";
  const isLine = selectedObject.type === "line";

  return (
    <div
      ref={toolbarRef}
      style={{
        top: userPosition ? userPosition.top : coords.top,
        left: userPosition ? userPosition.left : coords.left,
      }}
      className="absolute z-40 flex items-center bg-white border border-purple-150 rounded-2xl shadow-2xl p-1.5 space-x-1.5 select-none animate-fade-in pointer-events-auto shrink-0 w-max max-w-none"
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleDragStart}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-lg transition flex items-center shrink-0"
        title="Drag to reposition toolbar"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {userPosition && (
        <button
          onClick={() => setUserPosition(null)}
          className="p-1 hover:bg-purple-50 text-purple-600 hover:text-purple-800 rounded-lg transition flex items-center shrink-0"
          title="Snap back to object"
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
      )}

      {userPosition && <div className="h-5 w-px bg-purple-100/80" />}
      
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
              <div className="absolute bottom-11 left-0 bg-white border border-purple-100 rounded-xl p-1.5 shadow-2xl w-44 flex flex-col z-50 animate-fade-in max-h-60 overflow-y-auto">
                {/* Custom Google Font Loader */}
                <div className="p-1 border-b border-purple-50 mb-1.5 flex items-center">
                  <input
                    type="text"
                    placeholder="Load Google Font..."
                    className="w-full bg-slate-50 border border-purple-100 text-[10px] px-2 py-1.5 rounded-lg focus:outline-none focus:bg-white text-slate-700 font-bold"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const fontName = e.currentTarget.value.trim();
                        if (fontName) {
                          await handleFontFamilyChange(fontName);
                        }
                      }
                    }}
                  />
                </div>
                
                {FONTS_LIST.map((font) => (
                  <button
                    key={font}
                    onClick={() => handleFontFamilyChange(font)}
                    className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-[11px] font-semibold text-slate-700 rounded-lg transition"
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
                canvas.requestRenderAll();
                canvas.fire("object:modified", { target: selectedObject });
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
                canvas.requestRenderAll();
                canvas.fire("object:modified", { target: selectedObject });
              }}
              className="w-8 bg-transparent text-center text-[11px] font-bold text-slate-700 focus:outline-none"
            />
            <button
              onClick={() => {
                const ns = Math.min(200, fontSize + 2);
                setFontSize(ns);
                selectedObject.set("fontSize" as any, ns);
                canvas.requestRenderAll();
                canvas.fire("object:modified", { target: selectedObject });
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
            onClick={() => handleTextStyleToggle("underline")}
            className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleTextAlign("left")}
            className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleTextAlign("center")}
            className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleTextAlign("right")}
            className="p-2 text-slate-500 hover:text-purple-750 hover:bg-purple-50 rounded-xl transition"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
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
          {/* Crop Button */}
          {onStartCrop && (
            <button
              onClick={onStartCrop}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 hover:bg-purple-50 text-xs font-bold text-slate-700 hover:text-purple-700 rounded-xl transition border border-purple-100 hover:border-purple-300"
              title="Crop Image (C)"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Crop</span>
            </button>
          )}

          <div className="h-5 w-px bg-purple-100/80" />

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
                const newColor = e.target.value;
                setFillColor(newColor);
                if (isLine) {
                  setStrokeColor(newColor);
                  selectedObject.set("stroke", newColor);
                } else {
                  selectedObject.set("fill", newColor);
                }
                selectedObject.setCoords();
                canvas.requestRenderAll();
                canvas.fire("object:modified", { target: selectedObject });
              }}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[9px] font-mono text-slate-300 uppercase">{fillColor}</span>
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
            canvas.requestRenderAll();
            canvas.fire("object:modified", { target: selectedObject });
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
