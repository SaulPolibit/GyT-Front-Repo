'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getRedirectPathForRole, getUserRoleType } from '@/lib/auth-storage'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'investment-manager' | 'lp-portal'
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isLoggedIn, user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    // If not logged in, redirect to sign-in page
    if (!isLoggedIn || !user) {
      // Store the intended destination
      if (pathname) {
        sessionStorage.setItem('redirectAfterLogin', pathname)
      }
      router.push('/sign-in')
      return
    }

    // Check if user has correct role
    // requiredRole is 'investment-manager' or 'lp-portal'
    // user.role is 0-3 (0=root, 1=admin, 2=staff → investment-manager, 3=customer → lp-portal)
    const userRoleType = getUserRoleType(user.role)

    // If logged in but wrong role, redirect to correct dashboard
    if (requiredRole && userRoleType !== requiredRole) {
      const correctPath = getRedirectPathForRole(user.role)
      router.push(correctPath)
      return
    }
  }, [isLoggedIn, user, isLoading, requiredRole, router, pathname])

  // Show nothing while loading or redirecting
  if (isLoading || !isLoggedIn || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user has correct role
  const userRoleType = getUserRoleType(user.role)

  // Show nothing while redirecting to correct dashboard
  if (requiredRole && userRoleType !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  // User is authenticated and has correct role
  return <>{children}</>
}
