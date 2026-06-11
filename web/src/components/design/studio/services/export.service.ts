import { fabric } from "fabric";

export class ExportService {
  /**
   * Export the canvas as a PNG or JPG image
   */
  public static exportAsImage(
    canvas: fabric.Canvas,
    filename: string,
    format: "png" | "jpeg",
    multiplier: number = 2,
    transparentBg: boolean = false
  ) {
    // Save current background configuration
    const originalBgColor = canvas.backgroundColor;
    
    if (transparentBg && format === "png") {
      canvas.backgroundColor = "transparent";
      canvas.renderAll();
    }

    try {
      const dataUrl = canvas.toDataURL({
        format: format === "png" ? "png" : "jpeg",
        quality: 1.0,
        multiplier: multiplier,
      });

      // Restore background color
      if (transparentBg && format === "png") {
        canvas.backgroundColor = originalBgColor;
        canvas.renderAll();
      }

      const link = document.createElement("a");
      link.download = `${filename.replace(/\s+/g, "_")}.${format === "png" ? "png" : "jpg"}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      // Restore background color on error
      if (transparentBg && format === "png") {
        canvas.backgroundColor = originalBgColor;
        canvas.renderAll();
      }
      console.error("Canvas export failed due to tainted canvas or CORS blocks:", err);
      alert("Failed to export canvas image. This design contains external assets or images loaded from other websites that block cross-origin access (CORS). Please remove or replace the external image to export successfully.");
    }
  }

  /**
   * Export the canvas as raw SVG vector file
   */
  public static exportAsSVG(canvas: fabric.Canvas, filename: string) {
    const svgContent = canvas.toSVG();
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = `${filename.replace(/\s+/g, "_")}.svg`;
    link.href = url;
    link.click();
    
    // Clean up URL object
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Export the canvas as PDF by printing or generating an image wrapper
   */
  public static exportAsPDF(canvas: fabric.Canvas, filename: string, width: number, height: number) {
    try {
      // Generate high-DPI image of the canvas first
      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 2,
      });

      // Create a printable window or print iframe
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow pop-ups to export as PDF");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${filename}</title>
            <style>
              @page {
                size: ${width}px ${height}px;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background-color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                width: 100vw;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Canvas PDF export failed due to tainted canvas or CORS blocks:", err);
      alert("Failed to export canvas as PDF. This design contains external assets or images loaded from other websites that block cross-origin access (CORS). Please remove or replace the external image to export successfully.");
    }
  }
}
