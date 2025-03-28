import { Switch, Route, useLocation } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import Profile from "@/pages/profile";
import Applications from "@/pages/applications";
import AiControl from "@/pages/ai-control";
import Analytics from "@/pages/analytics";
import Login from "@/pages/login";
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@shared/schema";

// Create auth context
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  refetchUser: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refetchUser: () => {}
});

export const useAuth = () => useContext(AuthContext);

// Auth provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return (
    <AuthContext.Provider value={{ 
      user: user || null,
      isLoading,
      refetchUser: refetch
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return user ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/jobs" component={() => <ProtectedRoute component={Jobs} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/applications" component={() => <ProtectedRoute component={Applications} />} />
      <Route path="/ai-control" component={() => <ProtectedRoute component={AiControl} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
