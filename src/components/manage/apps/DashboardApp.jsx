import React from 'react';
import styled from 'styled-components';

function DashboardApp() {
  return (
    <DashboardSection>
      <h2>Dashboard Overview</h2>
      <p>Welcome to your management dashboard.</p>
      {/* Add more dashboard content here */}
    </DashboardSection>
  );
}

const DashboardSection = styled.section`
  h2 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

export default DashboardApp;
