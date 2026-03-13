import React, { useRef, useCallback, useEffect, useState } from "react";
import { Sparkles, WifiOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyApplications } from "@/hooks/useMyApplications";
import { useMarketplaceData, useOnlineStatus } from "@/hooks/useMarketplaceData";
import { useMarketplaceStatuses } from "@/hooks/useMarketplaceStatuses";
import { useMarketplaceActions, triggerHaptic } from "@/hooks/useMarketplaceActions";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MarketplaceContent, MarketplaceModals } from "@/components/marketplace";
import type { MarketplacePerson, MarketplaceCompany, MarketplaceJob, MarketplacePost } from "@/types/marketplace";

export default function MarketplaceMobile() {
  const { user } = useAuth();
  const { data: myApplications } = useMyApplications();
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const [applyJob, setApplyJob] = useState<MarketplaceJob | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [commentPost, setCommentPost] = useState<MarketplacePost | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const postsScrollRef = useRef<HTMLDivElement>(null);
  const [postIndex, setPostIndex] = useState(0);
  const startY = useRef(0);
  const startX = useRef(0);

  const isOnline = useOnlineStatus();
  const data = useMarketplaceData({ userId: user?.id, sessionId });
  const [statusMap, setStatusMap] = useMarketplaceStatuses(data.people, user?.id);
  const actions = useMarketplaceActions({
    setStatusMap,
    invalidatePosts: data.invalidatePosts,
  });

  const applicationsByJobId = (myApplications ?? []).reduce(
    (acc: Record<string, { created_at?: string; unlocked_at?: string; status?: string }>, app) => {
      acc[app.job_id] = app;
      return acc;
    },
    {}
  );

  const connectedOrPendingIds = new Set(
    Object.entries(statusMap)
      .filter(([, s]) => s === "accepted" || s === "pending")
      .map(([id]) => id)
  );
  const allPeople = data.people.filter(
    (p) => p.id !== user?.id && !connectedOrPendingIds.has(p.id)
  );
  const forYouPeople = allPeople.slice(0, 3);
  const forYouCompanies = data.companies.slice(0, 3);
  const forYouItems: { item: MarketplacePerson | MarketplaceCompany; type: "person" | "company" }[] = [];
  let pIdx = 0,
    cIdx = 0;
  while (forYouItems.length < 6 && (pIdx < forYouPeople.length || cIdx < forYouCompanies.length)) {
    if (pIdx < forYouPeople.length) forYouItems.push({ item: forYouPeople[pIdx++], type: "person" });
    if (forYouItems.length < 6 && cIdx < forYouCompanies.length) forYouItems.push({ item: forYouCompanies[cIdx++], type: "company" });
  }
  const peopleSection = allPeople.slice(3);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as unknown as HTMLElement;
    if (target?.closest?.('[data-hscroll="true"]')) {
      startY.current = 0;
      startX.current = 0;
      return;
    }
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const target = e.target as unknown as HTMLElement;
    if (target?.closest?.('[data-hscroll="true"]')) {
      if (pullDistance > 0) setPullDistance(0);
      return;
    }
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;
      if (Math.abs(dx) > Math.abs(dy) + 6) {
        setPullDistance(0);
        return;
      }
      if (dy > 0 && dy < 150 && dy >= 6) setPullDistance(dy);
    }
  }, [isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80 && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic("medium");
      await data.invalidateAll();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        toast({ title: "✨ Aktualisiert!" });
      }, 800);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, data.invalidateAll]);

  useEffect(() => {
    const el = postsScrollRef.current;
    if (!el) return;
    const handleScroll = () => setPostIndex(Math.round(el.scrollLeft / 296));
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [data.posts]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentPost || !commentText.trim()) return;
    await actions.handleSubmitComment(commentPost, commentText, () => {
      setCommentText("");
      setCommentPost(null);
    });
  }, [commentPost, commentText, actions]);

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] bg-gray-50/50 pb-24 overflow-y-auto"
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm animate-in slide-in-from-top">
          <WifiOff className="h-4 w-4" />
          <span>Keine Verbindung</span>
        </div>
      )}

      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: isRefreshing ? 60 : Math.min(pullDistance, 80) }}
      >
        <div className={cn("flex items-center gap-2 text-gray-500 text-sm", isRefreshing && "animate-pulse")}>
          <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
          <span>{isRefreshing ? "Aktualisiere..." : pullDistance > 80 ? "Loslassen" : "Runterziehen"}</span>
        </div>
      </div>

      <div className={cn("bg-white pt-4 pb-5 px-4 transition-transform duration-200", !isOnline && "mt-10")}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium text-blue-500">Entdecken</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketplace</h1>
        <p className="text-sm text-gray-500">Personen, Unternehmen & mehr</p>
      </div>

      <MarketplaceContent
        forYouItems={forYouItems}
        companies={data.companies}
        posts={data.posts}
        jobs={data.jobs}
        peopleSection={peopleSection}
        authors={data.authors}
        companyMap={data.companyMap}
        statusMap={statusMap}
        applicationsByJobId={applicationsByJobId}
        isLoading={data.isLoading}
        postIndex={postIndex}
        postsScrollRef={postsScrollRef}
        onConnect={actions.onConnect}
        onLikePost={actions.handleLikePost}
        onComment={setCommentPost}
        onApply={setApplyJob}
      />

      <div className="h-20" />

      <MarketplaceModals
        applyJob={applyJob}
        applySuccess={applySuccess}
        onApplyJobChange={setApplyJob}
        onApplySuccessChange={setApplySuccess}
        companyMap={data.companyMap}
        commentPost={commentPost}
        commentText={commentText}
        onCommentPostChange={setCommentPost}
        onCommentTextChange={setCommentText}
        onSubmitComment={handleSubmitComment}
        authors={data.authors}
      />
    </div>
  );
}
