import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, ArrowUpRight, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TokenPackage {
  id: string;
  credits: number;
  price_cents: number;
}

interface TokenManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onBalanceUpdate: (balance: number) => void;
}

export function TokenManagementModal({ 
  open, 
  onOpenChange, 
  currentBalance, 
  onBalanceUpdate 
}: TokenManagementModalProps) {
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTokenPackages();
    }
  }, [open]);

  const loadTokenPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('token_packages')
        .select('*')
        .eq('active', true)
        .order('credits', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading token packages:', error);
      toast({
        title: "Fehler beim Laden der Pakete",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-token-checkout', {
        body: { packageId }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast({
          title: "Weiterleitung zur Zahlung",
          description: "Sie werden zu Stripe weitergeleitet.",
        });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Fehler bei der Zahlung",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpgrade = async (planId: 'starter' | 'premium') => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planId }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast({
          title: "Weiterleitung zur Plan-Aktivierung",
          description: "Sie werden zu Stripe weitergeleitet.",
        });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Fehler bei der Plan-Aktivierung",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(0)}€`;
  };

  const calculatePricePerCredit = (cents: number, credits: number) => {
    return `${(cents / 100 / credits).toFixed(2)}€ pro Credit`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-[hsl(var(--accent))]" />
            Credits verwalten
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Aktueller Credit-Stand</h3>
                  <p className="text-muted-foreground">
                    Sie haben <strong>{currentBalance} Credits</strong> verfügbar
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[hsl(var(--accent))]">
                    {currentBalance}
                  </div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">i</span>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-900">So funktionieren Credits:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>1 Credit</strong> = Profil freischalten (Name, Details)</li>
                    <li>• <strong>2 Credits</strong> = Kontaktdaten freischalten (E-Mail, Telefon)</li>
                    <li>• <strong>3 Credits total</strong> = Vollständiger Kandidatenzugang</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Packages */}
          <div className="space-y-4">
            <h3 className="font-semibold">Credit-Pakete kaufen</h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              {packages.map((pkg, index) => (
                <Card 
                  key={pkg.id} 
                  className={`relative hover:shadow-md transition-shadow ${
                    index === 1 ? 'border-[hsl(var(--accent))] ring-2 ring-[hsl(var(--accent))]' : ''
                  }`}
                >
                  {index === 1 && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[hsl(var(--accent))] text-white">
                      Beliebt
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-12 h-12 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center mb-2">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">
                      {pkg.credits} Credits
                    </CardTitle>
                    <div className="text-2xl font-bold">
                      {formatPrice(pkg.price_cents)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {calculatePricePerCredit(pkg.price_cents, pkg.credits)}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-4">
                      <div className="text-sm text-muted-foreground text-center">
                        Entspricht ca. <strong>{Math.floor(pkg.credits / 3)} vollständigen</strong> Kandidatenprofilen
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={loading}
                      className={`w-full ${
                        index === 1 
                          ? 'bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] text-white'
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Coins className="h-4 w-4 mr-2" />
                      )}
                      Jetzt kaufen
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Plan Upgrade */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Plan upgraden</h3>
                  <p className="text-muted-foreground">
                    Holen Sie sich monatliche Credits und weitere Vorteile
                  </p>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="border-2 border-[hsl(var(--accent))] bg-white">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <h4 className="font-semibold">Starter</h4>
                        <div className="text-2xl font-bold text-[hsl(var(--accent))]">299€</div>
                        <p className="text-sm text-muted-foreground">pro Monat</p>
                        <Button 
                          size="sm" 
                          className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] text-white"
                          onClick={() => handlePlanUpgrade('starter')}
                          disabled={loading}
                        >
                          Starter wählen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 bg-white">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <h4 className="font-semibold">Premium</h4>
                        <div className="text-2xl font-bold">889€</div>
                        <p className="text-sm text-muted-foreground">pro Monat</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handlePlanUpgrade('premium')}
                          disabled={loading}
                        >
                          Premium wählen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}