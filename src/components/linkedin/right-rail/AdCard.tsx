import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export const AdCard: React.FC = () => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="p-4 pb-2">
        <p className="text-xs text-muted-foreground">Werbung</p>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Mehr qualifizierte Kandidaten finden
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Entdecken Sie unsere Premium-Features für besseres Matching und schnellere Einstellungen.
          </p>
          <a 
            href="/unternehmen/abrechnung" 
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Mehr erfahren
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
