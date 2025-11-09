import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type RealtimeConfig = {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  table: string;
  filter?: string;
};

export function useRealtime(
  channelName: string,
  configs: RealtimeConfig[],
  handler: () => void,
  deps: unknown[] = [],
) {
  useEffect(() => {
    if (!configs.length) return;

    const channel = supabase.channel(channelName);

    configs.forEach(config => {
      channel.on(
        "postgres_changes",
        {
          event: config.event ?? "*",
          schema: config.schema ?? "public",
          table: config.table,
          filter: config.filter,
        },
        handler,
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, handler, JSON.stringify(configs), ...deps]);
}
