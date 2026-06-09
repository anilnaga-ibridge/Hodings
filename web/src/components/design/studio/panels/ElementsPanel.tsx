import React from "react";
import { Plus, Type, Square, Circle, Shield, Star, Smile, Sparkles } from "lucide-react";
import { fabric } from "fabric";

interface ElementsPanelProps {
  canvas: fabric.Canvas | null;
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({ canvas }) => {
  const addRectangle = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 150,
      top: 150,
      width: 200,
      height: 150,
      fill: "#6366F1",
      stroke: "#ffffff",
      strokeWidth: 0,
      rx: 0,
      ry: 0,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 180,
      top: 180,
      radius: 90,
      fill: "#10B981",
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const addTriangle = () => {
    if (!canvas) return;
    const triangle = new fabric.Triangle({
      left: 160,
      top: 160,
      width: 180,
      height: 160,
      fill: "#F59E0B",
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
  };

  const addTextPreset = (type: "h1" | "h2" | "body") => {
    if (!canvas) return;
    let textObj: fabric.IText;

    switch (type) {
      case "h1":
        textObj = new fabric.IText("Add a Heading", {
          left: 100,
          top: 150,
          fontSize: 64,
          fontFamily: "Outfit",
          fontWeight: "bold",
          fill: "#1E293B",
        });
        break;
      case "h2":
        textObj = new fabric.IText("Add a Subheading", {
          left: 120,
          top: 180,
          fontSize: 40,
          fontFamily: "Inter",
          fontWeight: "600",
          fill: "#334155",
        });
        break;
      default:
        textObj = new fabric.IText("Add normal body text here...", {
          left: 140,
          top: 210,
          fontSize: 24,
          fontFamily: "Inter",
          fontWeight: "normal",
          fill: "#475569",
        });
        break;
    }

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
  };

  // Pre-configured stickers (SVGs or shapes)
  const addPremiumSticker = (type: "shield" | "star" | "sparkle") => {
    if (!canvas) return;
    let shape: fabric.Object;

    if (type === "star") {
      // Standard star path
      const starPath = "M 100 10 L 123 68 L 186 70 L 136 109 L 155 170 L 100 131 L 45 170 L 64 109 L 14 70 L 77 68 Z";
      shape = new fabric.Path(starPath, {
        left: 200,
        top: 200,
        fill: "#EC4899",
        scaleX: 0.8,
        scaleY: 0.8,
      });
      (shape as any).name = "Sticker: Pink Star";
    } else if (type === "shield") {
      const shieldPath = "M 12 22 s 8 -4 8 -10 V 5 l -8 -3 l -8 3 v 7 c 0 6 8 10 8 10 z";
      shape = new fabric.Path(shieldPath, {
        left: 200,
        top: 200,
        fill: "#3B82F6",
        scaleX: 8,
        scaleY: 8,
      });
      (shape as any).name = "Sticker: Blue Shield";
    } else {
      // Sparkle cross path
      const sparklePath = "M 10 0 C 10 7.5 17.5 10 20 10 C 17.5 10 10 12.5 10 20 C 10 12.5 2.5 10 0 10 C 2.5 10 10 7.5 10 0 Z";
      shape = new fabric.Path(sparklePath, {
        left: 200,
        top: 200,
        fill: "#FBBF24",
        scaleX: 5,
        scaleY: 5,
      });
      (shape as any).name = "Sticker: Golden Sparkle";
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  return (
    <div className="space-y-6">
      
      {/* Shapes Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vector Shapes</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={addRectangle}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-750 transition"
          >
            <Square className="w-4 h-4 text-purple-650" />
            <span>Rectangle</span>
          </button>
          
          <button
            onClick={addCircle}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-750 transition"
          >
            <Circle className="w-4 h-4 text-emerald-650" />
            <span>Circle</span>
          </button>

          <button
            onClick={addTriangle}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-750 transition"
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-amber-500 mr-1" />
            <span>Triangle</span>
          </button>
        </div>
      </div>

      {/* Typography Presets */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Text Presets</h4>
        <div className="space-y-2">
          <button
            onClick={() => addTextPreset("h1")}
            className="w-full text-left bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 px-4 py-2.5 rounded-xl text-sm font-bold flex justify-between items-center text-slate-800 transition"
          >
            <span>Add a Heading</span>
            <Plus className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => addTextPreset("h2")}
            className="w-full text-left bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 px-4 py-2.5 rounded-xl text-xs font-semibold flex justify-between items-center text-slate-750 transition"
          >
            <span>Add a Subheading</span>
            <Plus className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => addTextPreset("body")}
            className="w-full text-left bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 px-4 py-2.5 rounded-xl text-[11px] font-normal flex justify-between items-center text-slate-550 transition"
          >
            <span>Add body text block</span>
            <Plus className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>

      {/* Premium stickers */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Illustrations & stickers</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addPremiumSticker("star")}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-750 transition"
          >
            <Star className="w-4 h-4 text-pink-500" />
            <span>Pink Star</span>
          </button>

          <button
            onClick={() => addPremiumSticker("shield")}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-750 transition"
          >
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Badge Shield</span>
          </button>

          <button
            onClick={() => addPremiumSticker("sparkle")}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-purple-50/40 border border-purple-100/50 p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-750 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Sparkle</span>
          </button>
        </div>
      </div>

    </div>
  );
};
