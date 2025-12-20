"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface UserData {
  firstName: string
  lastName: string
  email: string
  languagePreference: 'english' | 'spanish'
  avatar: string
}

interface UserContextType {
  userData: UserData
  updateUserData: (data: Partial<UserData>) => void
}

const defaultUserData: UserData = {
  firstName: 'Gabriela',
  lastName: 'Mena',
  email: 'gabriela@polibit.io',
  languagePreference: 'english',
  avatar: '/avatars/shadcn.jpg'
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData>(defaultUserData)

  // Load user data from localStorage on mount
  useEffect(() => {
    // First, try to load from auth state (primary source)
    const authState = localStorage.getItem('polibit_auth')
    if (authState) {
      try {
        const parsed = JSON.parse(authState)
        if (parsed.user) {
          // Map auth user data to UserContext format
          setUserData({
            firstName: parsed.user.firstName || defaultUserData.firstName,
            lastName: parsed.user.lastName || defaultUserData.lastName,
            email: parsed.user.email || defaultUserData.email,
            languagePreference: (parsed.user.appLanguage === 'es' ? 'spanish' : 'english') as 'english' | 'spanish',
            avatar: parsed.user.profileImage || defaultUserData.avatar
          })
          return
        }
      } catch (e) {
        console.error('Failed to parse auth state:', e)
      }
    }

    // Fallback to legacy polibit_user_data
    const stored = localStorage.getItem('polibit_user_data')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUserData({ ...defaultUserData, ...parsed })
      } catch (e) {
        console.error('Failed to parse stored user data:', e)
      }
    }
  }, [])

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => {
      const updated = { ...prev, ...data }
      // Save to localStorage
      localStorage.setItem('polibit_user_data', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <UserContext.Provider value={{ userData, updateUserData }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
