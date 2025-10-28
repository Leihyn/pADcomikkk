import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export interface User {
  id: string
  username: string
  email: string
  hederaAccountId?: string
  createdAt: string
  profile: {
    bio: string
    avatar: string
    socialLinks: Record<string, string>
  }
  balance?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, hederaAccountId?: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User['profile']>) => Promise<void>
  connectWallet: (hederaAccountId: string, publicKey?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!token

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token')
        if (savedToken) {
          setToken(savedToken)
          
          // Verify token and get user data
          const response = await axios.post('/api/auth/verify-token', {
            token: savedToken
          })
          
          if (response.data.success) {
            setUser(response.data.data.user)
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token')
            setToken(null)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('token')
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Set up axios interceptor for authenticated requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/auth/login', {
        email,
        password
      })

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data
        
        setUser(userData)
        setToken(authToken)
        localStorage.setItem('token', authToken)
        
        toast.success('Login successful!')
      } else {
        throw new Error(response.data.error || 'Login failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string, hederaAccountId?: string) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
        hederaAccountId
      })

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data
        
        setUser(userData)
        setToken(authToken)
        localStorage.setItem('token', authToken)
        
        toast.success('Registration successful!')
      } else {
        throw new Error(response.data.error || 'Registration failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    toast.success('Logged out successfully')
  }

  const updateProfile = async (updates: Partial<User['profile']>) => {
    try {
      const response = await axios.put('/api/auth/profile', updates)

      if (response.data.success) {
        setUser(response.data.data.user)
        toast.success('Profile updated successfully!')
      } else {
        throw new Error(response.data.error || 'Profile update failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Profile update failed'
      toast.error(errorMessage)
      throw error
    }
  }

  const connectWallet = async (hederaAccountId: string, publicKey?: string) => {
    try {
      const response = await axios.post('/api/auth/connect-wallet', {
        hederaAccountId,
        publicKey
      })

      if (response.data.success) {
        // Update user with wallet info
        setUser(prev => prev ? {
          ...prev,
          hederaAccountId,
          balance: response.data.data.balance
        } : null)
        
        toast.success('Wallet connected successfully!')
      } else {
        throw new Error(response.data.error || 'Wallet connection failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Wallet connection failed'
      toast.error(errorMessage)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    connectWallet
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
