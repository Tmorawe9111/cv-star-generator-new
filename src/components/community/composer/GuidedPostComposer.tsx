import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildContent } from "@/config/postTemplates";
import type { PostTemplate, PostMeta } from "@/types/community";
import { X } from "lucide-react";

interface GuidedPostComposerProps {
  template: PostTemplate;
  onSubmit: (content: string, meta: PostMeta, imageUrl?: string) => Promise<void>;
  onCancel: () => void;
  uploadFile: (file: File, bucket: string, folder: string) => Promise<string>;
  userId: string;
  isSubmitting: boolean;
}

export function GuidedPostComposer({
  template,
  onSubmit,
  onCancel,
  uploadFile,
  userId,
  isSubmitting,
}: GuidedPostComposerProps) {
  const [values, setValues] = useState<PostMeta>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const allRequiredFilled = template.fields
    .filter((f) => f.required)
    .every((f) => {
      const v = values[f.key];
      return typeof v === "string" && v.trim().length > 0;
    });

  const content = buildContent(template.type, values);
  const canPost = allRequiredFilled && content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canPost) return;
    let imageUrl: string | undefined;
    if (imageFile) {
      imageUrl = await uploadFile(imageFile, "post-media", "images");
    }
    await onSubmit(content, values, imageUrl);
  };

  return (
    <div className="space-y-4">
      {template.fields.map((field) => (
        <div key={field.key}>
          <label className="text-sm font-medium mb-1 block">{field.label}</label>
          {field.type === "text" && (
            <Input
              value={(values[field.key] as string) ?? ""}
              onChange={(e) => updateValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="mt-1"
            />
          )}
          {field.type === "textarea" && (
            <Textarea
              value={(values[field.key] as string) ?? ""}
              onChange={(e) => updateValue(field.key, e.target.value)}
              placeholder={field.placeholder ?? template.placeholder}
              className="mt-1 min-h-[100px] resize-none"
            />
          )}
          {field.type === "select" && (
            <Select
              value={(values[field.key] as string) ?? ""}
              onValueChange={(v) => updateValue(field.key, v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={`${field.label} wählen`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {field.type === "image" && (
            <div className="mt-1">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Vorschau"
                    className="h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <span className="text-sm text-primary underline">
                    Foto hochladen
                  </span>
                </label>
              )}
            </div>
          )}
        </div>
      ))}

      {content && (
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <p className="text-muted-foreground text-xs mb-1">Vorschau:</p>
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button onClick={handleSubmit} disabled={!canPost || isSubmitting}>
          Posten
        </Button>
      </div>
    </div>
  );
}
