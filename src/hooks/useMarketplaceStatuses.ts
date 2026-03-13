import { useState, useEffect } from "react";
import { useConnections } from "@/hooks/useConnections";
import type { ConnectionState } from "@/hooks/useConnections";
import type { MarketplacePerson } from "@/types/marketplace";

export function useMarketplaceStatuses(
  people: MarketplacePerson[],
  userId: string | undefined
): [Record<string, ConnectionState>, React.Dispatch<React.SetStateAction<Record<string, ConnectionState>>>] {
  const [statusMap, setStatusMap] = useState<Record<string, ConnectionState>>(
    {}
  );
  const { getStatuses } = useConnections();

  useEffect(() => {
    if (!userId || people.length === 0) return;
    const ids = people.map((p) => p.id).filter((id) => id !== userId);
    if (ids.length === 0) return;
    getStatuses(ids)
      .then(setStatusMap)
      .catch((e) => console.error(e));
  }, [userId, people, getStatuses]);

  return [statusMap, setStatusMap];
}
