import { MapPin, Star, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { CompanyLocation } from './types';

interface LocationCardProps {
  location: CompanyLocation;
  onEdit: (location: CompanyLocation) => void;
  onDelete: (location: CompanyLocation) => void;
  onSetPrimary: (location: CompanyLocation) => void;
  canDelete: boolean;
}

export function LocationCard({ 
  location, 
  onEdit, 
  onDelete, 
  onSetPrimary,
  canDelete 
}: LocationCardProps) {
  const formatAddress = () => {
    const parts = [];
    
    if (location.street) {
      parts.push(`${location.street}${location.house_number ? ` ${location.house_number}` : ''}`);
    }
    
    if (location.postal_code || location.city) {
      parts.push(`${location.postal_code || ''} ${location.city || ''}`.trim());
    }
    
    if (location.country) {
      parts.push(location.country);
    }
    
    return parts;
  };

  const addressParts = formatAddress();

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 ease-out">
      {/* Primary Badge */}
      {location.is_primary && (
        <Badge 
          className="absolute -top-2 left-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-sm"
        >
          <Star className="w-3 h-3 mr-1 fill-current" />
          Hauptstandort
        </Badge>
      )}

      {/* Actions Menu */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-gray-200">
            <DropdownMenuItem 
              onClick={() => onEdit(location)}
              className="rounded-lg cursor-pointer"
            >
              <Pencil className="h-4 w-4 mr-2 text-gray-500" />
              Bearbeiten
            </DropdownMenuItem>
            {!location.is_primary && (
              <DropdownMenuItem 
                onClick={() => onSetPrimary(location)}
                className="rounded-lg cursor-pointer"
              >
                <Star className="h-4 w-4 mr-2 text-gray-500" />
                Als Hauptstandort
              </DropdownMenuItem>
            )}
            {canDelete && !location.is_primary && (
              <DropdownMenuItem 
                onClick={() => onDelete(location)}
                className="rounded-lg cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Location Name */}
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {location.name || 'Standort'}
          </h3>
          
          {/* Address */}
          <div className="space-y-0.5">
            {addressParts.map((part, index) => (
              <p key={index} className="text-gray-600 text-sm">
                {part}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

