import { fabric } from "fabric";

export class SmartGuides {
  private static threshold = 5; // Snapping distance threshold in px
  private static guideLines: fabric.Line[] = [];

  /**
   * Clears any active alignment guidelines from the canvas
   */
  public static clear(canvas: fabric.Canvas) {
    if (this.guideLines.length > 0) {
      this.guideLines.forEach((line) => canvas.remove(line));
      this.guideLines = [];
      canvas.renderAll();
    }
  }

  /**
   * Run alignment detection and snap elements during moving.
   * Renders guidelines.
   */
  public static alignMovingObject(
    canvas: fabric.Canvas,
    movingObj: fabric.Object,
    canvasWidth: number,
    canvasHeight: number
  ) {
    // Clear previous guides
    this.clear(canvas);

    const activeObj = movingObj;
    if (!activeObj) return;

    // Get current bounds of the moving object
    const movingLeft = activeObj.left || 0;
    const movingTop = activeObj.top || 0;
    const movingWidth = activeObj.width ? activeObj.width * (activeObj.scaleX || 1) : 0;
    const movingHeight = activeObj.height ? activeObj.height * (activeObj.scaleY || 1) : 0;

    const movingRight = movingLeft + movingWidth;
    const movingBottom = movingTop + movingHeight;
    const movingCenterX = movingLeft + movingWidth / 2;
    const movingCenterY = movingTop + movingHeight / 2;

    let snapX: number | null = null;
    let snapY: number | null = null;
    
    let guideX: number | null = null;
    let guideY: number | null = null;

    // 1. Check canvas edges & centers
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    // Horizontal snapping coordinates (Vertical guide lines)
    if (Math.abs(movingCenterX - canvasCenterX) < this.threshold) {
      snapX = canvasCenterX - movingWidth / 2;
      guideX = canvasCenterX;
    } else if (Math.abs(movingLeft) < this.threshold) {
      snapX = 0;
      guideX = 0;
    } else if (Math.abs(movingRight - canvasWidth) < this.threshold) {
      snapX = canvasWidth - movingWidth;
      guideX = canvasWidth;
    }

    // Vertical snapping coordinates (Horizontal guide lines)
    if (Math.abs(movingCenterY - canvasCenterY) < this.threshold) {
      snapY = canvasCenterY - movingHeight / 2;
      guideY = canvasCenterY;
    } else if (Math.abs(movingTop) < this.threshold) {
      snapY = 0;
      guideY = 0;
    } else if (Math.abs(movingBottom - canvasHeight) < this.threshold) {
      snapY = canvasHeight - movingHeight;
      guideY = canvasHeight;
    }

    // 2. Check other objects in the canvas
    const objects = canvas.getObjects().filter((o) => o !== activeObj && !(o as any).isCanvasBackground);

    for (const obj of objects) {
      const left = obj.left || 0;
      const top = obj.top || 0;
      const width = obj.width ? obj.width * (obj.scaleX || 1) : 0;
      const height = obj.height ? obj.height * (obj.scaleY || 1) : 0;

      const right = left + width;
      const bottom = top + height;
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // X-Axis Alignments (Vertical Guides)
      if (snapX === null) {
        if (Math.abs(movingLeft - left) < this.threshold) {
          snapX = left;
          guideX = left;
        } else if (Math.abs(movingRight - right) < this.threshold) {
          snapX = right - movingWidth;
          guideX = right;
        } else if (Math.abs(movingCenterX - centerX) < this.threshold) {
          snapX = centerX - movingWidth / 2;
          guideX = centerX;
        } else if (Math.abs(movingLeft - right) < this.threshold) {
          snapX = right;
          guideX = right;
        } else if (Math.abs(movingRight - left) < this.threshold) {
          snapX = left - movingWidth;
          guideX = left;
        }
      }

      // Y-Axis Alignments (Horizontal Guides)
      if (snapY === null) {
        if (Math.abs(movingTop - top) < this.threshold) {
          snapY = top;
          guideY = top;
        } else if (Math.abs(movingBottom - bottom) < this.threshold) {
          snapY = bottom - movingHeight;
          guideY = bottom;
        } else if (Math.abs(movingCenterY - centerY) < this.threshold) {
          snapY = centerY - movingHeight / 2;
          guideY = centerY;
        } else if (Math.abs(movingTop - bottom) < this.threshold) {
          snapY = bottom;
          guideY = bottom;
        } else if (Math.abs(movingBottom - top) < this.threshold) {
          snapY = top - movingHeight;
          guideY = top;
        }
      }
    }

    // Apply snap coordinates and draw lines
    if (snapX !== null) {
      activeObj.set("left", snapX);
      if (guideX !== null) {
        const line = new fabric.Line([guideX, 0, guideX, canvasHeight], {
          stroke: "#a855f7",
          strokeWidth: 1.5,
          strokeDashArray: [4, 4],
          selectable: false,
          evented: false,
        });
        canvas.add(line);
        this.guideLines.push(line);
      }
    }

    if (snapY !== null) {
      activeObj.set("top", snapY);
      if (guideY !== null) {
        const line = new fabric.Line([0, guideY, canvasWidth, guideY], {
          stroke: "#a855f7",
          strokeWidth: 1.5,
          strokeDashArray: [4, 4],
          selectable: false,
          evented: false,
        });
        canvas.add(line);
        this.guideLines.push(line);
      }
    }

    if (snapX !== null || snapY !== null) {
      activeObj.setCoords();
      canvas.renderAll();
    }
  }
}
