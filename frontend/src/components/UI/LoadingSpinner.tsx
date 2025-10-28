import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { FiLoader } from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  color?: string
}

const SpinnerContainer = styled.div<{ $size: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  
  ${({ $size }) => {
    switch ($size) {
      case 'small':
        return 'gap: 0.5rem;'
      case 'large':
        return 'gap: 1.5rem;'
      default:
        return 'gap: 1rem;'
    }
  }}
`

const Spinner = styled.div<{ $size: string; $color: string }>`
  border: 3px solid transparent;
  border-top: 3px solid ${({ $color }) => $color};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  ${({ $size }) => {
    switch ($size) {
      case 'small':
        return 'width: 20px; height: 20px; border-width: 2px;'
      case 'large':
        return 'width: 60px; height: 60px; border-width: 4px;'
      default:
        return 'width: 40px; height: 40px; border-width: 3px;'
    }
  }}
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const SpinnerText = styled.div<{ $size: string }>`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  
  ${({ $size }) => {
    switch ($size) {
      case 'small':
        return 'font-size: 0.75rem;'
      case 'large':
        return 'font-size: 1.125rem;'
      default:
        return 'font-size: 0.875rem;'
    }
  }}
`

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text, 
  color 
}) => {
  const { theme } = useTheme()
  const spinnerColor = color || theme.colors.primary

  return (
    <SpinnerContainer $size={size}>
      <Spinner $size={size} $color={spinnerColor} />
      {text && <SpinnerText $size={size}>{text}</SpinnerText>}
    </SpinnerContainer>
  )
}

export default LoadingSpinner
