import React from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <ErrorContainer>
          <ErrorIcon>
            <FaExclamationTriangle />
          </ErrorIcon>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            We're sorry, but there was an error loading this content.
          </ErrorMessage>
          <ErrorDetails>
            {this.state.error && this.state.error.toString()}
          </ErrorDetails>
          <RetryButton onClick={() => window.location.reload()}>
            Reload Page
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Styled components
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  margin: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #343a40;
`;

const ErrorMessage = styled.p`
  margin: 0 0 1rem 0;
  color: #6c757d;
`;

const ErrorDetails = styled.pre`
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f1f3f5;
  border-radius: 0.25rem;
  color: #dc3545;
  font-size: 0.875rem;
  max-width: 100%;
  overflow-x: auto;
`;

const RetryButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0069d9;
  }
`;

export default ErrorBoundary;