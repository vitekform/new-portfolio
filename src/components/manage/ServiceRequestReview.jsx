import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaServer, FaCheck, FaTimes, FaSpinner, FaFilter, FaUser, FaCalendarAlt, FaTicketAlt } from 'react-icons/fa';

function ServiceRequestReview() {
  const [loading, setLoading] = useState(true);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    fetchServiceRequests();
  }, [statusFilter]);

  const fetchServiceRequests = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/manage/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getServiceRequests',
          userId,
          token,
          status: statusFilter === 'all' ? null : statusFilter
        }),
      });

      const data = await response.json();

      if (data.success) {
        setServiceRequests(data.serviceRequests || []);
      } else {
        setError(data.message || 'Failed to fetch service requests');
      }
    } catch (err) {
      console.error('Error fetching service requests:', err);
      setError('Failed to fetch service requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    setError('');
    setSuccess('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/manage/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateServiceRequestStatus',
          userId,
          token,
          requestId,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Service request ${newStatus} successfully`);
        // Update the local state to reflect the change
        setServiceRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === requestId 
              ? { ...request, status: newStatus } 
              : request
          )
        );
      } else {
        setError(data.message || `Failed to ${newStatus} service request`);
      }
    } catch (err) {
      console.error(`Error ${newStatus} service request:`, err);
      setError(`Failed to ${newStatus} service request. Please try again.`);
    }
  };

  const handleCreateTicket = async (requestId) => {
    setCreatingTicket(true);
    setError('');
    setSuccess('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        setCreatingTicket(false);
        return;
      }

      const response = await fetch('/api/manage/ticketUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createTicket',
          userId,
          token,
          serviceRequestId: requestId,
          title: `Support Ticket #${requestId}`
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Ticket created successfully. You can now chat with the user.');
        // Update the local state to reflect the change
        fetchServiceRequests(); // Refresh the list to show the ticket status
      } else {
        setError(data.message || 'Failed to create ticket');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading && serviceRequests.length === 0) {
    return (
      <LoadingWrapper>
        <FaSpinner className="spinner" />
        <p>Loading service requests...</p>
      </LoadingWrapper>
    );
  }

  return (
    <ReviewContainer>
      <ReviewHeader>
        <h2>Service Request Review</h2>
        <FilterContainer>
          <FilterLabel>
            <FaFilter /> Filter:
          </FilterLabel>
          <FilterSelect 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </FilterSelect>
        </FilterContainer>
      </ReviewHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {serviceRequests.length === 0 ? (
        <EmptyState>
          No service requests found with the selected filter.
        </EmptyState>
      ) : (
        <RequestsList>
          {serviceRequests.map((request) => (
            <RequestCard key={request.id} status={request.status}>
              <RequestHeader>
                <ServiceName>
                  <FaServer />
                  <span>{request.service.name}</span>
                </ServiceName>
                <RequestStatus status={request.status}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </RequestStatus>
              </RequestHeader>

              <RequestDetails>
                <RequestDetail>
                  <FaUser />
                  <span>Requested by: {request.user.username}</span>
                </RequestDetail>
                <RequestDetail>
                  <FaCalendarAlt />
                  <span>Requested on: {formatDate(request.created_at)}</span>
                </RequestDetail>
              </RequestDetails>

              <RequestDescription>
                {request.details}
              </RequestDescription>

              {request.status === 'pending' && (
                <ActionButtons>
                  <ApproveButton onClick={() => handleUpdateStatus(request.id, 'approved')}>
                    <FaCheck /> Approve
                  </ApproveButton>
                  <RejectButton onClick={() => handleUpdateStatus(request.id, 'rejected')}>
                    <FaTimes /> Reject
                  </RejectButton>
                </ActionButtons>
              )}

              {request.status === 'approved' && !request.ticket && (
                <ActionButtons>
                  <CreateTicketButton 
                    onClick={() => handleCreateTicket(request.id)}
                    disabled={creatingTicket}
                  >
                    {creatingTicket ? (
                      <>
                        <FaSpinner className="spinner" /> Creating Ticket...
                      </>
                    ) : (
                      <>
                        <FaTicketAlt /> Create Support Ticket
                      </>
                    )}
                  </CreateTicketButton>
                </ActionButtons>
              )}

              {request.ticket && (
                <TicketInfo>
                  <FaTicketAlt />
                  <span>Ticket created - Check Ticket Management</span>
                </TicketInfo>
              )}
            </RequestCard>
          ))}
        </RequestsList>
      )}
    </ReviewContainer>
  );
}

// Styled components
const ReviewContainer = styled.div`
  margin-bottom: 2rem;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: var(--text-primary);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  background-color: var(--input-bg);
  color: var(--text-primary);
`;

const RequestsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RequestCard = styled.div`
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid ${props => {
    switch(props.status) {
      case 'approved': return 'var(--success-color, #4caf50)';
      case 'rejected': return 'var(--error-color, #f44336)';
      default: return 'var(--warning-color, #ff9800)';
    }
  }};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ServiceName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 1.1rem;
`;

const RequestStatus = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => {
    switch(props.status) {
      case 'approved': return 'rgba(76, 175, 80, 0.1)';
      case 'rejected': return 'rgba(244, 67, 54, 0.1)';
      default: return 'rgba(255, 152, 0, 0.1)';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'approved': return 'var(--success-color, #4caf50)';
      case 'rejected': return 'var(--error-color, #f44336)';
      default: return 'var(--warning-color, #ff9800)';
    }
  }};
`;

const RequestDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const RequestDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const RequestDescription = styled.div`
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  margin-bottom: 1rem;
  white-space: pre-wrap;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const ApproveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--success-color, #4caf50);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: var(--success-hover, #388e3c);
  }
`;

const RejectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--error-color, #f44336);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: var(--error-hover, #d32f2f);
  }
`;

const CreateTicketButton = styled.button`
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
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: var(--accent-hover);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TicketInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color, #4caf50);
  border-radius: var(--border-radius);
  margin-top: 0.5rem;
  font-size: 0.9rem;
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

const SuccessMessage = styled.div`
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color, #4caf50);
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '✓';
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
`;

export default ServiceRequestReview;
