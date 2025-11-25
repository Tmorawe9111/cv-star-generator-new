import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface Step0WelcomeProps {
  onNext: () => void;
}

export function Step0Welcome({ onNext }: Step0WelcomeProps) {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (user?.user_metadata?.first_name) {
        setFirstName(user.user_metadata.first_name);
      }

      if (companyId) {
        const { data } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();
        
        if (data?.name) {
          setCompanyName(data.name);
        }
      }
    };

    loadData();
  }, [user, companyId]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-10 px-6">
      {/* Logo & Welcome */}
      <div className="flex flex-col items-center space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <img 
            src="/assets/Logo_visiblle-2.svg" 
            alt="BeVisiblle" 
            className="h-14 w-14 object-contain" 
          />
          <span className="text-3xl font-medium tracking-tight text-gray-900">
            BeVisib<span className="text-blue-600">ll</span>e
          </span>
        </div>
        
        <h1 className="text-6xl font-light text-gray-900 tracking-tight text-center">
          Willkommen bei BeVisiblle
        </h1>
        
        {firstName && (
          <p className="text-3xl font-light text-gray-600 mt-3">
            Hallo {firstName}!
          </p>
        )}
        
        {companyName && (
          <p className="text-xl text-gray-500 mt-6 max-w-2xl text-center leading-relaxed">
            Lassen Sie uns Ihr Profil für <span className="font-normal text-gray-700">{companyName}</span> einrichten
          </p>
        )}
        
        <p className="text-lg text-gray-500 mt-8 max-w-xl text-center leading-relaxed">
          In wenigen Schritten richten wir Ihr Unternehmensprofil ein und bringen Sie mit den besten Talenten zusammen.
        </p>
      </div>

      {/* CTA Button */}
      <div className="pt-6">
        <Button
          onClick={onNext}
          size="lg"
          className="px-14 py-7 text-lg font-normal bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ease-out active:scale-[0.98]"
        >
          Setup starten
        </Button>
      </div>
    </div>
  );
}

