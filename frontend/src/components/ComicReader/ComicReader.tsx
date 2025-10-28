import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import axios from 'axios'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { useHedera } from '../contexts/HederaContext'
import { useTheme } from '../contexts/ThemeContext'

import ComicControls from './ComicReader/ComicControls'
import ComicPage from './ComicReader/ComicPage'
import ComicSidebar from './ComicReader/ComicSidebar'
import ComicToolbar from './ComicReader/ComicToolbar'
import LoadingSpinner from './UI/LoadingSpinner'

interface ComicData {
  id: string
  title: string
  series: string
  issueNumber: number
  pages: Array<{
    pageNumber: number
    thumbnail: string
    web: string
    print: string
  }>
  metadata: {
    totalPages: number
    format: string
    resolution: string
    downloadUrl: string
  }
}

interface ComicReaderProps {
  className?: string
}

const ComicReaderContainer = styled.div<{ $isFullscreen: boolean }>`
  position: relative;
  width: 100%;
  height: ${({ $isFullscreen }) => $isFullscreen ? '100vh' : 'calc(100vh - 80px)'};
  background: ${({ theme }) => theme.colors.background};
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const ReaderContent = styled.div<{ $sidebarOpen: boolean }>`
  flex: 1;
  display: flex;
  position: relative;
  margin-left: ${({ $sidebarOpen }) => $sidebarOpen ? '300px' : '0'};
  transition: margin-left 0.3s ease;
`

const PageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`

const PageWrapper = styled(motion.div)`
  position: relative;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

const NavigationOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.3s ease;
`

const LeftNav = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 2rem;
  
  &:hover {
    background: linear-gradient(to right, rgba(0,0,0,0.1), transparent);
  }
`

const RightNav = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 2rem;
  
  &:hover {
    background: linear-gradient(to left, rgba(0,0,0,0.1), transparent);
  }
`

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: ${({ theme }) => theme.colors.surface};
  z-index: 20;
`

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background: ${({ theme }) => theme.colors.primary};
  transition: width 0.3s ease;
`

