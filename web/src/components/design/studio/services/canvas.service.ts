import { fabric } from "fabric";

export class CanvasService {
  // Load Google Font dynamically
  public static loadGoogleFont(fontName: string): Promise<void> {
    return new Promise((resolve) => {
      // Avoid loading if already loaded
      const fontId = `google-font-${fontName.toLowerCase().replace(/\s+/g, "-")}`;
      if (document.getElementById(fontId)) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, "+")}:wght@400;700&display=swap`;
      
      link.onload = () => resolve();
      link.onerror = () => {
        console.warn(`Failed to load Google Font: ${fontName}`);
        resolve(); // resolve anyway to avoid blocking
      };
      
      document.head.appendChild(link);
    });
  }

  // Layer ordering
  public static bringToFront(canvas: fabric.Canvas, obj: fabric.Object) {
    obj.bringToFront();
    canvas.renderAll();
  }

  public static sendToBack(canvas: fabric.Canvas, obj: fabric.Object) {
    obj.sendToBack();
    // Keep background at the very back if there is one
    const objects = canvas.getObjects();
    const bg = objects.find((o) => (o as any).isCanvasBackground);
    if (bg) {
      bg.sendToBack();
    }
    canvas.renderAll();
  }

  public static bringForward(canvas: fabric.Canvas, obj: fabric.Object) {
    obj.bringForward();
    canvas.renderAll();
  }

  public static sendBackward(canvas: fabric.Canvas, obj: fabric.Object) {
    obj.sendBackwards();
    // Keep background at the very back
    const objects = canvas.getObjects();
    const bg = objects.find((o) => (o as any).isCanvasBackground);
    if (bg && objects.indexOf(bg) >= objects.indexOf(obj)) {
      bg.sendToBack();
    }
    canvas.renderAll();
  }

  // Alignments
  public static alignObject(canvas: fabric.Canvas, obj: fabric.Object, alignment: "left" | "center" | "right" | "top" | "middle" | "bottom", canvasWidth: number, canvasHeight: number) {
    const bound = obj.getBoundingRect(true);
    switch (alignment) {
      case "left":
        obj.set("left", (obj.left || 0) - bound.left);
        break;
      case "center":
        obj.centerH();
        break;
      case "right":
        obj.set("left", canvasWidth - bound.width + ((obj.left || 0) - bound.left));
        break;
      case "top":
        obj.set("top", (obj.top || 0) - bound.top);
        break;
      case "middle":
        obj.centerV();
        break;
      case "bottom":
        obj.set("top", canvasHeight - bound.height + ((obj.top || 0) - bound.top));
        break;
    }
    obj.setCoords();
    canvas.renderAll();
  }

  // Group / Ungroup
  public static groupSelected(canvas: fabric.Canvas): fabric.Group | null {
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== "activeSelection") return null;

    const selection = activeObj as fabric.ActiveSelection;
    selection.toGroup();
    const group = canvas.getActiveObject() as fabric.Group;
    canvas.renderAll();
    return group;
  }

  public static ungroupSelected(canvas: fabric.Canvas) {
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== "group") return;

    const group = activeObj as fabric.Group;
    group.toActiveSelection();
    canvas.renderAll();
  }

  // Image effects and filters
  public static applyImageFilter(
    canvas: fabric.Canvas,
    img: fabric.Image,
    filterName: "brightness" | "contrast" | "saturation" | "blur" | "grayscale" | "sepia" | "invert",
    value: number | boolean
  ) {
    const fabricFilters = fabric.Image.filters;
    if (!img.filters) img.filters = [];

    // Clear previous filter of the same type
    let filterIndex = -1;
    if (filterName === "brightness") {
      filterIndex = img.filters.findIndex((f) => f instanceof fabricFilters.Brightness);
      if (filterIndex > -1) img.filters.splice(filterIndex, 1);
      if (typeof value === "number" && value !== 0) {
        img.filters.push(new fabricFilters.Brightness({ brightness: value }));
      }
    } else if (filterName === "contrast") {
      filterIndex = img.filters.findIndex((f) => f instanceof fabricFilters.Contrast);
      if (filterIndex > -1) img.filters.splice(filterIndex, 1);
      if (typeof value === "number" && value !== 0) {
        img.filters.push(new fabricFilters.Contrast({ contrast: value }));
      }
    } else if (filterName === "saturation") {
      filterIndex = img.filters.findIndex((f) => f instanceof (fabricFilters as any).Saturation);
      if (filterIndex > -1) img.filters.splice(filterIndex, 1);
      // Fabric 5 Saturation uses a custom class
      if (typeof value === "number" && value !== 0) {
        img.filters.push(new (fabricFilters as any).Saturation({ saturation: value }));
      }
    } else if (filterName === "blur") {
      filterIndex = img.filters.findIndex((f) => f instanceof (fabricFilters as any).Blur);
      if (filterIndex > -1) img.filters.splice(filterIndex, 1);
      if (typeof value === "number" && value > 0) {
        img.filters.push(new (fabricFilters as any).Blur({ blur: value / 100 }));
      }
    } else if (filterName === "grayscale") {
      filterIndex = img.filters.findIndex((f) => f instanceof fabricFilters.Grayscale);
      if (filterIndex > -1) img.filters.splice(filterIndex, 1);
      if (value === true) img.filters.push(new fabricFilters.Grayscale());
    } else if (filterName === "sepia") {
      filterIndex = img.filters.findIndex((f) => f instanceof fabricFilters.Sepia);
      if (filterIndex > -1) img.filters.splice(filterIndex, 1);
      if (value === true) img.filters.push(new fabricFilters.Sepia());
    } else if (filterName === "invert") {
      filterIndex = img.filters.findIndex((f) => f instanceof fabricFilters.Invert);
      if (filterIndex > -1) img.filters.splice(filterIndex, 1);
      if (value === true) img.filters.push(new fabricFilters.Invert());
    }

    img.applyFilters();
    canvas.renderAll();
  }
}
