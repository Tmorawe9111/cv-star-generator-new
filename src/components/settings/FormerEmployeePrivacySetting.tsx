import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, GraduationCap, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export function FormerEmployeePrivacySetting() {
  const { user } = useAuth();
  const [showAsFormer, setShowAsFormer] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSetting() {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('show_as_former_employee')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setShowAsFormer(data?.show_as_former_employee ?? true);
      } catch (error) {
        console.error('Error loading privacy setting:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSetting();
  }, [user?.id]);

  const handleToggle = async (checked: boolean) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ show_as_former_employee: checked })
        .eq('id', user.id);

      if (error) throw error;

      setShowAsFormer(checked);
      toast({
        title: checked ? 'Sichtbarkeit aktiviert' : 'Sichtbarkeit deaktiviert',
        description: checked 
          ? 'Du wirst bei ehemaligen Arbeitgebern und Schulen angezeigt.'
          : 'Du wirst nicht mehr bei ehemaligen Arbeitgebern angezeigt.',
      });
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      toast({
        title: 'Fehler',
        description: 'Die Einstellung konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Ehemalige Arbeitgeber & Schulen
        </CardTitle>
        <CardDescription>
          Steuere, ob du bei ehemaligen Positionen sichtbar bist
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-as-former" className="text-base font-medium">
              Als Ehemaliger sichtbar
            </Label>
            <p className="text-sm text-muted-foreground">
              Bei ehemaligen Arbeitgebern und Schulen gelistet werden
            </p>
          </div>
          <Switch
            id="show-as-former"
            checked={showAsFormer}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Wenn aktiviert:</strong> Andere können dich kontaktieren 
              und nach deinen Erfahrungen bei ehemaligen Arbeitgebern fragen.
            </p>
            <p>
              <strong>Aktuelle Positionen</strong> werden immer angezeigt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            <span>Ehemalige Arbeitgeber</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4" />
            <span>Alumni-Netzwerke</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
