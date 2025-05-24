import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTicketAlt, FaSpinner, FaFilter, FaUser, FaCalendarAlt, FaComment, FaExclamationCircle, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import TicketChat from './TicketChat';

function TicketManagement() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'closed'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
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

      const response = await fetch('/api/manage/ticketUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getTickets',
          userId,
          token,
          status: statusFilter === 'all' ? null : statusFilter
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        setError(data.message || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to fetch tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    // Refresh tickets after closing chat to get updated data
    fetchTickets();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getUnreadCount = (ticket) => {
    const userId = parseInt(localStorage.getItem('userId'));
    return ticket.messages.filter(
      message => !message.is_read && message.sender_id !== userId
    ).length;
  };

  if (loading && tickets.length === 0) {
    return (
      <LoadingWrapper>
        <FaSpinner className="spinner" />
        <p>Loading tickets...</p>
      </LoadingWrapper>
    );
  }

  if (showChat && selectedTicket) {
    return <TicketChat ticket={selectedTicket} onClose={handleCloseChat} />;
  }

  return (
    <TicketContainer>
      <TicketHeader>
        <h2>Ticket Management</h2>
        <FilterContainer>
          <FilterLabel>
            <FaFilter /> Filter:
          </FilterLabel>
          <FilterSelect 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </FilterSelect>
        </FilterContainer>
      </TicketHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {tickets.length === 0 ? (
        <EmptyState>
          No tickets found with the selected filter.
        </EmptyState>
      ) : (
        <TicketsList>
          {tickets.map((ticket) => {
            const unreadCount = getUnreadCount(ticket);
            return (
              <TicketCard key={ticket.id} status={ticket.status}>
                <TicketHeader>
                  <TicketTitle>
                    <FaTicketAlt />
                    <span>{ticket.title}</span>
                    {unreadCount > 0 && (
                      <UnreadBadge>{unreadCount}</UnreadBadge>
                    )}
                  </TicketTitle>
                  <TicketStatus status={ticket.status}>
                    {ticket.status === 'open' ? (
                      <>
                        <FaExclamationCircle /> Open
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Closed
                      </>
                    )}
                  </TicketStatus>
                </TicketHeader>
                
                <TicketDetails>
                  <TicketDetail>
                    <FaUser />
                    <span>From: {ticket.user.username}</span>
                  </TicketDetail>
                  <TicketDetail>
                    <FaCalendarAlt />
                    <span>Created: {formatDate(ticket.created_at)}</span>
                  </TicketDetail>
                  <TicketDetail>
                    <FaComment />
                    <span>Messages: {ticket.messages.length}</span>
                  </TicketDetail>
                </TicketDetails>
                
                {ticket.service_request && (
                  <ServiceInfo>
                    <span>Service: {ticket.service_request.service.name}</span>
                  </ServiceInfo>
                )}
                
                <ViewButton onClick={() => handleViewTicket(ticket)}>
                  View Conversation <FaArrowRight />
                </ViewButton>
              </TicketCard>
            );
          })}
        </TicketsList>
      )}
    </TicketContainer>
  );
}

// Styled components
const TicketContainer = styled.div`
  margin-bottom: 2rem;
`;

const TicketHeader = styled.div`
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

const TicketsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TicketCard = styled.div`
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid ${props => props.status === 'open' ? 'var(--warning-color, #ff9800)' : 'var(--success-color, #4caf50)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const TicketTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 1.1rem;
  position: relative;
`;

const UnreadBadge = styled.span`
  background-color: var(--error-color, #f44336);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  margin-left: 0.5rem;
`;

const TicketStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => props.status === 'open' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)'};
  color: ${props => props.status === 'open' ? 'var(--warning-color, #ff9800)' : 'var(--success-color, #4caf50)'};
`;

const TicketDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
`;

const TicketDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const ServiceInfo = styled.div`
  padding: 0.5rem;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const ViewButton = styled.button`
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
  margin-top: 0.5rem;

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

export default TicketManagement;