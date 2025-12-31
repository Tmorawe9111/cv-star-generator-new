import React from 'react';

interface FormattedDescriptionProps {
  description: string;
  className?: string;
  textSize?: 'sm' | 'base' | 'lg' | 'xs';
}

/**
 * Component to format descriptions with bulletpoints.
 * Each line is displayed as a separate bulletpoint item.
 */
export const FormattedDescription: React.FC<FormattedDescriptionProps> = ({
  description,
  className = '',
  textSize = 'base'
}) => {
  if (!description) return null;

  // Split by newlines and filter empty lines
  const lines = description.split('\n').filter(line => line.trim());
  
  // Check if description has bullet markers or multiple lines
  const hasBulletpoints = lines.some(line => 
    line.trim().startsWith('•') || 
    line.trim().startsWith('-') || 
    line.trim().startsWith('*') ||
    line.trim().match(/^\d+[\.\)]/) // Numbered lists
  );
  
  // Size classes
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg'
  };

  if (hasBulletpoints || lines.length > 1) {
    // Display as bullet list - each line is a bulletpoint
    return (
      <ul className={`space-y-1.5 list-none pl-0 ${sizeClasses[textSize]} ${className}`}>
        {lines.map((line, idx) => {
          // Remove existing bullet markers if present
          const cleanLine = line.trim().replace(/^[•\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '');
          return (
            <li key={idx} className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed flex-1">{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  } else {
    // Single line or no bullets - display as paragraph
    return (
      <p className={`leading-relaxed ${sizeClasses[textSize]} ${className}`}>
        {description}
      </p>
    );
  }
};

