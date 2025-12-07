'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        router.push('/super-admin');
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/member');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
      // Redirect will happen via the useEffect above when user state changes
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 animate-fadeIn">
        {/* Header with gradient */}
        <div className="text-center">
          <div className="inline-block p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-2">
            <span className="gradient-text">OsuOlale</span>
          </h1>
          <p className="text-gray-600 font-medium">Cooperative Society Management System</p>
        </div>

        {/* Login Card with enhanced design */}
        <Card className="card-gradient border-2 border-white/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="h-11 border-2 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 border-2 focus:border-emerald-500 transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-2">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 btn-primary text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Apply link */}
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 font-medium">
                  Don't have an account?{' '}
                  <a href="/apply" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-all">
                    Apply for membership →
                  </a>
                </p>
              </div>
            </form>

            {/* Demo Credentials with beautiful design */}
            <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 shadow-inner">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="font-bold text-blue-900">Demo Credentials</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start p-2 bg-white/60 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                  <div className="text-sm flex-1">
                    <p className="font-semibold text-purple-900">Platform Admin</p>
                    <p className="text-gray-600">platform@admin.com / superadmin123</p>
                  </div>
                </div>
                <div className="flex items-start p-2 bg-white/60 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 mr-2"></div>
                  <div className="text-sm flex-1">
                    <p className="font-semibold text-emerald-900">Society Admin</p>
                    <p className="text-gray-600">admin@osuolale.com / admin123</p>
                  </div>
                </div>
                <div className="flex items-start p-2 bg-white/60 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                  <div className="text-sm flex-1">
                    <p className="font-semibold text-blue-900">Member</p>
                    <p className="text-gray-600">john.doe@email.com / member123</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
