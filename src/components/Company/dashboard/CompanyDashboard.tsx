import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coins, Users, ArrowUpRight, User, MapPin, GraduationCap, Eye, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TokenManagementModal } from './TokenManagementModal';

interface Candidate {
  id: string;
  name: string;
  initials: string;
  age: number;
  location: string;
  education: string;
  profession: string;
  isUnlocked: boolean;
  contactUnlocked: boolean;
  phone?: string;
  email?: string;
}

export function CompanyDashboard() {
  const [tokenBalance, setTokenBalance] = useState(0);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock candidates data for demo
  const mockCandidates: Candidate[] = [
    {
      id: '1',
      name: 'Anna Schmidt',
      initials: 'AS',
      age: 19,
      location: 'Berlin',
      education: 'Realschulabschluss',
      profession: 'Elektroniker/in',
      isUnlocked: false,
      contactUnlocked: false,
    },
    {
      id: '2',
      name: 'Max Müller',
      initials: 'MM',
      age: 20,
      location: 'Hamburg',
      education: 'Abitur',
      profession: 'IT-Systemelektroniker/in',
      isUnlocked: false,
      contactUnlocked: false,
    },
    {
      id: '3',
      name: 'Sarah Weber',
      initials: 'SW',
      age: 18,
      location: 'München',
      education: 'Fachhochschulreife',
      profession: 'Industriemechaniker/in',
      isUnlocked: false,
      contactUnlocked: false,
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load token balance
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('token_balance')
        .eq('id', user?.id)
        .single();

      if (companyData) {
        setTokenBalance(companyData.token_balance || 0);
      }

      // Set mock candidates
      setCandidates(mockCandidates);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockProfile = async (candidateId: string) => {
    if (tokenBalance < 1) {
      toast({
        title: "Nicht genügend Credits",
        description: "Sie benötigen 1 Credit zum Freischalten des Profils.",
        variant: "destructive",
      });
      return;
    }

    // Deduct token and unlock profile
    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, isUnlocked: true }
          : candidate
      )
    );
    setTokenBalance(prev => prev - 1);

    toast({
      title: "Profil freigeschaltet",
      description: "Sie können nun die vollständigen Profilinformationen einsehen.",
    });
  };

  const handleUnlockContact = async (candidateId: string) => {
    if (tokenBalance < 2) {
      toast({
        title: "Nicht genügend Credits",
        description: "Sie benötigen 2 Credits zum Freischalten der Kontaktdaten.",
        variant: "destructive",
      });
      return;
    }

    // Deduct tokens and unlock contact
    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === candidateId 
          ? { 
              ...candidate, 
              contactUnlocked: true,
              phone: '+49 123 456789',
              email: 'kandidat@email.de'
            }
          : candidate
      )
    );
    setTokenBalance(prev => prev - 2);

    toast({
      title: "Kontaktdaten freigeschaltet",
      description: "Sie können nun die Kontaktdaten des Kandidaten einsehen.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Token Balance */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Ihre passenden Kandidaten im Überblick</p>
        </div>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowTokenModal(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-[hsl(var(--accent))]" />
              <span className="font-semibold">Credits: {tokenBalance}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Credits Banner */}
      {tokenBalance < 5 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ihre Credits werden knapp</p>
                <p className="text-sm text-muted-foreground">
                  Kaufen Sie weitere Credits, um neue Talente freizuschalten.
                </p>
              </div>
              <Button 
                onClick={() => setShowTokenModal(true)}
                className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] text-white"
              >
                Credits nachkaufen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Passende Kandidaten</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center text-white font-semibold">
                      {candidate.isUnlocked ? (
                        <User className="h-6 w-6" />
                      ) : (
                        candidate.initials
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {candidate.isUnlocked ? candidate.name : 'Kandidat'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{candidate.profession}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {candidate.age} Jahre
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.education}</span>
                  </div>
                </div>

                {/* Contact Information (if unlocked) */}
                {candidate.contactUnlocked && (
                  <div className="bg-green-50 p-3 rounded-lg space-y-1">
                    <p className="text-sm font-medium text-green-800">Kontaktdaten:</p>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Phone className="h-3 w-3" />
                      <span>{candidate.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <span>@</span>
                      <span>{candidate.email}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!candidate.isUnlocked ? (
                    <Button 
                      onClick={() => handleUnlockProfile(candidate.id)}
                      className="flex-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] text-white"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Profil freischalten (1 Credit)
                    </Button>
                  ) : !candidate.contactUnlocked ? (
                    <Button 
                      onClick={() => handleUnlockContact(candidate.id)}
                      className="flex-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] text-white"
                      size="sm"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Kontaktdaten (2 Credits)
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Kontaktieren
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Token Management Modal */}
      <TokenManagementModal 
        open={showTokenModal}
        onOpenChange={setShowTokenModal}
        currentBalance={tokenBalance}
        onBalanceUpdate={setTokenBalance}
      />
    </div>
  );
}