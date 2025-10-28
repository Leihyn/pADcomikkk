import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiStar, FiUsers, FiZap } from 'react-icons/fi'
import { useTheme } from '../contexts/ThemeContext'

const HomeContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`

const HeroSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}15, ${({ theme }) => theme.colors.secondary}15);
  text-align: center;
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`

const HeroTitle = styled.h1`
  font-size: 4rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1.5rem;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 4rem;
`

const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: 1.125rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &.primary {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    
    &:hover {
      background: ${({ theme }) => theme.colors.secondary};
      transform: translateY(-2px);
    }
  }
  
  &.secondary {
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    border: 2px solid ${({ theme }) => theme.colors.border};
    
    &:hover {
      border-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`

const StatsSection = styled.section`
  padding: 4rem 0;
  background: ${({ theme }) => theme.colors.surface};
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
`

const StatCard = styled.div`
  text-align: center;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  background: ${({ theme }) => theme.colors.primary}20;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.5rem;
`

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`

const StatLabel = styled.div`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const FeaturesSection = styled.section`
  padding: 6rem 0;
`

const SectionTitle = styled.h2`
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`

const FeatureCard = styled.div`
  padding: 2rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  text-align: center;
`

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: ${({ theme }) => theme.colors.primary}20;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 2rem;
`

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`

const Home: React.FC = () => {
  const { theme } = useTheme()

  return (
    <HomeContainer>
      <HeroSection>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <HeroTitle>
              Discover, Collect & Trade
              <br />
              Comic NFTs on Hedera
            </HeroTitle>
            <HeroSubtitle>
              The future of comic book publishing is here. Create, mint, and trade 
              unique comic NFTs with lightning-fast transactions and minimal fees.
            </HeroSubtitle>
            <CTAButtons>
              <CTAButton to="/marketplace" className="primary">
                Explore Marketplace
                <FiArrowRight size={20} />
              </CTAButton>
              <CTAButton to="/creator" className="secondary">
                Start Creating
              </CTAButton>
            </CTAButtons>
          </motion.div>
        </Container>
      </HeroSection>

      <StatsSection>
        <Container>
          <StatsGrid>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <StatCard>
                <StatIcon>
                  <FiZap size={24} />
                </StatIcon>
                <StatValue>3-5s</StatValue>
                <StatLabel>Transaction Finality</StatLabel>
              </StatCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <StatCard>
                <StatIcon>
                  <FiStar size={24} />
                </StatIcon>
                <StatValue>$0.001</StatValue>
                <StatLabel>Average Transaction Cost</StatLabel>
              </StatCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <StatCard>
                <StatIcon>
                  <FiUsers size={24} />
                </StatIcon>
                <StatValue>10k+</StatValue>
                <StatLabel>Transactions Per Second</StatLabel>
              </StatCard>
            </motion.div>
          </StatsGrid>
        </Container>
      </StatsSection>

      <FeaturesSection>
        <Container>
          <SectionTitle>Why Choose Comic Pad?</SectionTitle>
          <FeaturesGrid>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <FeatureCard>
                <FeatureIcon>
                  <FiZap size={32} />
                </FeatureIcon>
                <FeatureTitle>Lightning Fast</FeatureTitle>
                <FeatureDescription>
                  Built on Hedera Hashgraph for 3-5 second transaction finality 
                  and 10,000+ transactions per second.
                </FeatureDescription>
              </FeatureCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <FeatureCard>
                <FeatureIcon>
                  <FiStar size={32} />
                </FeatureIcon>
                <FeatureTitle>Low Cost</FeatureTitle>
                <FeatureDescription>
                  Transaction fees as low as $0.001, making it affordable 
                  for creators and collectors of all sizes.
                </FeatureDescription>
              </FeatureCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <FeatureCard>
                <FeatureIcon>
                  <FiUsers size={32} />
                </FeatureIcon>
                <FeatureTitle>Eco-Friendly</FeatureTitle>
                <FeatureDescription>
                  Carbon-negative blockchain technology that's better 
                  for the environment than traditional proof-of-work.
                </FeatureDescription>
              </FeatureCard>
            </motion.div>
          </FeaturesGrid>
        </Container>
      </FeaturesSection>
    </HomeContainer>
  )
}

export default Home
