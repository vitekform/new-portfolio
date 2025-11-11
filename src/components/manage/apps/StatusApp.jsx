import React from 'react';
import styled from 'styled-components';
import Status from '../Status';

function StatusApp() {
  return (
    <StatusSection>
      <Status />
    </StatusSection>
  );
}

const StatusSection = styled.section`
  h2 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

export default StatusApp;
