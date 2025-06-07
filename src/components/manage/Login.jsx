import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaUser, FaLock, FaSpinner, FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import DeviceVerification from './DeviceVerification';
import '../../App.css';
import '../../index.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requireVerification, setRequireVerification] = useState(false);
  const [verificationData, setVerificationData] = useState({
    userId: null,
    token: null
  });

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
    setRequireVerification(false);

    try {
      // Send data as JSON in POST request
      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          username: formData.username,
          password: formData.password
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('Login successful! Redirecting...');
        // Store user data in localStorage or sessionStorage
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('token', data.token);

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/manage';
        }, 1500);
      } else if (data.requireVerification) {
        // Device verification required
        setVerificationData({
          userId: data.userId,
          token: data.token
        });
        setRequireVerification(true);
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (data) => {
    // Store user data in localStorage or sessionStorage
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('token', data.token);

    // Redirect to dashboard
    window.location.href = '/manage';
  };

  if (requireVerification) {
    return (
      <DeviceVerification 
        userId={verificationData.userId} 
        token={verificationData.token} 
        onVerificationSuccess={handleVerificationSuccess} 
      />
    );
  }

  return (
    <FormContainer>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FormHeader>
          <FormTitle>Login to Your Account</FormTitle>
          <ThemeToggle />
        </FormHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <InputIcon>
              <FaUser />
            </InputIcon>
            <Input
              type="text"
              name="username"
              placeholder="Username or Email"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="spinner" /> Logging in...
              </>
            ) : (
              'Login'
            )}
          </SubmitButton>

          <ForgotPasswordLink>
            <Link to="/manage/auth/forgot-password">Forgot your password?</Link>
          </ForgotPasswordLink>
        </Form>

        <RegisterLink>
          Don't have an account? <Link to="/manage/auth/register">Register <FaUserPlus /></Link>
        </RegisterLink>
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

const ForgotPasswordLink = styled.div`
  text-align: center;
  margin-top: 1rem;

  a {
    color: var(--accent-color);
    text-decoration: none;
    font-size: 0.9rem;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 2rem;
  color: var(--text-secondary);

  a {
    color: var(--accent-color);
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export default Login;
