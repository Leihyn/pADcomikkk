import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'

interface ComicPageProps {
  pageData: {
    pageNumber: number
    thumbnail: string
    web: string
    print: string
  }
  viewMode: 'single' | 'double' | 'continuous'
  zoom: 'fit-width' | 'fit-height' | 'fit-page' | number
  isLoading: boolean
  onLoadStart: () => void
  onLoadEnd: () => void
}

const PageContainer = styled.div<{ $zoom: number | string; $viewMode: string }>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const PageImage = styled.img<{ $zoom: number | string; $loaded: boolean }>`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: opacity 0.3s ease;
  opacity: ${({ $loaded }) => $loaded ? 1 : 0};
  cursor: pointer;
  
  ${({ $zoom }) => {
    if (typeof $zoom === 'number') {
      return `
        transform: scale(${$zoom});
        transform-origin: center;
      `
    }
    
    switch ($zoom) {
      case 'fit-width':
        return 'width: 100%; height: auto;'
      case 'fit-height':
        return 'height: 100%; width: auto;'
      case 'fit-page':
        return 'width: 100%; height: 100%; object-fit: contain;'
      default:
        return 'max-width: 100%; max-height: 100%;'
    }
  }}
`

const LoadingOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const ErrorOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: ${({ theme }) => theme.colors.error};
`

const PageNumber = styled.div`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 0.875rem;
  font-weight: 500;
`

const ComicPage: React.FC<ComicPageProps> = ({
  pageData,
  viewMode,
  zoom,
  isLoading,
  onLoadStart,
  onLoadEnd
}) => {
  const { theme } = useTheme()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState('')

  // Determine which image quality to load based on zoom
  useEffect(() => {
    const loadImage = () => {
      onLoadStart()
      setImageError(false)
      
      // Choose image quality based on zoom level
      let src = pageData.web // Default to web quality
      
      if (typeof zoom === 'number' && zoom > 1.5) {
        src = pageData.print // High zoom needs print quality
      } else if (zoom === 'fit-page') {
        src = pageData.thumbnail // Fit page can use thumbnail
      }
      
      setImageSrc(src)
    }

    loadImage()
  }, [pageData, zoom, onLoadStart])

  const handleImageLoad = () => {
    setImageLoaded(true)
    onLoadEnd()
  }

  const handleImageError = () => {
    setImageError(true)
    onLoadEnd()
    
    // Fallback to thumbnail if web/print fails
    if (imageSrc !== pageData.thumbnail) {
      setImageSrc(pageData.thumbnail)
      setImageError(false)
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <PageContainer $zoom={zoom} $viewMode={viewMode}>
      {isLoading && !imageLoaded && (
        <LoadingOverlay>
          <LoadingSpinner />
          <span>Loading page {pageData.pageNumber}...</span>
        </LoadingOverlay>
      )}

      {imageError ? (
        <ErrorOverlay>
          <div>Failed to load page {pageData.pageNumber}</div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Please check your internet connection
          </div>
        </ErrorOverlay>
      ) : (
        <PageImage
          src={imageSrc}
          alt={`Page ${pageData.pageNumber}`}
          $zoom={zoom}
          $loaded={imageLoaded}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={handleImageClick}
          draggable={false}
        />
      )}

      <PageNumber>
        {pageData.pageNumber}
      </PageNumber>
    </PageContainer>
  )
}

export default ComicPage
