import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaEdit, FaTrash, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

const UserManagement = ({ userId, token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/manage/userUtils', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getAllUsers',
            userId,
            token
          }),
        });

        const data = await response.json();

        if (data.success) {
          setUsers(data.users);
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError('An error occurred. Please try again later.');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId, token]);

  // Handle role change
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // Start editing a user
  const startEditing = (user) => {
    setEditingUser(user.id);
    setSelectedRole(user.role);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
    setSelectedRole('');
  };

  // Save role change
  const saveRoleChange = async (userId) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateUserRole',
          userId,
          token,
          targetUserId: editingUser,
          newRole: selectedRole
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the user in the local state
        setUsers(users.map(user => 
          user.id === editingUser 
            ? { ...user, role: selectedRole } 
            : user
        ));
        setEditingUser(null);
      } else {
        setError(data.message || 'Failed to update user role');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Error updating user role:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/manage/userUtils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteUser',
          userId,
          token,
          targetUserId
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the user from the local state
        setUsers(users.filter(user => user.id !== targetUserId));
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Error deleting user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <LoadingWrapper>
        <FaSpinner className="spinner" />
        <p>Loading users...</p>
      </LoadingWrapper>
    );
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <UserManagementContainer>
      <h2>User Management</h2>
      
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <UsersTable>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  {editingUser === user.id ? (
                    <RoleSelect value={selectedRole} onChange={handleRoleChange}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="unverified">Unverified</option>
                    </RoleSelect>
                  ) : (
                    <RoleBadge role={user.role}>{user.role}</RoleBadge>
                  )}
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  {editingUser === user.id ? (
                    <ActionButtons>
                      <ActionButton 
                        onClick={() => saveRoleChange(userId)} 
                        disabled={actionLoading}
                        title="Save"
                      >
                        {actionLoading ? <FaSpinner className="spinner" /> : <FaCheck />}
                      </ActionButton>
                      <ActionButton 
                        onClick={cancelEditing} 
                        disabled={actionLoading}
                        title="Cancel"
                      >
                        <FaTimes />
                      </ActionButton>
                    </ActionButtons>
                  ) : (
                    <ActionButtons>
                      <ActionButton 
                        onClick={() => startEditing(user)} 
                        disabled={actionLoading}
                        title="Edit role"
                      >
                        <FaEdit />
                      </ActionButton>
                      <ActionButton 
                        onClick={() => deleteUser(user.id)} 
                        disabled={actionLoading}
                        className="delete"
                        title="Delete user"
                      >
                        {actionLoading ? <FaSpinner className="spinner" /> : <FaTrash />}
                      </ActionButton>
                    </ActionButtons>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </UsersTable>
      )}
    </UserManagementContainer>
  );
};

// Styled components
const UserManagementContainer = styled.div`
  h2 {
    margin-bottom: 1.5rem;
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--card-border);
  }
  
  th {
    font-weight: 600;
    background-color: var(--bg-secondary);
  }
  
  tr:hover {
    background-color: var(--bg-secondary);
  }
`;

const RoleBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  background-color: ${props => {
    switch(props.role) {
      case 'admin': return 'rgba(0, 128, 255, 0.2)';
      case 'root': return 'rgba(255, 0, 0, 0.2)';
      case 'unverified': return 'rgba(255, 165, 0, 0.2)';
      default: return 'rgba(128, 128, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.role) {
      case 'admin': return '#0080ff';
      case 'root': return '#ff0000';
      case 'unverified': return '#ff9900';
      default: return '#808080';
    }
  }};
`;

const RoleSelect = styled.select`
  padding: 0.25rem;
  border-radius: 4px;
  border: 1px solid var(--card-border);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  font-size: 0.875rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--card-border);
  
  &.delete {
    color: #d32f2f;
    
    &:hover {
      background-color: rgba(211, 47, 47, 0.1);
    }
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
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
  background-color: rgba(255, 0, 0, 0.1);
  color: #d32f2f;
  padding: 1rem;
  border-radius: var(--border-radius);
  text-align: center;
`;

export default UserManagement;