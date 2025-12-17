import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Calendar, CheckCircle2, XCircle, ExternalLink, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type CalendarProvider = 'google' | 'outlook' | 'teams' | 'calendly' | 'zoom';

interface CalendarIntegration {
  id: string;
  provider: CalendarProvider;
  is_active: boolean;
  calendar_id: string | null;
  oauth_client_id: string | null;
  oauth_client_secret: string | null;
  oauth_redirect_uri: string | null;
  created_at: string;
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const PROVIDER_INFO: Record<CalendarProvider, { name: string; description: string; color: string }> = {
  google: {
    name: 'Google Calendar',
    description: 'Automatische Termin-Erstellung und Google Meet Links',
    color: 'bg-blue-500'
  },
  outlook: {
    name: 'Microsoft Outlook',
    description: 'Outlook Calendar Synchronisation',
    color: 'bg-blue-600'
  },
  teams: {
    name: 'Microsoft Teams',
    description: 'Teams Meeting Links automatisch generieren',
    color: 'bg-purple-600'
  },
  calendly: {
    name: 'Calendly',
    description: 'Automatisches Scheduling mit Verfügbarkeitsprüfung',
    color: 'bg-orange-500'
  },
  zoom: {
    name: 'Zoom',
    description: 'Zoom Meeting Links automatisch erstellen',
    color: 'bg-blue-500'
  }
};

export function CalendarIntegrationSettings() {
  const { company } = useCompany();
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<CalendarProvider | null>(null);
  const [configuring, setConfiguring] = useState<CalendarProvider | null>(null);
  const [oauthConfig, setOauthConfig] = useState<Partial<Record<CalendarProvider, OAuthConfig>>>({});

  useEffect(() => {
    if (company?.id) {
      loadIntegrations();
    }
    
    // Check for OAuth callback success/error
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success) {
      toast({
        title: 'Erfolgreich',
        description: 'Kalender-Integration wurde erfolgreich verbunden.',
      });
      loadIntegrations();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    if (error) {
      toast({
        title: 'Fehler',
        description: error === 'oauth_cancelled' 
          ? 'OAuth-Vorgang wurde abgebrochen.'
          : 'Kalender-Integration konnte nicht verbunden werden.',
        variant: 'destructive'
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [company?.id]);

  const loadIntegrations = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_calendar_integrations')
        .select('id, provider, is_active, calendar_id, oauth_client_id, oauth_client_secret, oauth_redirect_uri, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error: any) {
      console.error('Error loading calendar integrations:', error);
      toast({
        title: 'Fehler',
        description: 'Kalender-Integrationen konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureOAuth = (provider: CalendarProvider) => {
    const integration = integrations.find(i => i.provider === provider);
    setOauthConfig({
      ...oauthConfig,
      [provider]: {
        clientId: integration?.oauth_client_id || '',
        clientSecret: integration?.oauth_client_secret || '',
        redirectUri: integration?.oauth_redirect_uri || getDefaultRedirectUri(provider),
      }
    });
    setConfiguring(provider);
  };

  const getDefaultRedirectUri = (provider: CalendarProvider): string => {
    // Use Supabase Edge Function callback URL
    const supabaseUrl = supabase.supabaseUrl;
    if (provider === 'google') {
      return `${supabaseUrl}/functions/v1/google-calendar-oauth/callback`;
    } else if (provider === 'outlook' || provider === 'teams') {
      return `${supabaseUrl}/functions/v1/microsoft-calendar-oauth/callback`;
    }
    return `${supabaseUrl}/functions/v1/${provider}-calendar-oauth/callback`;
  };

  const handleSaveOAuthConfig = async (provider: CalendarProvider) => {
    if (!company?.id) return;

    const config = oauthConfig[provider];
    if (!config || !config.clientId || !config.clientSecret || !config.redirectUri) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Felder aus.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Save OAuth credentials to integration (create or update)
      const integration = integrations.find(i => i.provider === provider);
      
      if (integration) {
        const { error } = await supabase
          .from('company_calendar_integrations')
          .update({
            oauth_client_id: config.clientId,
            oauth_client_secret: config.clientSecret,
            oauth_redirect_uri: config.redirectUri,
          })
          .eq('id', integration.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_calendar_integrations')
          .insert({
            company_id: company.id,
            provider,
            oauth_client_id: config.clientId,
            oauth_client_secret: config.clientSecret,
            oauth_redirect_uri: config.redirectUri,
            is_active: false, // Not active until OAuth flow is completed
          });

        if (error) throw error;
      }

      toast({
        title: 'Erfolgreich',
        description: 'OAuth-Credentials wurden gespeichert.',
      });

      setConfiguring(null);
      loadIntegrations();
    } catch (error: any) {
      console.error('Error saving OAuth config:', error);
      toast({
        title: 'Fehler',
        description: 'OAuth-Credentials konnten nicht gespeichert werden.',
        variant: 'destructive'
      });
    }
  };

  const handleConnect = async (provider: CalendarProvider) => {
    if (!company?.id) return;

    // Check if OAuth credentials are configured
    const integration = integrations.find(i => i.provider === provider);
    if (!integration?.oauth_client_id || !integration?.oauth_client_secret) {
      toast({
        title: 'OAuth-Credentials erforderlich',
        description: 'Bitte konfigurieren Sie zuerst Ihre OAuth-Credentials.',
        variant: 'destructive'
      });
      handleConfigureOAuth(provider);
      return;
    }

    setConnecting(provider);
    try {
      // Handle different providers
      if (provider === 'google') {
        const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
          body: {
            companyId: company.id,
            clientId: integration.oauth_client_id!,
            clientSecret: integration.oauth_client_secret!,
            redirectUri: integration.oauth_redirect_uri || getDefaultRedirectUri(provider),
          },
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) throw error;
        if (data?.authUrl) {
          window.location.href = data.authUrl;
        }
      } else if (provider === 'outlook' || provider === 'teams') {
        const { data, error } = await supabase.functions.invoke('microsoft-calendar-oauth', {
          body: {
            provider,
            companyId: company.id,
            clientId: integration.oauth_client_id!,
            clientSecret: integration.oauth_client_secret!,
            redirectUri: integration.oauth_redirect_uri || getDefaultRedirectUri(provider),
          },
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) throw error;
        if (data?.authUrl) {
          window.location.href = data.authUrl;
        }
      } else if (provider === 'calendly' || provider === 'zoom') {
        // Calendly and Zoom require different setup (API keys, webhooks, etc.)
        toast({
          title: 'In Entwicklung',
          description: `Die ${PROVIDER_INFO[provider].name} Integration wird in einer späteren Phase implementiert.`,
        });
        setConnecting(null);
      }
    } catch (error: any) {
      console.error('Error connecting calendar:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Verbindung konnte nicht hergestellt werden.',
        variant: 'destructive'
      });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('company_calendar_integrations')
        .update({ is_active: false })
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: 'Erfolgreich',
        description: 'Kalender-Integration wurde deaktiviert.',
      });

      loadIntegrations();
    } catch (error: any) {
      console.error('Error disconnecting calendar:', error);
      toast({
        title: 'Fehler',
        description: 'Integration konnte nicht deaktiviert werden.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableProviders: CalendarProvider[] = ['google', 'outlook', 'teams', 'calendly', 'zoom'];
  const connectedProviders = integrations.filter(i => i.is_active).map(i => i.provider);

  // Helper to get integration (active or inactive)
  const getIntegration = (provider: CalendarProvider) => {
    return integrations.find(i => i.provider === provider);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Kalender-Integrationen</h2>
        <p className="text-muted-foreground">
          Verbinden Sie Ihren Kalender für automatische Termin-Erstellung und Video-Links.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {availableProviders.map((provider) => {
          const info = PROVIDER_INFO[provider];
          const isConnected = connectedProviders.includes(provider);
          const integration = getIntegration(provider);

          return (
            <Card key={provider} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${info.color} flex items-center justify-center`}>
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {info.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isConnected && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verbunden
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Diese Integration ist aktiv und wird für Interview-Planungen verwendet.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => integration && handleConfigureOAuth(provider)}
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        OAuth bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => integration && handleDisconnect(integration.id)}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Trennen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Verbinden Sie {info.name} für automatische Termin-Erstellung.
                    </p>
                    <div className="space-y-2">
                      {integration?.oauth_client_id ? (
                        <Button
                          onClick={() => handleConnect(provider)}
                          disabled={connecting === provider}
                          className="w-full"
                        >
                          {connecting === provider ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Wird verbunden...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Verbinden
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleConfigureOAuth(provider)}
                          className="w-full"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          OAuth konfigurieren
                        </Button>
                      )}
                      {integration?.oauth_client_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConfigureOAuth(provider)}
                          className="w-full text-xs"
                        >
                          OAuth-Credentials bearbeiten
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Jedes Unternehmen muss seine eigenen OAuth-Credentials konfigurieren. 
            Diese erhalten Sie von Google Cloud Console bzw. Azure Portal. Nach der Konfiguration können 
            Termine automatisch in Ihrem Kalender erstellt und Video-Links generiert werden.
          </p>
        </CardContent>
      </Card>

      {/* OAuth Configuration Dialog */}
      <Dialog open={configuring !== null} onOpenChange={(open) => !open && setConfiguring(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              OAuth konfigurieren: {configuring && PROVIDER_INFO[configuring].name}
            </DialogTitle>
            <DialogDescription>
              Geben Sie Ihre OAuth-Credentials ein, die Sie von {configuring === 'google' ? 'Google Cloud Console' : 'Azure Portal'} erhalten haben.
            </DialogDescription>
          </DialogHeader>
          
          {configuring && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  value={oauthConfig[configuring]?.clientId || ''}
                  onChange={(e) => setOauthConfig({
                    ...oauthConfig,
                    [configuring]: {
                      ...oauthConfig[configuring],
                      clientId: e.target.value,
                    } as OAuthConfig
                  })}
                  placeholder="Ihre OAuth Client ID"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret *</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={oauthConfig[configuring]?.clientSecret || ''}
                  onChange={(e) => setOauthConfig({
                    ...oauthConfig,
                    [configuring]: {
                      ...oauthConfig[configuring],
                      clientSecret: e.target.value,
                    } as OAuthConfig
                  })}
                  placeholder="Ihr OAuth Client Secret"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="redirect_uri">Redirect URI *</Label>
                <Input
                  id="redirect_uri"
                  value={oauthConfig[configuring]?.redirectUri || getDefaultRedirectUri(configuring)}
                  onChange={(e) => setOauthConfig({
                    ...oauthConfig,
                    [configuring]: {
                      ...oauthConfig[configuring],
                      redirectUri: e.target.value,
                    } as OAuthConfig
                  })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Diese URI muss auch in {configuring === 'google' ? 'Google Cloud Console' : 'Azure Portal'} als Redirect URI eingetragen sein.
                </p>
              </div>

              {configuring === 'google' && (
                <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900">
                  <strong>Google Cloud Console:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Gehen Sie zu <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">console.cloud.google.com</a></li>
                    <li>Erstellen Sie ein Projekt oder wählen Sie ein bestehendes</li>
                    <li>Aktivieren Sie "Google Calendar API"</li>
                    <li>Erstellen Sie OAuth 2.0 Credentials</li>
                    <li>Fügen Sie die Redirect URI hinzu</li>
                  </ol>
                </div>
              )}

              {(configuring === 'outlook' || configuring === 'teams') && (
                <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900">
                  <strong>Azure Portal:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Gehen Sie zu <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer" className="underline">portal.azure.com</a></li>
                    <li>Erstellen Sie eine App Registration</li>
                    <li>Fügen Sie die Redirect URI hinzu</li>
                    <li>Erteilen Sie Permissions: Calendars.ReadWrite, OnlineMeetings.ReadWrite</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiguring(null)}>
              Abbrechen
            </Button>
            <Button onClick={() => configuring && handleSaveOAuthConfig(configuring)}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

