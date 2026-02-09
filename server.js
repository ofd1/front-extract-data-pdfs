const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos.'));
    }
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const WEBHOOK_URL = 'https://hiker.app.n8n.cloud/webhook/b33194ba-d75c-4c59-971e-ffbfb47fe804';

/**
 * Extracts the .xlsx file from a response buffer.
 * The webhook may return a zip containing multiple files (e.g. a .sip + .xlsx).
 * This function detects zips and extracts the xlsx, discarding everything else.
 */
function extractXlsx(buffer, contentType) {
  const isZip =
    contentType.includes('zip') ||
    contentType.includes('octet-stream') ||
    (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04);

  if (isZip) {
    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      // Find the .xlsx entry
      const xlsxEntry = entries.find(e => e.entryName.endsWith('.xlsx'));

      if (xlsxEntry) {
        console.log(`Extracted "${xlsxEntry.entryName}" from zip (${entries.length} entries total)`);
        return {
          buffer: xlsxEntry.getData(),
          filename: xlsxEntry.entryName
        };
      }

      // No xlsx found — try any non-zip, non-sip file
      const fallbackEntry = entries.find(e =>
        !e.isDirectory &&
        !e.entryName.endsWith('.sip') &&
        !e.entryName.endsWith('.zip')
      );

      if (fallbackEntry) {
        console.log(`No .xlsx found, using fallback "${fallbackEntry.entryName}" from zip`);
        return {
          buffer: fallbackEntry.getData(),
          filename: fallbackEntry.entryName.replace(/\.[^.]+$/, '.xlsx')
        };
      }

      console.warn('Zip contained no usable files, returning raw buffer');
    } catch (err) {
      console.error('Failed to parse zip:', err.message);
    }
  }

  // Not a zip or extraction failed — return buffer as-is
  return {
    buffer,
    filename: 'balancete_extraido.xlsx'
  };
}

app.post('/api/extract/balancete', upload.array('pdfs', 50), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo PDF enviado.' });
  }

  try {
    const formData = new FormData();

    req.files.forEach((file, index) => {
      formData.append('pdfs', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
      timeout: 300000
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook retornou status ${webhookResponse.status}`);
    }

    const contentType = webhookResponse.headers.get('content-type') || '';
    const buffer = await webhookResponse.buffer();

    // Extract xlsx from the response (which may be a zip containing multiple files)
    const xlsxResult = extractXlsx(buffer, contentType);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${xlsxResult.filename}"`,
      'Content-Length': xlsxResult.buffer.length
    });

    return res.send(xlsxResult.buffer);

  } catch (error) {
    console.error('Erro ao processar:', error);
    res.status(500).json({
      error: 'Erro ao processar os arquivos. Tente novamente.',
      details: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
