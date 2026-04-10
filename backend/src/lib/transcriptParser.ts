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

  if (extension === 'txt' || file.mimetype.startsWith('text/')) {
    return normalizeTranscript(file.buffer.toString('utf8'));
  }

  if (extension === 'pdf' || file.mimetype === 'application/pdf') {
    const parsed = await pdfParse(file.buffer);
    return normalizeTranscript(parsed.text ?? '');
  }

  if (
    extension === 'docx' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return normalizeTranscript(result.value ?? '');
  }

  throw new Error('Unsupported transcript format. Use TXT, PDF, or DOCX.');
}
