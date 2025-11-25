import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Check, Plus, CreditCard } from "lucide-react";
import { useState } from "react";

interface Package {
  id: string;
  name: string;
  monthly_price_cents: number;
  included_needs: number;
  extra_need_price_cents?: number;
}

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: Package[];
  currentPackageId: string;
  onPurchaseExtra: () => void;
  onUpgradePackage: (packageId: string) => void;
  isLoading?: boolean;
}

export function UpsellModal({ 
  isOpen, 
  onClose, 
  packages, 
  currentPackageId, 
  onPurchaseExtra, 
  onUpgradePackage,
  isLoading 
}: UpsellModalProps) {
  const [selectedAction, setSelectedAction] = useState<'extra' | 'upgrade' | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');

  const currentPackage = packages.find(p => p.id === currentPackageId);
  const availableUpgrades = packages.filter(p => 
    currentPackage && p.included_needs > currentPackage.included_needs
  );

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',');
  };

  const getPackageColor = (packageId: string) => {
    switch (packageId) {
      case 'starter': return 'border-gray-200 bg-gray-50';
      case 'professional': return 'border-blue-200 bg-blue-50';
      case 'enterprise': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'professional': return <Zap className="h-5 w-5 text-blue-600" />;
      case 'enterprise': return <Crown className="h-5 w-5 text-purple-600" />;
      default: return <Plus className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleConfirm = () => {
    if (selectedAction === 'extra') {
      onPurchaseExtra();
    } else if (selectedAction === 'upgrade' && selectedPackage) {
      onUpgradePackage(selectedPackage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Mehr Anforderungsprofile benötigt?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Aktuelles Paket:</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentPackage?.name}</Badge>
              <span className="text-sm">
                {currentPackage?.included_needs} Anforderungsprofile inklusive
              </span>
            </div>
          </div>

          {/* Option 1: Buy one extra need */}
          <Card 
            className={`cursor-pointer transition-all ${
              selectedAction === 'extra' 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedAction('extra')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                  Einzelnes Anforderungsprofil kaufen
                </div>
                <Badge variant="outline" className="text-lg font-bold">
                  29,00€
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Sofort verfügbar
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Einmalige Zahlung
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Perfekt für gelegentliche Nutzung
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Ideal wenn Sie nur gelegentlich ein zusätzliches Anforderungsprofil benötigen.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Option 2: Upgrade package */}
          {availableUpgrades.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Oder auf ein höheres Paket upgraden:</h3>
              
              <div className="grid gap-3">
                {availableUpgrades.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all ${getPackageColor(pkg.id)} ${
                      selectedAction === 'upgrade' && selectedPackage === pkg.id
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedAction('upgrade');
                      setSelectedPackage(pkg.id);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            {getPackageIcon(pkg.id)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{pkg.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {pkg.included_needs} Anforderungsprofile inklusive
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatPrice(pkg.monthly_price_cents)}€
                          </div>
                          <div className="text-sm text-muted-foreground">pro Monat</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          {pkg.included_needs} Needs inklusive
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Monatlich kündbar
                        </div>
                        {pkg.extra_need_price_cents && (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Extra Needs: {formatPrice(pkg.extra_need_price_cents)}€
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Sofort aktiv
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedAction || isLoading}
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? 'Wird verarbeitet...' : 'Jetzt kaufen'}
            </Button>
          </div>

          {/* Trust signals */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            <div className="flex items-center justify-center gap-4">
              <span>🔒 Sicherer Checkout</span>
              <span>✅ Sofort aktiv</span>
              <span>📞 Support verfügbar</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}