import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogPostsAdmin } from '@/hooks/useBlogManagement';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Eye, Calendar, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useDeleteBlogPost } from '@/hooks/useBlogManagement';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function BlogList() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const { data: posts, isLoading } = useBlogPostsAdmin({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    industry_sector: industryFilter !== 'all' ? industryFilter : undefined,
  });
  
  // Ensure all posts are shown when filter is 'all' (including archived)

  const deletePost = useDeleteBlogPost();

  const filteredPosts = posts?.filter((post) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      await deletePost.mutateAsync(postToDelete);
      toast.success('Blog-Artikel gelöscht');
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      toast.error('Fehler beim Löschen');
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline',
    };

    const labels: Record<string, string> = {
      published: 'Veröffentlicht',
      draft: 'Entwurf',
      archived: 'Archiviert',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getIndustryLabel = (industry?: string) => {
    const labels: Record<string, string> = {
      pflege: 'Pflege',
      handwerk: 'Handwerk',
      industrie: 'Industrie',
      allgemein: 'Allgemein',
    };
    return labels[industry || ''] || '-';
  };

  const getAudienceLabel = (audience?: string) => {
    const labels: Record<string, string> = {
      schueler: 'Schüler',
      azubi: 'Azubi',
      profi: 'Profi',
      unternehmen: 'Unternehmen',
    };
    return labels[audience || ''] || '-';
  };

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Blog-Artikel</h1>
          <p className="text-muted-foreground">Verwalte deine Blog-Artikel für SEO-Content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/blog/bulk-upload">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/blog/new">
              <Plus className="h-4 w-4 mr-2" />
              Neuer Artikel
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="published">Veröffentlicht</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="archived">Archiviert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Branche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Branchen</SelectItem>
              <SelectItem value="pflege">Pflege</SelectItem>
              <SelectItem value="handwerk">Handwerk</SelectItem>
              <SelectItem value="industrie">Industrie</SelectItem>
              <SelectItem value="allgemein">Allgemein</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground flex items-center">
            {filteredPosts?.length || 0} Artikel
          </div>
        </div>
      </Card>

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredPosts && filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    {getStatusBadge(post.status)}
                  </div>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {post.published_at
                        ? format(new Date(post.published_at), 'dd.MM.yyyy', { locale: de })
                        : format(new Date(post.created_at), 'dd.MM.yyyy', { locale: de })}
                    </div>
                    <span>Branche: {getIndustryLabel(post.industry_sector)}</span>
                    <span>Zielgruppe: {getAudienceLabel(post.target_audience)}</span>
                    <span className="text-xs">/{post.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.status === 'published' && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/blog/edit/${post.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPostToDelete(post.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Keine Blog-Artikel gefunden</p>
          <Button asChild>
            <Link to="/admin/blog/new">
              <Plus className="h-4 w-4 mr-2" />
              Ersten Artikel erstellen
            </Link>
          </Button>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Artikel wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

