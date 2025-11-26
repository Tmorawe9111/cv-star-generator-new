import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmartBack } from '@/hooks/useSmartBack';
import { cn } from '@/lib/utils';

interface SmartBackButtonProps {
  /** Where to go for company users */
  companyFallback?: string;
  /** Where to go for regular users */
  userFallback?: string;
  /** Custom label (default: "Zurück") */
  label?: string;
  /** Show only icon on mobile */
  iconOnlyMobile?: boolean;
  /** Additional className */
  className?: string;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Smart back button that navigates based on user type
 * - Companies → Company area
 * - Users → User area
 * - Never uses history.back()
 */
export function SmartBackButton({
  companyFallback,
  userFallback,
  label = 'Zurück',
  iconOnlyMobile = true,
  className,
  variant = 'ghost',
  size = 'sm'
}: SmartBackButtonProps) {
  const { goBack, isCompany } = useSmartBack();

  const handleClick = () => {
    goBack({ companyFallback, userFallback });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn('gap-2', className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {iconOnlyMobile ? (
        <span className="hidden sm:inline">{label}</span>
      ) : (
        <span>{label}</span>
      )}
    </Button>
  );
}

/**
 * Context label showing where back will go
 */
export function SmartBackLabel() {
  const { isCompany } = useSmartBack();
  
  return (
    <span className="text-sm text-muted-foreground">
      {isCompany ? 'Zurück zum Dashboard' : 'Zurück zum Feed'}
    </span>
  );
}

