import React, { useCallback, useState } from 'react';
import { useUploadBlogImage } from '@/hooks/useBlogManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  className?: string;
}

export function ImageUploader({ value, onChange, label = 'Bild hochladen', accept = 'image/*', className }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const uploadImage = useUploadBlogImage();

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle eine Bilddatei');
      return;
    }

    // Dateigröße prüfen und warnen
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      toast.warning('Bild ist sehr groß. Die Kompression kann etwas dauern...');
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const url = await uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });
      onChange(url);
      toast.success('Bild erfolgreich hochgeladen');
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [uploadImage, onChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          value && 'border-solid'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="relative">
            <img 
              src={value} 
              alt="Preview" 
              className="max-h-64 mx-auto rounded-lg" 
              onError={(e) => {
                console.error('Image load error:', value);
                toast.error('Bild konnte nicht geladen werden. Bitte überprüfe die URL.');
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => onChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {uploading ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Ziehe ein Bild hierher oder klicke zum Auswählen
              </p>
              {uploading && (
                <div className="mb-3 space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {uploadProgress < 30 ? 'Bild wird komprimiert...' : 
                     uploadProgress < 90 ? 'Bild wird hochgeladen...' : 
                     'Fast fertig...'}
                  </p>
                </div>
              )}
              <Input
                type="file"
                accept={accept}
                onChange={handleInputChange}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Hochladen...' : 'Bild auswählen'}
              </Button>
            </div>
          </div>
        )}
      </div>
      {value && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Oder URL eingeben"
          className="text-sm"
        />
      )}
    </div>
  );
}

