import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

function normalizeTranscript(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export async function extractTranscriptFromUpload(file: Express.Multer.File): Promise<string> {
  const extension = getExtension(file.originalname);

  // Support both memory and disk-backed multer files
  let buffer: Buffer;
  if (file.buffer && file.buffer.length) {
    buffer = file.buffer;
  } else if ((file as any).path) {
    buffer = await (await import('fs/promises')).readFile((file as any).path);
  } else {
    throw new Error('No file buffer or path available');
  }

  if (extension === 'txt' || file.mimetype.startsWith('text/')) {
    return normalizeTranscript(buffer.toString('utf8'));
  }

  if (extension === 'pdf' || file.mimetype === 'application/pdf') {
    const parsed = await pdfParse(buffer);
    return normalizeTranscript(parsed.text ?? '');
  }

  if (
    extension === 'docx' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeTranscript(result.value ?? '');
  }

  throw new Error('Unsupported transcript format. Use TXT, PDF, or DOCX.');
}
