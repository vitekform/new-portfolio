import React from 'react';
import styled from 'styled-components';
import {FaGithub, FaLinkedin, FaTwitter, FaEnvelope, FaHeart, FaDiscord, FaCloudflare} from 'react-icons/fa';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer id="contact">
      <div className="container">
        <FooterContent>
          <FooterSection>
            <FooterTitle>Get In Touch</FooterTitle>
            <ContactInfo>
              <ContactItem>
                <FaEnvelope />
                <ContactLink href="mailto:ganamaga@duck.com">ganamaga@duck.com</ContactLink>
              </ContactItem>
            </ContactInfo>
            <SocialLinks>
              <SocialLink href="https://github.com/vitekform" target="_blank" rel="noopener noreferrer">
                <FaGithub />
              </SocialLink>
              <SocialLink href={"/social/discord"} target={"_blank"} rel={"noopener noreferrer"}>
                <FaDiscord />
              </SocialLink>
            </SocialLinks>
          </FooterSection>
          
          <FooterSection>
            <FooterTitle>Quick Links</FooterTitle>
            <FooterLinks>
              <FooterLink href="#home">Home</FooterLink>
              <FooterLink href="#skills">Skills</FooterLink>
              <FooterLink href="#projects">Projects</FooterLink>
              <FooterLink href="#contact">Contact</FooterLink>
            </FooterLinks>
          </FooterSection>
        </FooterContent>
        
        <FooterDivider />
        
        <FooterBottom>
          <Copyright>
            © {currentYear} ganamaga. All rights reserved.
          </Copyright>
          <MadeWith>
            Made with <HeartIcon><FaHeart /></HeartIcon> using React<br/>Hosted on Cloudflare Pages <FaCloudflare />
          </MadeWith>
        </FooterBottom>
      </div>
    </FooterContainer>
  );
};

// Styled components
const FooterContainer = styled.footer`
  background-color: var(--bg-secondary);
  padding: 4rem 0 2rem;
  margin-top: 2rem;
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const FooterSection = styled.div``;

const FooterTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 0;
    width: 50px;
    height: 2px;
    background-color: var(--accent-color);
  }
`;

const ContactInfo = styled.div`
  margin-bottom: 1.5rem;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
`;

const ContactLink = styled.a`
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: var(--accent-color);
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1.2rem;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ease;
  
  &:hover {
    background-color: var(--accent-color);
    color: white;
    transform: translateY(-3px);
  }
`;

const FooterLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FooterLink = styled.a`
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
  
  &:hover {
    color: var(--accent-color);
    transform: translateX(5px);
  }
`;

const FooterDivider = styled.hr`
  border: none;
  height: 1px;
  background-color: var(--card-border);
  margin: 2rem 0;
`;

const FooterBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const MadeWith = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const HeartIcon = styled.span`
  color: #e25555;
  display: inline-flex;
  align-items: center;
  animation: heartbeat 1.5s ease infinite;
  
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

export default Footer;