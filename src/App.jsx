import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Home from './components/Home';
import ManageLayout from './components/manage/ManageLayout';
import Login from './components/manage/Login';
import Register from './components/manage/Register';
import VerifyEmail from './components/manage/VerifyEmail';
import ForgotPassword from './components/manage/ForgotPassword';
import ResetPassword from './components/manage/ResetPassword';
import { ThemeProvider } from './context/ThemeContext';
import BattleShips from "./components/Battleships.jsx";
import ErrorBoundary from './components/common/ErrorBoundary';

// Import standalone app components
import DashboardApp from './components/manage/apps/DashboardApp';
import StatusApp from './components/manage/apps/StatusApp';
import ServicesApp from './components/manage/apps/ServicesApp';
import UsersApp from './components/manage/apps/UsersApp';
import ServiceRequestsApp from './components/manage/apps/ServiceRequestsApp';
import StorageApp from './components/manage/apps/StorageApp';
import TicketsApp from './components/manage/apps/TicketsApp';
import AccountApp from './components/manage/apps/AccountApp';
import AIChatApp from './components/manage/apps/AIChatApp';

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <ErrorBoundary><Home /></ErrorBoundary>
  },
  {
    path: '/manage',
    element: <ErrorBoundary><Navigate to="/manage/app/dashboard" replace /></ErrorBoundary>
  },
  {
    path: '/manage/app',
    element: <ErrorBoundary><ManageLayout /></ErrorBoundary>,
    children: [
      {
        path: 'dashboard',
        element: <DashboardApp />
      },
      {
        path: 'ai-chat',
        element: <AIChatApp />
      },
      {
        path: 'status',
        element: <StatusApp />
      },
      {
        path: 'services',
        element: <ServicesApp />
      },
      {
        path: 'users',
        element: <UsersApp />
      },
      {
        path: 'service-requests',
        element: <ServiceRequestsApp />
      },
      {
        path: 'storage',
        element: <StorageApp />
      },
      {
        path: 'tickets',
        element: <TicketsApp />
      },
      {
        path: 'account',
        element: <AccountApp />
      }
    ]
  },
  {
    path: '/manage/auth/login',
    element: <ErrorBoundary><Login /></ErrorBoundary>
  },
  {
    path: '/manage/auth/register',
    element: <ErrorBoundary><Register /></ErrorBoundary>
  },
  {
    path: '/manage/auth/forgot-password',
    element: <ErrorBoundary><ForgotPassword /></ErrorBoundary>
  },
  {
    path: '/reset-password',
    element: <ErrorBoundary><ResetPassword /></ErrorBoundary>
  },
  {
    path: '/verify-email',
    element: <ErrorBoundary><VerifyEmail /></ErrorBoundary>
  },
  {
    path: '/battleships',
    element: <ErrorBoundary><BattleShips/></ErrorBoundary>
  }
]);

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
