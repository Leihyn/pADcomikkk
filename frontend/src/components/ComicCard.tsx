import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiHeart, FiShoppingCart, FiEye, FiClock } from 'react-icons/fi'
import { useTheme } from '../contexts/ThemeContext'

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

interface ComicCardProps {
  comic: Comic
  onBuy: () => void
  isBuying?: boolean
}

const CardContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`

const ComicImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${CardContainer}:hover & {
    opacity: 1;
  }
`

const ActionButtons = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${CardContainer}:hover & {
    opacity: 1;
  }
`

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    transform: scale(1.1);
  }
`

const RarityBadge = styled.div<{ $rarity: string }>`
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${({ $rarity, theme }) => {
    switch ($rarity) {
      case 'Legendary':
        return `
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          color: #000;
        `
      case 'Epic':
        return `
          background: linear-gradient(135deg, #9f7aea, #b794f6);
          color: white;
        `
      case 'Rare':
        return `
          background: linear-gradient(135deg, #3182ce, #63b3ed);
          color: white;
        `
      default:
        return `
          background: ${theme.colors.surface};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
        `
    }
  }}
`

const Content = styled.div`
  padding: 1.5rem;
`

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Series = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.75rem;
`

const Creator = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 1rem;
`

const Genres = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const GenreTag = styled.span`
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const PriceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`

const Price = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`

const Supply = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const BuyButton = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $disabled }) => 
    $disabled ? theme.colors.border : theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
  }
`

const ComicCard: React.FC<ComicCardProps> = ({ comic, onBuy, isBuying = false }) => {
  const { theme } = useTheme()

  const formatPrice = (price: number) => {
    return `${price} HBAR`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getSupplyPercentage = () => {
    return Math.round((comic.currentSupply / comic.maxSupply) * 100)
  }

  return (
    <CardContainer
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/marketplace/${comic.id}`}>
        <ImageContainer>
          <ComicImage
            src={comic.coverImage}
            alt={`${comic.title} #${comic.issueNumber}`}
            loading="lazy"
          />
          <Overlay />
          <RarityBadge $rarity={comic.rarity}>
            {comic.rarity}
          </RarityBadge>
          <ActionButtons>
            <ActionButton title="Add to favorites">
              <FiHeart size={16} />
            </ActionButton>
            <ActionButton title="Quick view">
              <FiEye size={16} />
            </ActionButton>
          </ActionButtons>
        </ImageContainer>
      </Link>

      <Content>
        <Title>{comic.title}</Title>
        <Series>{comic.series} #{comic.issueNumber}</Series>
        <Creator>by {comic.creator}</Creator>

        <Genres>
          {comic.genres.slice(0, 3).map(genre => (
            <GenreTag key={genre}>{genre}</GenreTag>
          ))}
          {comic.genres.length > 3 && (
            <GenreTag>+{comic.genres.length - 3}</GenreTag>
          )}
        </Genres>

        <PriceSection>
          <Price>{formatPrice(comic.mintPrice)}</Price>
          <Supply>
            {comic.currentSupply}/{comic.maxSupply} 
            ({getSupplyPercentage()}% sold)
          </Supply>
        </PriceSection>

        <BuyButton
          onClick={(e) => {
            e.preventDefault()
            onBuy()
          }}
          disabled={!comic.isLive || isBuying}
        >
          {isBuying ? (
            <>
              <FiClock size={16} />
              Processing...
            </>
          ) : (
            <>
              <FiShoppingCart size={16} />
              {comic.isLive ? 'Buy Now' : 'Not Available'}
            </>
          )}
        </BuyButton>
      </Content>
    </CardContainer>
  )
}

export default ComicCard