const ComicReader: React.FC<ComicReaderProps> = ({ className }) => {
  const { comicId } = useParams<{ comicId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { account, isConnected } = useHedera()
  const { theme } = useTheme()

  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'single' | 'double' | 'continuous'>('single')
  const [zoom, setZoom] = useState<'fit-width' | 'fit-height' | 'fit-page' | number>(1)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [readingProgress, setReadingProgress] = useState(0)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Fetch comic data
  const { data: comicData, isLoading: comicLoading, error } = useQuery<ComicData>(
    ['comic', comicId],
    async () => {
      const response = await axios.get(`/api/reader/comic/${comicId}`, {
        params: {
          userAddress: account?.accountId,
          tokenId: comicData?.tokenId,
          serialNumber: comicData?.serialNumber
        }
      })
      return response.data.data
    },
    {
      enabled: !!comicId,
      retry: 1,
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to load comic')
      }
    }
  )

  // Save reading progress
  const saveProgressMutation = useMutation(
    async (progress: { currentPage: number; totalPages: number; readTime: number }) => {
      await axios.post('/api/reader/progress', {
        comicId,
        userAddress: account?.accountId,
        ...progress,
        readTime: Date.now() - (readingProgress || Date.now())
      })
    },
    {
      onSuccess: () => {
        setReadingProgress(Date.now())
      }
    }
  )

  // Add bookmark
  const addBookmarkMutation = useMutation(
    async (pageNumber: number) => {
      await axios.post('/api/reader/bookmark', {
        comicId,
        userAddress: account?.accountId,
        pageNumber,
        note: `Bookmark for page ${pageNumber}`
      })
    },
    {
      onSuccess: (_, pageNumber) => {
        setBookmarks(prev => [...prev, pageNumber])
        toast.success('Bookmark added!')
      }
    }
  )

  // Remove bookmark
  const removeBookmarkMutation = useMutation(
    async (pageNumber: number) => {
      await axios.delete(`/api/reader/bookmark/${comicId}-${account?.accountId}-${pageNumber}`)
    },
    {
      onSuccess: (_, pageNumber) => {
        setBookmarks(prev => prev.filter(p => p !== pageNumber))
        toast.success('Bookmark removed!')
      }
    }
  )

  // Navigation functions
  const goToPage = useCallback((pageNumber: number) => {
    if (!comicData) return
    
    const clampedPage = Math.max(1, Math.min(pageNumber, comicData.metadata.totalPages))
    setCurrentPage(clampedPage)
    
    // Save progress
    if (isAuthenticated && account) {
      saveProgressMutation.mutate({
        currentPage: clampedPage,
        totalPages: comicData.metadata.totalPages,
        readTime: 0
      })
    }
  }, [comicData, isAuthenticated, account, saveProgressMutation])

  const nextPage = useCallback(() => {
    if (comicData && currentPage < comicData.metadata.totalPages) {
      goToPage(currentPage + 1)
    }
  }, [currentPage, comicData, goToPage])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          nextPage()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevPage()
          break
        case 'f':
        case 'F11':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'b':
          e.preventDefault()
          toggleBookmark()
          break
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen()
          } else if (sidebarOpen) {
            setSidebarOpen(false)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [nextPage, prevPage, isFullscreen, sidebarOpen])

  // Mouse/touch navigation
  const handlePageClick = useCallback((e: React.MouseEvent) => {
    if (!comicData) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftSide = x < rect.width / 2
    
    if (isLeftSide) {
      prevPage()
    } else {
      nextPage()
    }
  }, [nextPage, prevPage, comicData])

  // Fullscreen functions
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Bookmark functions
  const toggleBookmark = useCallback(() => {
    if (!isAuthenticated || !account) {
      toast.error('Please connect your wallet to add bookmarks')
      return
    }

    if (bookmarks.includes(currentPage)) {
      removeBookmarkMutation.mutate(currentPage)
    } else {
      addBookmarkMutation.mutate(currentPage)
    }
  }, [currentPage, bookmarks, isAuthenticated, account, addBookmarkMutation, removeBookmarkMutation])

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    if (isFullscreen) {
      document.addEventListener('mousemove', handleMouseMove)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
        }
      }
    }
  }, [isFullscreen])

  // Calculate progress
  useEffect(() => {
    if (comicData) {
      const progress = (currentPage / comicData.metadata.totalPages) * 100
      setReadingProgress(progress)
    }
  }, [currentPage, comicData])

  if (comicLoading) {
    return (
      <ComicReaderContainer className={className}>
        <LoadingSpinner size="large" />
      </ComicReaderContainer>
    )
  }

  if (error || !comicData) {
    return (
      <ComicReaderContainer className={className}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Comic not found</h2>
          <p>The comic you're looking for doesn't exist or you don't have access to it.</p>
          <button onClick={() => navigate('/marketplace')}>
            Browse Marketplace
          </button>
        </div>
      </ComicReaderContainer>
    )
  }

  const currentPageData = comicData.pages.find(p => p.pageNumber === currentPage)

  return (
    <ComicReaderContainer ref={containerRef} $isFullscreen={isFullscreen} className={className}>
      <ComicToolbar
        comic={comicData}
        currentPage={currentPage}
        totalPages={comicData.metadata.totalPages}
        viewMode={viewMode}
        zoom={zoom}
        isFullscreen={isFullscreen}
        sidebarOpen={sidebarOpen}
        showControls={showControls}
        onViewModeChange={setViewMode}
        onZoomChange={setZoom}
        onFullscreenToggle={toggleFullscreen}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onGoToPage={goToPage}
      />

      <ReaderContent $sidebarOpen={sidebarOpen}>
        <PageContainer onClick={handlePageClick}>
          <AnimatePresence mode="wait">
            {currentPageData && (
              <PageWrapper
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ComicPage
                  pageData={currentPageData}
                  viewMode={viewMode}
                  zoom={zoom}
                  isLoading={isLoading}
                  onLoadStart={() => setIsLoading(true)}
                  onLoadEnd={() => setIsLoading(false)}
                />
              </PageWrapper>
            )}
          </AnimatePresence>

          <NavigationOverlay $visible={showControls && isFullscreen}>
            <LeftNav onClick={prevPage} />
            <RightNav onClick={nextPage} />
          </NavigationOverlay>
        </PageContainer>

        <ComicSidebar
          isOpen={sidebarOpen}
          comic={comicData}
          currentPage={currentPage}
          bookmarks={bookmarks}
          onPageSelect={goToPage}
          onBookmarkToggle={toggleBookmark}
          onClose={() => setSidebarOpen(false)}
        />
      </ReaderContent>

      <ComicControls
        currentPage={currentPage}
        totalPages={comicData.metadata.totalPages}
        onPageChange={goToPage}
        onNext={nextPage}
        onPrev={prevPage}
        onBookmark={toggleBookmark}
        isBookmarked={bookmarks.includes(currentPage)}
        showControls={showControls}
      />

      <ProgressBar>
        <ProgressFill $progress={readingProgress} />
      </ProgressBar>
    </ComicReaderContainer>
  )
}

export default ComicReader
