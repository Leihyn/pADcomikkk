import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import styled from 'styled-components'

interface Comic {
  id: string
  title: string
  description: string
  coverImage: string
  pages: string[]
  creator: {
    id: string
    username: string
  }
  price?: string
  createdAt: string
}

const ComicReader: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [comic, setComic] = useState<Comic | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchComic = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(`/api/comics/${id}`)
        
        if (response.data.success) {
          setComic(response.data.data)
        } else {
          toast.error('Failed to load comic')
          navigate('/marketplace')
        }
      } catch (error) {
        console.error('Error fetching comic:', error)
        toast.error('Failed to load comic')
        navigate('/marketplace')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchComic()
    }
  }, [id, navigate])

  const nextPage = () => {
    if (comic && currentPage < comic.pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const previousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (isLoading) {
    return <Container>Loading...</Container>
  }

  if (!comic) {
    return <Container>Comic not found</Container>
  }

  return (
    <Container>
      <Header>
        <Title>{comic.title}</Title>
        <PageIndicator>
          Page {currentPage + 1} of {comic.pages.length}
        </PageIndicator>
      </Header>

      <ReaderContainer>
        <NavigationButton onClick={previousPage} disabled={currentPage === 0}>
          ←
        </NavigationButton>

        <ComicPage>
          <img 
            src={comic.pages[currentPage]} 
            alt={`Page ${currentPage + 1}`}
            style={{ maxWidth: '100%', maxHeight: '80vh' }}
          />
        </ComicPage>

        <NavigationButton 
          onClick={nextPage} 
          disabled={currentPage === comic.pages.length - 1}
        >
          →
        </NavigationButton>
      </ReaderContainer>
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
`

const PageIndicator = styled.div`
  font-size: 16px;
  color: #666;
`

const ReaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
`

const ComicPage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`

const NavigationButton = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  padding: 15px 20px;
  font-size: 24px;
  border-radius: 8px;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: #090a0dff;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`

export default ComicReader