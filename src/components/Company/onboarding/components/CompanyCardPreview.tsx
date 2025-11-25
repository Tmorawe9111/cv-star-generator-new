import { Card } from '@/components/ui/card';
import { Building2, Globe } from 'lucide-react';

interface CompanyCardPreviewProps {
  logoUrl?: string;
  coverImageUrl?: string;
  companyBio?: string;
  websiteUrl?: string;
}

export function CompanyCardPreview({
  logoUrl,
  coverImageUrl,
  companyBio,
  websiteUrl,
}: CompanyCardPreviewProps) {
  return (
    <Card className="overflow-hidden border border-gray-200">
      {/* Cover Image */}
      {coverImageUrl ? (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <img
            src={coverImageUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
      )}

      <div className="p-6 space-y-4">
        {/* Logo */}
        <div className="flex items-start gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-16 h-16 rounded-full object-cover border-2 border-white -mt-8 bg-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-white -mt-8 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Company Bio */}
        {companyBio ? (
          <p className="text-sm text-gray-700 line-clamp-3">{companyBio}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Unternehmensbeschreibung wird hier angezeigt...</p>
        )}

        {/* Website */}
        {websiteUrl && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Globe className="w-4 h-4" />
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}

