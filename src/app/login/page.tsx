'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import the LoginForm component with no SSR
const LoginForm = dynamic(() => import('./login-form').then(mod => mod.LoginForm), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function LoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  // Clear any autofilled values on mount
  React.useEffect(() => {
    setIsMounted(true);
    
    // Clear any autofilled values after a short delay
    const timer = setTimeout(() => {
      // Clear all input values
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        input.value = '';
        input.autocomplete = 'off';
        input.setAttribute('autocomplete', 'off');
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Redirect if already authenticated
  React.useEffect(() => {
    const isAuthenticated = typeof window !== 'undefined' && 
      document.cookie.split(';').some((item) => item.trim().startsWith('isAuthenticated='));
    
    if (isAuthenticated) {
      router.replace('/patients');
    }
  }, [router]);

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* Left Section */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 items-center justify-center p-8">
        <div className="text-white text-center max-w-md">
          <div className="flex items-center justify-center mb-6">
            <span className="text-3xl font-bold">Sansys EHR</span>
          </div>
          <div className="mb-6">
            <div className="relative w-full h-64">
              <Image
                src="/login.png"
                alt="Healthcare illustration"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-xl font-semibold mb-1">Enhance impact in healthcare</h1>
          <p className="text-sm leading-relaxed">
            Your Impact in healthcare just got stronger. Enhance patient care
            through refined data control, seamless appointments, and impactful
            task management.
          </p>
          <div className="flex justify-center mt-8 space-x-2">
            <span className="block w-2.5 h-2.5 rounded-full bg-white opacity-75"></span>
            <span className="block w-2.5 h-2.5 rounded-full bg-white opacity-50"></span>
            <span className="block w-2.5 h-2.5 rounded-full bg-white opacity-25"></span>
          </div>
        </div>
      </div>

      {/* Right Section (Login Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <LoginForm />
      </div>
    </div>
  );
}