import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Client, AccountId, PrivateKey, Hbar } from '@hashgraph/sdk'
import toast from 'react-hot-toast'

export interface HederaAccount {
  accountId: string
  publicKey: string
  balance: string
}

export interface HederaTransaction {
  transactionId: string
  status: string
  timestamp: string
}

interface HederaContextType {
  client: Client | null
  account: HederaAccount | null
  isConnected: boolean
  isLoading: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  getAccountBalance: (accountId: string) => Promise<string>
  transferHBAR: (to: string, amount: number) => Promise<HederaTransaction>
  createAccount: () => Promise<HederaAccount>
  signMessage: (message: string) => Promise<string>
}

const HederaContext = createContext<HederaContextType | undefined>(undefined)

interface HederaProviderProps {
  children: ReactNode
}

export const HederaProvider: React.FC<HederaProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null)
  const [account, setAccount] = useState<HederaAccount | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize Hedera client
  useEffect(() => {
    const initClient = () => {
      try {
        const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
        const hederaClient = Client.forName(network)
        setClient(hederaClient)
      } catch (error) {
        console.error('Failed to initialize Hedera client:', error)
      }
    }

    initClient()
  }, [])

  // Check for saved wallet connection
  useEffect(() => {
    const savedAccount = localStorage.getItem('hederaAccount')
    if (savedAccount && client) {
      try {
        const accountData = JSON.parse(savedAccount)
        setAccount(accountData)
        setIsConnected(true)
      } catch (error) {
        console.error('Failed to parse saved account:', error)
        localStorage.removeItem('hederaAccount')
      }
    }
  }, [client])

  const connectWallet = async () => {
    try {
      setIsLoading(true)

      // For development, create a demo account
      const demoAccount = await createAccount()
      setAccount(demoAccount)
      setIsConnected(true)
      localStorage.setItem('hederaAccount', JSON.stringify(demoAccount))
      
      toast.success('Demo wallet connected!')
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      toast.error(error.message || 'Failed to connect wallet')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setIsConnected(false)
    localStorage.removeItem('hederaAccount')
    toast.success('Wallet disconnected')
  }

  const getAccountBalance = async (accountId: string): Promise<string> => {
    try {
      if (!client) {
        throw new Error('Hedera client not initialized')
      }

      const balance = await new (await import('@hashgraph/sdk')).AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId))
        .execute(client)

      return balance.hbars.toString()
    } catch (error: any) {
      console.error('Failed to get account balance:', error)
      throw error
    }
  }

  const transferHBAR = async (to: string, amount: number): Promise<HederaTransaction> => {
    try {
      if (!client || !account) {
        throw new Error('Wallet not connected')
      }

      // Demo transfer for development
      return {
        transactionId: `demo-${Date.now()}`,
        status: 'success',
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Transfer error:', error)
      toast.error(error.message || 'Transfer failed')
      throw error
    }
  }

  const createAccount = async (): Promise<HederaAccount> => {
    try {
      if (!client) {
        throw new Error('Hedera client not initialized')
      }

      // Generate a new key pair
      const privateKey = PrivateKey.generateED25519()
      const publicKey = privateKey.publicKey

      // In a real implementation, you would create the account on Hedera
      // For demo purposes, we'll create a mock account
      const mockAccount: HederaAccount = {
        accountId: `0.0.${Math.floor(Math.random() * 1000000)}`,
        publicKey: publicKey.toString(),
        balance: '100' // Demo balance
      }

      return mockAccount
    } catch (error: any) {
      console.error('Failed to create account:', error)
      throw error
    }
  }

  const signMessage = async (message: string): Promise<string> => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      // Demo signature for development
      return `demo-signature-${Date.now()}`
    } catch (error: any) {
      console.error('Signing error:', error)
      throw error
    }
  }

  const value: HederaContextType = {
    client,
    account,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    getAccountBalance,
    transferHBAR,
    createAccount,
    signMessage
  }

  return (
    <HederaContext.Provider value={value}>
      {children}
    </HederaContext.Provider>
  )
}

export const useHedera = (): HederaContextType => {
  const context = useContext(HederaContext)
  if (context === undefined) {
    throw new Error('useHedera must be used within a HederaProvider')
  }
  return context
}
