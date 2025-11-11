import React from 'react';
import styled from 'styled-components';
import AccountSettings from '../AccountSettings';

function AccountApp() {
  return (
    <AccountSettingsSection>
      <AccountSettings />
    </AccountSettingsSection>
  );
}

const AccountSettingsSection = styled.section`
  h2 {
    margin-top: 0;
    color: var(--text-primary);
  }
`;

export default AccountApp;
