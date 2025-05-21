import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { 
  FaJava, 
  FaJs, 
  FaNodeJs, 
  FaReact, 
  FaDocker, 
  FaGitAlt, 
  FaTerminal, 
  FaLinux,
  FaCode
} from 'react-icons/fa';
import { SiVite } from 'react-icons/si';

const Skills = () => {
  const skills = [
    { name: 'Java', icon: <FaJava />, level: 95 },
    { name: 'JavaScript', icon: <FaJs />, level: 85 },
    { name: 'Node.JS', icon: <FaNodeJs />, level: 80 },
    { name: 'React', icon: <FaReact />, level: 85 },
    { name: 'Vite', icon: <SiVite />, level: 90 },
    { name: 'Docker', icon: <FaDocker />, level: 70 },
    { name: 'Git', icon: <FaGitAlt />, level: 90 },
    { name: 'Bash', icon: <FaTerminal />, level: 85 },
    { name: 'Linux', icon: <FaLinux />, level: 80 },
    { name: 'Paper API', icon: <FaCode />, level: 95 }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const skillVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <SkillsSection id="skills">
      <div className="container">
        <SectionTitle>Skills</SectionTitle>
        <SectionSubtitle>My technical expertise</SectionSubtitle>

        <SkillsGrid
          as={motion.div}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {skills.map((skill, index) => (
            <SkillCard
              key={index}
              as={motion.div}
              variants={skillVariants}
            >
              <IconWrapper>
                {skill.icon}
              </IconWrapper>
              <SkillName>{skill.name}</SkillName>
              <SkillBarContainer>
                <SkillBarFill style={{ width: `${skill.level}%` }} />
              </SkillBarContainer>
              <SkillLevel>{skill.level}%</SkillLevel>
            </SkillCard>
          ))}
        </SkillsGrid>
      </div>
    </SkillsSection>
  );
};

// Styled components
const SkillsSection = styled.section`
  background-color: var(--bg-secondary);
  padding: 5rem 0;
`;

const SectionTitle = styled.h2`
  text-align: center;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

const SectionSubtitle = styled.p`
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  font-size: 1.1rem;
`;

const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SkillCard = styled.div`
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: 0 4px 6px var(--card-shadow);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px var(--card-shadow);
  }
`;

const IconWrapper = styled.div`
  font-size: 2.5rem;
  color: var(--accent-color);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
`;

const SkillName = styled.h3`
  margin-bottom: 1rem;
  font-weight: 600;
`;

const SkillBarContainer = styled.div`
  height: 8px;
  background-color: var(--skill-bar-bg);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const SkillBarFill = styled.div`
  height: 100%;
  background-color: var(--accent-color);
  border-radius: 4px;
`;

const SkillLevel = styled.span`
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
`;

export default Skills;
