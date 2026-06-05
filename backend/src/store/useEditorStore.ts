import { create } from "zustand";

export interface CanvasElement {
  id: string;
  type: "text" | "image" | "rect" | "circle" | "svg";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  locked?: boolean;
}

interface EditorState {
  // Canvas Configuration
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panX: number;
  panY: number;
  snapToGrid: boolean;

  // Selection
  activeElementId: string | null;
  selectedElementIds: string[];

  // Elements
  elements: CanvasElement[];

  // Revision History
  history: string[]; // Serialized canvas snapshots
  historyIndex: number;

  // Actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setElements: (elements: CanvasElement[]) => void;
  updateElement: (id: string, properties: Partial<CanvasElement>) => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearStore: () => void;
  toggleSnapToGrid: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  canvasWidth: 1920,
  canvasHeight: 1080,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  snapToGrid: true,
  activeElementId: null,
  selectedElementIds: [],
  elements: [],
  history: [],
  historyIndex: -1,

  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  
  setElements: (elements) => set({ elements }),

  updateElement: (id, properties) => set((state) => ({
    elements: state.elements.map((el) => 
      el.id === id ? { ...el, ...properties } : el
    )
  })),

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  saveHistory: () => {
    const { elements, history, historyIndex } = get();
    const serialized = JSON.stringify(elements);
    
    // Clear future history states if we were in the middle of undoing
    const updatedHistory = history.slice(0, historyIndex + 1);
    
    // Avoid saving identical consecutive states
    if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1] === serialized) {
      return;
    }
    
    updatedHistory.push(serialized);
    
    set({
      history: updatedHistory,
      historyIndex: updatedHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      const elements = JSON.parse(history[targetIdx]);
      set({ elements, historyIndex: targetIdx });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      const elements = JSON.parse(history[targetIdx]);
      set({ elements, historyIndex: targetIdx });
    }
  },

  clearStore: () => set({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    activeElementId: null,
    selectedElementIds: [],
    elements: [],
    history: [],
    historyIndex: -1,
  }),
}));
