import React from 'react';
import styled from 'styled-components';
import ServiceRequestReview from '../ServiceRequestReview';

function ServiceRequestsApp() {
  return (
    <ServiceRequestsSection>
      <ServiceRequestReview />
    </ServiceRequestsSection>
  );
}

const ServiceRequestsSection = styled.section`
  h2 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

export default ServiceRequestsApp;
