import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import slugify from 'slugify';
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost, BlogPostInput } from '@/hooks/useBlogManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Eye, Search, Facebook, Twitter, Linkedin, Share2, Plus, X, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ImageUploader } from '@/components/blog/ImageUploader';
import { VideoEmbedder } from '@/components/blog/VideoEmbedder';
import { QuillEditor } from '@/components/blog/QuillEditor';

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
    // Social Media
    og_title: '',
    og_description: '',
    og_image: '',
    og_type: 'article',
    og_url: '',
    twitter_card: 'summary_large_image',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    twitter_site: '@bevisiblle',
    twitter_creator: '',
    // Video
    video_url: '',
    video_embed_code: '',
    // Additional Media
    gallery_images: [],
    external_links: [],
    // Social Sharing
    enable_social_sharing: true,
    canonical_url: '',
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
        // Social Media
        og_title: existingPost.og_title || '',
        og_description: existingPost.og_description || '',
        og_image: existingPost.og_image || '',
        og_type: existingPost.og_type || 'article',
        og_url: existingPost.og_url || '',
        twitter_card: existingPost.twitter_card || 'summary_large_image',
        twitter_title: existingPost.twitter_title || '',
        twitter_description: existingPost.twitter_description || '',
        twitter_image: existingPost.twitter_image || '',
        twitter_site: existingPost.twitter_site || '@bevisiblle',
        twitter_creator: existingPost.twitter_creator || '',
        // Video
        video_url: existingPost.video_url || '',
        video_embed_code: existingPost.video_embed_code || '',
        // Additional Media
        gallery_images: existingPost.gallery_images || [],
        external_links: existingPost.external_links || [],
        // Social Sharing
        enable_social_sharing: existingPost.enable_social_sharing ?? true,
        canonical_url: existingPost.canonical_url || '',
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

  // Auto-generate OG and Twitter from SEO if empty
  useEffect(() => {
    if (!form.og_title && form.seo_title) {
      setForm((f) => ({ ...f, og_title: f.seo_title }));
    }
  }, [form.seo_title]);

  useEffect(() => {
    if (!form.og_description && form.seo_description) {
      setForm((f) => ({ ...f, og_description: f.seo_description }));
    }
  }, [form.seo_description]);

  useEffect(() => {
    if (!form.og_image && form.featured_image) {
      setForm((f) => ({ ...f, og_image: f.featured_image }));
    }
  }, [form.featured_image]);

  useEffect(() => {
    if (!form.twitter_title && form.seo_title) {
      setForm((f) => ({ ...f, twitter_title: f.seo_title }));
    }
  }, [form.seo_title]);

  useEffect(() => {
    if (!form.twitter_description && form.seo_description) {
      setForm((f) => ({ ...f, twitter_description: f.seo_description }));
    }
  }, [form.seo_description]);

  useEffect(() => {
    if (!form.twitter_image && form.featured_image) {
      setForm((f) => ({ ...f, twitter_image: f.featured_image }));
    }
  }, [form.featured_image]);

  // Auto-generate canonical URL
  useEffect(() => {
    if (!form.canonical_url && form.slug) {
      setForm((f) => ({ ...f, canonical_url: `${window.location.origin}/blog/${f.slug}` }));
    }
  }, [form.slug]);

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
              <QuillEditor
                value={form.content}
                onChange={(value) => setForm((f) => ({ ...f, content: value }))}
                placeholder="Schreibe deinen Artikel..."
                minHeight="400px"
              />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                SEO & Social Media
                <Badge variant={seo.score === 100 ? 'default' : 'secondary'}>
                  Score: {seo.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Grundlagen</TabsTrigger>
                  <TabsTrigger value="og">Open Graph</TabsTrigger>
                  <TabsTrigger value="twitter">Twitter</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
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
                  <div>
                    <Label htmlFor="canonical_url">Canonical URL</Label>
                    <Input
                      id="canonical_url"
                      value={form.canonical_url || ''}
                      onChange={(e) => setForm((f) => ({ ...f, canonical_url: e.target.value }))}
                      placeholder="https://bevisiblle.de/blog/..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="og" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-semibold">Open Graph (Facebook, LinkedIn)</Label>
                  </div>
                  <div>
                    <Label htmlFor="og_title">OG Titel</Label>
                    <Input
                      id="og_title"
                      value={form.og_title || ''}
                      onChange={(e) => setForm((f) => ({ ...f, og_title: e.target.value }))}
                      placeholder="Falls abweichend von SEO-Titel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="og_description">OG Beschreibung</Label>
                    <Textarea
                      id="og_description"
                      value={form.og_description || ''}
                      onChange={(e) => setForm((f) => ({ ...f, og_description: e.target.value }))}
                      placeholder="Falls abweichend von SEO-Beschreibung"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="og_image">OG Bild</Label>
                    <ImageUploader
                      value={form.og_image || ''}
                      onChange={(url) => setForm((f) => ({ ...f, og_image: url }))}
                      label="Empfohlen: 1200x630px"
                    />
                  </div>
                  <div>
                    <Label htmlFor="og_type">OG Type</Label>
                    <Select
                      value={form.og_type || 'article'}
                      onValueChange={(value) => setForm((f) => ({ ...f, og_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="og_url">OG URL</Label>
                    <Input
                      id="og_url"
                      value={form.og_url || ''}
                      onChange={(e) => setForm((f) => ({ ...f, og_url: e.target.value }))}
                      placeholder="https://bevisiblle.de/blog/..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="twitter" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Twitter className="h-5 w-5 text-blue-400" />
                    <Label className="text-base font-semibold">Twitter Cards</Label>
                  </div>
                  <div>
                    <Label htmlFor="twitter_card">Card Type</Label>
                    <Select
                      value={form.twitter_card || 'summary_large_image'}
                      onValueChange={(value: 'summary' | 'summary_large_image' | 'app' | 'player') =>
                        setForm((f) => ({ ...f, twitter_card: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                        <SelectItem value="app">App</SelectItem>
                        <SelectItem value="player">Player</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="twitter_title">Twitter Titel</Label>
                    <Input
                      id="twitter_title"
                      value={form.twitter_title || ''}
                      onChange={(e) => setForm((f) => ({ ...f, twitter_title: e.target.value }))}
                      placeholder="Falls abweichend von SEO-Titel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter_description">Twitter Beschreibung</Label>
                    <Textarea
                      id="twitter_description"
                      value={form.twitter_description || ''}
                      onChange={(e) => setForm((f) => ({ ...f, twitter_description: e.target.value }))}
                      placeholder="Falls abweichend von SEO-Beschreibung"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter_image">Twitter Bild</Label>
                    <ImageUploader
                      value={form.twitter_image || ''}
                      onChange={(url) => setForm((f) => ({ ...f, twitter_image: url }))}
                      label="Empfohlen: 1200x675px"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter_site">Twitter Site (@username)</Label>
                    <Input
                      id="twitter_site"
                      value={form.twitter_site || ''}
                      onChange={(e) => setForm((f) => ({ ...f, twitter_site: e.target.value }))}
                      placeholder="@bevisiblle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter_creator">Twitter Creator (@username)</Label>
                    <Input
                      id="twitter_creator"
                      value={form.twitter_creator || ''}
                      onChange={(e) => setForm((f) => ({ ...f, twitter_creator: e.target.value }))}
                      placeholder="@author"
                    />
                  </div>
                </TabsContent>
              </Tabs>
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
              <div className="flex items-center justify-between pt-4 border-t">
                <Label htmlFor="enable_social_sharing">Social Sharing aktivieren</Label>
                <Switch
                  id="enable_social_sharing"
                  checked={form.enable_social_sharing ?? true}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, enable_social_sharing: checked }))}
                />
              </div>
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
            <CardContent>
              <ImageUploader
                value={form.featured_image || ''}
                onChange={(url) => setForm((f) => ({ ...f, featured_image: url }))}
                label="Hauptbild des Artikels"
              />
            </CardContent>
          </Card>

          {/* Video */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoEmbedder
                videoUrl={form.video_url}
                embedCode={form.video_embed_code}
                onVideoUrlChange={(url) => setForm((f) => ({ ...f, video_url: url }))}
                onEmbedCodeChange={(code) => setForm((f) => ({ ...f, video_embed_code: code }))}
              />
            </CardContent>
          </Card>

          {/* Gallery Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Galerie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {form.gallery_images?.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newImages = form.gallery_images?.filter((_, i) => i !== idx) || [];
                        setForm((f) => ({ ...f, gallery_images: newImages }));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <ImageUploader
                value=""
                onChange={(url) => {
                  setForm((f) => ({ ...f, gallery_images: [...(f.gallery_images || []), url] }));
                }}
                label="Bild zur Galerie hinzufügen"
              />
            </CardContent>
          </Card>

          {/* External Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Externe Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.external_links?.map((link, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Link {idx + 1}</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newLinks = form.external_links?.filter((_, i) => i !== idx) || [];
                        setForm((f) => ({ ...f, external_links: newLinks }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...(form.external_links || [])];
                      newLinks[idx] = { ...link, url: e.target.value };
                      setForm((f) => ({ ...f, external_links: newLinks }));
                    }}
                    placeholder="https://..."
                  />
                  <Input
                    value={link.title}
                    onChange={(e) => {
                      const newLinks = [...(form.external_links || [])];
                      newLinks[idx] = { ...link, title: e.target.value };
                      setForm((f) => ({ ...f, external_links: newLinks }));
                    }}
                    placeholder="Link-Titel"
                  />
                  <Textarea
                    value={link.description || ''}
                    onChange={(e) => {
                      const newLinks = [...(form.external_links || [])];
                      newLinks[idx] = { ...link, description: e.target.value };
                      setForm((f) => ({ ...f, external_links: newLinks }));
                    }}
                    placeholder="Beschreibung (optional)"
                    rows={2}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setForm((f) => ({
                    ...f,
                    external_links: [...(f.external_links || []), { url: '', title: '', description: '' }],
                  }));
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Link hinzufügen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

