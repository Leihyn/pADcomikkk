import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { useTheme } from '../contexts/ThemeContext'

interface SearchFiltersProps {
  searchParams: {
    query: string
    genre: string
    series: string
    creator: string
    rarity: string
    minPrice: string
    maxPrice: string
    sortBy: string
  }
  onSearch: (params: Partial<SearchFiltersProps['searchParams']>) => void
}

const FiltersContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 1.5rem;
  position: sticky;
  top: 2rem;
`

const FilterGroup = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const FilterLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`

const FilterInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const FilterSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const FilterButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.background};
  color: ${({ theme, $active }) => 
    $active ? theme.colors.white : theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme, $active }) => 
      $active ? theme.colors.primary : theme.colors.surface};
  }
`

const ClearButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }
`

const PriceRange = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const SearchFilters: React.FC<SearchFiltersProps> = ({ searchParams, onSearch }) => {
  const { theme } = useTheme()

  const genres = [
    'Superhero', 'Manga', 'Horror', 'Sci-Fi', 'Fantasy', 
    'Indie', 'Webcomics', 'Action', 'Drama', 'Comedy'
  ]

  const rarities = [
    'Standard', 'Rare', 'Epic', 'Legendary', 'Mythic'
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }
  ]

  const handleInputChange = (field: keyof typeof searchParams) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onSearch({ [field]: e.target.value })
  }

  const clearFilters = () => {
    onSearch({
      query: '',
      genre: '',
      series: '',
      creator: '',
      rarity: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest'
    })
  }

  const hasActiveFilters = Object.values(searchParams).some(value => 
    value !== '' && value !== 'newest'
  )

  return (
    <FiltersContainer>
      <FilterGroup>
        <FilterLabel>Search</FilterLabel>
        <FilterInput
          type="text"
          placeholder="Search comics, creators, series..."
          value={searchParams.query}
          onChange={handleInputChange('query')}
        />
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>Genre</FilterLabel>
        <FilterSelect
          value={searchParams.genre}
          onChange={handleInputChange('genre')}
        >
          <option value="">All Genres</option>
          {genres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </FilterSelect>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>Series</FilterLabel>
        <FilterInput
          type="text"
          placeholder="Enter series name"
          value={searchParams.series}
          onChange={handleInputChange('series')}
        />
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>Creator</FilterLabel>
        <FilterInput
          type="text"
          placeholder="Enter creator name"
          value={searchParams.creator}
          onChange={handleInputChange('creator')}
        />
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>Rarity</FilterLabel>
        <FilterSelect
          value={searchParams.rarity}
          onChange={handleInputChange('rarity')}
        >
          <option value="">All Rarities</option>
          {rarities.map(rarity => (
            <option key={rarity} value={rarity}>{rarity}</option>
          ))}
        </FilterSelect>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>Price Range (HBAR)</FilterLabel>
        <PriceRange>
          <FilterInput
            type="number"
            placeholder="Min"
            value={searchParams.minPrice}
            onChange={handleInputChange('minPrice')}
            min="0"
            step="0.1"
          />
          <span>-</span>
          <FilterInput
            type="number"
            placeholder="Max"
            value={searchParams.maxPrice}
            onChange={handleInputChange('maxPrice')}
            min="0"
            step="0.1"
          />
        </PriceRange>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>Sort By</FilterLabel>
        <FilterSelect
          value={searchParams.sortBy}
          onChange={handleInputChange('sortBy')}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </FilterGroup>

      {hasActiveFilters && (
        <FilterGroup>
          <ClearButton onClick={clearFilters}>
            Clear All Filters
          </ClearButton>
        </FilterGroup>
      )}
    </FiltersContainer>
  )
}

export default SearchFilters
