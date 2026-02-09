const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');

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

    if (
      contentType.includes('spreadsheetml') ||
      contentType.includes('octet-stream') ||
      contentType.includes('excel') ||
      contentType.includes('vnd.ms-excel')
    ) {
      const buffer = await webhookResponse.buffer();

      let filename = 'balancete_extraido.xlsx';
      const disposition = webhookResponse.headers.get('content-disposition');
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length
      });

      return res.send(buffer);
    }

    // If the response is JSON, try to extract a download URL or binary data
    if (contentType.includes('json')) {
      const data = await webhookResponse.json();

      if (data.fileUrl) {
        const fileResponse = await fetch(data.fileUrl);
        const buffer = await fileResponse.buffer();

        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="balancete_extraido.xlsx"',
          'Content-Length': buffer.length
        });

        return res.send(buffer);
      }

      if (data.base64) {
        const buffer = Buffer.from(data.base64, 'base64');

        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${data.filename || 'balancete_extraido.xlsx'}"`,
          'Content-Length': buffer.length
        });

        return res.send(buffer);
      }

      return res.json(data);
    }

    // Fallback: return whatever the webhook sent
    const buffer = await webhookResponse.buffer();
    res.set({
      'Content-Type': contentType || 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="balancete_extraido.xlsx"',
      'Content-Length': buffer.length
    });
    return res.send(buffer);

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
