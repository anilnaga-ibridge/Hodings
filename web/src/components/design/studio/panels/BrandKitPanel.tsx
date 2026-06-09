import React from "react";
import { Palette, Plus } from "lucide-react";
import { CanvasService } from "../services/canvas.service";
import { fabric } from "fabric";

interface BrandAssetType {
  id: string;
  name: string;
  logoUrl?: string | null;
  assetUrl: string;
  colorPalette?: { primary: string; secondary: string; accent: string } | null;
  typography?: { headings: string; body: string } | null;
}

interface BrandKitPanelProps {
  canvas: fabric.Canvas | null;
  brandAssets: BrandAssetType[];
  selectedObject: fabric.Object | null;
}

export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({
  canvas,
  brandAssets,
  selectedObject,
}) => {
  const addTextWithFont = async (textStr: string, fontFamily: string, fontSize: number) => {
    if (!canvas) return;
    
    // Load font dynamically
    await CanvasService.loadGoogleFont(fontFamily);
    
    const textObj = new fabric.IText(textStr, {
      left: 150,
      top: 150,
      fontSize,
      fontFamily,
      fill: "#1E293B",
      fontWeight: "bold",
    });
    
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
  };

  const applyBrandColor = (color: string) => {
    if (!canvas) return;
    if (selectedObject) {
      selectedObject.set("fill", color);
      canvas.renderAll();
    } else {
      canvas.setBackgroundColor(color, () => canvas.renderAll());
    }
  };

  const applyBrandFont = async (fontFamily: string) => {
    if (!canvas || !selectedObject) return;
    if (selectedObject.type === "i-text" || selectedObject.type === "textbox") {
      await CanvasService.loadGoogleFont(fontFamily);
      selectedObject.set("fontFamily" as any, fontFamily);
      canvas.renderAll();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-1.5">
        <Palette className="w-4 h-4 text-purple-650" />
        <h3 className="font-bold text-sm text-slate-800">Brand Identity Kits</h3>
      </div>

      {brandAssets.map((asset) => (
        <div key={asset.id} className="p-4 rounded-2xl bg-slate-50 border border-purple-100 shadow-sm space-y-4">
          <p className="text-xs font-bold text-slate-700">{asset.name}</p>

          {/* Color Palettes Swatches */}
          {asset.colorPalette && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Brand Colors</span>
              <div className="flex space-x-2">
                {[asset.colorPalette.primary, asset.colorPalette.secondary, asset.colorPalette.accent].map((col, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyBrandColor(col)}
                    className="w-8 h-8 rounded-lg border border-purple-200 cursor-pointer hover:scale-105 transition shadow-sm"
                    style={{ backgroundColor: col }}
                    title="Click to apply to selection or canvas background"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Brand Fonts applying buttons */}
          {asset.typography && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Brand Fonts</span>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    if (selectedObject && (selectedObject.type === "i-text" || selectedObject.type === "textbox")) {
                      applyBrandFont(asset.typography!.headings);
                    } else {
                      addTextWithFont("Heading Title", asset.typography!.headings, 54);
                    }
                  }}
                  className="w-full text-left bg-white hover:bg-purple-50/50 border border-purple-100 px-3 py-2 rounded-xl text-xs font-semibold truncate flex justify-between items-center text-slate-700 transition"
                >
                  <span style={{ fontFamily: asset.typography.headings }}>Heading: {asset.typography.headings}</span>
                  <Plus className="w-4 h-4 opacity-60" />
                </button>
                
                <button
                  onClick={() => {
                    if (selectedObject && (selectedObject.type === "i-text" || selectedObject.type === "textbox")) {
                      applyBrandFont(asset.typography!.body);
                    } else {
                      addTextWithFont("Body content text...", asset.typography!.body, 32);
                    }
                  }}
                  className="w-full text-left bg-white hover:bg-purple-50/50 border border-purple-100 px-3 py-2 rounded-xl text-xs font-semibold truncate flex justify-between items-center text-slate-700 transition"
                >
                  <span style={{ fontFamily: asset.typography.body }}>Body: {asset.typography.body}</span>
                  <Plus className="w-4 h-4 opacity-60" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
