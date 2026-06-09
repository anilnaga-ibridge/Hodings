import { fabric } from "fabric";
import { useDesignStudioStore } from "../stores/designStudio.store";

export const useLayers = (canvas: fabric.Canvas | null) => {
  const { layers, setLayers } = useDesignStudioStore();

  const toggleVisibility = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      obj.set("visible", !obj.visible);
      canvas.discardActiveObject();
      canvas.renderAll();
      
      // Update store
      setLayers(
        layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
      );
    }
  };

  const toggleLock = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      const isLocked = !obj.lockMovementX;
      obj.set({
        lockMovementX: isLocked,
        lockMovementY: isLocked,
        lockScalingX: isLocked,
        lockScalingY: isLocked,
        lockRotation: isLocked,
        hasControls: !isLocked,
        selectable: !isLocked,
      });
      canvas.discardActiveObject();
      canvas.renderAll();

      // Update store
      setLayers(
        layers.map((l) => (l.id === layerId ? { ...l, locked: isLocked } : l))
      );
    }
  };

  const renameLayer = (layerId: string, newName: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      (obj as any).name = newName;
      canvas.renderAll();

      // Update store
      setLayers(
        layers.map((l) => (l.id === layerId ? { ...l, name: newName } : l))
      );
    }
  };

  const duplicateLayer = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      obj.clone((cloned: fabric.Object) => {
        canvas.discardActiveObject();
        cloned.set({
          left: (cloned.left || 0) + 30,
          top: (cloned.top || 0) + 30,
          evented: true,
        });
        (cloned as any).id = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        if ((obj as any).name) {
          (cloned as any).name = `${(obj as any).name} (Copy)`;
        }
        
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
    }
  };

  const deleteLayer = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  /**
   * Reorder layers by moving the Fabric object in the stack.
   * `layers` is order-reversed (top layer is index 0 in UI, but last index in Fabric).
   */
  const reorderLayers = (draggedIndex: number, targetIndex: number) => {
    if (!canvas) return;
    const objects = canvas.getObjects().filter((o) => !(o as any).isCanvasBackground);
    
    // UI index 0 is Fabric index `objects.length - 1`
    const fabricDraggedIndex = objects.length - 1 - draggedIndex;
    const fabricTargetIndex = objects.length - 1 - targetIndex;

    const draggedObj = objects[fabricDraggedIndex];
    if (draggedObj) {
      // Offset if there's a background object at stack position 0
      const hasBackground = canvas.getObjects().some((o) => (o as any).isCanvasBackground);
      const targetStackPos = fabricTargetIndex + (hasBackground ? 1 : 0);

      draggedObj.moveTo(targetStackPos);
      canvas.renderAll();
    }
  };

  return {
    layers,
    toggleVisibility,
    toggleLock,
    renameLayer,
    duplicateLayer,
    deleteLayer,
    reorderLayers,
  };
};
