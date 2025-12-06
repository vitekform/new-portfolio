import React from 'react';
import styled from 'styled-components';
import AIChat from '../AIChat';

function AIChatApp() {
  return (
    <AIChatSection>
      <AIChat />
    </AIChatSection>
  );
}

const AIChatSection = styled.section`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export default AIChatApp;
