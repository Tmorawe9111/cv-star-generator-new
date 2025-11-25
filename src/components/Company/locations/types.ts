export interface CompanyLocation {
  id: string;
  company_id: string;
  name: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string;
  city: string;
  country: string;
  is_primary: boolean;
  is_active: boolean;
  lat: number | null;
  lon: number | null;
  created_at: string;
  updated_at: string;
}

export interface LocationFormData {
  name: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  country: string;
  is_primary: boolean;
}

export const EMPTY_LOCATION_FORM: LocationFormData = {
  name: '',
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
  country: 'Deutschland',
  is_primary: false,
};

