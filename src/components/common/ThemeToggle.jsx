import React from 'react';
import styled from 'styled-components';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <ToggleButton onClick={toggleDarkMode} aria-label="Toggle dark mode">
      {darkMode ? <FaSun /> : <FaMoon />}
    </ToggleButton>
  );
};

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--bg-secondary);
  }
`;

export default ThemeToggle;