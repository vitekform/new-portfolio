import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For demo purposes, we'll use a predefined list of projects
  // In a real application, you would fetch this from the GitHub API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Simulating API call with timeout
        setTimeout(() => {
          const demoProjects = [
            {
              id: 1,
              name: 'KHK PCE Membership form',
              description: 'Membership registration form for KHK PCE.',
              image: 'https://bcstorage.ganamaga.me/webassets/khk.png',
              skills: ['JavaScript', 'Cloudflare Pages', 'Vite', 'React'],
              github: 'https://github.com/vitekform/khk',
              demo: 'https://khk.ganamaga.me'
            },
          ];
          
          setProjects(demoProjects);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to fetch projects');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const projectVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  if (loading) {
    return (
      <ProjectsSection id="projects">
        <div className="container">
          <SectionTitle>Projects</SectionTitle>
          <SectionSubtitle>My recent work</SectionSubtitle>
          <LoadingMessage>Loading projects...</LoadingMessage>
        </div>
      </ProjectsSection>
    );
  }

  if (error) {
    return (
      <ProjectsSection id="projects">
        <div className="container">
          <SectionTitle>Projects</SectionTitle>
          <SectionSubtitle>My recent work</SectionSubtitle>
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      </ProjectsSection>
    );
  }

  return (
    <ProjectsSection id="projects">
      <div className="container">
        <SectionTitle>Projects</SectionTitle>
        <SectionSubtitle>My recent work</SectionSubtitle>
        
        <ProjectsGrid
          as={motion.div}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              as={motion.div}
              variants={projectVariants}
            >
              <ProjectImage src={project.image} alt={project.name} />
              <ProjectContent>
                <ProjectTitle>{project.name}</ProjectTitle>
                <ProjectDescription>{project.description}</ProjectDescription>
                
                <ProjectSkills>
                  {project.skills.map((skill, index) => (
                    <ProjectSkillTag key={index}>{skill}</ProjectSkillTag>
                  ))}
                </ProjectSkills>
                
                <ProjectLinks>
                  <ProjectLink href={project.github} target="_blank" rel="noopener noreferrer">
                    <FaGithub /> Code
                  </ProjectLink>
                  <ProjectLink href={project.demo} target="_blank" rel="noopener noreferrer">
                    <FaExternalLinkAlt /> Demo
                  </ProjectLink>
                </ProjectLinks>
              </ProjectContent>
            </ProjectCard>
          ))}
        </ProjectsGrid>
      </div>
    </ProjectsSection>
  );
};

// Styled components
const ProjectsSection = styled.section`
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

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProjectCard = styled.div`
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0 4px 10px var(--card-shadow);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 25px var(--card-shadow);
  }
`;

const ProjectImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const ProjectContent = styled.div`
  padding: 1.5rem;
`;

const ProjectTitle = styled.h3`
  margin-bottom: 0.75rem;
  font-weight: 600;
`;

const ProjectDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
`;

const ProjectSkills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const ProjectSkillTag = styled.span`
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const ProjectLinks = styled.div`
  display: flex;
  gap: 1rem;
`;

const ProjectLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent-color);
  font-weight: 500;
  font-size: 0.9rem;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #e74c3c;
`;

export default Projects;
