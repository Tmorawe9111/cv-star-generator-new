import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminSession } from "@/hooks/useAdminSession";
import { Navigate } from "react-router-dom";
import { useUsers } from "@/hooks/useUsers";
import { UserDrawer } from "@/components/admin/UserDrawer";
import { Badge } from "@/components/ui/badge";
import { User, Users as UsersIcon, CheckCircle, XCircle, Calendar, Eye, EyeOff } from "lucide-react";

export default function UsersPage() {
  const { role } = useAdminSession();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "published" | "incomplete">("all");
  const [region, setRegion] = React.useState("");
  const [dateStart, setDateStart] = React.useState<string | undefined>(undefined);
  const [dateEnd, setDateEnd] = React.useState<string | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<any | null>(null);

  const { data, isLoading, error } = useUsers({ search, status, region, dateStart, dateEnd, page, pageSize: 20 });

  if (role === "CompanyAdmin") {
    return <Navigate to="/admin" replace />;
  }

  const canEdit = role === "SuperAdmin" || role === "SupportAgent";
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  // Calculate stats
  const published = data?.users.filter(u => u.profile_published).length ?? 0;
  const complete = data?.users.filter(u => u.profile_complete).length ?? 0;

  const getUserTypeBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Unbekannt</Badge>;
    
    const types: Record<string, { label: string; className: string }> = {
      'schueler': { label: 'Schüler', className: 'bg-blue-500 hover:bg-blue-600' },
      'azubi': { label: 'Azubi', className: 'bg-green-500 hover:bg-green-600' },
      'ausgelernt': { label: 'Ausgelernt', className: 'bg-purple-500 hover:bg-purple-600' }
    };
    
    const type = types[status] || { label: status, className: '' };
    return <Badge className={type.className}>{type.label}</Badge>;
  };

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-4xl font-semibold tracking-tight">Benutzer</h1>
        <p className="text-muted-foreground text-base">Übersicht aller registrierten Benutzer mit vollständigen Profilen</p>
      </div>

      {/* Stats Cards - Apple Style */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Gesamt Benutzer</CardDescription>
              <UsersIcon className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight">{total.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Alle registrierten Benutzer</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-green-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Veröffentlicht</CardDescription>
              <Eye className="h-5 w-5 text-green-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-green-600 dark:text-green-500">
              {published.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${((published / total) * 100).toFixed(0)}%` : '0%'} sichtbar
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Vollständig</CardDescription>
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-blue-600 dark:text-blue-500">
              {complete.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${((complete / total) * 100).toFixed(0)}%` : '0%'} komplett
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-orange-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Unvollständig</CardDescription>
              <XCircle className="h-5 w-5 text-orange-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-orange-600 dark:text-orange-500">
              {(total - complete).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Benötigen Updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table - Apple Style */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold tracking-tight">Alle Benutzer</CardTitle>
          <CardDescription className="text-base">Detaillierte Übersicht mit Profil-Status und Informationen</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters - Apple Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <input 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              placeholder="Suche nach Email..." 
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
            />
            <select 
              value={status} 
              onChange={(e) => { setStatus(e.target.value as any); setPage(1); }} 
              className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">Alle Status</option>
              <option value="published">Veröffentlicht</option>
              <option value="incomplete">Unvollständig</option>
            </select>
            <input 
              type="text" 
              value={region} 
              onChange={(e) => { setRegion(e.target.value); setPage(1); }} 
              placeholder="Bundesland" 
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
            />
            <div className="flex gap-2">
              <input 
                type="date" 
                value={dateStart ?? ""} 
                onChange={(e) => { setDateStart(e.target.value || undefined); setPage(1); }} 
                className="h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
              />
              <input 
                type="date" 
                value={dateEnd ?? ""} 
                onChange={(e) => { setDateEnd(e.target.value || undefined); setPage(1); }} 
                className="h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
              />
            </div>
          </div>

          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Art</TableHead>
                  <TableHead>Branche</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Letzter Login</TableHead>
                  <TableHead>Sichtbar</TableHead>
                  <TableHead>Vollständig</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead>Aktionen</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-muted-foreground">Lade Benutzer...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                
                {!isLoading && error && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Keine Berechtigung oder Fehler beim Laden.
                    </TableCell>
                  </TableRow>
                )}
                
                {!isLoading && !error && data && data.users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Keine Benutzer gefunden.
                    </TableCell>
                  </TableRow>
                )}
                
                {!isLoading && !error && data && data.users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <TableCell className="font-medium text-sm">{u.email ?? "—"}</TableCell>
                    <TableCell>{getUserTypeBadge(u.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.branche || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.created_at ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{new Date(u.created_at).toLocaleDateString('de-DE')}</span>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {u.last_sign_in_at ? (
                        <div className="text-sm text-muted-foreground">
                          {new Date(u.last_sign_in_at).toLocaleDateString('de-DE')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.profile_published ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">Ja</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <EyeOff className="h-4 w-4" />
                          <span className="text-sm">Nein</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.profile_complete ? (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Ja</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Nein</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.profile_published && u.profile_complete ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Aktiv</Badge>
                      ) : u.profile_complete ? (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Versteckt</Badge>
                      ) : (
                        <Badge variant="secondary">Setup</Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-2">
                          <button 
                            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-primary/10" 
                            onClick={() => setSelected(u)}
                          >
                            Details
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">
              Seite {page} von {totalPages} • Gesamt: {total} Benutzer
            </span>
            <div className="flex gap-2">
              <button 
                className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm hover:shadow" 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Zurück
              </button>
              <button 
                className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm hover:shadow" 
                disabled={page >= totalPages} 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Weiter
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserDrawer user={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}
