import { useState, useMemo } from "react";
import { useMyApplications, ApplicationStatus } from "@/hooks/useMyApplications";
import { useCandidateWithdrawAllApplications, useCandidateWithdrawApplication } from "@/hooks/useCandidateWithdrawApplications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Eye, XCircle, CheckCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ApplicationsListProps {
  searchQuery: string;
}

export function ApplicationsList({ searchQuery }: ApplicationsListProps) {
  const { data: applications, isLoading, error } = useMyApplications();
  const withdrawOne = useCandidateWithdrawApplication();
  const withdrawAll = useCandidateWithdrawAllApplications();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawSetInvisible, setWithdrawSetInvisible] = useState(true);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkSetInvisible, setBulkSetInvisible] = useState(true);

  const getRejectionReason = (application: any) => {
    return (
      application?.reason_custom ||
      application?.reason_short ||
      null
    );
  };

  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    let filtered = applications;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.job?.title?.toLowerCase().includes(query) ||
          app.job?.company?.name?.toLowerCase().includes(query) ||
          app.job?.city?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [applications, statusFilter, searchQuery]);

  const getStatusConfig = (status: ApplicationStatus) => {
    switch (status) {
      case "new":
        return {
          label: "Neu",
          variant: "secondary" as const,
          icon: Clock,
          color: "text-yellow-600",
          banner: "bg-green-50 border-green-200 text-green-900",
        };
      case "unlocked":
        return {
          label: "Freigeschaltet",
          variant: "default" as const,
          icon: CheckCircle,
          color: "text-blue-600",
          banner: "bg-blue-50 border-blue-200 text-blue-900",
        };
      case "interview":
        return {
          label: "Im Gespräch",
          variant: "default" as const,
          icon: Calendar,
          color: "text-purple-600",
          banner: "bg-purple-50 border-purple-200 text-purple-900",
        };
      case "offer":
        return {
          label: "Angebot",
          variant: "default" as const,
          icon: CheckCircle,
          color: "text-indigo-600",
          banner: "bg-indigo-50 border-indigo-200 text-indigo-900",
        };
      case "hired":
        return {
          label: "Eingestellt",
          variant: "default" as const,
          icon: CheckCircle,
          color: "text-green-600",
          banner: "bg-emerald-50 border-emerald-200 text-emerald-900",
        };
      case "rejected":
        return {
          label: "Abgelehnt",
          variant: "destructive" as const,
          icon: XCircle,
          color: "text-red-600",
          banner: "bg-red-50 border-red-200 text-red-900",
        };
      case "archived":
        return {
          label: "Archiviert",
          variant: "outline" as const,
          icon: AlertCircle,
          color: "text-gray-600",
          banner: "bg-orange-50 border-orange-200 text-orange-900",
        };
    }
  };

  const openDetails = (application: any) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
    setWithdrawReason("");
    setWithdrawSetInvisible(true);
  };

  if (isLoading) {
    return <div className="text-center py-12">Laden...</div>;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="font-semibold mb-1">Bewerbungen konnten nicht geladen werden</div>
        <div className="text-sm text-muted-foreground">
          {(error as any)?.message || "Unbekannter Fehler"}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk action */}
      {applications && applications.some((a) => !["archived", "rejected", "hired"].includes(a.status)) && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 p-4">
          <div className="min-w-0">
            <div className="font-semibold">Neuen Job gefunden?</div>
            <div className="text-sm text-muted-foreground">
              Du kannst alle offenen Bewerbungen absagen und dein Profil direkt unsichtbar schalten.
            </div>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setBulkDialogOpen(true)}>
            Alle Bewerbungen absagen
          </Button>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
          className="rounded-full"
        >
          Alle
        </Button>
        <Button
          variant={statusFilter === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("new")}
          className="rounded-full"
        >
          Neu
        </Button>
        <Button
          variant={statusFilter === "unlocked" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("unlocked")}
          className="rounded-full"
        >
          Freigeschaltet
        </Button>
        <Button
          variant={statusFilter === "interview" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("interview")}
          className="rounded-full"
        >
          Interview
        </Button>
        <Button
          variant={statusFilter === "offer" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("offer")}
          className="rounded-full"
        >
          Angebot
        </Button>
        <Button
          variant={statusFilter === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("rejected")}
          className="rounded-full"
        >
          Abgelehnt
        </Button>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Keine Bewerbungen gefunden</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={application.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetails(application)}
              >
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <Avatar className="h-16 w-16 rounded-lg">
                    <AvatarImage src={application.job?.company?.logo_url} />
                    <AvatarFallback className="rounded-lg">
                      {application.job?.company?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 hover:text-primary">
                          {application.job?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {application.job?.company?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {application.job?.city} • {application.job?.employment_type}
                        </p>

                        {/* Status banner (Apple-style) */}
                        <div className={`mt-3 rounded-xl border p-3 ${statusConfig.banner}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold flex items-center gap-2">
                                <StatusIcon className="h-4 w-4" />
                                {statusConfig.label}
                              </div>
                              <div className="mt-1 text-xs opacity-90">
                                Beworben am{" "}
                                <span className="font-medium">
                                  {format(new Date(application.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                                </span>
                              </div>
                              {application.unlocked_at && (
                                <div className="mt-1 text-xs opacity-90">
                                  Freigeschaltet am{" "}
                                  <span className="font-medium">
                                    {format(new Date(application.unlocked_at), "dd.MM.yyyy HH:mm", { locale: de })}
                                  </span>
                                </div>
                              )}
                              {getRejectionReason(application) && (application.status === "rejected" || application.status === "archived") && (
                                <div className="mt-2 text-xs opacity-90 break-words">
                                  Grund: <span className="font-medium">{getRejectionReason(application)}</span>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-white/60">
                              Status
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/jobs/${application.job_id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Job ansehen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(application);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Bewerbungsstatus
                          </DropdownMenuItem>
                          {!["archived", "rejected", "hired"].includes(application.status) && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(application);
                              }}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Bewerbung absagen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status and Date */}
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    <span className="text-sm text-muted-foreground">
                      Beworben{" "}
                      {formatDistanceToNow(new Date(application.created_at), {
                        locale: de,
                        addSuffix: true,
                      })}
                      {" "}
                      · {format(new Date(application.created_at), "dd.MM.yyyy", { locale: de })}
                    </span>
                    {application.unlocked_at && (
                      <Badge variant="outline" className="text-xs">
                        Freigeschaltet am{" "}
                        {format(new Date(application.unlocked_at), "dd.MM.yyyy", { locale: de })}
                      </Badge>
                    )}
                    {application.status === "rejected" && getRejectionReason(application) && (
                      <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">
                        Grund: {getRejectionReason(application)}
                      </Badge>
                    )}
                      {application.status === "archived" && getRejectionReason(application) && (
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                          Abgesagt: {getRejectionReason(application)}
                        </Badge>
                      )}
                      {application.is_new && (
                        <Badge variant="outline" className="text-xs">
                          Neu
                        </Badge>
                      )}
                    </div>

                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bewerbungsstatus</DialogTitle>
          </DialogHeader>
          {selectedApplication ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="text-sm text-muted-foreground">Stelle</div>
                <div className="font-semibold">{selectedApplication.job?.title}</div>
                <div className="text-sm text-muted-foreground">{selectedApplication.job?.company?.name}</div>
              </div>

              <div className="rounded-xl border p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{getStatusConfig(selectedApplication.status).label}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Beworben am</span>
                  <span className="font-medium">
                    {format(new Date(selectedApplication.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                  </span>
                </div>
                {selectedApplication.unlocked_at && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Freigeschaltet am</span>
                    <span className="font-medium">
                      {format(new Date(selectedApplication.unlocked_at), "dd.MM.yyyy HH:mm", { locale: de })}
                    </span>
                  </div>
                )}
                {selectedApplication.updated_at && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Zuletzt aktualisiert</span>
                    <span className="font-medium">
                      {format(new Date(selectedApplication.updated_at), "dd.MM.yyyy HH:mm", { locale: de })}
                    </span>
                  </div>
                )}
                {getRejectionReason(selectedApplication) && (
                  <div className="rounded-lg bg-muted/30 p-3 mt-2">
                    <div className="text-muted-foreground mb-1">Grund</div>
                    <div className="font-medium break-words">{getRejectionReason(selectedApplication)}</div>
                  </div>
                )}
              </div>

              {!["archived", "rejected", "hired"].includes(selectedApplication.status) && (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="font-semibold">Bewerbung absagen</div>
                  <Textarea
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="Optionaler Grund (z.B. bereits neuen Job gefunden)…"
                  />
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 p-3">
                    <div className="text-sm">
                      <div className="font-medium">Profil unsichtbar schalten</div>
                      <div className="text-muted-foreground text-xs">Damit du nicht weiter angeschrieben wirst.</div>
                    </div>
                    <Switch checked={withdrawSetInvisible} onCheckedChange={setWithdrawSetInvisible} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                      Schließen
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={withdrawOne.isPending}
                      onClick={() => {
                        withdrawOne.mutate(
                          {
                            applicationId: selectedApplication.id,
                            reason: withdrawReason || undefined,
                            setInvisible: withdrawSetInvisible,
                          },
                          { onSuccess: () => setDetailsOpen(false) }
                        );
                      }}
                    >
                      {withdrawOne.isPending ? "Wird gespeichert..." : "Bewerbung absagen"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Bulk withdraw confirm */}
      <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Bewerbungen absagen?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Wir sagen alle offenen Bewerbungen ab und informieren die Unternehmen mit deinem Grund.
              </p>
              <Textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Optionaler Grund (z.B. bereits neuen Job gefunden)…"
              />
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 p-3">
                <div className="text-sm">
                  <div className="font-medium">Profil unsichtbar schalten</div>
                  <div className="text-muted-foreground text-xs">Empfohlen, wenn du nicht mehr suchst.</div>
                </div>
                <Switch checked={bulkSetInvisible} onCheckedChange={setBulkSetInvisible} />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                withdrawAll.mutate({ reason: bulkReason || undefined, setInvisible: bulkSetInvisible });
              }}
            >
              Bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
