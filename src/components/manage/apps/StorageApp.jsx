import React from 'react';
import styled from 'styled-components';
import StorageBrowser from '../StorageBrowser';

function StorageApp() {
  return (
    <StorageSection>
      <StorageBrowser />
    </StorageSection>
  );
}

const StorageSection = styled.section`
  h2 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

export default StorageApp;
