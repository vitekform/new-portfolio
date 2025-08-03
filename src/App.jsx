import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/Home';
import Manage from './components/Manage';
import Login from './components/manage/Login';
import Register from './components/manage/Register';
import VerifyEmail from './components/manage/VerifyEmail';
import ForgotPassword from './components/manage/ForgotPassword';
import ResetPassword from './components/manage/ResetPassword';
import { ThemeProvider } from './context/ThemeContext';
import BattleShips from "./components/Battleships.jsx";
import ErrorBoundary from './components/common/ErrorBoundary';

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <ErrorBoundary><Home /></ErrorBoundary>
  },
  {
    path: '/manage',
    element: <ErrorBoundary><Manage /></ErrorBoundary>
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
