import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import slugify from 'slugify';
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost, BlogPostInput } from '@/hooks/useBlogManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const toSlug = (s: string) => slugify(s, { lower: true, strict: true, trim: true });

export default function BlogEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: existingPost, isLoading: loadingPost } = useBlogPost(id || '');
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BlogPostInput>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    industry_sector: undefined,
    target_audience: undefined,
    seo_title: '',
    seo_description: '',
    seo_keywords: [],
    featured_image: '',
    category: '',
    tags: [],
    status: 'draft',
    published_at: undefined,
  });

  // Load existing post
  useEffect(() => {
    if (existingPost) {
      setForm({
        title: existingPost.title || '',
        slug: existingPost.slug || '',
        excerpt: existingPost.excerpt || '',
        content: existingPost.content || '',
        industry_sector: existingPost.industry_sector || undefined,
        target_audience: existingPost.target_audience || undefined,
        seo_title: existingPost.seo_title || '',
        seo_description: existingPost.seo_description || '',
        seo_keywords: existingPost.seo_keywords || [],
        featured_image: existingPost.featured_image || '',
        category: existingPost.category || '',
        tags: existingPost.tags || [],
        status: existingPost.status || 'draft',
        published_at: existingPost.published_at || undefined,
      });
    }
  }, [existingPost]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEdit && form.title && !form.slug) {
      setForm((f) => ({ ...f, slug: toSlug(f.title) }));
    }
  }, [form.title, isEdit]);

  // Auto-generate SEO title/description from title/excerpt
  useEffect(() => {
    if (!form.seo_title && form.title) {
      setForm((f) => ({ ...f, seo_title: f.title }));
    }
  }, [form.title]);

  useEffect(() => {
    if (!form.seo_description && form.excerpt) {
      setForm((f) => ({ ...f, seo_description: f.excerpt || '' }));
    }
  }, [form.excerpt]);

  const seo = useMemo(() => {
    const titleOk = form.seo_title.length > 0 && form.seo_title.length <= 60;
    const descOk = form.seo_description.length > 0 && form.seo_description.length <= 160;
    const score = (titleOk ? 50 : 0) + (descOk ? 50 : 0);
    return { titleOk, descOk, score };
  }, [form.seo_title, form.seo_description]);

  const canPublish = seo.titleOk && seo.descOk && form.title && form.content && form.slug;

  const handleSave = async (status: 'draft' | 'published' | 'archived') => {
    if (!form.title || !form.content || !form.slug) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setSaving(true);
    try {
      const postData: BlogPostInput = {
        ...form,
        status,
        published_at: status === 'published' ? new Date().toISOString() : undefined,
      };

      if (isEdit && id) {
        await updatePost.mutateAsync({ id, input: postData });
        toast.success('Artikel aktualisiert');
      } else {
        await createPost.mutateAsync(postData);
        toast.success('Artikel erstellt');
      }

      navigate('/admin/blog');
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Speichern');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loadingPost && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blog')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? existingPost?.title : 'Erstelle einen neuen Blog-Artikel'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Grundinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="z.B. Generalistik: Die neue Pflegeausbildung erklärt"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL-Slug *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                  placeholder="generalistik-pflegeausbildung"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: /blog/{form.slug || 'slug'}
                </p>
              </div>
              <div>
                <Label htmlFor="excerpt">Kurzbeschreibung</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Kurze Zusammenfassung des Artikels (wird in Listen angezeigt)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Inhalt *</CardTitle>
            </CardHeader>
            <CardContent>
              <ReactQuill
                theme="snow"
                value={form.content}
                onChange={(value) => setForm((f) => ({ ...f, content: value }))}
                placeholder="Schreibe deinen Artikel..."
                style={{ minHeight: '400px' }}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ align: [] }],
                    ['link', 'image'],
                    ['clean'],
                  ],
                }}
              />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                SEO-Einstellungen
                <Badge variant={seo.score === 100 ? 'default' : 'secondary'}>
                  Score: {seo.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo_title">SEO-Titel</Label>
                <Input
                  id="seo_title"
                  value={form.seo_title}
                  onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                  placeholder="Max. 60 Zeichen"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.seo_title.length}/60 {seo.titleOk ? '✓' : '✗'}
                </p>
              </div>
              <div>
                <Label htmlFor="seo_description">SEO-Beschreibung</Label>
                <Textarea
                  id="seo_description"
                  value={form.seo_description}
                  onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                  placeholder="Max. 160 Zeichen"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.seo_description.length}/160 {seo.descOk ? '✓' : '✗'}
                </p>
              </div>
              <div>
                <Label htmlFor="seo_keywords">Keywords (kommagetrennt)</Label>
                <Input
                  id="seo_keywords"
                  value={form.seo_keywords?.join(', ') || ''}
                  onChange={(e) => {
                    const keywords = e.target.value
                      .split(',')
                      .map((k) => k.trim())
                      .filter(Boolean);
                    setForm((f) => ({ ...f, seo_keywords: keywords }));
                  }}
                  placeholder="Pflegeausbildung, Generalistik, Gesundheitswesen"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish */}
          <Card>
            <CardHeader>
              <CardTitle>Veröffentlichung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: 'draft' | 'published' | 'archived') =>
                    setForm((f) => ({ ...f, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="published">Veröffentlicht</SelectItem>
                    <SelectItem value="archived">Archiviert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleSave('published')}
                  disabled={!canPublish || saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Speichere...' : 'Veröffentlichen'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Als Entwurf speichern
                </Button>
              </div>
              {!canPublish && form.status === 'published' && (
                <p className="text-xs text-destructive">
                  Bitte fülle alle Pflichtfelder aus und verbessere den SEO-Score
                </p>
              )}
            </CardContent>
          </Card>

          {/* Categorization */}
          <Card>
            <CardHeader>
              <CardTitle>Kategorisierung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="industry_sector">Branche</Label>
                <Select
                  value={form.industry_sector || ''}
                  onValueChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      industry_sector: value === 'all' ? undefined : (value as any),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Branche wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Keine</SelectItem>
                    <SelectItem value="pflege">Pflege</SelectItem>
                    <SelectItem value="handwerk">Handwerk</SelectItem>
                    <SelectItem value="industrie">Industrie</SelectItem>
                    <SelectItem value="allgemein">Allgemein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_audience">Zielgruppe</Label>
                <Select
                  value={form.target_audience || ''}
                  onValueChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      target_audience: value === 'all' ? undefined : (value as any),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Zielgruppe wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Keine</SelectItem>
                    <SelectItem value="schueler">Schüler</SelectItem>
                    <SelectItem value="azubi">Azubi</SelectItem>
                    <SelectItem value="profi">Profi</SelectItem>
                    <SelectItem value="unternehmen">Unternehmen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Kategorie</Label>
                <Input
                  id="category"
                  value={form.category || ''}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="z.B. Ausbildung, Karriere"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (kommagetrennt)</Label>
                <Input
                  id="tags"
                  value={form.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean);
                    setForm((f) => ({ ...f, tags: tags }));
                  }}
                  placeholder="Tag1, Tag2, Tag3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="featured_image">Bild-URL</Label>
                <Input
                  id="featured_image"
                  value={form.featured_image || ''}
                  onChange={(e) => setForm((f) => ({ ...f, featured_image: e.target.value }))}
                  placeholder="https://..."
                />
                {form.featured_image && (
                  <img
                    src={form.featured_image}
                    alt="Featured"
                    className="mt-2 rounded-lg w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

