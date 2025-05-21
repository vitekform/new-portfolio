import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import {FaDiscord, FaGithub, FaLinkedin, FaTwitter} from 'react-icons/fa';

const Hero = () => {
  return (
    <HeroSection id="home">
      <div className="container">
        <HeroContent>
          <HeroTextContent>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HeroGreeting>Hello, I'm</HeroGreeting>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <HeroName>ganamaga</HeroName>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <HeroTitle>Backend Developer</HeroTitle>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <HeroDescription>
                I specialize in developing Minecraft server plugins using the Paper API.
                Focused on creating high-performance, scalable, and innovative solutions
                for Minecraft servers. Passionate about clean code and optimized backend systems.
              </HeroDescription>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <HeroActions>
                <PrimaryButton href="#projects">View Projects</PrimaryButton>
                <SecondaryButton href="#contact">Contact Me</SecondaryButton>
              </HeroActions>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <SocialLinks>
                <SocialLink href="https://github.com/vitekform" target="_blank" rel="noopener noreferrer">
                  <FaGithub />
                </SocialLink>
                <SocialLink href={"/social/discord"} target={"_blank"} rel={"noopener noreferrer"}>
                  <FaDiscord />
                </SocialLink>
              </SocialLinks>
            </motion.div>
          </HeroTextContent>

          <HeroImageContainer>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <HeroImage src="https://cdn.discordapp.com/icons/1338129367955542096/0039da3fe9f27a442f0f6bfa76933389.webp?size=512" alt="Profile" />
            </motion.div>
          </HeroImageContainer>
        </HeroContent>
      </div>

      <ScrollIndicator>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
        >
          <ScrollText>Scroll Down</ScrollText>
          <ScrollIcon>↓</ScrollIcon>
        </motion.div>
      </ScrollIndicator>
    </HeroSection>
  );
};

// Styled components
const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  padding-top: 80px; /* Account for fixed header */
`;

const HeroContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const HeroTextContent = styled.div`
  @media (max-width: 992px) {
    order: 2;
  }
`;

const HeroGreeting = styled.p`
  font-size: 1.2rem;
  color: var(--accent-color);
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const HeroName = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, var(--accent-color), #9f7aea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroTitle = styled.h2`
  font-size: 2rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const HeroDescription = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.6;

  @media (max-width: 992px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeroActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 992px) {
    justify-content: center;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const PrimaryButton = styled.a`
  display: inline-block;
  background-color: var(--accent-color);
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 30px;
  font-weight: 500;
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const SecondaryButton = styled.a`
  display: inline-block;
  background-color: transparent;
  color: var(--text-primary);
  padding: 0.8rem 2rem;
  border-radius: 30px;
  font-weight: 500;
  text-decoration: none;
  border: 2px solid var(--accent-color);
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: var(--accent-color);
    color: white;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 992px) {
    justify-content: center;
  }
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1.2rem;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ease;

  &:hover {
    background-color: var(--accent-color);
    color: white;
    transform: translateY(-3px);
  }
`;

const HeroImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 992px) {
    order: 1;
  }
`;

const HeroImage = styled.img`
  width: 100%;
  max-width: 400px;
  border-radius: 50%;
  box-shadow: 0 10px 30px var(--card-shadow);
  border: 5px solid var(--card-bg);
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;

  @media (max-width: 768px) {
    display: none;
  }
`;

const ScrollText = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
`;

const ScrollIcon = styled.div`
  font-size: 1.5rem;
  color: var(--accent-color);
`;

export default Hero;
