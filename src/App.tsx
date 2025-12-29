import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Simple auth wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

// Placeholder pages - will be fully implemented
function Overview() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold text-foreground mb-4">System Overview</h1>
      <p className="text-muted-foreground">Dashboard is loading... Database schema has been updated.</p>
    </div>
  );
}

function Auth() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);
    
    if (result.error) {
      setError(result.error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded text-foreground"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded text-foreground"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-primary text-primary-foreground rounded font-medium"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <p className="text-muted-foreground text-sm mt-4 text-center">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary ml-1"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

import React from "react";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Overview />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
