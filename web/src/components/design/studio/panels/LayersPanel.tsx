import React, { useState } from "react";
import { useLayers } from "../hooks/useLayers";
import { 
  Eye, EyeOff, Lock, Unlock, Trash2, 
  Copy, Edit2, Check, Move, Layers 
} from "lucide-react";
import { fabric } from "fabric";

interface LayersPanelProps {
  canvas: fabric.Canvas | null;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ canvas }) => {
  const { 
    layers, 
    toggleVisibility, 
    toggleLock, 
    renameLayer, 
    duplicateLayer, 
    deleteLayer, 
    reorderLayers 
  } = useLayers(canvas);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) {
      renameLayer(id, editName);
    }
    setEditingId(null);
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderLayers(draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  if (layers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center select-none">
        <Layers className="w-8 h-8 text-slate-350 mb-2.5" />
        <p className="text-xs font-semibold text-slate-400">No layers created</p>
        <p className="text-[10px] text-slate-350 mt-1 max-w-44 leading-normal">
          Add elements, titles, shapes or images to populate layers list
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-purple-650" />
          <span>Canvas Layers</span>
        </h3>
        <span className="text-[10px] font-bold text-purple-650 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100/80">
          {layers.length} elements
        </span>
      </div>

      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onClick={() => {
              if (!canvas) return;
              const obj = canvas.getObjects().find((o) => (o as any).id === layer.id);
              if (obj) {
                canvas.setActiveObject(obj);
                canvas.renderAll();
              }
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition group cursor-pointer ${
              layer.active
                ? "bg-purple-50/70 border-purple-300 shadow-sm"
                : "bg-slate-50 border-purple-100/50 hover:bg-purple-50/20 hover:border-purple-200"
            } ${draggedIndex === index ? "opacity-45 scale-95 border-dashed border-purple-400" : ""}`}
          >
            {/* Left: Drag Handle, Icon, and Name */}
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <Move className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition cursor-grab" />
              
              <div className="min-w-0 flex-1">
                {editingId === layer.id ? (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xs font-semibold text-slate-700 bg-white border border-purple-200 px-1.5 py-0.5 rounded focus:outline-none focus:border-purple-500 w-full"
                    />
                    <button
                      onClick={() => saveRename(layer.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-705 truncate max-w-36">
                      {layer.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(layer.id, layer.name);
                      }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 transition hover:bg-purple-100 rounded text-slate-400 hover:text-slate-650"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <span className="text-[8.5px] text-slate-400 font-bold uppercase block mt-0.5">
                  {layer.type}
                </span>
              </div>
            </div>

            {/* Right: Locking, Visibility, Duplication & Delete Action Panel */}
            <div className="flex items-center space-x-1 pl-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Lock Toggle */}
              <button
                onClick={() => toggleLock(layer.id)}
                className={`p-1.5 rounded-lg transition hover:bg-slate-100 ${
                  layer.locked ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-slate-700"
                }`}
                title={layer.locked ? "Unlock element position" : "Lock element position"}
              >
                {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              {/* Visibility Toggle */}
              <button
                onClick={() => toggleVisibility(layer.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-350" />}
              </button>

              {/* Duplicate */}
              <button
                onClick={() => duplicateLayer(layer.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition opacity-0 group-hover:opacity-100"
                title="Duplicate layer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                onClick={() => deleteLayer(layer.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                title="Delete layer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
