import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaTrash, FaPlus, FaPaperPlane, FaRobot, FaUser, FaCog, FaChevronDown } from 'react-icons/fa';

function AIChat() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('@cf/meta/llama-2-7b-chat-int8');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const messagesEndRef = useRef(null);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUserRole();
    fetchConversations();
    fetchModels();
    fetchSystemPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUserData', userId, token })
      });
      const data = await response.json();
      if (data.success) {
        setIsAdmin(data.userData.role === 'admin' || data.userData.role === 'root');
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/manage/aiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getConversations', userId, token })
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/manage/aiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAvailableModels', userId, token })
      });
      const data = await response.json();
      if (data.success) {
        setModels(data.models);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  const fetchSystemPrompt = async () => {
    try {
      const response = await fetch('/api/manage/aiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSystemPrompt', userId, token })
      });
      const data = await response.json();
      if (data.success) {
        setSystemPrompt(data.systemPrompt);
      }
    } catch (err) {
      console.error('Error fetching system prompt:', err);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await fetch('/api/manage/aiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getConversation', userId, token, conversationId })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentConversation(data.conversation);
        setMessages(data.messages);
        setSelectedModel(data.conversation.model);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    }
  };

  const createNewConversation = async () => {
    if (!newChatTitle.trim()) {
      setError('Conversation title is required');
      return;
    }

    try {
      const response = await fetch('/api/manage/aiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createConversation',
          userId,
          token,
          title: newChatTitle,
          model: selectedModel
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewChatTitle('');
        setShowNewChatModal(false);
        fetchConversations();
        loadConversation(data.conversationId);
        setSuccessMessage('Conversation created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch('/api/manage/aiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteConversation', userId, token, conversationId })
      });
      const data = await response.json();
      if (data.success) {
        fetchConversations();
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        setShowDeleteConfirm(false);
        setConversationToDelete(null);
        setSuccessMessage('Conversation deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setLoading(true);
    setError('');

    // Add user message to UI immediately
    const tempUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/manage/aiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          userId,
          token,
          conversationId: currentConversation.id,
          message: userMessage,
          model: selectedModel
        })
      });
      const data = await response.json();
      
      if (data.success) {
        // Add assistant message
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.message,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
        fetchConversations(); // Refresh to update timestamps
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const updateSystemPrompt = async () => {
    try {
      const response = await fetch('/api/manage/aiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSystemPrompt',
          userId,
          token,
          systemPrompt
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('System prompt updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update system prompt');
      }
    } catch (err) {
      console.error('Error updating system prompt:', err);
      setError('Failed to update system prompt');
    }
  };

  return (
    <ChatContainer>
      <Sidebar>
        <SidebarHeader>
          <h3>Conversations</h3>
          <NewChatButton onClick={() => setShowNewChatModal(true)}>
            <FaPlus /> New Chat
          </NewChatButton>
        </SidebarHeader>
        <ConversationList>
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              active={currentConversation?.id === conv.id}
              onClick={() => loadConversation(conv.id)}
            >
              <ConversationTitle>{conv.title}</ConversationTitle>
              <ConversationMeta>
                {new Date(conv.updated_at).toLocaleDateString()}
              </ConversationMeta>
              <DeleteButton
                onClick={(e) => {
                  e.stopPropagation();
                  setConversationToDelete(conv.id);
                  setShowDeleteConfirm(true);
                }}
              >
                <FaTrash />
              </DeleteButton>
            </ConversationItem>
          ))}
        </ConversationList>
      </Sidebar>

      <ChatArea>
        {currentConversation ? (
          <>
            <ChatHeader>
              <div>
                <h2>{currentConversation.title}</h2>
                <ModelSelector>
                  <FaRobot />
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown />
                </ModelSelector>
              </div>
              <SettingsButton onClick={() => setShowSettings(!showSettings)}>
                <FaCog />
              </SettingsButton>
            </ChatHeader>

            {showSettings && (
              <SettingsPanel>
                <h3>Settings</h3>
                {isAdmin ? (
                  <div>
                    <label>System Prompt (Admin Only):</label>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={4}
                    />
                    <SaveButton onClick={updateSystemPrompt}>
                      Save System Prompt
                    </SaveButton>
                  </div>
                ) : (
                  <p>System Prompt: {systemPrompt}</p>
                )}
              </SettingsPanel>
            )}

            <MessagesArea>
              {messages.map((msg) => (
                <Message key={msg.id} role={msg.role}>
                  <MessageIcon>
                    {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                  </MessageIcon>
                  <MessageContent>
                    <MessageText>{msg.content}</MessageText>
                    <MessageTime>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </MessageTime>
                  </MessageContent>
                </Message>
              ))}
              {loading && (
                <Message role="assistant">
                  <MessageIcon>
                    <FaRobot />
                  </MessageIcon>
                  <MessageContent>
                    <LoadingDots>
                      <span>.</span><span>.</span><span>.</span>
                    </LoadingDots>
                  </MessageContent>
                </Message>
              )}
              <div ref={messagesEndRef} />
            </MessagesArea>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

            <MessageForm onSubmit={sendMessage}>
              <MessageInput
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
              />
              <SendButton type="submit" disabled={loading || !newMessage.trim()}>
                <FaPaperPlane />
              </SendButton>
            </MessageForm>
          </>
        ) : (
          <EmptyState>
            <FaRobot size={64} />
            <h2>Welcome to AI Chat</h2>
            <p>Select a conversation or create a new one to get started</p>
          </EmptyState>
        )}
      </ChatArea>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>Create New Conversation</h3>
              <CloseButton onClick={() => { setShowNewChatModal(false); setNewChatTitle(''); }}>
                ×
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <label>Conversation Title:</label>
              <input
                type="text"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter title..."
                autoFocus
              />
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => { setShowNewChatModal(false); setNewChatTitle(''); }}>
                Cancel
              </CancelButton>
              <ConfirmButton onClick={createNewConversation}>
                Create
              </ConfirmButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>Delete Conversation</h3>
              <CloseButton onClick={() => { setShowDeleteConfirm(false); setConversationToDelete(null); }}>
                ×
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => { setShowDeleteConfirm(false); setConversationToDelete(null); }}>
                Cancel
              </CancelButton>
              <DeleteConfirmButton onClick={() => deleteConversation(conversationToDelete)}>
                Delete
              </DeleteConfirmButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </ChatContainer>
  );
}

