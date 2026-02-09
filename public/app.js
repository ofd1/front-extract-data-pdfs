// State
let selectedFiles = [];
let downloadBlob = null;
let downloadFilename = 'balancete_extraido.xlsx';

// DOM references
const viewSelect = document.getElementById('view-select');
const viewBalancete = document.getElementById('view-balancete');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const fileItems = document.getElementById('file-items');
const actions = document.getElementById('actions');
const btnExtract = document.getElementById('btn-extract');
const progressSection = document.getElementById('progress-section');
const downloadSection = document.getElementById('download-section');
const errorSection = document.getElementById('error-section');

// Navigation
function selectExtractor(type) {
  if (type === 'balancete') {
    viewSelect.classList.remove('active');
    viewBalancete.classList.add('active');
  }
}

function goBack() {
  resetView();
  viewBalancete.classList.remove('active');
  viewSelect.classList.add('active');
}

// File handling
fileInput.addEventListener('change', (e) => {
  addFiles(Array.from(e.target.files));
  fileInput.value = '';
});

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
  if (files.length === 0) {
    alert('Apenas arquivos PDF sao aceitos.');
    return;
  }
  addFiles(files);
});

function addFiles(files) {
  files.forEach(file => {
    if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
      selectedFiles.push(file);
    }
  });
  renderFileList();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
}

function clearFiles() {
  selectedFiles = [];
  renderFileList();
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderFileList() {
  if (selectedFiles.length === 0) {
    fileList.hidden = true;
    actions.hidden = true;
    return;
  }

  fileList.hidden = false;
  actions.hidden = false;

  fileItems.innerHTML = selectedFiles.map((file, i) => `
    <div class="file-item">
      <div class="file-item-icon">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#dc2626" opacity="0.15"/>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#dc2626" stroke-width="1.5"/>
          <path d="M14 2v6h6" stroke="#dc2626" stroke-width="1.5"/>
          <text x="12" y="17" text-anchor="middle" font-size="6" font-weight="bold" fill="#dc2626">PDF</text>
        </svg>
      </div>
      <div class="file-item-info">
        <div class="file-item-name">${escapeHtml(file.name)}</div>
        <div class="file-item-size">${formatSize(file.size)}</div>
      </div>
      <button class="file-item-remove" onclick="removeFile(${i})" title="Remover">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Extraction
async function startExtraction() {
  if (selectedFiles.length === 0) return;

  // Hide other sections, show progress
  dropZone.hidden = true;
  fileList.hidden = true;
  actions.hidden = true;
  downloadSection.hidden = true;
  errorSection.hidden = true;
  progressSection.hidden = false;

  // Reset progress UI
  document.getElementById('progress-spinner').hidden = false;
  document.getElementById('progress-check').hidden = true;
  document.getElementById('progress-title').textContent = 'Processando seus arquivos...';
  document.getElementById('progress-text').textContent = 'Isso pode levar alguns minutos dependendo da quantidade de arquivos.';
  document.getElementById('progress-bar-container').hidden = false;

  // Simulate progress bar
  let progress = 0;
  const progressBar = document.getElementById('progress-bar');
  const progressInterval = setInterval(() => {
    if (progress < 85) {
      progress += Math.random() * 8;
      progressBar.style.width = Math.min(progress, 85) + '%';
    }
  }, 800);

  try {
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('pdfs', file);
    });

    const response = await fetch('/api/extract/balancete', {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('json')) {
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      // If JSON was returned but no file, show the response
      throw new Error('O servidor retornou dados, mas nenhum arquivo Excel foi gerado.');
    }

    // It's a file download
    const blob = await response.blob();
    downloadBlob = blob;

    // Try to get filename from response headers
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        downloadFilename = match[1].replace(/['"]/g, '');
      }
    }

    // Show success
    progressBar.style.width = '100%';
    await sleep(400);

    document.getElementById('progress-spinner').hidden = true;
    document.getElementById('progress-check').hidden = false;
    document.getElementById('progress-title').textContent = 'Processamento concluido!';
    document.getElementById('progress-text').textContent = '';
    document.getElementById('progress-bar-container').hidden = true;

    await sleep(800);

    progressSection.hidden = true;
    downloadSection.hidden = false;

  } catch (error) {
    clearInterval(progressInterval);
    progressSection.hidden = true;
    errorSection.hidden = false;
    document.getElementById('error-text').textContent = error.message || 'Ocorreu um erro ao processar seus arquivos.';
  }
}

function downloadFile() {
  if (!downloadBlob) return;

  const url = URL.createObjectURL(downloadBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetView() {
  selectedFiles = [];
  downloadBlob = null;
  downloadFilename = 'balancete_extraido.xlsx';

  dropZone.hidden = false;
  fileList.hidden = true;
  actions.hidden = true;
  progressSection.hidden = true;
  downloadSection.hidden = true;
  errorSection.hidden = true;

  fileItems.innerHTML = '';
  document.getElementById('progress-bar').style.width = '0%';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
