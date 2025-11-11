import React from 'react';
import styled from 'styled-components';
import TicketManagement from '../TicketManagement';

function TicketsApp() {
  return (
    <TicketsSection>
      <TicketManagement />
    </TicketsSection>
  );
}

const TicketsSection = styled.section`
  h2 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

export default TicketsApp;