// Styled Components
const ChatContainer = styled.div`
  display: flex;
  height: 100%;
  gap: 0;
  background-color: var(--bg-primary);
`;

const Sidebar = styled.div`
  width: 280px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--card-border);

  h3 {
    margin: 0 0 0.75rem 0;
    color: var(--text-primary);
  }
`;

const NewChatButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const ConversationItem = styled.div`
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: ${props => props.active ? 'var(--accent-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border-radius: var(--border-radius);
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.active ? 'var(--accent-color)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const ConversationTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
  padding-right: 30px;
`;

const ConversationMeta = styled.div`
  font-size: 0.75rem;
  opacity: 0.7;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
  padding: 0.25rem;

  &:hover {
    opacity: 1;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg);
`;

const ChatHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
  }
`;

const ModelSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;

  select {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius);
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.5rem;

  &:hover {
    color: var(--accent-color);
  }
`;

const SettingsPanel = styled.div`
  padding: 1rem 1.5rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--card-border);

  h3 {
    margin: 0 0 0.75rem 0;
    color: var(--text-primary);
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--card-bg);
    color: var(--text-primary);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius);
    resize: vertical;
    font-family: inherit;
  }
`;

const SaveButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;

  &:hover {
    opacity: 0.9;
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Message = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  opacity: ${props => props.role === 'user' ? 1 : 0.95};
`;

const MessageIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.children?.type === FaUser ? 'var(--accent-color)' : 'var(--bg-secondary)'};
  color: ${props => props.children?.type === FaUser ? 'white' : 'var(--text-primary)'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  flex: 1;
`;

const MessageText = styled.div`
  color: var(--text-primary);
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const MessageTime = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 0.25rem;
  
  span {
    animation: bounce 1.4s infinite ease-in-out both;
    
    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem 1.5rem;
  background-color: rgba(255, 0, 0, 0.1);
  color: #d32f2f;
  border-top: 1px solid var(--card-border);
`;

const SuccessMessage = styled.div`
  padding: 0.75rem 1.5rem;
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border-top: 1px solid var(--card-border);
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: var(--text-primary);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--accent-color);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius);
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: var(--accent-color);
    }
  }

  p {
    margin: 0;
    color: var(--text-primary);
    line-height: 1.5;
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--card-border);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: var(--bg-primary);
  }
`;

const ConfirmButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;

  &:hover {
    opacity: 0.9;
  }
`;

const DeleteConfirmButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;

  &:hover {
    opacity: 0.9;
  }
`;

const MessageForm = styled.form`
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--card-border);
  display: flex;
  gap: 1rem;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const SendButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 1rem;

  h2 {
    color: var(--text-primary);
    margin: 0;
  }

  p {
    margin: 0;
  }
`;

export default AIChat;
