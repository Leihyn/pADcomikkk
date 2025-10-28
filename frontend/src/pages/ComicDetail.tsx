import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import axios from 'axios'
import toast from 'react-hot-toast'

import { useTheme } from '../contexts/ThemeContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const ComicDetailContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  padding: 2rem 0;
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`

const ComicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { theme } = useTheme()

  const { data: comic, isLoading, error } = useQuery(
    ['comic', id],
    async () => {
      const response = await axios.get(`/api/comics/${id}`)
      return response.data.data
    },
    {
      enabled: !!id,
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to load comic')
      }
    }
  )

  if (isLoading) {
    return (
      <ComicDetailContainer>
        <Container>
          <LoadingSpinner size="large" text="Loading comic details..." />
        </Container>
      </ComicDetailContainer>
    )
  }

  if (error || !comic) {
    return (
      <ComicDetailContainer>
        <Container>
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>Comic not found</h2>
            <p>The comic you're looking for doesn't exist.</p>
          </div>
        </Container>
      </ComicDetailContainer>
    )
  }

  return (
    <ComicDetailContainer>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>{comic.title}</h1>
          <p>Comic details will be displayed here</p>
        </motion.div>
      </Container>
    </ComicDetailContainer>
  )
}

export default ComicDetail
