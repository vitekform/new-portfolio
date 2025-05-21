import { motion } from 'framer-motion';
import styled, { createGlobalStyle } from 'styled-components';
import Header from './Header';
import Hero from './Hero';
import Skills from './Skills';
import Projects from './Projects';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';
import '../App.css';

// Create a global style for dark mode
const GlobalStyle = createGlobalStyle`
  body {
    transition: all 0.3s ease;
  }
`;

function Home() {
  // Use the theme context instead of local state
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <>
      <GlobalStyle />
      <HomeContainer>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main>
          <Hero />
          <Skills />
          <Projects />
        </main>
        <Footer />
      </HomeContainer>
    </>
  );
}

// Styled components
const HomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export default Home;
