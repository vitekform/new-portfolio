import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaSpinner, FaSave, FaTimes } from 'react-icons/fa';

function AchievementEditor() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchAllAchievements();
  }, []);

  const fetchAllAchievements = async () => {
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

      const response = await fetch('/api/manage/achievementUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getAllAchievements',
          userId,
          token
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAchievements(data.achievements || []);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateAchievement = () => {
    setIsCreating(true);
    setEditingAchievement(null);
    setFormData({
      code: '',
      name: '',
      description: ''
    });
  };

  const handleEditAchievement = (achievement) => {
    setIsCreating(false);
    setEditingAchievement(achievement);
    setFormData({
      code: achievement.code,
      name: achievement.name,
      description: achievement.description
    });
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingAchievement(null);
    setFormData({
      code: '',
      name: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form data
    if (!formData.code || !formData.name || !formData.description) {
      setError('All fields are required');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        return;
      }

      const action = isCreating ? 'createAchievement' : 'updateAchievement';
      const achievementId = editingAchievement?.id;

      const response = await fetch('/api/manage/achievementUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId,
          token,
          achievementId,
          ...formData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(isCreating ? 'Achievement created successfully' : 'Achievement updated successfully');
        fetchAllAchievements();
        handleCancelEdit();
      } else {
        setError(data.message || 'Failed to save achievement');
      }
    } catch (err) {
      console.error('Error saving achievement:', err);
      setError('Failed to save achievement. Please try again.');
    }
  };

  const handleDeleteAchievement = async (achievement) => {
    if (!window.confirm(`Are you sure you want to delete the achievement "${achievement.name}"?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/manage/achievementUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteAchievement',
          userId,
          token,
          achievementId: achievement.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Achievement deleted successfully');
        fetchAllAchievements();
      } else {
        setError(data.message || 'Failed to delete achievement');
      }
    } catch (err) {
      console.error('Error deleting achievement:', err);
      setError('Failed to delete achievement. Please try again.');
    }
  };

  if (loading && achievements.length === 0) {
    return (
      <LoadingWrapper>
        <FaSpinner className="spinner" />
        <p>Loading achievements...</p>
      </LoadingWrapper>
    );
  }

  return (
    <EditorContainer>
      <EditorHeader>
        <h2>Achievement Editor</h2>
        <CreateButton onClick={handleCreateAchievement}>
          <FaPlus /> Create New Achievement
        </CreateButton>
      </EditorHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {(isCreating || editingAchievement) && (
        <EditorForm onSubmit={handleSubmit}>
          <h3>{isCreating ? 'Create New Achievement' : 'Edit Achievement'}</h3>
          
          <FormGroup>
            <Label htmlFor="code">Code</Label>
            <Input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Achievement code (e.g. ACHIEVEMENT_CODE)"
              disabled={!isCreating} // Code cannot be changed when editing
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Achievement name"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Achievement description"
              rows={3}
            />
          </FormGroup>
          
          <ButtonGroup>
            <SubmitButton type="submit">
              <FaSave /> {isCreating ? 'Create' : 'Update'}
            </SubmitButton>
            <CancelButton type="button" onClick={handleCancelEdit}>
              <FaTimes /> Cancel
            </CancelButton>
          </ButtonGroup>
        </EditorForm>
      )}

      <AchievementsList>
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id}>
            <AchievementIcon>
              <FaTrophy />
            </AchievementIcon>
            <AchievementDetails>
              <AchievementCode>{achievement.code}</AchievementCode>
              <AchievementName>{achievement.name}</AchievementName>
              <AchievementDescription>
                {achievement.description}
              </AchievementDescription>
            </AchievementDetails>
            <AchievementActions>
              <ActionButton edit onClick={() => handleEditAchievement(achievement)}>
                <FaEdit />
              </ActionButton>
              <ActionButton delete onClick={() => handleDeleteAchievement(achievement)}>
                <FaTrash />
              </ActionButton>
            </AchievementActions>
          </AchievementCard>
        ))}
      </AchievementsList>
    </EditorContainer>
  );
}

// Styled components
const EditorContainer = styled.div`
  margin-bottom: 2rem;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: var(--text-primary);
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: var(--accent-hover);
  }
`;

const EditorForm = styled.form`
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  h3 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  background-color: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;

  &:disabled {
    background-color: var(--bg-secondary);
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  background-color: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
  resize: vertical;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: var(--accent-hover);
  }
`;

const CancelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const AchievementsList = styled.div`
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

const AchievementDetails = styled.div`
  flex: 1;
`;

const AchievementCode = styled.div`
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-bottom: 0.25rem;
`;

const AchievementName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
`;

const AchievementDescription = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const AchievementActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.edit ? 'rgba(33, 150, 243, 0.1)' : props.delete ? 'rgba(244, 67, 54, 0.1)' : 'var(--bg-secondary)'};
  color: ${props => props.edit ? '#2196f3' : props.delete ? '#f44336' : 'var(--text-primary)'};
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: ${props => props.edit ? 'rgba(33, 150, 243, 0.2)' : props.delete ? 'rgba(244, 67, 54, 0.2)' : 'var(--bg-tertiary)'};
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

export default AchievementEditor;