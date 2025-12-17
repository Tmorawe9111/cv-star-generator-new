import { Navigate, useLocation } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyUserRole, type CompanyUserRole } from "@/hooks/useCompanyUserRole";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  allow: CompanyUserRole[]; // accepted roles
  children: React.ReactNode;
  redirectTo?: string;
};

export function CompanyRoleGate({ allow, children, redirectTo = "/unternehmen/feed" }: Props) {
  const location = useLocation();
  const { company, loading: companyLoading } = useCompany();
  const { data: role, isLoading } = useCompanyUserRole(company?.id);

  if (companyLoading || isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (!company?.id) {
    return <Navigate to="/unternehmensregistrierung" replace />;
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}


