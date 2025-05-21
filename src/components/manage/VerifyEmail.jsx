import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setVerificationStatus('error');
          setMessage('Missing verification token. Please check your verification link.');
          return;
        }
        
        const response = await fetch('/api/manage/userUtils', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'verifyEmail',
            verificationToken: token
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setVerificationStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setVerificationStatus('error');
          setMessage(data.message || 'Failed to verify your email. Please try again.');
        }
      } catch (err) {
        console.error('Error verifying email:', err);
        setVerificationStatus('error');
        setMessage('An error occurred while verifying your email. Please try again later.');
      }
    };
    
    verifyEmail();
  }, [searchParams]);
  
  return (
    <VerifyEmailContainer>
      <VerificationCard>
        <CardHeader>
          <h2>Email Verification</h2>
        </CardHeader>
        
        <CardContent>
          {verificationStatus === 'loading' && (
            <StatusMessage>
              <FaSpinner className="spinner" />
              <p>{message}</p>
            </StatusMessage>
          )}
          
          {verificationStatus === 'success' && (
            <StatusMessage success>
              <FaCheckCircle />
              <p>{message}</p>
            </StatusMessage>
          )}
          
          {verificationStatus === 'error' && (
            <StatusMessage error>
              <FaTimesCircle />
              <p>{message}</p>
            </StatusMessage>
          )}
          
          <ActionLinks>
            {verificationStatus === 'success' && (
              <ActionLink to="/manage/auth/login">
                Log in to your account
              </ActionLink>
            )}
            
            {verificationStatus === 'error' && (
              <ActionLink to="/manage">
                Return to dashboard
              </ActionLink>
            )}
          </ActionLinks>
        </CardContent>
      </VerificationCard>
    </VerifyEmailContainer>
  );
}

// Styled components
const VerifyEmailContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--bg-primary);
`;

const VerificationCard = styled.div`
  width: 100%;
  max-width: 500px;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 10px var(--card-shadow);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--card-border);
  
  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.5rem;
    text-align: center;
  }
`;

const CardContent = styled.div`
  padding: 2rem;
`;

const StatusMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 2rem;
  
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: ${props => {
      if (props.success) return 'var(--success-color, #4caf50)';
      if (props.error) return 'var(--error-color, #f44336)';
      return 'var(--text-primary)';
    }};
  }
  
  p {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.1rem;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ActionLinks = styled.div`
  display: flex;
  justify-content: center;
`;

const ActionLink = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-color);
  color: white;
  text-decoration: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  transition: background-color var(--transition-speed) ease;
  
  &:hover {
    background-color: var(--accent-hover);
  }
`;

export default VerifyEmail;