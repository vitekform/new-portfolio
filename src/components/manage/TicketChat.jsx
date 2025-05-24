import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaArrowLeft, FaSpinner, FaPaperPlane, FaUser, FaLock, FaUnlock, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

function TicketChat({ ticket, onClose }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [message, setMessage] = useState('');
  const [currentTicket, setCurrentTicket] = useState(ticket);
  const messagesEndRef = useRef(null);
  const isAdmin = localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'root';

  // Refresh ticket data every 10 seconds to get new messages
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshTicket();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [currentTicket.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentTicket.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const refreshTicket = async () => {
    setRefreshing(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        setRefreshing(false);
        return;
      }

      const response = await fetch('/api/manage/ticketUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getTicket',
          userId,
          token,
          ticketId: currentTicket.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentTicket(data.ticket);
      } else {
        setError(data.message || 'Failed to refresh ticket');
      }
    } catch (err) {
      console.error('Error refreshing ticket:', err);
      setError('Failed to refresh ticket. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }

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
          action: 'sendMessage',
          userId,
          token,
          ticketId: currentTicket.id,
          content: message
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('');
        // Refresh ticket to get the new message
        await refreshTicket();
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (newStatus) => {
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
          action: 'updateTicketStatus',
          userId,
          token,
          ticketId: currentTicket.id,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        // Update local ticket state
        setCurrentTicket(prev => ({
          ...prev,
          status: newStatus
        }));
      } else {
        setError(data.message || `Failed to ${newStatus === 'open' ? 'reopen' : 'close'} ticket`);
      }
    } catch (err) {
      console.error(`Error ${newStatus === 'open' ? 'reopening' : 'closing'} ticket:`, err);
      setError(`Failed to ${newStatus === 'open' ? 'reopen' : 'close'} ticket. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const isUserMessage = (senderId) => {
    return parseInt(localStorage.getItem('userId')) === senderId;
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <BackButton onClick={onClose}>
          <FaArrowLeft /> Back to Tickets
        </BackButton>
        <TicketInfo>
          <TicketTitle>{currentTicket.title}</TicketTitle>
          <TicketStatus status={currentTicket.status}>
            {currentTicket.status === 'open' ? (
              <>
                <FaExclamationCircle /> Open
              </>
            ) : (
              <>
                <FaCheckCircle /> Closed
              </>
            )}
          </TicketStatus>
        </TicketInfo>
        {isAdmin && (
          <StatusActions>
            {currentTicket.status === 'open' ? (
              <CloseButton 
                onClick={() => handleUpdateTicketStatus('closed')}
                disabled={loading}
              >
                <FaLock /> Close Ticket
              </CloseButton>
            ) : (
              <ReopenButton 
                onClick={() => handleUpdateTicketStatus('open')}
                disabled={loading}
              >
                <FaUnlock /> Reopen Ticket
              </ReopenButton>
            )}
          </StatusActions>
        )}
      </ChatHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <ServiceInfo>
        {currentTicket.service_request ? (
          <>
            <strong>Service:</strong> {currentTicket.service_request.service.name}
            <br />
            <strong>Details:</strong> {currentTicket.service_request.details}
          </>
        ) : (
          <span>No service request attached</span>
        )}
      </ServiceInfo>

      <MessagesContainer>
        {currentTicket.messages.length === 0 ? (
          <EmptyMessages>
            No messages yet. Start the conversation!
          </EmptyMessages>
        ) : (
          currentTicket.messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              isUser={isUserMessage(msg.sender_id)}
            >
              <MessageHeader>
                <SenderInfo>
                  <FaUser />
                  <span>
                    {msg.sender.username}
                    {msg.sender.role === 'admin' || msg.sender.role === 'root' ? 
                      ` (${msg.sender.role})` : ''}
                  </span>
                </SenderInfo>
                <MessageTime>{formatDate(msg.created_at)}</MessageTime>
              </MessageHeader>
              <MessageContent>{msg.content}</MessageContent>
            </MessageBubble>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {refreshing && (
          <RefreshingIndicator>
            <FaSpinner className="spinner" /> Refreshing...
          </RefreshingIndicator>
        )}
      </MessagesContainer>

      {currentTicket.status === 'open' ? (
        <MessageForm onSubmit={handleSendMessage}>
          <MessageInput
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={loading}
          />
          <SendButton type="submit" disabled={loading || !message.trim()}>
            {loading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
          </SendButton>
        </MessageForm>
      ) : (
        <ClosedTicketMessage>
          This ticket is closed. {isAdmin && 'Reopen it to continue the conversation.'}
        </ClosedTicketMessage>
      )}
    </ChatContainer>
  );
}

// Styled components
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  min-height: 500px;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--card-border);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const TicketInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TicketTitle = styled.h3`
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
`;

const TicketStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 0.25rem;
  background-color: ${props => props.status === 'open' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)'};
  color: ${props => props.status === 'open' ? 'var(--warning-color, #ff9800)' : 'var(--success-color, #4caf50)'};
`;

const StatusActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ReopenButton = styled.button`
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ServiceInfo = styled.div`
  padding: 1rem;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.9rem;
  border-bottom: 1px solid var(--card-border);
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EmptyMessages = styled.div`
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  background-color: ${props => props.isUser ? 'var(--accent-color)' : 'var(--bg-secondary)'};
  color: ${props => props.isUser ? 'white' : 'var(--text-primary)'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
`;

const SenderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
`;

const MessageTime = styled.span`
  opacity: 0.8;
`;

const MessageContent = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
`;

const MessageForm = styled.form`
  display: flex;
  padding: 1rem;
  gap: 0.5rem;
  border-top: 1px solid var(--card-border);
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  background-color: var(--input-bg);
  color: var(--text-primary);
  resize: none;
  min-height: 40px;
  max-height: 120px;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

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

const RefreshingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  padding: 0.5rem;
  
  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ClosedTicketMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--card-border);
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--error-color, #f44336);
  padding: 0.75rem;
  margin: 0.5rem;
  border-radius: var(--border-radius);
`;

const SuccessMessage = styled.div`
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color, #4caf50);
  padding: 0.75rem;
  margin: 0.5rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '✓';
  }
`;

export default TicketChat;