import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaKey, FaSpinner, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import ThemeToggle from '../common/ThemeToggle';

function DeviceVerification({ userId, token, onVerificationSuccess }) {
  const [authCode, setAuthCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    // Only allow numbers and limit to 6 digits
    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
    setAuthCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send data as JSON in POST request
      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verifyDeviceCode',
          userId,
          token,
          authCode
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        // Call the onVerificationSuccess callback after a short delay
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess(data);
          }
        }, 1500);
      } else {
        setError(data.message || 'Failed to verify device. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Device verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    // This would typically trigger a new login attempt
    // For simplicity, we'll just show a message
    setError('Please try logging in again to receive a new verification code.');
  };

  return (
    <FormContainer>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FormHeader>
          <FormTitle>Device Verification</FormTitle>
          <ThemeToggle />
        </FormHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {success ? (
          <SuccessContainer>
            <SuccessIcon>
              <FaCheckCircle />
            </SuccessIcon>
            <SuccessMessage>Device verified successfully!</SuccessMessage>
            <p>You will be redirected to your account shortly...</p>
          </SuccessContainer>
        ) : (
          <>
            <FormDescription>
              <p>We've detected a login from a new device.</p>
              <p>For your security, please enter the 6-digit verification code sent to your email.</p>
              <EmailIcon>
                <FaEnvelope />
              </EmailIcon>
            </FormDescription>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <InputIcon>
                  <FaKey />
                </InputIcon>
                <CodeInput
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={authCode}
                  onChange={handleChange}
                  required
                  pattern="\d{6}"
                  title="Please enter a 6-digit code"
                />
              </FormGroup>

              <SubmitButton type="submit" disabled={loading || authCode.length !== 6}>
                {loading ? (
                  <>
                    <FaSpinner className="spinner" /> Verifying...
                  </>
                ) : (
                  'Verify Device'
                )}
              </SubmitButton>
              
              <ResendCodeButton type="button" onClick={handleResendCode}>
                Didn't receive a code? Try again
              </ResendCodeButton>
            </Form>
          </>
        )}
      </motion.div>
    </FormContainer>
  );
}

// Styled components
const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const FormTitle = styled.h2`
  color: var(--text-primary);
  margin: 0;
`;

const FormDescription = styled.div`
  color: var(--text-secondary);
  margin-bottom: 2rem;
  text-align: center;
  
  p {
    margin-bottom: 0.5rem;
  }
`;

const EmailIcon = styled.div`
  font-size: 3rem;
  color: var(--accent-color);
  margin: 1.5rem 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
`;

const CodeInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
  text-align: center;
  transition: border-color var(--transition-speed) ease;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
    letter-spacing: normal;
    font-size: 1rem;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ResendCodeButton = styled.button`
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
  padding: 0;
  text-align: center;
  width: 100%;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 0, 0, 0.1);
  color: #d32f2f;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem 0;
  text-align: center;
  color: var(--text-primary);

  p {
    margin-bottom: 1rem;
  }
`;

const SuccessIcon = styled.div`
  font-size: 3rem;
  color: #4caf50;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.div`
  background-color: rgba(0, 128, 0, 0.1);
  color: #388e3c;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  text-align: center;
  width: 100%;
`;

const FormContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--bg-primary);

  > div {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    background-color: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 4px 10px var(--card-shadow);
  }
`;

export default DeviceVerification;