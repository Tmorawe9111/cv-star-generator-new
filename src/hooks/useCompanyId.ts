import { useCompany } from "@/hooks/useCompany";

export function useCompanyId() {
  const { company } = useCompany();
  return company?.id ?? null;
}
