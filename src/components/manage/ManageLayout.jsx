import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSignOutAlt, FaSpinner } from 'react-icons/fa';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import manageAppsConfig from '../../config/manageApps.json';
import { FaUsers, FaChartLine, FaServer, FaCog, FaClipboardCheck, FaTicketAlt, FaRobot } from 'react-icons/fa';
import '../../App.css';
import '../../index.css';

const iconMap = {
  FaUsers,
  FaChartLine,
  FaServer,
  FaCog,
  FaClipboardCheck,
  FaTicketAlt,
  FaRobot,
  Dashboard: () => '📊',
  Storage: () => '📦'
};

function ManageLayout() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
      // Redirect to login if not logged in
      navigate('/manage/auth/login');
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
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
        } else {
          setError(data.message || 'Failed to fetch user data');
          // Redirect to login if authentication fails
          localStorage.removeItem('userId');
          localStorage.removeItem('token');
          setTimeout(() => {
            navigate('/manage/auth/login');
          }, 1500);
        }
      } catch (err) {
        setError('An error occurred. Please try again later.');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('token');

    // Redirect to login page
    navigate('/manage/auth/login');
  };

  // Role hierarchy for access control
  const roleHierarchy = {
    user: 0,
    admin: 1,
    root: 2
  };

  // Filter apps based on user role
  const getAccessibleApps = () => {
    if (!userData) return [];
    
    const userRoleLevel = roleHierarchy[userData.role] ?? 0;
    
    return manageAppsConfig.filter(app => {
      const requiredRoleLevel = roleHierarchy[app.role] ?? 0;
      return userRoleLevel >= requiredRoleLevel;
    });
  };

  const accessibleApps = getAccessibleApps();

  // Render loading state
  if (loading) {
    return (
      <ManageContainer>
        <LoadingWrapper>
          <FaSpinner className="spinner" />
          <p>Loading dashboard...</p>
        </LoadingWrapper>
      </ManageContainer>
    );
  }

  // Render error state
  if (error) {
    return (
      <ManageContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </ManageContainer>
    );
  }

  return (
    <ManageContainer>
      <div
        className="container"
        style={{ width: '100%', maxWidth: '2000px', margin: '0 auto' }}
      >
        <DashboardHeader>
          <h1>Management Dashboard</h1>
          <UserInfo>
            <p>Welcome, {userData?.username || 'User'}</p>
            <RoleBadge role={userData?.role || 'user'}>{userData?.role || 'user'}</RoleBadge>
            <ThemeToggle />
          </UserInfo>
        </DashboardHeader>

        <DashboardLayout>
          <Sidebar>
            {accessibleApps.map((app) => {
              const IconComponent = iconMap[app.icon];
              const isActive = location.pathname === app.app_url;
              
              return (
                <SidebarItem
                  key={app.app_url}
                  active={isActive}
                  onClick={() => navigate(app.app_url)}
                >
                  {IconComponent && typeof IconComponent === 'function' && IconComponent.prototype ? (
                    <IconComponent />
                  ) : IconComponent ? (
                    IconComponent()
                  ) : null}
                  {' '}
                  {app.app_name}
                </SidebarItem>
              );
            })}

            <LogoutButton onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </LogoutButton>
          </Sidebar>

          <ContentArea>
            <Outlet />
          </ContentArea>
        </DashboardLayout>
      </div>
    </ManageContainer>
  );
}

// Styled components
const ManageContainer = styled.div`
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0;
  background-color: var(--bg-primary);
  overflow: hidden; /* Prevent scrolling at container level */
`;

const DashboardHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--card-bg);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  border-bottom: 1px solid var(--card-border);

  h1 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-primary);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  p {
    margin: 0;
    color: var(--text-primary);
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
      default: return 'rgba(128, 128, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.role) {
      case 'admin': return '#0080ff';
      case 'root': return '#ff0000';
      default: return '#808080';
    }
  }};
`;

const DashboardLayout = styled.div`
  display: flex;
  background-color: var(--card-bg);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  overflow: hidden;
  box-shadow: 0 4px 10px var(--card-shadow);
  height: calc(100vh - 80px); /* Adjust for header height */
  width: 100%;
  flex: 1;
`;

const Sidebar = styled.nav`
  width: 200px;
  background-color: var(--bg-secondary);
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
`;

const SidebarItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.active ? 'var(--accent-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: ${props => props.active ? 'var(--accent-color)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--text-primary);
  border: none;
  text-align: left;
  cursor: pointer;
  margin-top: auto;
  transition: background-color var(--transition-speed) ease;

  &:hover {
    background-color: rgba(255, 0, 0, 0.05);
    color: #d32f2f;
  }
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 2rem;
  overflow-y: auto; /* Enable vertical scrolling if content exceeds height */
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;

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
  max-width: 500px;
`;

export default ManageLayout;
