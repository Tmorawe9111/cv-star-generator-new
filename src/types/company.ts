export interface CompanyBase {
  id: string;
  name: string;
  logo_url?: string | null;
  industry?: string | null;
  main_location?: string | null;
  employee_count?: number | null;
}

export interface CompanyLite extends CompanyBase {
  // Minimal company data for lists and cards
}

export interface CompanyProfile extends CompanyBase {
  description?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  header_image?: string | null;
  founded_year?: number | null;
  size_range?: string | null;
  country?: string | null;
  location_id?: number | null;
  location_radius_km?: number | null;
  matching_about?: string | null;
  matching_benefits_text?: string | null;
  matching_must_text?: string | null;
  matching_nice_text?: string | null;
  mission_statement?: string | null;
  additional_locations?: unknown;
  plan_type?: string | null;
  subscription_status?: string | null;
  account_status?: string | null;
  active_tokens?: number | null;
  seats?: number | null;
  primary_email?: string | null;
  phone?: string | null;
  contact_person?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SuggestedCompany extends CompanyLite {
  reasons: string[];
  city?: string | null;
}

export interface CompaniesViewData {
  pending: CompanyLite[];
  following: CompanyLite[];
  suggested: SuggestedCompany[];
}

export interface CompaniesViewState extends CompaniesViewData {
  loading: boolean;
  error?: string | null;
}