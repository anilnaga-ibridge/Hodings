import { create } from "zustand";
import { CanvasElement, ZoomSettings, WorkspaceConfig } from "../types/canvas.types";
import { EditorLayer } from "../types/layer.types";

interface DesignStudioState {
  // Canvas Size
  canvasWidth: number;
  canvasHeight: number;
  canvasBgColor: string;
  canvasBgGradient: string | null;
  
  // Viewport Settings
  zoom: number;
  panX: number;
  panY: number;
  handMode: boolean; // Spacebar panning / Hand tool active
  
  // Snapping & Visual helpers
  snapToGrid: boolean;
  snapToObjects: boolean;
  showRulers: boolean;
  showGrid: boolean;
  
  // Elements & Selection
  elements: CanvasElement[];
  activeElementId: string | null;
  selectedElementIds: string[];
  layers: EditorLayer[];
  
  // Navigation & Sidebars
  activeTab: string;
  workspaces: WorkspaceConfig[];
  selectedWorkspaceId: string;
  designName: string;
  activeDesignId: string | null;
  
  // Auto-Save Status
  isSaving: boolean;
  isDirty: boolean;
  
  // History
  history: string[]; // List of serialized canvas strings
  historyIndex: number;
  
  // Setters & Actions
  setDimensions: (width: number, height: number) => void;
  setCanvasBgColor: (color: string) => void;
  setCanvasBgGradient: (gradient: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setHandMode: (active: boolean) => void;
  setSnapToGrid: (active: boolean) => void;
  setSnapToObjects: (active: boolean) => void;
  setShowRulers: (active: boolean) => void;
  setShowGrid: (active: boolean) => void;
  
  setElements: (elements: CanvasElement[]) => void;
  setLayers: (layers: EditorLayer[]) => void;
  setActiveElementId: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  
  setActiveTab: (tab: string) => void;
  setWorkspaces: (workspaces: WorkspaceConfig[]) => void;
  setSelectedWorkspaceId: (id: string) => void;
  setDesignName: (name: string) => void;
  setActiveDesignId: (id: string | null) => void;
  
  setIsSaving: (saving: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  
  saveHistoryState: (json: string) => void;
  undoState: () => string | null;
  redoState: () => string | null;
  clearStoreState: () => void;
}

export const useDesignStudioStore = create<DesignStudioState>((set, get) => ({
  canvasWidth: 1920,
  canvasHeight: 1080,
  canvasBgColor: "#ffffff",
  canvasBgGradient: null,
  
  zoom: 1.0,
  panX: 0,
  panY: 0,
  handMode: false,
  
  snapToGrid: true,
  snapToObjects: true,
  showRulers: true,
  showGrid: false,
  
  elements: [],
  activeElementId: null,
  selectedElementIds: [],
  layers: [],
  
  activeTab: "templates",
  workspaces: [],
  selectedWorkspaceId: "",
  designName: "Untitled Project",
  activeDesignId: null,
  
  isSaving: false,
  isDirty: false,
  
  history: [],
  historyIndex: -1,
  
  setDimensions: (width, height) => set({ canvasWidth: width, canvasHeight: height, isDirty: true }),
  setCanvasBgColor: (color) => set({ canvasBgColor: color, canvasBgGradient: null, isDirty: true }),
  setCanvasBgGradient: (gradient) => set({ canvasBgGradient: gradient, isDirty: true }),
  setZoom: (zoom) => {
    // Zoom boundary constraints between 10% (0.1) and 500% (5.0)
    const constrainedZoom = Math.max(0.1, Math.min(5.0, zoom));
    set({ zoom: constrainedZoom });
  },
  setPan: (panX, panY) => set({ panX, panY }),
  setHandMode: (active) => set({ handMode: active }),
  setSnapToGrid: (active) => set({ snapToGrid: active }),
  setSnapToObjects: (active) => set({ snapToObjects: active }),
  setShowRulers: (active) => set({ showRulers: active }),
  setShowGrid: (active) => set({ showGrid: active }),
  
  setElements: (elements) => set({ elements }),
  setLayers: (layers) => set({ layers }),
  setActiveElementId: (id) => set({ activeElementId: id, selectedElementIds: id ? [id] : [] }),
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids, activeElementId: ids.length === 1 ? ids[0] : null }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
  setDesignName: (name) => set({ designName: name }),
  setActiveDesignId: (id) => set({ activeDesignId: id }),
  
  setIsSaving: (saving) => set({ isSaving: saving }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  
  saveHistoryState: (json) => {
    const { history, historyIndex } = get();
    const cleanHistory = history.slice(0, historyIndex + 1);
    
    // Avoid redundant consecutive states
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1] === json) {
      return;
    }
    
    set({
      history: [...cleanHistory, json],
      historyIndex: cleanHistory.length,
      isDirty: true,
    });
  },
  
  undoState: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({ historyIndex: newIndex, isDirty: true });
      return history[newIndex];
    }
    return null;
  },
  
  redoState: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({ historyIndex: newIndex, isDirty: true });
      return history[newIndex];
    }
    return null;
  },
  
  clearStoreState: () => set({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    elements: [],
    activeElementId: null,
    selectedElementIds: [],
    layers: [],
    history: [],
    historyIndex: -1,
    isDirty: false,
    isSaving: false,
  }),
}));
