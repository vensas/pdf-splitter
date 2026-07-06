import JSZip from 'jszip';

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadPdf(bytes: Uint8Array, fileName: string): void {
  downloadBlob(new Blob([bytes.slice()], { type: 'application/pdf' }), fileName);
}

export async function downloadZip(files: { name: string; bytes: Uint8Array }[], zipName: string): Promise<void> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.bytes);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, zipName);
}
