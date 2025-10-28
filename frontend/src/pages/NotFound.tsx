import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi'

const NotFoundContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
  text-align: center;
  padding: 2rem;
`

const NotFoundContent = styled.div`
  max-width: 600px;
`

const NotFoundCode = styled.h1`
  font-size: 8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 4rem;
  }
`

const NotFoundTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`

const NotFoundDescription = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2rem;
  line-height: 1.6;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`

const ActionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &.primary {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    
    &:hover {
      background: ${({ theme }) => theme.colors.secondary};
      transform: translateY(-2px);
    }
  }
  
  &.secondary {
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    border: 2px solid ${({ theme }) => theme.colors.border};
    
    &:hover {
      border-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`

const NotFound: React.FC = () => {
  return (
    <NotFoundContainer>
      <NotFoundContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <NotFoundCode>404</NotFoundCode>
          <NotFoundTitle>Page Not Found</NotFoundTitle>
          <NotFoundDescription>
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to exploring amazing comics!
          </NotFoundDescription>
          <ActionButtons>
            <ActionButton to="/" className="primary">
              <FiArrowLeft size={20} />
              Go Home
            </ActionButton>
            <ActionButton to="/marketplace" className="secondary">
              Browse Comics
              <FiExternalLink size={20} />
            </ActionButton>
          </ActionButtons>
        </motion.div>
      </NotFoundContent>
    </NotFoundContainer>
  )
}

export default NotFound
