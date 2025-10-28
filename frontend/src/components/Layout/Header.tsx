import React, { useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiSearch, FiUser, FiShoppingCart, FiSun, FiMoon } from 'react-icons/fi'

import { useAuth } from '../../contexts/AuthContext'
import { useHedera } from '../../contexts/HederaContext'
import { useTheme } from '../../contexts/ThemeContext'

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  backdrop-filter: blur(10px);
`

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
`

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const Nav = styled.nav<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.colors.background};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    flex-direction: column;
    padding: 2rem;
    transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-100%)'};
    transition: transform 0.3s ease;
    z-index: 999;
  }
`

const NavLink = styled(Link)<{ $isActive: boolean }>`
  color: ${({ theme, $isActive }) => 
    $isActive ? theme.colors.primary : theme.colors.text};
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surface};
  }
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }
`

const ConnectButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }
`

const MobileMenuButton = styled.button`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
  }
`

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()
  const { isConnected, account, connectWallet, disconnectWallet } = useHedera()
  const { isDark, toggleTheme } = useTheme()

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/creator', label: 'Create' },
  ]

  const handleWalletAction = () => {
    if (isConnected) {
      disconnectWallet()
    } else {
      connectWallet()
    }
  }

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          Comic Pad
        </Logo>

        <Nav $isOpen={isMenuOpen}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              $isActive={location.pathname === item.path}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </Nav>

        <HeaderActions>
          <ActionButton title="Search">
            <FiSearch size={20} />
          </ActionButton>
          
          <ActionButton title="Shopping Cart">
            <FiShoppingCart size={20} />
          </ActionButton>
          
          <ActionButton 
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={toggleTheme}
          >
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </ActionButton>

          {isAuthenticated ? (
            <>
              <ActionButton title="Profile">
                <FiUser size={20} />
              </ActionButton>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <ConnectButton onClick={handleWalletAction}>
              {isConnected ? 'Disconnect' : 'Connect Wallet'}
            </ConnectButton>
          )}

          <MobileMenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </MobileMenuButton>
        </HeaderActions>
      </HeaderContent>
    </HeaderContainer>
  )
}

export default Header
