import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLoginCounter } from '@/hooks/useLoginCounter';
import { saveProfileLocation, parseLocation } from '@/lib/location-utils';
import { openVisibilityPrompt } from '@/lib/event-bus';

interface AddressData {
  zip: string;
  city: string;
  street?: string;
  houseNo?: string;
  lat?: number;
  lng?: number;
}

interface EntryGateState {
  showAddressModal: boolean;
  showVisibilityBanner: boolean;
  addressData: AddressData | null;
  loading: boolean;
}

export function useEntryGates() {
  const { profile, user, refetchProfile } = useAuth();
  const { loginCount } = useLoginCounter();
  const [state, setState] = useState<EntryGateState>({
    showAddressModal: false,
    showVisibilityBanner: false,
    addressData: null,
    loading: false
  });

  const checkAddressConfirmation = useCallback(async () => {
    if (!user || !profile) return false;

    // Check if address is already confirmed from the profile
    if (profile.address_confirmed) {
      return false; // Already confirmed
    }

    // Get existing profile data for pre-filling
    const addressData: AddressData = {
      zip: profile?.plz || '',
      city: profile?.ort || '',
      street: profile?.strasse || '',
      houseNo: profile?.hausnummer || ''
    };

    setState(prev => ({
      ...prev,
      showAddressModal: true,
      addressData
    }));

    return true;
  }, [user?.id, profile?.address_confirmed, profile?.plz, profile?.ort, profile?.strasse, profile?.hausnummer]);

  const checkVisibilityPrompt = useCallback(async () => {
    if (!user || !profile) return;

    const isFirstDashboard = !profile.first_dashboard_seen;
    const hasCompletedOnboarding = profile.onboarding_completed || profile.first_profile_saved;
    const isInvisible = profile.visibility_mode === 'invisible';

    // First time prompt (after onboarding completion)
    const qualifiesFirstPrompt = 
      hasCompletedOnboarding && 
      !profile.visibility_prompt_shown;

    // Cyclic prompt (every 3rd login when invisible)
    const needsCyclicPrompt = 
      isInvisible && 
      loginCount > 0 && 
      loginCount % 3 === 0 &&
      profile.visibility_prompt_shown;

    if (qualifiesFirstPrompt || needsCyclicPrompt) {
      // Use the same VisibilityPrompt everywhere (the one used in the profile)
      openVisibilityPrompt();

      // Mark prompt as shown so we don't keep re-opening it on every navigation
      if (!profile.visibility_prompt_shown) {
        try {
          await supabase
            .from('profiles')
            .update({ visibility_prompt_shown: true })
            .eq('id', user.id);
        } catch (e) {
          console.warn('Failed to mark visibility_prompt_shown', e);
        }
      }

      // Hide banner when opening the prompt
      setState(prev => ({ ...prev, showVisibilityBanner: false }));
    } else if (isInvisible && !needsCyclicPrompt) {
      // Allow dismissing the banner (so it doesn't block BottomNav on mobile)
      const dismissKey = `visibility_banner_dismissed_until_${profile.id}`;
      const dismissedUntilRaw = localStorage.getItem(dismissKey);
      const dismissedUntil = dismissedUntilRaw ? parseInt(dismissedUntilRaw, 10) : 0;
      if (dismissedUntil && dismissedUntil > Date.now()) {
        return;
      }
      // Show info banner when invisible but not on 3rd login
      setState(prev => ({
        ...prev,
        showVisibilityBanner: true
      }));
    }

    // Mark first dashboard visit
    if (isFirstDashboard) {
      await supabase
        .from('profiles')
        .update({ first_dashboard_seen: true })
        .eq('id', user.id);
    }
  }, [user?.id, profile?.first_dashboard_seen, profile?.onboarding_completed, profile?.first_profile_saved, profile?.visibility_mode, profile?.visibility_prompt_shown, loginCount]);

  const onNavigate = useCallback(async () => {
    if (!user || !profile) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Auto-confirm address if it exists in profile but not confirmed yet
      if (profile.plz && profile.ort && !profile.address_confirmed) {
        try {
          await supabase
            .from('profiles')
            .update({ address_confirmed: true })
            .eq('id', user.id);
        } catch (error) {
          console.error('Error auto-confirming address:', error);
        }
      }

      // Check visibility prompt directly
      await checkVisibilityPrompt();
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id, profile?.plz, profile?.ort, profile?.address_confirmed, checkVisibilityPrompt]);

  const saveAddress = useCallback(async (addressData: AddressData) => {
    if (!user) throw new Error('No user');

    try {
      // Build location string from zip and city
      const locationString = addressData.zip && addressData.city 
        ? `${addressData.zip} ${addressData.city}`
        : addressData.city || '';

      // Get coordinates and location_id first
      let locationId: number | null = null;
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (addressData.zip && addressData.city) {
        // Get coordinates from postal_codes or geocode
        const { data: coords, error: coordsError } = await supabase.rpc('get_location_coordinates', {
          p_postal_code: addressData.zip.trim(),
          p_city: addressData.city.trim(),
          p_country_code: 'DE'
        });

        if (!coordsError && coords && coords.length > 0 && coords[0].latitude && coords[0].longitude) {
          latitude = coords[0].latitude;
          longitude = coords[0].longitude;

          // Get bundesland from postal_codes if available
          let bundesland = '';
          const { data: postalData } = await supabase
            .from('postal_codes')
            .select('bundesland')
            .eq('plz', addressData.zip.trim())
            .limit(1)
            .maybeSingle();
          bundesland = postalData?.bundesland || '';

          // Upsert location with coordinates
          const { data: locId, error: locationError } = await supabase.rpc('upsert_location_with_coords', {
            p_postal_code: addressData.zip.trim(),
            p_city: addressData.city.trim(),
            p_state: bundesland,
            p_country_code: 'DE',
            p_lat: latitude,
            p_lon: longitude
          });

          if (!locationError && locId) {
            locationId = locId;
          }
        }
      }

      // Update profile with ALL address fields, coordinates, and location_id in one update
      const updateData: any = {
        plz: addressData.zip?.trim() || null,
        ort: addressData.city?.trim() || null,
        strasse: addressData.street?.trim() || null,
        hausnummer: addressData.houseNo?.trim() || null,
        country: 'Deutschland', // Set country to Deutschland when address is confirmed
        address_confirmed: true,
      };

      // Add coordinates and location_id if available
      if (locationId) {
        updateData.location_id = locationId;
      }
      if (latitude !== null && longitude !== null) {
        updateData.latitude = latitude;
        updateData.longitude = longitude;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile address:', error);
        throw error;
      }

      // Refetch profile to ensure UI is updated with latest data
      await refetchProfile();

      setState(prev => ({
        ...prev,
        showAddressModal: false,
        addressData: null
      }));

      // After address confirmation, check visibility
      await checkVisibilityPrompt();
    } catch (error) {
      console.error('Failed to save address:', error);
      throw error;
    }
  }, [user, refetchProfile, checkVisibilityPrompt]);

  const closeVisibilityBanner = useCallback(() => {
    // Dismiss for 24h
    if (profile?.id) {
      const dismissKey = `visibility_banner_dismissed_until_${profile.id}`;
      localStorage.setItem(dismissKey, String(Date.now() + 24 * 60 * 60 * 1000));
    }
    setState(prev => ({
      ...prev,
      showVisibilityBanner: false
    }));
  }, [profile?.id]);

  return {
    ...state,
    onNavigate,
    saveAddress,
    closeVisibilityBanner,
    closeAddressModal: () => setState(prev => ({ ...prev, showAddressModal: false }))
  };
}