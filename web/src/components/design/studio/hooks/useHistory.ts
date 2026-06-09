import { useRef } from "react";
import { fabric } from "fabric";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { HistoryService } from "../services/history.service";

export const useHistory = (canvas: fabric.Canvas | null) => {
  const { undoState, redoState, saveHistoryState, history, historyIndex } = useDesignStudioStore();
  const isHistoryChangingRef = useRef(false);

  const registerState = () => {
    if (!canvas || isHistoryChangingRef.current) return;
    const json = HistoryService.serializeCanvas(canvas);
    saveHistoryState(json);
  };

  const undo = () => {
    if (!canvas) return;
    const stateStr = undoState();
    if (stateStr) {
      isHistoryChangingRef.current = true;
      HistoryService.deserializeCanvas(canvas, stateStr, () => {
        isHistoryChangingRef.current = false;
      });
    }
  };

  const redo = () => {
    if (!canvas) return;
    const stateStr = redoState();
    if (stateStr) {
      isHistoryChangingRef.current = true;
      HistoryService.deserializeCanvas(canvas, stateStr, () => {
        isHistoryChangingRef.current = false;
      });
    }
  };

  return {
    undo,
    redo,
    registerState,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
};
