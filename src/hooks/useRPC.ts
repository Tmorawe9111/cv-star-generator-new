import { useQuery, type QueryKey, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";

type UseRPCOptions<TData> = Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;

export function useRPC<TData>(
  key: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseRPCOptions<TData>,
): UseQueryResult<TData> {
  return useQuery<TData>({
    queryKey: key,
    queryFn: async () => {
      const data = await queryFn();
      return data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}
