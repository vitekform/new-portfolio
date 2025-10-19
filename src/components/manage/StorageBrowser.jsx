import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import FileViewer from 'react-file-viewer';

const DEFAULT_BUCKET = 'portfolio';

function StorageBrowser() {
  const [bucketName, setBucketName] = useState(DEFAULT_BUCKET);
  const [prefix, setPrefix] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Preview state for react-file-viewer
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerType, setViewerType] = useState(''); // extension like 'pdf', 'png', etc.
  const [viewerName, setViewerName] = useState('');
  const [viewerMime, setViewerMime] = useState('');
  const [textContent, setTextContent] = useState(''); // for text files

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  const fetchListing = async (nextPrefix = prefix) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://storage.ganamaga.me/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'browse',
          userId,
          token,
          bucketName,
          prefix: nextPrefix
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to browse');
      setPrefix(data.prefix || nextPrefix);
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketName]);

  const navigateTo = (subPrefix) => {
    const newPrefix = subPrefix;
    fetchListing(newPrefix);
  };

  const goUp = () => {
    if (!prefix) return;
    const parts = prefix.replace(/\/$/, '').split('/');
    parts.pop();
    const parent = parts.length ? parts.join('/') + '/' : '';
    fetchListing(parent);
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Delete ${key}?`)) return;
    try {
      const res = await fetch('https://storage.ganamaga.me/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteFile', userId, token, bucketName, key })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete');
      fetchListing();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDownload = async (key) => {
    try {
      const res = await fetch('https://storage.ganamaga.me/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'downloadFile', userId, token, bucketName, key })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to download');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = key.split('/').pop();
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleOpen = async (key) => {
    try {
      // Determine MIME type first
      const typeRes = await fetch('https://storage.ganamaga.me/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getFileType', userId, token, bucketName, key })
      });
      const typeData = await typeRes.json();
      if (!typeData.success) throw new Error(typeData.message || 'Failed to get file type');
      const mime = typeData.mimeType || typeData.contentType || 'application/octet-stream';

      const filename = key.split('/').pop();
      const ext = (filename.includes('.') ? filename.split('.').pop() : '').toLowerCase();
      const isTextLike = (mt) => {
        if (!mt) return false;
        if (mt.startsWith('text/')) return true;
        const textish = ['application/json', 'application/xml', 'application/javascript', 'application/x-javascript', 'application/xhtml+xml'];
        return textish.includes(mt);
      };

      // If text-like, fetch content and show in modal (not via FileViewer)
      if (isTextLike(mime) || mime === 'text/markdown' || mime === 'text/csv') {
        const contentRes = await fetch('https://storage.ganamaga.me/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getFileContent', userId, token, bucketName, key })
        });
        const contentData = await contentRes.json();
        if (!contentData.success) throw new Error(contentData.message || 'Failed to open text file');
        setTextContent(contentData.content || '');
        setViewerUrl('');
        setViewerType('txt');
        setViewerName(filename);
        setViewerMime(mime);
        setPreviewOpen(true);
        return;
      }

      // Supported types for react-file-viewer (best-effort)
      const supported = new Set(['pdf','png','jpg','jpeg','gif','bmp','webp','csv','doc','docx','xls','xlsx','ppt','pptx','mp4','webm','mov','m4v','avi','mp3','wav','ogg']);

      // Download the file as blob (for viewer)
      const dlRes = await fetch('https://storage.ganamaga.me/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'downloadFile', userId, token, bucketName, key })
      });
      if (!dlRes.ok) {
        const data = await dlRes.json();
        throw new Error(data.message || 'Failed to download');
      }
      const buf = await dlRes.arrayBuffer();
      const blob = new Blob([buf], { type: mime });
      const url = window.URL.createObjectURL(blob);

      if (supported.has(ext)) {
        setViewerUrl(url);
        setViewerType(ext || 'pdf');
        setViewerName(filename);
        setViewerMime(mime);
        setTextContent('');
        setPreviewOpen(true);
        return;
      }

      // Fallback for unsupported types: trigger a download and cleanup
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    let firstError = null;
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('action', 'uploadFile');
        formData.append('userId', userId);
        formData.append('token', token);
        formData.append('bucketName', bucketName);
        formData.append('prefix', prefix);
        formData.append('file', file);

        const res = await fetch('https://storage.ganamaga.me/api/storage', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.success) {
          if (!firstError) firstError = new Error(data.message || `Upload failed for ${file.name}`);
        }
      }
      // Refresh listing once after all uploads
      fetchListing();
      if (firstError) throw firstError;
    } catch (e) {
      alert(e.message);
    } finally {
      // reset input value to allow re-uploading same filename(s)
      event.target.value = '';
    }
  };

  const closePreview = () => {
    if (viewerUrl) {
      try { window.URL.revokeObjectURL(viewerUrl); } catch {}
    }
    setPreviewOpen(false);
    setViewerUrl('');
    setViewerType('');
    setViewerName('');
    setViewerMime('');
    setTextContent('');
  };

  return (
    <Container>
      <Controls>
        <div>
          <label>
            Bucket:
            <input value={bucketName} onChange={(e) => setBucketName(e.target.value)} placeholder="bucket" />
          </label>
        </div>
        <div>
          <button onClick={goUp} disabled={!prefix}>Up</button>
          <span style={{ marginLeft: 8, opacity: 0.8 }}>Path: /{prefix}</span>
        </div>
        <div>
          <input type="file" multiple onChange={handleUpload} />
        </div>
      </Controls>

      {loading && <Info>Loading...</Info>}
      {error && <ErrorMsg>{error}</ErrorMsg>}

      <List>
        {folders.map(f => (
          <Row key={f.prefix}>
            <span role="button" style={{ color: '#0a7', cursor: 'pointer' }} onClick={() => navigateTo(f.prefix)}>
              📁 {f.name}
            </span>
          </Row>
        ))}
        {files.map(file => (
          <Row key={file.key}>
            <span>📄 {file.name}</span>
            <Actions>
              <button onClick={() => handleOpen(file.key)}>Open</button>
              <button onClick={() => handleDownload(file.key)}>Download</button>
              <button onClick={() => handleDelete(file.key)} style={{ color: 'red' }}>Delete</button>
            </Actions>
          </Row>
        ))}
        {!folders.length && !files.length && !loading && <Info>Empty</Info>}
      </List>

      {previewOpen && (
        <ModalOverlay onClick={closePreview}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <strong>{viewerName}</strong>
              <button onClick={closePreview}>Close</button>
            </ModalHeader>
            <ModalBody>
              {textContent ? (
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{textContent}</pre>
              ) : (
                <FileViewer
                  fileType={viewerType}
                  filePath={viewerUrl}
                  onError={(e) => {
                    console.error('FileViewer error', e);
                    closePreview();
                    setTimeout(() => alert('Cannot preview this file type. It may have been downloaded instead or please try Download.'), 0);
                  }}
                />
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const Info = styled.div`
  opacity: 0.8;
`;

const ErrorMsg = styled.div`
  color: #e44;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  width: min(95vw, 1200px);
  height: min(90vh, 800px);
  background: #111;
  color: #eee;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #1b1b1b;
  border-bottom: 1px solid rgba(255,255,255,0.08);

  button {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  background: #000;
  padding: 8px;
  overflow: auto;

  /* Ensure embedded viewers fit */
  > div { height: 100%; }
`;

export default StorageBrowser;
