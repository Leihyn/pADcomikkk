import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'react-query'
import axios from 'axios'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { useHedera } from '../contexts/HederaContext'
import { useTheme } from '../contexts/ThemeContext'

import ComicCard from "../components/ComicCard";
import SearchFilters from '../components/SearchFilters'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import Pagination from '../components/UI/Pagination'

interface Comic {
  id: string
  title: string
  series: string
  issueNumber: number
  creator: string
  mintPrice: number
  currentSupply: number
  maxSupply: number
  rarity: string
  genres: string[]
  coverImage: string
  createdAt: string
  isLive: boolean
}

interface MarketplaceProps {
  className?: string
}

const MarketplaceContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  padding: 2rem 0;
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 600px;
  margin: 0 auto;
`

const Content = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const FiltersSection = styled.div`
  @media (max-width: 1024px) {
    order: 2;
  }
`

const ComicsSection = styled.div`
  @media (max-width: 1024px) {
    order: 1;
  }
`

const ComicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const StatsItem = styled.div`
  text-align: center;
`

const StatsValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`

const StatsLabel = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 0.25rem;
`

const Marketplace: React.FC<MarketplaceProps> = ({ className }) => {
  const { isAuthenticated } = useAuth()
  const { isConnected } = useHedera()
  const { theme } = useTheme()

  // State
  const [searchParams, setSearchParams] = useState({
    query: '',
    genre: '',
    series: '',
    creator: '',
    rarity: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
    limit: 20,
    offset: 0
  })

  // Fetch comics
  const { data: comicsData, isLoading, error, refetch } = useQuery(
    ['comics', searchParams],
    async () => {
      const response = await axios.get('/api/comics/search', {
        params: searchParams
      })
      return response.data.data
    },
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  )

  // Fetch marketplace stats
  const { data: statsData } = useQuery(
    'marketplace-stats',
    async () => {
      const response = await axios.get('/api/marketplace/stats')
      return response.data.data
    },
    {
      staleTime: 60000, // 1 minute
    }
  )

  // Handle search
  const handleSearch = (newParams: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      offset: 0 // Reset to first page when searching
    }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({
      ...prev,
      offset: (page - 1) * prev.limit
    }))
  }

  // Buy comic mutation
  const buyComicMutation = useMutation(
    async (comicId: string) => {
      if (!isAuthenticated || !isConnected) {
        throw new Error('Please connect your wallet to purchase comics')
      }

      const response = await axios.post('/api/marketplace/buy', {
        comicId,
        buyer: 'current-user-address', // This would come from the wallet context
        tokenId: 'token-id',
        serialNumber: 1
      })

      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Comic purchased successfully!')
        refetch()
      },
      onError: (error: any) => {
        toast.error(error.message || 'Purchase failed')
      }
    }
  )

  const handleBuyComic = (comicId: string) => {
    buyComicMutation.mutate(comicId)
  }

  const comics = comicsData?.comics || []
  const totalPages = Math.ceil((comicsData?.total || 0) / searchParams.limit)
  const currentPage = Math.floor(searchParams.offset / searchParams.limit) + 1

  return (
    <MarketplaceContainer className={className}>
      <Container>
        <Header>
          <Title>Comic Marketplace</Title>
          <Subtitle>
            Discover, collect, and trade unique comic NFTs on Hedera.
            Fast transactions, low fees, and verifiable ownership.
          </Subtitle>
        </Header>

        {statsData && (
          <StatsBar>
            <StatsItem>
              <StatsValue>{statsData.totalListings}</StatsValue>
              <StatsLabel>Total Comics</StatsLabel>
            </StatsItem>
            <StatsItem>
              <StatsValue>{statsData.activeListings}</StatsValue>
              <StatsLabel>Available</StatsLabel>
            </StatsItem>
            <StatsItem>
              <StatsValue>{statsData.totalVolume} HBAR</StatsValue>
              <StatsLabel>Volume</StatsLabel>
            </StatsItem>
            <StatsItem>
              <StatsValue>{statsData.totalSales}</StatsValue>
              <StatsLabel>Sales</StatsLabel>
            </StatsItem>
          </StatsBar>
        )}

        <Content>
          <FiltersSection>
            <SearchFilters
              searchParams={searchParams}
              onSearch={handleSearch}
            />
          </FiltersSection>

          <ComicsSection>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <LoadingSpinner size="large" />
                <p style={{ marginTop: '1rem', color: theme.colors.textSecondary }}>
                  Loading comics...
                </p>
              </div>
            ) : error ? (
              <EmptyState>
                <EmptyIcon>⚠️</EmptyIcon>
                <h3>Failed to load comics</h3>
                <p>Please try again later.</p>
                <button onClick={() => refetch()}>
                  Retry
                </button>
              </EmptyState>
            ) : comics.length === 0 ? (
              <EmptyState>
                <EmptyIcon>🔍</EmptyIcon>
                <h3>No comics found</h3>
                <p>Try adjusting your search filters or browse all comics.</p>
                <button onClick={() => setSearchParams(prev => ({ ...prev, query: '', genre: '', series: '', creator: '', rarity: '', minPrice: '', maxPrice: '' }))}>
                  Clear Filters
                </button>
              </EmptyState>
            ) : (
              <>
                <ComicsGrid>
                  {comics.map((comic: Comic) => (
                    <motion.div
                      key={comic.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ComicCard
                        comic={comic}
                        onBuy={() => handleBuyComic(comic.id)}
                        isBuying={buyComicMutation.isLoading}
                      />
                    </motion.div>
                  ))}
                </ComicsGrid>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </ComicsSection>
        </Content>
      </Container>
    </MarketplaceContainer>
  )
}

export default Marketplace
