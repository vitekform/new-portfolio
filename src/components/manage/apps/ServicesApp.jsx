import React from 'react';
import styled from 'styled-components';
import Services from '../Services';

function ServicesApp() {
  return (
    <ServicesSection>
      <Services />
    </ServicesSection>
  );
}

const ServicesSection = styled.section`
  h2 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

export default ServicesApp;
