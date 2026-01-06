import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Copy, ExternalLink, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  code: string;
  name: string;
  platform: 'instagram' | 'facebook' | 'both';
  utm_campaign?: string;
  redirectTo: 'gesundheitswesen' | 'cv-generator';
  created_at?: string;
}

export default function CreatorManagement() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  
  const [formData, setFormData] = useState<Omit<Creator, 'id' | 'created_at'>>({
    code: '',
    name: '',
    platform: 'instagram',
    utm_campaign: '',
    redirectTo: 'cv-generator',
  });

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      // Load from localStorage (in production, this would be from a database)
      const saved = localStorage.getItem('creators');
      if (saved) {
        setCreators(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCreators = (newCreators: Creator[]) => {
    localStorage.setItem('creators', JSON.stringify(newCreators));
    setCreators(newCreators);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast({
        title: 'Fehler',
        description: 'Code und Name sind erforderlich',
        variant: 'destructive',
      });
      return;
    }

    if (editingCreator) {
      // Update existing
      const updated = creators.map(c => 
        c.id === editingCreator.id 
          ? { ...editingCreator, ...formData }
          : c
      );
      saveCreators(updated);
      toast({
        title: 'Erfolg',
        description: 'Creator aktualisiert',
      });
    } else {
      // Create new
      const newCreator: Creator = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
      };
      saveCreators([...creators, newCreator]);
      toast({
        title: 'Erfolg',
        description: 'Creator erstellt',
      });
    }

    setShowForm(false);
    setEditingCreator(null);
    setFormData({
      code: '',
      name: '',
      platform: 'instagram',
      utm_campaign: '',
      redirectTo: 'cv-generator',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Möchtest du diesen Creator wirklich löschen?')) {
      saveCreators(creators.filter(c => c.id !== id));
      toast({
        title: 'Erfolg',
        description: 'Creator gelöscht',
      });
    }
  };

  const handleEdit = (creator: Creator) => {
    setEditingCreator(creator);
    setFormData({
      code: creator.code,
      name: creator.name,
      platform: creator.platform,
      utm_campaign: creator.utm_campaign || '',
      redirectTo: creator.redirectTo,
    });
    setShowForm(true);
  };

  const generateLinks = (creator: Creator) => {
    const baseUrl = window.location.origin;
    const links = [];
    
    // Einheitlicher Link für alle Creators mit Query-Parameter
    if (creator.platform === 'instagram' || creator.platform === 'both') {
      links.push({
        platform: 'Instagram',
        url: `${baseUrl}/ig?c=${creator.code}`,
        short: `bevisiblle.de/ig?c=${creator.code}`,
        display: 'bevisiblle.de/ig', // Zeigt nur den Basis-Link an
      });
    }
    
    if (creator.platform === 'facebook' || creator.platform === 'both') {
      links.push({
        platform: 'Facebook',
        url: `${baseUrl}/fb?c=${creator.code}`,
        short: `bevisiblle.de/fb?c=${creator.code}`,
        display: 'bevisiblle.de/fb', // Zeigt nur den Basis-Link an
      });
    }
    
    return links;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Kopiert!',
      description: 'Link wurde in die Zwischenablage kopiert',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Management</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte Instagram & Facebook Creator Links
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Creator
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCreator ? 'Creator bearbeiten' : 'Neuer Creator'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Creator Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  placeholder="z.B. nakam"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Wird in der URL verwendet: bevisiblle.de/ig/nakam
                </p>
              </div>
              <div>
                <Label htmlFor="name">Creator Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Nakam"
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(v: any) => setFormData({ ...formData, platform: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="both">Beide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="redirectTo">Weiterleitung zu</Label>
                <Select
                  value={formData.redirectTo}
                  onValueChange={(v: any) => setFormData({ ...formData, redirectTo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cv-generator">CV Generator</SelectItem>
                    <SelectItem value="gesundheitswesen">Gesundheitswesen Landing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="utm_campaign">UTM Campaign (optional)</Label>
                <Input
                  id="utm_campaign"
                  value={formData.utm_campaign}
                  onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                  placeholder="z.B. january2024"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                {editingCreator ? 'Aktualisieren' : 'Erstellen'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowForm(false);
                setEditingCreator(null);
                setFormData({
                  code: '',
                  name: '',
                  platform: 'instagram',
                  utm_campaign: '',
                  redirectTo: 'cv-generator',
                });
              }}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creators List */}
      <Card>
        <CardHeader>
          <CardTitle>Creators</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Creators erstellt.
            </div>
          ) : (
            <div className="space-y-4">
              {creators.map((creator) => {
                const links = generateLinks(creator);
                return (
                  <Card key={creator.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{creator.name}</h3>
                          <span className="text-xs px-2 py-1 bg-muted rounded">
                            {creator.platform === 'both' ? 'Instagram & Facebook' : creator.platform}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Code: <code className="bg-muted px-1 rounded">{creator.code}</code>
                        </p>
                        <div className="space-y-2">
                          {links.map((link) => (
                            <div key={link.platform} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium w-24">{link.platform}:</span>
                                <code className="flex-1 bg-muted px-2 py-1 rounded text-sm">
                                  {link.display || link.short}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(link.url)}
                                  title="Vollständigen Link kopieren"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(link.url, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground ml-24">
                                Vollständiger Link: <code className="bg-muted px-1 rounded">{link.short}</code>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/admin/referral-analytics?utm_source=${creator.platform === 'both' ? 'instagram' : creator.platform}&referral_code=${creator.code.toUpperCase()}_${creator.platform === 'both' ? 'IG' : creator.platform.toUpperCase()}`, '_blank')}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(creator)}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(creator.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

