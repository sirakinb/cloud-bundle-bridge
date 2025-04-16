import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface User {
  email: string;
  password: string;
  name?: string;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [userData, setUserData] = useState<User>({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSignup) {
        // Signup logic
        const users = JSON.parse(localStorage.getItem('clearstudy-users') || '[]');
        const existingUser = users.find((u: User) => u.email === userData.email);
        
        if (existingUser) {
          toast.error('Email already registered');
          return;
        }

        const newUser = {
          ...userData,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('clearstudy-users', JSON.stringify(users));
        localStorage.setItem('clearstudy-current-user', JSON.stringify(newUser));
        toast.success('Account created successfully!');
      } else {
        // Login logic
        const users = JSON.parse(localStorage.getItem('clearstudy-users') || '[]');
        const user = users.find(
          (u: User) => u.email === userData.email && u.password === userData.password
        );

        if (!user) {
          toast.error('Invalid email or password');
          return;
        }

        localStorage.setItem('clearstudy-current-user', JSON.stringify(user));
        toast.success('Logged in successfully!');
      }

      // Force a page reload to ensure all context providers are properly initialized
      window.location.href = '/';
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignup ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignup ? 'Sign up to get started' : 'Sign in to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={userData.password}
                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {isSignup ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 