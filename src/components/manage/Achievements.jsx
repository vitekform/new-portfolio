import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTrophy, FaLock, FaUnlock, FaSpinner, FaMagic } from 'react-icons/fa';
import './achievements.css';

function Achievements() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [easterEggs, setEasterEggs] = useState([]);
  const [secretSettings, setSecretSettings] = useState([]);
  const [error, setError] = useState('');
  const [activeSecretSettings, setActiveSecretSettings] = useState({});

  useEffect(() => {
    fetchUserAchievements();
  }, []);

  const fetchUserAchievements = async () => {
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getUserAchievements',
          userId,
          token
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAchievements(data.achievements || []);
        setEasterEggs(data.easterEggs || []);
        setSecretSettings(data.secretSettings || []);

        // Initialize active secret settings
        const activeSettings = {};
        (data.secretSettings || []).forEach(setting => {
          activeSettings[setting.secret_setting.code] = false;
        });
        setActiveSecretSettings(activeSettings);
      } else {
        setError(data.message || 'Failed to fetch achievements');
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to fetch achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecretSetting = (code) => {
    setActiveSecretSettings(prev => ({
      ...prev,
      [code]: !prev[code]
    }));

    // Apply the secret setting effect
    if (code === 'RAINBOW_MODE') {
      const root = document.documentElement;
      if (!activeSecretSettings[code]) {
        // Enable rainbow mode
        root.style.setProperty('--rainbow-animation', 'rainbow 5s linear infinite');
        document.body.classList.add('rainbow-mode');
      } else {
        // Disable rainbow mode
        root.style.setProperty('--rainbow-animation', 'none');
        document.body.classList.remove('rainbow-mode');
      }
    }
  };

  if (loading) {
    return (
      <LoadingWrapper>
        <FaSpinner className="spinner" />
        <p>Loading achievements...</p>
      </LoadingWrapper>
    );
  }

  return (
    <AchievementsContainer>
      <SectionHeader>
        <h2>Achievements & Easter Eggs</h2>
      </SectionHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <AchievementsSection>
        <SectionTitle>
          <FaTrophy />
          <span>Your Achievements</span>
        </SectionTitle>

        {achievements.length === 0 ? (
          <EmptyState>
            You haven't earned any achievements yet. Keep using the app to unlock them!
          </EmptyState>
        ) : (
          <AchievementsList>
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id}>
                <AchievementIcon>
                  <FaTrophy />
                </AchievementIcon>
                <AchievementDetails>
                  <AchievementName>{achievement.achievement.name}</AchievementName>
                  <AchievementDescription>
                    {achievement.achievement.description}
                  </AchievementDescription>
                  <AchievementDate>
                    Unlocked on {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </AchievementDate>
                </AchievementDetails>
              </AchievementCard>
            ))}
          </AchievementsList>
        )}
      </AchievementsSection>

      {easterEggs.length > 0 && (
        <AchievementsSection>
          <SectionTitle>
            <FaMagic />
            <span>Easter Eggs Discovered</span>
          </SectionTitle>

          <AchievementsList>
            {easterEggs.map((easterEgg) => (
              <AchievementCard key={easterEgg.id}>
                <AchievementIcon>
                  <FaMagic />
                </AchievementIcon>
                <AchievementDetails>
                  <AchievementName>{easterEgg.easter_egg.name}</AchievementName>
                  <AchievementDescription>
                    {easterEgg.easter_egg.description}
                  </AchievementDescription>
                  <AchievementDate>
                    Discovered on {new Date(easterEgg.unlocked_at).toLocaleDateString()}
                  </AchievementDate>
                </AchievementDetails>
              </AchievementCard>
            ))}
          </AchievementsList>
        </AchievementsSection>
      )}

      {secretSettings.length > 0 && (
        <AchievementsSection>
          <SectionTitle>
            <FaUnlock />
            <span>Secret Settings</span>
          </SectionTitle>

          <SecretSettingsList>
            {secretSettings.map((setting) => (
              <SecretSettingCard key={setting.id}>
                <SecretSettingIcon active={activeSecretSettings[setting.secret_setting.code]}>
                  {activeSecretSettings[setting.secret_setting.code] ? <FaUnlock /> : <FaLock />}
                </SecretSettingIcon>
                <SecretSettingDetails>
                  <SecretSettingName>{setting.secret_setting.name}</SecretSettingName>
                  <SecretSettingDescription>
                    {setting.secret_setting.description}
                  </SecretSettingDescription>
                  <SecretSettingDate>
                    Unlocked on {new Date(setting.unlocked_at).toLocaleDateString()}
                  </SecretSettingDate>
                </SecretSettingDetails>
                <ToggleButton 
                  active={activeSecretSettings[setting.secret_setting.code]}
                  onClick={() => toggleSecretSetting(setting.secret_setting.code)}
                >
                  {activeSecretSettings[setting.secret_setting.code] ? 'Disable' : 'Enable'}
                </ToggleButton>
              </SecretSettingCard>
            ))}
          </SecretSettingsList>
        </AchievementsSection>
      )}
    </AchievementsContainer>
  );
}

// Styled components
const AchievementsContainer = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: var(--text-primary);
  }
`;

const AchievementsSection = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AchievementsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const SecretSettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AchievementCard = styled.div`
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const SecretSettingCard = styled.div`
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const AchievementIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--accent-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const SecretSettingIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.active ? 'var(--success-color, #4caf50)' : 'var(--accent-color)'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: background-color 0.3s ease;
`;

const AchievementDetails = styled.div`
  flex: 1;
`;

const SecretSettingDetails = styled.div`
  flex: 1;
`;

const AchievementName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
`;

const SecretSettingName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
`;

const AchievementDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const SecretSettingDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const AchievementDate = styled.div`
  font-size: 0.8rem;
  color: var(--text-tertiary);
`;

const SecretSettingDate = styled.div`
  font-size: 0.8rem;
  color: var(--text-tertiary);
`;

const ToggleButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${props => props.active ? 'var(--success-color, #4caf50)' : 'var(--accent-color)'};
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;
  white-space: nowrap;

  &:hover {
    background-color: ${props => props.active ? 'var(--success-hover, #388e3c)' : 'var(--accent-hover)'};
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

export default Achievements;
