import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/Home';
import Manage from './components/Manage';
import Login from './components/manage/Login';
import Register from './components/manage/Register';
import VerifyEmail from './components/manage/VerifyEmail';
import ForgotPassword from './components/manage/ForgotPassword';
import ResetPassword from './components/manage/ResetPassword';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/manage',
    element: <Manage />
  },
  {
    path: '/manage/auth/login',
    element: <Login />
  },
  {
    path: '/manage/auth/register',
    element: <Register />
  },
  {
    path: '/manage/auth/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />
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
