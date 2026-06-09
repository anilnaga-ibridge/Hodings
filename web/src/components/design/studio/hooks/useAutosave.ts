import { useEffect, useRef } from "react";
import { fabric } from "fabric";
import { useDesignStudioStore } from "../stores/designStudio.store";
import { api } from "@/config/axios";
import { HistoryService } from "../services/history.service";

export const useAutosave = (canvas: fabric.Canvas | null) => {
  const {
    isDirty,
    setIsDirty,
    isSaving,
    setIsSaving,
    designName,
    activeDesignId,
    setActiveDesignId,
    selectedWorkspaceId,
  } = useDesignStudioStore();

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const designNameRef = useRef(designName);
  designNameRef.current = designName;

  const activeDesignIdRef = useRef(activeDesignId);
  activeDesignIdRef.current = activeDesignId;

  const selectedWorkspaceIdRef = useRef(selectedWorkspaceId);
  selectedWorkspaceIdRef.current = selectedWorkspaceId;

  // Immediate Save to Backend
  const saveToBackendImmediate = async () => {
    if (!canvas) return;
    
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const canvasJson = HistoryService.serializeCanvas(canvas);
    
    // Save local storage backup immediately
    if (typeof window !== "undefined") {
      localStorage.setItem("design_studio_draft_backup", canvasJson);
      localStorage.setItem("design_studio_draft_name", designNameRef.current);
    }
    
    if (!token) {
      // Guests skip backend sync
      setIsDirty(false);
      return;
    }
    
    setIsSaving(true);
    try {
      if (activeDesignIdRef.current) {
        await api.put(`/designs/${activeDesignIdRef.current}`, {
          name: designNameRef.current,
          canvasJson,
        });
      } else {
        const res = await api.post("/designs", {
          name: designNameRef.current,
          workspaceId: selectedWorkspaceIdRef.current || "wsp_local",
          width: canvas.width || 1920,
          height: canvas.height || 1080,
          canvasJson,
        });
        if (res.data.success && res.data.data?.id) {
          setActiveDesignId(res.data.data.id);
        }
      }
      setIsDirty(false);
    } catch (err) {
      console.error("[Autosave] Failed to sync with backend database", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Local Save (Debounced LocalStorage)
  useEffect(() => {
    if (!canvas || !isDirty) return;

    const timeout = setTimeout(() => {
      const canvasJson = HistoryService.serializeCanvas(canvas);
      localStorage.setItem("design_studio_draft_backup", canvasJson);
      localStorage.setItem("design_studio_draft_name", designNameRef.current);
      console.info("[Autosave] Saved temporary draft to LocalStorage.");
    }, 5000); // 5 seconds debounce

    return () => clearTimeout(timeout);
  }, [canvas, isDirty, designName]);

  // Periodic Backend Sync (every 30 seconds)
  useEffect(() => {
    if (!canvas) return;

    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        console.info("[Autosave] Periodic backend database sync triggered.");
        saveToBackendImmediate();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [canvas]);

  // Immediate Page Exit Save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        // Save copy to local storage immediately
        if (canvas) {
          localStorage.setItem("design_studio_draft_backup", HistoryService.serializeCanvas(canvas));
          localStorage.setItem("design_studio_draft_name", designNameRef.current);
        }
        
        // standard page exit browser dialog warning
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to exit?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [canvas]);

  return {
    saveToBackendImmediate,
  };
};
