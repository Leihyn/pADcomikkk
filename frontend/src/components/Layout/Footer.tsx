import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { FiGithub, FiTwitter, FiMail } from 'react-icons/fi'

const FooterContainer = styled.footer`
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 3rem 0 2rem;
  margin-top: 4rem;
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`

const FooterSection = styled.div`
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 1rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  a {
    color: ${({ theme }) => theme.colors.textSecondary};
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`

const SocialLink = styled.a`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    transform: translateY(-2px);
  }
`

const FooterBottom = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`

const Copyright = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  margin: 0;
`

const FooterLinks = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
  
  a {
    color: ${({ theme }) => theme.colors.textSecondary};
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <Container>
        <FooterContent>
          <FooterSection>
            <h3>Comic Pad</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The future of comic book publishing. Create, mint, and trade 
              unique comic NFTs on Hedera Hashgraph.
            </p>
            <SocialLinks>
              <SocialLink href="#" title="GitHub">
                <FiGithub size={20} />
              </SocialLink>
              <SocialLink href="#" title="Twitter">
                <FiTwitter size={20} />
              </SocialLink>
              <SocialLink href="#" title="Discord">
                {/* <FiDiscord size={20} /> */}
              </SocialLink>
              <SocialLink href="#" title="Email">
                <FiMail size={20} />
              </SocialLink>
            </SocialLinks>
          </FooterSection>

          <FooterSection>
            <h3>Platform</h3>
            <ul>
              <li><Link to="/marketplace">Marketplace</Link></li>
              <li><Link to="/creator">Creator Studio</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/help">Help Center</Link></li>
            </ul>
          </FooterSection>

          <FooterSection>
            <h3>Resources</h3>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Reference</a></li>
              <li><a href="#">Tutorials</a></li>
              <li><a href="#">Community</a></li>
            </ul>
          </FooterSection>

          <FooterSection>
            <h3>Support</h3>
            <ul>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Bug Reports</a></li>
              <li><a href="#">Feature Requests</a></li>
              <li><a href="#">Status Page</a></li>
            </ul>
          </FooterSection>
        </FooterContent>

        <FooterBottom>
          <Copyright>
            © 2024 Comic Pad. All rights reserved.
          </Copyright>
          <FooterLinks>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </FooterLinks>
        </FooterBottom>
      </Container>
    </FooterContainer>
  )
}

export default Footer
