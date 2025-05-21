import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaServer, FaDatabase, FaSync } from 'react-icons/fa';

function Status() {
  const [loading, setLoading] = useState(true);
  const [apiLatency, setApiLatency] = useState(null);
  const [dbLatency, setDbLatency] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const measureLatency = async () => {
    setRefreshing(true);
    setLoading(true);
    setError('');
    
    try {
      // Measure frontend to API latency
      const apiStartTime = performance.now();
      const apiResponse = await fetch('/api/manage/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkLatency',
        }),
      });
      
      const apiEndTime = performance.now();
      const apiLatencyValue = Math.round(apiEndTime - apiStartTime);
      setApiLatency(apiLatencyValue);
      
      if (!apiResponse.ok) {
        throw new Error('Failed to connect to API');
      }
      
      const data = await apiResponse.json();
      
      if (data.success) {
        setDbLatency(data.dbLatency);
      } else {
        setError(data.message || 'Failed to check database latency');
        setDbLatency(null);
      }
    } catch (err) {
      console.error('Error checking latency:', err);
      setError('Failed to check latency. Please try again.');
      setApiLatency(null);
      setDbLatency(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    measureLatency();
  }, []);

  const getLatencyStatus = (latency) => {
    if (latency === null) return 'unknown';
    if (latency < 100) return 'good';
    if (latency < 300) return 'medium';
    return 'poor';
  };

  const apiStatus = getLatencyStatus(apiLatency);
  const dbStatus = getLatencyStatus(dbLatency);

  return (
    <StatusContainer>
      <StatusHeader>
        <h2>System Status</h2>
        <RefreshButton onClick={measureLatency} disabled={refreshing}>
          <FaSync className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </StatusHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <StatusGrid>
        <StatusCard>
          <StatusIcon>
            <FaServer />
          </StatusIcon>
          <StatusInfo>
            <StatusTitle>Frontend to API Latency</StatusTitle>
            {loading ? (
              <StatusValue>Measuring...</StatusValue>
            ) : (
              <>
                <StatusValue status={apiStatus}>
                  {apiLatency !== null ? `${apiLatency} ms` : 'Failed to measure'}
                </StatusValue>
                <StatusIndicator status={apiStatus} />
              </>
            )}
          </StatusInfo>
        </StatusCard>

        <StatusCard>
          <StatusIcon>
            <FaDatabase />
          </StatusIcon>
          <StatusInfo>
            <StatusTitle>API to Database Latency</StatusTitle>
            {loading ? (
              <StatusValue>Measuring...</StatusValue>
            ) : (
              <>
                <StatusValue status={dbStatus}>
                  {dbLatency !== null ? `${dbLatency} ms` : 'Failed to measure'}
                </StatusValue>
                <StatusIndicator status={dbStatus} />
              </>
            )}
          </StatusInfo>
        </StatusCard>
      </StatusGrid>
    </StatusContainer>
  );
}

// Styled components
const StatusContainer = styled.div`
  margin-bottom: 2rem;
`;

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: var(--text-primary);
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: var(--accent-hover);
  }

  &:disabled {
    background-color: var(--bg-secondary);
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const StatusCard = styled.div`
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  box-shadow: 0 2px 4px var(--card-shadow);
`;

const StatusIcon = styled.div`
  font-size: 2rem;
  color: var(--accent-color);
  margin-right: 1rem;
`;

const StatusInfo = styled.div`
  flex: 1;
`;

const StatusTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-primary);
`;

const StatusValue = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => {
    switch(props.status) {
      case 'good': return 'var(--success-color, #4caf50)';
      case 'medium': return 'var(--warning-color, #ff9800)';
      case 'poor': return 'var(--error-color, #f44336)';
      default: return 'var(--text-primary)';
    }
  }};
`;

const StatusIndicator = styled.div`
  width: 100%;
  height: 4px;
  margin-top: 0.5rem;
  background-color: ${props => {
    switch(props.status) {
      case 'good': return 'var(--success-color, #4caf50)';
      case 'medium': return 'var(--warning-color, #ff9800)';
      case 'poor': return 'var(--error-color, #f44336)';
      default: return 'var(--bg-secondary)';
    }
  }};
  border-radius: 2px;
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--error-color, #f44336);
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
`;

export default Status;