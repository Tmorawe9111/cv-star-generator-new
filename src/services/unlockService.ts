import { supabase } from "@/integrations/supabase/client";

export interface UnlockState {
  basic_unlocked: boolean;
  contact_unlocked: boolean;
  unlocked_at?: string;
}

export interface UnlockOptions {
  profileId: string;
  jobPostId?: string;
}

export type UnlockResult = 
  | { success: true; data: any }
  | { success: false; error: string };

const BASIC_UNLOCK_COST = 1;
const CONTACT_UNLOCK_COST = 2;

export class UnlockService {
  /**
   * Holt die Company ID des aktuellen Users
   */
  private async getCurrentCompanyId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        console.error('Error getting company ID:', error);
        return null;
      }

      return data.company_id;
    } catch (error) {
      console.error('Unexpected error getting company ID:', error);
      return null;
    }
  }

  /**
   * Prüft ob ein Profil bereits freigeschaltet ist
   */
  async checkUnlockState(profileId: string): Promise<UnlockState | null> {
    try {
      const companyId = await this.getCurrentCompanyId();
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('company_candidates')
        .select('unlocked_at, stage')
        .eq('candidate_id', profileId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) {
        console.error('Error checking unlock state:', error);
        return null;
      }

      if (!data) {
        return {
          basic_unlocked: false,
          contact_unlocked: false
        };
      }

      // Wenn unlocked_at gesetzt ist, sind Basisdaten freigeschaltet
      const basicUnlocked = data.unlocked_at !== null;
      
      // Kontaktdaten sind freigeschaltet, wenn Stage nicht "new" ist
      const contactUnlocked = basicUnlocked && data.stage !== 'new';

      return {
        basic_unlocked: basicUnlocked,
        contact_unlocked: contactUnlocked,
        unlocked_at: data.unlocked_at
      };
    } catch (error) {
      console.error('Unexpected error in checkUnlockState:', error);
      return null;
    }
  }

  /**
   * Schaltet Basis-Profildaten frei (kostet Tokens) - nutzt RPC use_company_token
   */
  async unlockBasic(options: UnlockOptions): Promise<UnlockResult> {
    try {
      const companyId = await this.getCurrentCompanyId();
      if (!companyId) {
        return {
          success: false,
          error: 'Keine Company-Zuordnung gefunden'
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'Nicht angemeldet'
        };
      }

      // Prüfe Unlock-Status
      const unlockState = await this.checkUnlockState(options.profileId);
      if (unlockState?.basic_unlocked) {
        return {
          success: false,
          error: 'Profil bereits freigeschaltet'
        };
      }

      // RPC: Token abziehen und Profil freischalten
      const { data, error } = await supabase.rpc('use_company_token', {
        p_company_id: companyId,
        p_profile_id: options.profileId,
        p_token_cost: 2, // Basic unlock costs 2 tokens
        p_reason: 'basic_unlock'
      });

      if (error) {
        console.error('RPC error:', error);
        return {
          success: false,
          error: error.message || 'Fehler beim Freischalten'
        };
      }

      // Erstelle oder update company_candidates Eintrag mit job_posting_id
      const linkedJobIds = options.jobPostId ? [options.jobPostId] : [];
      
      const { error: candidateError } = await supabase
        .from('company_candidates')
        .upsert({
          company_id: companyId,
          candidate_id: options.profileId,
          unlocked_at: new Date().toISOString(),
          unlocked_by_user_id: user.id,
          source_need_id: options.jobPostId || null,
          linked_job_ids: linkedJobIds,
          stage: 'new'
        }, {
          onConflict: 'company_id,candidate_id'
        });

      if (candidateError) {
        console.error('Candidate error:', candidateError);
        return {
          success: false,
          error: 'Fehler beim Aktualisieren der Pipeline'
        };
      }

      // Log Activity
      await this.logProfileView(options.profileId, companyId);

      return {
        success: true,
        data: { unlocked: true, cost: BASIC_UNLOCK_COST }
      };
    } catch (error: any) {
      console.error('Unexpected error in unlockBasic:', error);
      return {
        success: false,
        error: error.message || 'Unerwarteter Fehler'
      };
    }
  }

  /**
   * Schaltet Kontaktdaten frei (kostet Tokens)
   */
  async unlockContact(options: UnlockOptions): Promise<UnlockResult> {
    try {
      const companyId = await this.getCurrentCompanyId();
      if (!companyId) {
        return {
          success: false,
          error: 'Keine Company-Zuordnung gefunden'
        };
      }

      // Prüfe ob Basic bereits freigeschaltet ist
      const unlockState = await this.checkUnlockState(options.profileId);
      if (!unlockState?.basic_unlocked) {
        return {
          success: false,
          error: 'Bitte zuerst Basic-Level freischalten'
        };
      }

      if (unlockState.contact_unlocked) {
        return {
          success: false,
          error: 'Kontaktdaten bereits freigeschaltet'
        };
      }

      // Prüfe Token-Balance
      const { data: wallet, error: walletError } = await supabase
        .from('company_token_wallets')
        .select('balance')
        .eq('company_id', companyId)
        .single();

      if (walletError || !wallet) {
        return {
          success: false,
          error: 'Token-Wallet nicht gefunden'
        };
      }

      if (wallet.balance < CONTACT_UNLOCK_COST) {
        return {
          success: false,
          error: 'Nicht genügend Tokens'
        };
      }

      // Transaktion: Token abziehen und Stage ändern
      const { error: updateError } = await supabase
        .from('company_token_wallets')
        .update({ balance: wallet.balance - CONTACT_UNLOCK_COST })
        .eq('company_id', companyId);

      if (updateError) {
        return {
          success: false,
          error: 'Fehler beim Abziehen der Tokens'
        };
      }

      // Update Stage zu "contacted"
      const { error: candidateError } = await supabase
        .from('company_candidates')
        .update({ stage: 'contacted' })
        .eq('company_id', companyId)
        .eq('candidate_id', options.profileId);

      if (candidateError) {
        // Rollback
        await supabase
          .from('company_token_wallets')
          .update({ balance: wallet.balance })
          .eq('company_id', companyId);

        return {
          success: false,
          error: 'Fehler beim Freischalten'
        };
      }

      return {
        success: true,
        data: { unlocked: true, cost: CONTACT_UNLOCK_COST }
      };
    } catch (error: any) {
      console.error('Unexpected error in unlockContact:', error);
      return {
        success: false,
        error: error.message || 'Unerwarteter Fehler'
      };
    }
  }

  /**
   * Loggt einen Profilaufruf
   */
  async logProfileView(profileId: string, companyId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('company_activity').insert({
        company_id: companyId,
        actor_user_id: user.id,
        type: 'profile_view',
        payload: { candidate_id: profileId }
      });
    } catch (error) {
      console.error('Error logging profile view:', error);
    }
  }

  /**
   * Loggt einen Anhang-Download
   */
  async logAttachmentDownload(profileId: string, fileId: string): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();
      if (!companyId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('company_activity').insert({
        company_id: companyId,
        actor_user_id: user.id,
        type: 'attachment_download',
        payload: { 
          candidate_id: profileId,
          file_id: fileId
        }
      });
    } catch (error) {
      console.error('Error logging attachment download:', error);
    }
  }

  /**
   * Holt maskiertes Profil basierend auf Unlock-Level
   */
  async getMaskedProfile(profileId: string): Promise<any> {
    try {
      const unlockState = await this.checkUnlockState(profileId);
      
      // ✅ Source of truth: profiles (not candidates snapshot fields)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error || !profile) {
        throw error || new Error('Profil nicht gefunden');
      }

      // Basis-Daten maskieren wenn nicht freigeschaltet
      if (!unlockState?.basic_unlocked) {
        (profile as any).vorname = (profile as any).vorname ? String((profile as any).vorname).charAt(0) + '***' : null;
        (profile as any).nachname = (profile as any).nachname ? String((profile as any).nachname).charAt(0) + '***' : null;
        (profile as any).email = null;
        (profile as any).telefon = null;
        (profile as any).cv_url = null;
      }

      // Kontaktdaten maskieren wenn nicht freigeschaltet
      if (!unlockState?.contact_unlocked) {
        (profile as any).email = (profile as any).email ? '***@***' : null;
        (profile as any).telefon = (profile as any).telefon ? '+49 ***' : null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting masked profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const unlockService = new UnlockService();

// Export helper functions for backward compatibility
export const checkUnlockState = (profileId: string) => 
  unlockService.checkUnlockState(profileId);

export const unlockBasic = (options: UnlockOptions) => 
  unlockService.unlockBasic(options);

export const unlockContact = (options: UnlockOptions) => 
  unlockService.unlockContact(options);
