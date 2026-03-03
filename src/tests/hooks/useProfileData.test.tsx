import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePublicProfile } from "@/hooks/usePublicProfile";

const mockMaybeSingle = vi.fn();
const chain: Record<string, unknown> = {};
chain.select = vi.fn().mockReturnValue(chain);
chain.eq = vi.fn().mockReturnValue(chain);
chain.maybeSingle = mockMaybeSingle;
const mockFrom = vi.fn(() => chain);

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

const mockProfile = {
  id: "user-123",
  vorname: "Max",
  nachname: "Mustermann",
  avatar_url: "https://example.com/avatar.png",
  full_name: "Max Mustermann",
  company_id: null,
  company_name: null,
  company_logo: null,
  employment_status: "fachkraft",
};

describe("useProfileData (usePublicProfile)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({
      data: mockProfile,
      error: null,
    });
  });

  it("fetches profile when userId is provided", async () => {
    const { result } = renderHook(() => usePublicProfile("user-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      id: "user-123",
      vorname: "Max",
      nachname: "Mustermann",
      avatar_url: "https://example.com/avatar.png",
      full_name: "Max Mustermann",
      company_id: null,
      company_name: null,
      company_logo: null,
      employment_status: "fachkraft",
    });
  });

  it("does not fetch when userId is undefined", () => {
    const { result } = renderHook(() => usePublicProfile(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("handles fetch error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "Profile not found" },
    });

    const { result } = renderHook(() => usePublicProfile("user-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
