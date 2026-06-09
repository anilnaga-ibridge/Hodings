import { fabric } from "fabric";

export class HistoryService {
  private static MAX_HISTORY_SIZE = 50;

  /**
   * Serializes the current Fabric canvas to a JSON string
   */
  public static serializeCanvas(canvas: fabric.Canvas): string {
    return JSON.stringify(canvas.toJSON());
  }

  /**
   * Loads a serialized JSON string back into the Fabric canvas
   */
  public static deserializeCanvas(
    canvas: fabric.Canvas,
    json: string,
    callback?: () => void
  ): void {
    try {
      const parsed = JSON.parse(json);
      canvas.loadFromJSON(parsed, () => {
        canvas.renderAll();
        if (callback) callback();
      });
    } catch (err) {
      console.error("Failed to deserialize canvas", err);
    }
  }

  /**
   * Helper to clean up history array and limit size to MAX_HISTORY_SIZE
   */
  public static limitHistory(history: string[]): string[] {
    if (history.length > this.MAX_HISTORY_SIZE) {
      return history.slice(history.length - this.MAX_HISTORY_SIZE);
    }
    return history;
  }
}
