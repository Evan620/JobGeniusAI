import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

export default function Login() {
  const [_, setLocation] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">JobGenius AI</CardTitle>
          <CardDescription>
            Sign in to manage your job applications with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 h-12"
              onClick={() => window.location.href = '/auth/linkedin'}
            >
              <FaLinkedin className="w-5 h-5 text-blue-600" />
              <span>Sign in with LinkedIn</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 h-12"
              onClick={() => window.location.href = '/auth/github'}
            >
              <FaGithub className="w-5 h-5" />
              <span>Sign in with GitHub</span>
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
          
          <Button 
            className="w-full"
            onClick={() => setLocation('/dashboard')}
          >
            Continue as Guest
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}