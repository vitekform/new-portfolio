import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

const Header = ({ darkMode, toggleDarkMode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <HeaderContainer scrolled={isScrolled}>
      <div className="container">
        <HeaderContent>
          <Logo>
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Portfolio
            </motion.span>
          </Logo>

          <NavDesktop>
            <NavLink href="#home">Home</NavLink>
            <NavLink href="#skills">Skills</NavLink>
            <NavLink href="#projects">Projects</NavLink>
            <NavLink href="#contact">Contact</NavLink>
            <NavLink href="/manage">Manage</NavLink>
          </NavDesktop>

          <HeaderActions>
            <DarkModeToggle onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </DarkModeToggle>

            <MobileMenuButton onClick={toggleMobileMenu}>
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </MobileMenuButton>
          </HeaderActions>
        </HeaderContent>
      </div>

      {/* Mobile Menu */}
      <MobileMenu open={mobileMenuOpen}>
        <MobileNavLink href="#home" onClick={toggleMobileMenu}>Home</MobileNavLink>
        <MobileNavLink href="#skills" onClick={toggleMobileMenu}>Skills</MobileNavLink>
        <MobileNavLink href="#projects" onClick={toggleMobileMenu}>Projects</MobileNavLink>
        <MobileNavLink href="#contact" onClick={toggleMobileMenu}>Contact</MobileNavLink>
        <MobileNavLink href="/manage" onClick={toggleMobileMenu}>Manage</MobileNavLink>
      </MobileMenu>
    </HeaderContainer>
  );
};

// Styled components
const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background-color: ${props => props.scrolled ? 'var(--header-bg)' : 'transparent'};
  backdrop-filter: ${props => props.scrolled ? 'blur(10px)' : 'none'};
  box-shadow: ${props => props.scrolled ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none'};
  transition: background-color 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease;
  padding: 1rem 0;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const NavDesktop = styled.nav`
  display: flex;
  gap: 2rem;
  margin-left: 20px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: var(--text-primary);
  font-weight: 500;
  text-decoration: none;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: var(--accent-color);
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 100%;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 20px;
`;

const DarkModeToggle = styled.button`
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

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.2rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 70px;
  left: 0;
  width: 100%;
  background-color: var(--card-bg);
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  transform: ${props => props.open ? 'translateY(0)' : 'translateY(-100%)'};
  opacity: ${props => props.open ? 1 : 0};
  visibility: ${props => props.open ? 'visible' : 'hidden'};
  transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
  box-shadow: 0 4px 10px var(--card-shadow);
  z-index: 999;
`;

const MobileNavLink = styled.a`
  color: var(--text-primary);
  font-weight: 500;
  text-decoration: none;
  padding: 1rem 2rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--bg-secondary);
  }
`;

export default Header;
