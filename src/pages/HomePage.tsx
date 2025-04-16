import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('clearstudy-current-user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('clearstudy-current-user');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user.name || 'User'}!</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/record')}>
            <CardHeader>
              <CardTitle>Record Audio</CardTitle>
              <CardDescription>Start a new recording session</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Click here to start recording your audio notes.</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>My Recordings</CardTitle>
              <CardDescription>View your saved recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Access your previously recorded audio notes.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 