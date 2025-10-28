import React from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiBookmark, FiBookmarkCheck } from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'

interface ComicControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onNext: () => void
  onPrev: () => void
  onBookmark: () => void
  isBookmarked: boolean
  showControls: boolean
}

const ControlsContainer = styled(motion.div)<{ $visible: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 1rem 1.5rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 30;
  backdrop-filter: blur(10px);
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
  transition: opacity 0.3s ease;
`

const ControlButton = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $disabled }) => 
    $disabled ? theme.colors.border : theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
  }
`

const BookmarkButton = styled(ControlButton)<{ $isBookmarked: boolean }>`
  background: ${({ theme, $isBookmarked }) => 
    $isBookmarked ? theme.colors.success : theme.colors.surface};
  color: ${({ theme, $isBookmarked }) => 
    $isBookmarked ? theme.colors.white : theme.colors.text};
  border: 1px solid ${({ theme, $isBookmarked }) => 
    $isBookmarked ? theme.colors.success : theme.colors.border};
`

const PageInput = styled.input`
  width: 60px;
  height: 40px;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  font-weight: 500;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const PageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 2px;
  overflow: hidden;
`

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background: ${({ theme }) => theme.colors.primary};
  transition: width 0.3s ease;
`

const ComicControls: React.FC<ComicControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onNext,
  onPrev,
  onBookmark,
  isBookmarked,
  showControls
}) => {
  const { theme } = useTheme()
  const [pageInput, setPageInput] = useState(currentPage.toString())

  const progress = (currentPage / totalPages) * 100
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNumber = parseInt(pageInput)
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        onPageChange(pageNumber)
      } else {
        setPageInput(currentPage.toString())
      }
    }
  }

  const handlePageInputBlur = () => {
    const pageNumber = parseInt(pageInput)
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber)
    } else {
      setPageInput(currentPage.toString())
    }
  }

  // Update input when current page changes externally
  React.useEffect(() => {
    setPageInput(currentPage.toString())
  }, [currentPage])

  return (
    <AnimatePresence>
      {showControls && (
        <ControlsContainer
          $visible={showControls}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <ControlButton
            $disabled={isFirstPage}
            onClick={onPrev}
            title="Previous page (←)"
          >
            <FiChevronLeft size={20} />
          </ControlButton>

          <PageInput
            type="number"
            min="1"
            max={totalPages}
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputSubmit}
            onBlur={handlePageInputBlur}
            title="Go to page"
          />

          <PageInfo>
            of {totalPages}
          </PageInfo>

          <ControlButton
            $disabled={isLastPage}
            onClick={onNext}
            title="Next page (→)"
          >
            <FiChevronRight size={20} />
          </ControlButton>

          <BookmarkButton
            $isBookmarked={isBookmarked}
            onClick={onBookmark}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark (B)'}
          >
            {isBookmarked ? <FiBookmarkCheck size={20} /> : <FiBookmark size={20} />}
          </BookmarkButton>

          <ProgressBar>
            <ProgressFill $progress={progress} />
          </ProgressBar>
        </ControlsContainer>
      )}
    </AnimatePresence>
  )
}

export default ComicControls
