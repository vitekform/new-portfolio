import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaEnvelope, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Send data as JSON in POST request
      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'forgotPassword',
          email: email
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Password reset instructions sent to your email');
        setEmail(''); // Clear the form
      } else {
        setError(data.message || 'Failed to process your request. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Forgot password error:', err);
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

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {!success ? (
          <>
            <FormDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </FormDescription>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <InputIcon>
                  <FaEnvelope />
                </InputIcon>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <SubmitButton type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <FaSpinner className="spinner" /> Sending...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </SubmitButton>
            </Form>
          </>
        ) : (
          <SuccessContainer>
            <p>Check your email for instructions to reset your password.</p>
            <p>If you don't see the email in your inbox, please check your spam folder.</p>
          </SuccessContainer>
        )}

        <BackToLogin>
          <FaArrowLeft /> <Link to="/manage/auth/login">Back to Login</Link>
        </BackToLogin>
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
  margin: 2rem 0;
  text-align: center;
  color: var(--text-primary);

  p {
    margin-bottom: 1rem;
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

export default ForgotPassword;