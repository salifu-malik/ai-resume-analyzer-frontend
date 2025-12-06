import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface CaptureOptions {
  filename?: string;
  pageFormat?: "a4" | "letter";
  orientation?: "portrait" | "landscape";
  scale?: number; // html2canvas scale multiplier
  background?: string; // e.g., "#ffffff"
}

/**
 * Capture a DOM element as a multi‑page PDF that visually matches the screen.
 * - Uses html2canvas at high scale for sharpness
 * - Slices the tall canvas into pages to avoid gaps/overlaps
 */
export async function captureElementToPdf(el: HTMLElement, opts: CaptureOptions = {}): Promise<void> {
  const {
    filename = defaultFilename(),
    pageFormat = "a4",
    orientation = "portrait",
    scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
    background = "#ffffff",
  } = opts;

  // Ensure element is in the document and visible
  if (!el || !document.body.contains(el)) {
    throw new Error("Element not found in document");
  }

  // Temporarily disable animations/transitions to avoid flicker during capture
  const disableCss = document.createElement("style");
  disableCss.setAttribute("data-pdf-capture", "");
  disableCss.innerHTML =
    "* { transition: none !important; animation: none !important; }";
  document.head.appendChild(disableCss);

  try {
    // Wait for images/fonts to settle
    await waitForImages(el);

    const canvas = await html2canvas(el, {
      scale,
      backgroundColor: background,
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowWidth: document.documentElement.clientWidth,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    // Create jsPDF with requested format/orientation
    const pdf = new jsPDF({ orientation, unit: "pt", format: pageFormat });

    const pageSize = pdf.internal.pageSize; // in points
    const pageWidth = pageSize.getWidth();
    const pageHeight = pageSize.getHeight();

    // Canvas size in pixels; convert to points keeping aspect ratio
    const pxToPt = (px: number) => (px * 72) / 96; // 96 CSS px per inch

    const imgWidthPt = pageWidth; // fit width
    const imgHeightPt = (canvas.height * imgWidthPt) / canvas.width;

    if (imgHeightPt <= pageHeight) {
      // Single page
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidthPt, imgHeightPt, undefined, "FAST");
    } else {
      // Multi‑page: draw portions of the big image per page
      // Create a temporary canvas to slice per page to preserve quality
      const pageCanvas = document.createElement("canvas");
      const pageCtx = pageCanvas.getContext("2d");
      if (!pageCtx) throw new Error("Canvas 2D context not available");

      // Compute the height in source pixels that corresponds to a full PDF page height
      const pageHeightPx = Math.floor((pageHeight * canvas.width) / pageWidth);
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeightPx;

      let renderedHeightPx = 0;
      let first = true;

      while (renderedHeightPx < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeightPx);

        // Resize temp canvas to the slice height
        if (pageCanvas.height !== sliceHeight) {
          pageCanvas.height = sliceHeight;
        }

        // Draw slice from main canvas
        pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          renderedHeightPx,
          canvas.width,
          sliceHeight,
          0,
          0,
          pageCanvas.width,
          sliceHeight
        );

        const sliceData = pageCanvas.toDataURL("image/jpeg", 0.92);
        if (!first) pdf.addPage({ format: pageFormat, orientation });
        pdf.addImage(
          sliceData,
          "JPEG",
          0,
          0,
          pageWidth,
          (sliceHeight * pageWidth) / canvas.width,
          undefined,
          "FAST"
        );

        renderedHeightPx += sliceHeight;
        first = false;
      }
    }

    pdf.save(filename);
  } finally {
    // Restore animations
    disableCss.remove();
  }
}

function defaultFilename(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `resume-review_${yyyy}-${mm}-${dd}.pdf`;
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}
