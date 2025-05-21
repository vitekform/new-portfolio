import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUser, FaEnvelope, FaLock, FaCheck, FaSpinner, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

function AccountSettings() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form submission states
  const [submitting, setSubmitting] = useState(false);
  const [activeForm, setActiveForm] = useState(null);

  // Email verification state
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getUserData',
          userId,
          token
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserData(data.userData);
        setUsername(data.userData.username);
        setEmail(data.userData.email);
      } else {
        setError(data.message || 'Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (username.trim() === '' || username === userData.username) {
      return;
    }

    await updateUserField('username', username);
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (email.trim() === '' || email === userData.email) {
      return;
    }

    await updateUserField('email', email);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (currentPassword.trim() === '' || newPassword.trim() === '' || confirmPassword.trim() === '') {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    await updateUserField('password', newPassword, currentPassword);
  };

  const updateUserField = async (field, value, currentPassword = null) => {
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        return;
      }

      const requestBody = {
        action: 'updateUserField',
        userId,
        token,
        field,
        value
      };

      if (currentPassword) {
        requestBody.currentPassword = currentPassword;
      }

      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);

        // Update local state if username or email was changed
        if (field === 'username' || field === 'email') {
          setUserData(prev => ({
            ...prev,
            [field]: value
          }));
        }

        // Clear password fields if password was updated
        if (field === 'password') {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }

        setActiveForm(null);
      } else {
        setError(data.message || `Failed to update ${field}`);
      }
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      setError(`Failed to update ${field}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setVerificationLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendVerificationEmail',
          userId,
          token
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Verification email sent. Please check your inbox.');
        setVerificationSent(true);
      } else {
        setError(data.message || 'Failed to send verification email');
      }
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError('Failed to send verification email. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };


  const handleSetTheme = async (isDark) => {
    // First update the UI immediately
    if (darkMode !== isDark) {
      toggleDarkMode();
    }

    // Then save the preference to the user's account if they're logged in
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        return; // Still use cookies (handled by ThemeContext) if not logged in
      }

      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateUserField',
          userId,
          token,
          field: 'theme',
          value: isDark ? 'dark' : 'light'
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Failed to save theme preference:', data.message);
      }
    } catch (err) {
      console.error('Error saving theme preference:', err);
    }
  };

  if (loading) {
    return (
      <LoadingWrapper>
        <FaSpinner className="spinner" />
        <p>Loading account settings...</p>
      </LoadingWrapper>
    );
  }

  return (
    <AccountSettingsContainer>
      <SettingsHeader>
        <h2>Account Settings</h2>
      </SettingsHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      <SettingsSection>
        <SectionTitle>Theme Preference</SectionTitle>
        <ThemeOptions>
          <ThemeOption 
            active={!darkMode} 
            onClick={() => handleSetTheme(false)}
          >
            <FaSun />
            <span>Light Mode</span>
          </ThemeOption>
          <ThemeOption 
            active={darkMode} 
            onClick={() => handleSetTheme(true)}
          >
            <FaMoon />
            <span>Dark Mode</span>
          </ThemeOption>
        </ThemeOptions>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Profile Information</SectionTitle>

        <SettingsCard>
          <SettingRow>
            <SettingLabel>
              <FaUser />
              <span>Username</span>
            </SettingLabel>
            <SettingValue>{userData?.username}</SettingValue>
            <EditButton onClick={() => setActiveForm('username')}>Edit</EditButton>
          </SettingRow>

          {activeForm === 'username' && (
            <EditForm onSubmit={handleUpdateUsername}>
              <FormInput
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="New username"
                required
              />
              <ButtonGroup>
                <SubmitButton type="submit" disabled={submitting}>
                  {submitting ? <FaSpinner className="spinner" /> : 'Save'}
                </SubmitButton>
                <CancelButton type="button" onClick={() => {
                  setActiveForm(null);
                  setUsername(userData.username);
                }}>
                  Cancel
                </CancelButton>
              </ButtonGroup>
            </EditForm>
          )}
        </SettingsCard>

        <SettingsCard>
          <SettingRow>
            <SettingLabel>
              <FaEnvelope />
              <span>Email</span>
            </SettingLabel>
            <SettingValue>{userData?.email}</SettingValue>
            <EditButton onClick={() => setActiveForm('email')}>Edit</EditButton>
          </SettingRow>

          {activeForm === 'email' && (
            <EditForm onSubmit={handleUpdateEmail}>
              <FormInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="New email address"
                required
              />
              <ButtonGroup>
                <SubmitButton type="submit" disabled={submitting}>
                  {submitting ? <FaSpinner className="spinner" /> : 'Save'}
                </SubmitButton>
                <CancelButton type="button" onClick={() => {
                  setActiveForm(null);
                  setEmail(userData.email);
                }}>
                  Cancel
                </CancelButton>
              </ButtonGroup>
            </EditForm>
          )}
        </SettingsCard>

        <SettingsCard>
          <SettingRow>
            <SettingLabel>
              <FaLock />
              <span>Password</span>
            </SettingLabel>
            <SettingValue>••••••••</SettingValue>
            <EditButton onClick={() => setActiveForm('password')}>Change</EditButton>
          </SettingRow>

          {activeForm === 'password' && (
            <EditForm onSubmit={handleUpdatePassword}>
              <FormInput
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
              />
              <FormInput
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
              />
              <FormInput
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              <ButtonGroup>
                <SubmitButton type="submit" disabled={submitting}>
                  {submitting ? <FaSpinner className="spinner" /> : 'Save'}
                </SubmitButton>
                <CancelButton type="button" onClick={() => {
                  setActiveForm(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}>
                  Cancel
                </CancelButton>
              </ButtonGroup>
            </EditForm>
          )}
        </SettingsCard>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Email Verification</SectionTitle>
        <VerificationCard>
          <VerificationStatus verified={userData?.role !== 'unverified'}>
            {userData?.role !== 'unverified' ? (
              <>
                <FaCheck /> Your email is verified
              </>
            ) : (
              'Your email is not verified'
            )}
          </VerificationStatus>

          {userData?.role === 'unverified' && (
            <>
              <VerifyButton 
                onClick={handleSendVerificationEmail} 
                disabled={verificationLoading || verificationSent}
              >
                {verificationLoading ? (
                  <FaSpinner className="spinner" />
                ) : verificationSent ? (
                  'Verification Email Sent'
                ) : (
                  'Send Verification Email'
                )}
              </VerifyButton>

            </>
          )}
        </VerificationCard>
      </SettingsSection>
    </AccountSettingsContainer>
  );
}

// Styled components
const AccountSettingsContainer = styled.div`
  margin-bottom: 2rem;
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: var(--text-primary);
  }
