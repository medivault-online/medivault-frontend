'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/config/routes';
import type { Route } from 'next';

export default function LogoutPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Call the sign-out API
        const response = await fetch('/api/auth/cognito/sign-out', {
          method: 'POST',
          credentials: 'include' // Important for handling cookies
        });

        if (!response.ok) {
          throw new Error('Failed to sign out');
        }

        // Clear auth context
        if (setAuth) {
          setAuth({
            isAuthenticated: false,
            user: null
          });
        }

        // Redirect to login page using the route from our configuration
        router.push(routes.root.login as Route);
      } catch (error) {
        console.error('Error during logout:', error);
        // Still redirect to login page even if there's an error
        router.push(routes.root.login as Route);
      }
    };

    handleLogout();
  }, [router, setAuth]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Signing out...</h1>
        <p className="text-gray-600">Please wait while we complete the sign-out process.</p>
      </div>
    </div>
  );
} 