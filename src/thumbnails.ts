import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const THUMBNAIL_WIDTH = 180;

export interface LoadedPdf {
  pageCount: number;
  renderPage(pageIndex: number, canvas: HTMLCanvasElement): Promise<void>;
  destroy(): void;
}

/**
 * Loads a PDF with pdf.js for on-screen preview. The bytes are copied
 * because pdf.js transfers the buffer to its worker.
 */
export async function loadForPreview(bytes: Uint8Array): Promise<LoadedPdf> {
  const document = await pdfjs.getDocument({ data: bytes.slice() }).promise;

  return {
    pageCount: document.numPages,

    async renderPage(pageIndex: number, canvas: HTMLCanvasElement): Promise<void> {
      const page = await document.getPage(pageIndex + 1);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = (THUMBNAIL_WIDTH / baseViewport.width) * (window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${THUMBNAIL_WIDTH}px`;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not create a canvas context for the preview.');
      }
      await page.render({ canvasContext: context, viewport }).promise;
      page.cleanup();
    },

    destroy(): void {
      void document.destroy();
    },
  };
}
