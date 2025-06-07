import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaLock, FaSpinner, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { Link, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import '../../App.css';
import '../../index.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    // Check if token is present in URL
    const token = searchParams.get('token');
    if (!token) {
      setTokenError('Missing reset token. Please check your reset link.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Get token from URL
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setError('Missing reset token. Please check your reset link.');
      setLoading(false);
      return;
    }

    try {
      // Send data as JSON in POST request
      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resetPassword',
          resetToken: resetToken,
          newPassword: formData.newPassword
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Your password has been reset successfully');
        // Clear form
        setFormData({
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FormHeader>
          <FormTitle>Reset Your Password</FormTitle>
          <ThemeToggle />
        </FormHeader>

        {tokenError ? (
          <TokenErrorContainer>
            <ErrorMessage>{tokenError}</ErrorMessage>
            <p>The reset link appears to be invalid or expired.</p>
            <BackToLogin>
              <FaArrowLeft /> <Link to="/manage/auth/forgot-password">Request a new reset link</Link>
            </BackToLogin>
          </TokenErrorContainer>
        ) : (
          <>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success ? (
              <SuccessContainer>
                <SuccessIcon>
                  <FaCheckCircle />
                </SuccessIcon>
                <SuccessMessage>{success}</SuccessMessage>
                <p>Your password has been updated successfully.</p>
                <BackToLogin>
                  <FaArrowLeft /> <Link to="/manage/auth/login">Back to Login</Link>
                </BackToLogin>
              </SuccessContainer>
            ) : (
              <>
                <FormDescription>
                  Create a new password for your account.
                </FormDescription>

                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <InputIcon>
                      <FaLock />
                    </InputIcon>
                    <Input
                      type="password"
                      name="newPassword"
                      placeholder="New Password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      minLength="6"
                    />
                  </FormGroup>

                  <FormGroup>
                    <InputIcon>
                      <FaLock />
                    </InputIcon>
                    <Input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm New Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength="6"
                    />
                  </FormGroup>

                  <PasswordRequirements>
                    Password must be at least 6 characters long.
                  </PasswordRequirements>

                  <SubmitButton type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <FaSpinner className="spinner" /> Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </SubmitButton>
                </Form>

                <BackToLogin>
                  <FaArrowLeft /> <Link to="/manage/auth/login">Back to Login</Link>
                </BackToLogin>
              </>
            )}
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

const FormDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
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

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-speed) ease;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
  }
`;

const PasswordRequirements = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: -0.5rem;
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

const ErrorMessage = styled.div`
  background-color: rgba(255, 0, 0, 0.1);
  color: #d32f2f;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background-color: rgba(0, 128, 0, 0.1);
  color: #388e3c;
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

const TokenErrorContainer = styled.div`
  text-align: center;
  color: var(--text-primary);
  
  p {
    margin: 1rem 0 2rem;
  }
`;

const BackToLogin = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  color: var(--text-secondary);
  
  a {
    color: var(--accent-color);
    text-decoration: none;
    margin-left: 0.5rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
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

export default ResetPassword;