import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Converts a base64 data URL (candidate.resumeFile) to a File and extracts text.
 * Use when the candidate has a stored file but resumeText was never populated.
 */
export async function extractTextFromDataUrl(dataUrl, fileName) {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], fileName || 'curriculo', { type: blob.type });
    return await extractResumeText(file);
  } catch {
    return '';
  }
}

/**
 * Reads a File object and returns the extracted plain text.
 * Supports PDF and DOCX/DOC. Returns '' on failure.
 */
export async function extractResumeText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return await extractPdfText(arrayBuffer);
    }

    if (
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.type.includes('wordprocessingml') ||
      file.type.includes('msword')
    ) {
      return await extractDocxText(arrayBuffer);
    }

    return '';
  } catch {
    return '';
  }
}

async function extractPdfText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    pages.push(pageText);
  }
  return pages.join('\n');
}

async function extractDocxText(arrayBuffer) {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}
