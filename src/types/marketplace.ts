/** Person profile for marketplace cards */
export interface MarketplacePerson {
  id: string;
  vorname?: string | null;
  nachname?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  branche?: string | null;
  stadt?: string | null;
  ort?: string | null;
  status?: string | null;
  schule?: string | null;
  ausbildungsberuf?: string | null;
  ausbildungsbetrieb?: string | null;
  aktueller_beruf?: string | null;
  berufserfahrung?: Array<{
    position?: string;
    titel?: string;
    beruf?: string;
    unternehmen?: string;
    company?: string;
    [key: string]: unknown;
  }>;
  schulbildung?: Array<{
    name?: string;
    schule?: string;
    [key: string]: unknown;
  }>;
  mutualConnections?: Array<{ id: string; avatar_url: string | null; name: string }>;
  mutualCount?: number;
  commonSchools?: string[];
  commonJobs?: Array<{ company: string; position: string }>;
}

/** Company for marketplace cards */
export interface MarketplaceCompany {
  id: string;
  name: string;
  logo_url?: string | null;
  industry?: string | null;
  city?: string | null;
}

/** Post for marketplace feed */
export interface MarketplacePost {
  id: string;
  content: string;
  image_url?: string | null;
  user_id: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
}

/** Job for marketplace cards */
export interface MarketplaceJob {
  id: string;
  title: string;
  company_id: string;
  location?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
}
