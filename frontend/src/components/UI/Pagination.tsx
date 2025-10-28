import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiMoreHorizontal } from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 2rem 0;
`

const PageButton = styled.button<{ $active?: boolean; $disabled?: boolean }>`
  min-width: 40px;
  height: 40px;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.background};
  color: ${({ theme, $active, $disabled }) => 
    $disabled ? theme.colors.textSecondary :
    $active ? theme.colors.white : theme.colors.text};
  font-size: 0.875rem;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme, $active }) => 
      $active ? theme.colors.primary : theme.colors.surface};
  }
  
  &:disabled {
    opacity: 0.5;
  }
`

const Ellipsis = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PageInfo = styled.div`
  margin: 0 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5
}) => {
  const { theme } = useTheme()

  if (totalPages <= 1) {
    return null
  }

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = []
    const halfVisible = Math.floor(maxVisiblePages / 2)
    
    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    // Always show first page
    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) {
        pages.push('ellipsis')
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis')
      }
      pages.push(totalPages)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <PaginationContainer>
      <PageButton
        $disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        title="Previous page"
      >
        <FiChevronLeft size={16} />
      </PageButton>

      {visiblePages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <Ellipsis key={`ellipsis-${index}`}>
              <FiMoreHorizontal size={16} />
            </Ellipsis>
          )
        }

        return (
          <PageButton
            key={page}
            $active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </PageButton>
        )
      })}

      <PageButton
        $disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        title="Next page"
      >
        <FiChevronRight size={16} />
      </PageButton>

      <PageInfo>
        Page {currentPage} of {totalPages}
      </PageInfo>
    </PaginationContainer>
  )
}

export default Pagination
