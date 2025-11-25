import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  header_image?: string;
  description?: string;
  size_range?: string;
  industry?: string;
  target_groups?: string[];
  selected_plan_id?: string;
  active_plan_id?: string;
  plan_interval?: string;
  next_billing_date?: string;
  founded_year?: number;
  main_location?: string;
  additional_locations?: any;
  website_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  mission_statement?: string;
  employee_count?: number;
  plan_type?: string;
  active_tokens: number;
  seats: number;
  subscription_status: string;
  primary_email?: string;
  phone?: string;
  contact_person?: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
  // Address fields
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  // Matching profile fields
  matching_about?: string;
  matching_benefits_text?: string;
  matching_must_text?: string;
  matching_nice_text?: string;
  location_radius_km?: number;
  location_id?: number;
  // Onboarding fields
  onboarding_completed?: boolean | null;
}

interface CompanyUser {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  invited_at: string;
  accepted_at?: string;
}

export const useCompany = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCompanyData();
    }
  }, [user]);

  // Realtime subscription: keep company data in sync with DB changes
  useEffect(() => {
    if (!company?.id) return;
    const channel = supabase
      .channel(`companies:${company.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'companies', filter: `id=eq.${company.id}` },
        (payload) => {
          const updated = payload.new as any;
          setCompany((prev) => (prev ? { ...prev, ...updated } : updated));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only select needed fields for better performance
      // Note: contact_email and contact_phone may not exist until migration is run
      // TODO: Add contact_email, contact_phone back after running migration 20250120000000_add_contact_fields_to_companies.sql
      const { data: companyUserData, error: companyUserError } = await supabase
        .from('company_users')
        .select(`
          id, user_id, company_id, role, invited_at, accepted_at,
          companies (id, name, logo_url, header_image, industry, main_location, description, website_url, active_plan_id, plan_interval, subscription_id, active_tokens, total_tokens_ever, max_seats, max_locations, max_industries, next_billing_date, country, contact_person, contact_position, contact_email, contact_phone, onboarding_completed, street, house_number, postal_code, city)
        `)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (companyUserError) {
        throw companyUserError;
      }

      if (!companyUserData) {
        // No company found for user
        setCompany(null);
        setCompanyUser(null);
      } else {
        setCompanyUser(companyUserData);
        setCompany(companyUserData.companies);
      }
    } catch (err: any) {
      console.error('Error loading company data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!company) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', company.id);

      if (error) throw error;

      // Update local state immediately
      setCompany({ ...company, ...updates });
      
      // Reload company data from database to ensure consistency
      await loadCompanyData();
      
      return { success: true };
    } catch (err: any) {
      console.error('Error updating company:', err);
      return { success: false, error: err.message };
    }
  };

  const useToken = async (profileId: string) => {
    if (!company) return { success: false, error: 'No company found' };

    try {
      const { data, error } = await supabase.rpc('use_token', { p_profile_id: profileId });
      if (error) throw error;

      const remaining = Array.isArray(data) ? (data[0] as any)?.remaining_tokens : (data as any)?.remaining_tokens;
      if (typeof remaining === 'number') {
        setCompany({ ...company, active_tokens: remaining });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error using token:', err);
      return { success: false, error: err.message };
    }
  };

  const hasUsedToken = async (profileId: string): Promise<boolean> => {
    if (!company) return false;

    try {
      const { data } = await supabase
        .from('tokens_used')
        .select('id')
        .eq('company_id', company.id)
        .eq('profile_id', profileId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  };

  return {
    company,
    companyUser,
    loading,
    error,
    updateCompany,
    useToken,
    hasUsedToken,
    refetch: loadCompanyData,
  };
};