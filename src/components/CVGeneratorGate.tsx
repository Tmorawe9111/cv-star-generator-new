import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, User, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const CVGeneratorGate = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isLoading, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [isRefetching, setIsRefetching] = React.useState(false);

  // If user exists but profile is null, try to refetch once
  React.useEffect(() => {
    const abortController = new AbortController();

    if (user && profile === null && !isRefetching) {
      setIsRefetching(true);
      refetchProfile().finally(() => {
        if (!abortController.signal.aborted) {
          setIsRefetching(false);
        }
      });
    }

    return () => {
      abortController.abort();
    };
  }, [user, profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, allow CV generation (registration happens at the end)
  if (!user) {
    return <>{children}</>;
  }

  // Show loading while refetching profile
  if (user && profile === null && isRefetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is logged in but doesn't have a complete profile, show message
  if (user && (!profile || !profile.profile_complete)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Profil vervollständigen</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Um den Lebenslauf Generator zu nutzen, müssen Sie zunächst Ihr Profil vervollständigen.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/profile')}
                className="w-full"
              >
                <User className="mr-2 h-4 w-4" />
                Zum Profil
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/mein-bereich')}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Zum Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has complete profile, allow CV generation
  return <>{children}</>;
};