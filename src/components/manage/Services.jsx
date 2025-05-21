import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaServer, FaCloud, FaCode, FaRocket, FaSpinner, FaCheck } from 'react-icons/fa';

function Services() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [requestStatus, setRequestStatus] = useState({ show: false, success: false, message: '' });
  const [selectedService, setSelectedService] = useState(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/manage/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getServices',
          userId: localStorage.getItem('userId'),
          token: localStorage.getItem('token')
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
      } else {
        setError(data.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to fetch services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = (service) => {
    setSelectedService(service);
    setShowRequestForm(true);
  };

  const submitServiceRequest = async () => {
    if (!selectedService || !requestDetails.trim()) {
      setRequestStatus({
        show: true,
        success: false,
        message: 'Please provide details for your request'
      });
      return;
    }

    try {
      const response = await fetch('/api/manage/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'requestService',
          userId: localStorage.getItem('userId'),
          token: localStorage.getItem('token'),
          serviceId: selectedService.id,
          details: requestDetails
        }),
      });
      
      const data = await response.json();
      
      setRequestStatus({
        show: true,
        success: data.success,
        message: data.message
      });

      if (data.success) {
        setRequestDetails('');
        setShowRequestForm(false);
      }
    } catch (err) {
      console.error('Error requesting service:', err);
      setRequestStatus({
        show: true,
        success: false,
        message: 'An error occurred. Please try again.'
      });
    }
  };

  const getServiceIcon = (serviceName) => {
    switch(serviceName.toLowerCase()) {
      case 'web hosting':
        return <FaServer />;
      case 'file cloud':
        return <FaCloud />;
      case 'application server':
        return <FaCode />;
      case 'ci / cd':
        return <FaRocket />;
      default:
        return <FaServer />;
    }
  };

  return (
    <ServicesContainer>
      <ServicesHeader>
        <h2>Available Services</h2>
      </ServicesHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {requestStatus.show && (
        <StatusMessage success={requestStatus.success}>
          {requestStatus.message}
        </StatusMessage>
      )}

      {loading ? (
        <LoadingWrapper>
          <FaSpinner className="spinner" />
          <p>Loading services...</p>
        </LoadingWrapper>
      ) : (
        <>
          {showRequestForm ? (
            <RequestForm>
              <h3>Request Service: {selectedService?.name}</h3>
              <p>Please provide details about your requirements:</p>
              <textarea
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                placeholder="Describe your needs, timeline, and any specific requirements..."
                rows={5}
              />
              <ButtonGroup>
                <Button primary onClick={submitServiceRequest}>Submit Request</Button>
                <Button onClick={() => setShowRequestForm(false)}>Cancel</Button>
              </ButtonGroup>
            </RequestForm>
          ) : (
            <ServicesGrid>
              {services.map((service) => (
                <ServiceCard key={service.id}>
                  <ServiceIcon>
                    {getServiceIcon(service.name)}
                  </ServiceIcon>
                  <ServiceInfo>
                    <ServiceTitle>{service.name}</ServiceTitle>
                    <ServiceDescription>{service.description}</ServiceDescription>
                  </ServiceInfo>
                  <RequestButton onClick={() => handleRequestService(service)}>
                    Request Service
                  </RequestButton>
                </ServiceCard>
              ))}
            </ServicesGrid>
          )}
        </>
      )}
    </ServicesContainer>
  );
}

// Styled components
const ServicesContainer = styled.div`
  margin-bottom: 2rem;
`;

const ServicesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: var(--text-primary);
  }
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ServiceCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  box-shadow: 0 2px 4px var(--card-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px var(--card-shadow);
  }
`;

const ServiceIcon = styled.div`
  font-size: 2rem;
  color: var(--accent-color);
  margin-bottom: 1rem;
`;

const ServiceInfo = styled.div`
  flex: 1;
`;

const ServiceTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
`;

const ServiceDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
`;

const RequestButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;
  margin-top: auto;

  &:hover {
    background-color: var(--accent-hover);
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;

  .spinner {
    animation: spin 1s linear infinite;
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--error-color, #f44336);
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
`;

const StatusMessage = styled.div`
  background-color: ${props => props.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
  color: ${props => props.success ? 'var(--success-color, #4caf50)' : 'var(--error-color, #f44336)'};
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    ${props => props.success ? "content: '✓';" : "content: '⚠';"}
  }
`;

const RequestForm = styled.div`
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  h3 {
    margin-top: 0;
    color: var(--text-primary);
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius);
    background-color: var(--input-bg);
    color: var(--text-primary);
    resize: vertical;
    margin-bottom: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${props => props.primary ? 'var(--accent-color)' : 'var(--bg-secondary)'};
  color: ${props => props.primary ? 'white' : 'var(--text-primary)'};
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: ${props => props.primary ? 'var(--accent-hover)' : 'var(--bg-tertiary)'};
  }
`;

export default Services;