`;

const SettingsSection = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
`;

const SettingsCard = styled.div`
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SettingLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
`;

const SettingValue = styled.div`
  flex: 1;
  margin: 0 1rem;
  color: var(--text-primary);
`;

const EditButton = styled.button`
  background-color: transparent;
  color: var(--accent-color);
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const EditForm = styled.form`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--card-border);
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  background-color: var(--input-bg);
  color: var(--text-primary);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const SubmitButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: var(--accent-hover);
  }

  &:disabled {
    background-color: var(--bg-secondary);
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

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: var(--bg-tertiary);
  }
`;

const ThemeOptions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ThemeOption = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.active ? 'var(--accent-color)' : 'var(--card-bg)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border: 1px solid ${props => props.active ? 'var(--accent-color)' : 'var(--card-border)'};
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-speed) ease;

  &:hover {
    background-color: ${props => props.active ? 'var(--accent-hover)' : 'var(--bg-secondary)'};
  }
`;

const VerificationCard = styled.div`
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  & > div:first-child {
    margin-bottom: 0;
  }

  & > button {
    align-self: center;
  }
`;

const VerificationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.verified ? 'var(--success-color, #4caf50)' : 'var(--warning-color, #ff9800)'};
`;

const VerifyButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: var(--accent-hover);
  }

  &:disabled {
    background-color: ${props => props.verificationSent ? 'var(--success-color, #4caf50)' : 'var(--bg-secondary)'};
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
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


export default AccountSettings;
