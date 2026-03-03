import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, ExternalLink, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAdminAdvertisements, type Advertisement, type AdvertisementInput } from '@/hooks/useAdminAdvertisements';

export default function AdvertisementsAdmin() {
  const { data: ads, isLoading: loading, createAd, updateAd, deleteAd } = useAdminAdvertisements();
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Advertisement>>({
    title: '',
    url: '',
    description: '',
    image_url: '',
    badge: '',
    category: '',
    position: 'right',
    priority: 0,
    active: true,
    target_branche: [],
    target_status: [],
    target_regions: []
  });

  const handleSave = async () => {
    try {
      if (editingAd) {
        await updateAd({ id: editingAd.id, input: formData as AdvertisementInput });
        toast({ title: 'Erfolg', description: 'Werbung aktualisiert' });
      } else {
        await createAd(formData as AdvertisementInput);
        toast({ title: 'Erfolg', description: 'Werbung erstellt' });
      }
      setIsDialogOpen(false);
      setEditingAd(null);
      resetForm();
    } catch (error: unknown) {
      toast({
        title: 'Fehler',
        description: (error as Error).message || 'Fehler beim Speichern',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Werbung wirklich löschen?')) return;
    try {
      await deleteAd(id);
      toast({ title: 'Erfolg', description: 'Werbung gelöscht' });
    } catch (error: unknown) {
      toast({
        title: 'Fehler',
        description: (error as Error).message || 'Fehler beim Löschen',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      url: ad.url,
      description: ad.description || '',
      image_url: ad.image_url || '',
      badge: ad.badge || '',
      category: ad.category || '',
      position: ad.position,
      priority: ad.priority,
      active: ad.active,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
      target_branche: ad.target_branche || [],
      target_status: ad.target_status || [],
      target_regions: ad.target_regions || []
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      image_url: '',
      badge: '',
      category: '',
      position: 'right',
      priority: 0,
      active: true,
      target_branche: [],
      target_status: [],
      target_regions: []
    });
  };

  const toggleArrayValue = (field: 'target_branche' | 'target_status' | 'target_regions', value: string) => {
    const current = formData[field] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const branchen = ['handwerk', 'it', 'gesundheit', 'buero', 'verkauf', 'gastronomie', 'bau'];
  const statuses = ['schueler', 'azubi', 'fachkraft'];
  const regions = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Werbeverwaltung</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAd(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Werbung
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'Werbung bearbeiten' : 'Neue Werbung'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Premium Mitgliedschaft"
                />
              </div>

              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="z.B. /premium"
                />
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kurze Beschreibung der Werbung"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image_url">Bild-URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="badge">Badge</Label>
                  <Input
                    id="badge"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="z.B. Anzeige, Sponsored"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Kategorie</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="z.B. Membership, Event"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: 'left' | 'right' | 'both') => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Links</SelectItem>
                      <SelectItem value="right">Rechts</SelectItem>
                      <SelectItem value="both">Beide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priorität</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Niedrigere Zahl = höhere Priorität</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Startdatum</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Enddatum</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Aktiv</Label>
              </div>

              {/* Targeting Section */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Targeting (Clustering)</h3>
                <p className="text-sm text-muted-foreground">
                  Leer lassen für alle Nutzer, oder spezifische Gruppen auswählen
                </p>

                <div>
                  <Label>Branchen</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {branchen.map(branche => (
                      <Badge
                        key={branche}
                        variant={formData.target_branche?.includes(branche) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue('target_branche', branche)}
                      >
                        {branche}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {statuses.map(status => (
                      <Badge
                        key={status}
                        variant={formData.target_status?.includes(status) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue('target_status', status)}
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Regionen</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {regions.map(region => (
                      <Badge
                        key={region}
                        variant={formData.target_regions?.includes(region) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue('target_regions', region)}
                      >
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Abbrechen
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Lädt...</div>
      ) : (
        <div className="grid gap-4">
          {ads.map(ad => (
            <Card key={ad.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {ad.title}
                      {!ad.active && <Badge variant="secondary">Inaktiv</Badge>}
                      {ad.badge && <Badge>{ad.badge}</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span>Position: {ad.position}</span>
                      <span>•</span>
                      <span>Priorität: {ad.priority}</span>
                      <span>•</span>
                      <span>Klicks: {ad.click_count}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(ad)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(ad.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">{ad.description}</p>
                  <a href={ad.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {ad.url}
                  </a>
                  
                  {/* Targeting Info */}
                  {(ad.target_branche?.length || ad.target_status?.length || ad.target_regions?.length) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold mb-1">Targeting:</p>
                      <div className="flex flex-wrap gap-1">
                        {ad.target_branche?.map(b => <Badge key={b} variant="outline" className="text-xs">{b}</Badge>)}
                        {ad.target_status?.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                        {ad.target_regions?.map(r => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

