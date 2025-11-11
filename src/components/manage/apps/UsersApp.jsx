import React from 'react';
import styled from 'styled-components';
import UserManagement from '../UserManagement';

function UsersApp() {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  return (
    <UsersSection>
      <UserManagement userId={userId} token={token} />
    </UsersSection>
  );
}

const UsersSection = styled.section`
  h2 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

export default UsersApp;
