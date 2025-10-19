import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const DEFAULT_BUCKET = 'portfolio';

function StorageBrowser() {
  const [bucketName, setBucketName] = useState(DEFAULT_BUCKET);
  const [prefix, setPrefix] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // 1) Get MIME type first
      const typeRes = await fetch('https://storage.ganamaga.me/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getFileType', userId, token, bucketName, key })
      });
      const typeData = await typeRes.json();
      if (!typeData.success) throw new Error(typeData.message || 'Failed to get file type');
      const mime = typeData.mimeType || typeData.contentType || 'application/octet-stream';

      const isTextLike = (mt) => {
        if (!mt) return false;
        if (mt.startsWith('text/')) return true;
        const textish = ['application/json', 'application/xml', 'application/javascript', 'application/x-javascript', 'application/xhtml+xml'];
        return textish.includes(mt);
      };

      if (isTextLike(mime) || mime === 'text/markdown' || mime === 'text/csv') {
        // 2a) Text: fetch UTF-8 content and show in a new window
        const contentRes = await fetch('https://storage.ganamaga.me/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getFileContent', userId, token, bucketName, key })
        });
        const contentData = await contentRes.json();
        if (!contentData.success) throw new Error(contentData.message || 'Failed to open text file');
        const content = contentData.content || '';

        const win = window.open('', '_blank');
        if (!win) throw new Error('Popup blocked. Please allow popups for this site.');
        const escapeHtml = (str) => str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const prettyType = mime.startsWith('text/') ? mime : `text/plain`; // ensure readable
        win.document.open();
        win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${key.split('/').pop()}</title></head><body style="margin:0;padding:16px;font-family:monospace;white-space:pre;">`);
        win.document.write(`<div style="white-space:pre-wrap;">${escapeHtml(content)}</div>`);
        win.document.write(`</body></html>`);
        win.document.close();
        return;
      }

      const isPreviewable = (mt) => {
        if (!mt) return false;
        return mt.startsWith('image/') || mt.startsWith('video/') || mt.startsWith('audio/') || mt === 'application/pdf';
      };

      if (isPreviewable(mime)) {
        // 2b) Binary previewable: download and open with correct MIME
        const binRes = await fetch('https://storage.ganamaga.me/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'downloadFile', userId, token, bucketName, key })
        });
        if (!binRes.ok) {
          const data = await binRes.json();
          throw new Error(data.message || 'Failed to download for preview');
        }
        const buf = await binRes.arrayBuffer();
        const blob = new Blob([buf], { type: mime });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        return;
      }

      // 2c) Fallback: trigger a download for other types
      const dlRes = await fetch('https://storage.ganamaga.me/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'downloadFile', userId, token, bucketName, key })
      });
      if (!dlRes.ok) {
        const data = await dlRes.json();
        throw new Error(data.message || 'Failed to download');
      }
      const blob = await dlRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = key.split('/').pop();
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

export default StorageBrowser;
