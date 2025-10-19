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
      const res = await fetch('/api/manage/storage', {
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
      const res = await fetch('/api/manage/storage', {
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
      const res = await fetch('/api/manage/storage', {
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
    // For images or text, try to open in new tab if possible
    try {
      // Try fetching type first (optional)
      const res = await fetch('/api/manage/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'downloadFile', userId, token, bucketName, key })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to open');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('action', 'uploadFile');
      formData.append('userId', userId);
      formData.append('token', token);
      formData.append('bucketName', bucketName);
      formData.append('prefix', prefix);
      formData.append('file', file);

      const res = await fetch('/api/manage/storage', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');
      fetchListing();
    } catch (e) {
      alert(e.message);
    } finally {
      // reset input value to allow re-uploading same filename
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
          <input type="file" onChange={handleUpload} />
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
