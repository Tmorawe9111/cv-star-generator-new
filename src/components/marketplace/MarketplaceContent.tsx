import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Building2, FileText, Briefcase, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { HorizontalScrollSection } from "./HorizontalScrollSection";
import { ForYouCard } from "./ForYouCard";
import { PersonCard } from "./PersonCard";
import { CompanyCard } from "./CompanyCard";
import { PostCardSlider } from "./PostCardSlider";
import { JobCard } from "./JobCard";
import type { MarketplacePerson, MarketplaceCompany, MarketplaceJob, MarketplacePost } from "@/types/marketplace";

const DUMMY_JOBS: MarketplaceJob[] = [
  { id: "demo-1", title: "Frontend Developer (React)", company_id: "demo", location: "Berlin", employment_type: "Vollzeit", salary_min: 55000, salary_max: 75000 },
  { id: "demo-2", title: "UX/UI Designer", company_id: "demo", location: "München", employment_type: "Vollzeit", salary_min: 50000, salary_max: 70000 },
  { id: "demo-3", title: "Product Manager", company_id: "demo", location: "Hamburg", employment_type: "Vollzeit", salary_min: 65000, salary_max: 90000 },
  { id: "demo-4", title: "Backend Engineer (Node.js)", company_id: "demo", location: "Remote", employment_type: "Vollzeit", salary_min: 60000, salary_max: 85000 },
  { id: "demo-5", title: "Marketing Manager", company_id: "demo", location: "Frankfurt", employment_type: "Teilzeit", salary_min: 40000, salary_max: 55000 },
  { id: "demo-6", title: "Data Analyst", company_id: "demo", location: "Köln", employment_type: "Vollzeit", salary_min: 48000, salary_max: 65000 },
];

export interface MarketplaceContentProps {
  forYouItems: { item: MarketplacePerson | MarketplaceCompany; type: "person" | "company" }[];
  companies: MarketplaceCompany[];
  posts: MarketplacePost[];
  jobs: MarketplaceJob[];
  peopleSection: MarketplacePerson[];
  authors: Record<string, { name: string; avatar_url: string | null }>;
  companyMap: Record<string, { name: string; logo_url: string | null }>;
  statusMap: Record<string, string>;
  applicationsByJobId: Record<string, { created_at?: string; unlocked_at?: string; status?: string }>;
  isLoading: boolean;
  postIndex: number;
  postsScrollRef: React.RefObject<HTMLDivElement | null>;
  onConnect: (id: string) => void;
  onLikePost: (postId: string, liked: boolean) => void;
  onComment: (post: MarketplacePost) => void;
  onApply: (job: MarketplaceJob) => void;
}

export const MarketplaceContent: React.FC<MarketplaceContentProps> = ({
  forYouItems,
  companies,
  posts,
  jobs,
  peopleSection,
  authors,
  companyMap,
  statusMap,
  applicationsByJobId,
  isLoading,
  postIndex,
  postsScrollRef,
  onConnect,
  onLikePost,
  onComment,
  onApply,
}) => {
  const displayJobs = jobs.length > 0 ? jobs : DUMMY_JOBS;

  return (
    <>
      <div className="mt-5">
        <SectionHeader title="Für dich" icon={<Sparkles className="h-5 w-5 text-yellow-500" />} />
        <HorizontalScrollSection>
          {forYouItems.length > 0 ? (
            forYouItems.map(({ item, type }, index) => (
              <div key={item.id} className="snap-center" style={{ scrollSnapAlign: "center" }}>
                <div className="animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}>
                  <ForYouCard
                    item={item}
                    type={type}
                    index={index}
                    onAction={() => (type === "person" ? onConnect(item.id) : undefined)}
                    actionLabel={type === "person" ? "Vernetzen" : "Folgen"}
                    actionDone={type === "person" && statusMap[item.id] === "accepted"}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 px-2">Keine Vorschläge</p>
          )}
        </HorizontalScrollSection>
      </div>

      {companies.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Unternehmen" icon={<Building2 className="h-5 w-5 text-blue-500" />} />
          <HorizontalScrollSection>
            {companies.slice(0, 8).map((company, idx) => (
              <div key={company.id} className="snap-center animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "backwards", scrollSnapAlign: "center" }}>
                <CompanyCard company={company} index={idx} />
              </div>
            ))}
          </HorizontalScrollSection>
        </div>
      )}

      <div className="mt-6">
        <SectionHeader title="Beiträge" icon={<FileText className="h-5 w-5 text-green-500" />} />
        {posts.length > 0 ? (
          <div className="relative px-4">
            <div ref={postsScrollRef} data-hscroll="true" className="overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x", overscrollBehaviorX: "contain" }}>
              <style>{`[data-hscroll="true"]::-webkit-scrollbar{display:none}`}</style>
              <div className="flex gap-3" style={{ width: `${posts.slice(0, 5).length * 296}px` }}>
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="snap-center shrink-0">
                    <PostCardSlider post={post} author={authors[post.user_id]} onLike={onLikePost} onComment={onComment} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {posts.slice(0, 5).map((_, idx) => (
                <div key={idx} className={cn("h-1.5 rounded-full transition-all", idx === postIndex ? "w-4 bg-blue-500" : "w-1.5 bg-gray-300")} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 px-4">Keine Beiträge</p>
        )}
        {posts.length > 0 && (
          <div className="px-4 mt-3 flex justify-end">
            <Link to="/community">
              <Button variant="ghost" size="sm" className="text-blue-500 text-sm font-medium">
                Mehr Beiträge <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6">
        <SectionHeader title="Jobs für dich" icon={<Briefcase className="h-5 w-5 text-purple-500" />} seeAllText="Alle Jobs" />
        <HorizontalScrollSection>
          {displayJobs.slice(0, 6).map((job) => (
            <div key={job.id} className="snap-center" style={{ scrollSnapAlign: "center" }}>
              <JobCard
                job={job}
                companyName={companyMap[job.company_id]?.name || (job.id.startsWith("demo") ? "Top Unternehmen" : undefined)}
                companyLogo={companyMap[job.company_id]?.logo_url}
                application={applicationsByJobId[job.id] ?? null}
                onApply={onApply}
              />
            </div>
          ))}
        </HorizontalScrollSection>
      </div>

      <div className="mt-6">
        <SectionHeader title="Personen" icon={<Users className="h-5 w-5 text-pink-500" />} />
        <HorizontalScrollSection>
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="snap-center min-w-[160px] w-[160px] h-[200px] bg-white rounded-2xl p-3 animate-pulse" style={{ scrollSnapAlign: "center" }}>
                <div className="h-14 w-14 rounded-full bg-gray-200 mx-auto mb-2" />
                <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-2" />
                <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
              </div>
            ))
          ) : peopleSection.length > 0 ? (
            peopleSection.slice(0, 10).map((person, idx) => (
              <div key={person.id} className="snap-center animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "backwards", scrollSnapAlign: "center" }}>
                <PersonCard person={person} index={idx} onConnect={() => onConnect(person.id)} status={(statusMap[person.id] ?? "none") as "none" | "pending" | "accepted" | "incoming" | "declined"} />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">Noch keine Nutzer registriert</p>
          )}
        </HorizontalScrollSection>
      </div>

      <div className="mt-6 px-4">
        <SectionHeader title="Gruppen" icon={<Users className="h-5 w-5 text-purple-500" />} />
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">Gruppen kommen bald!</p>
            <p className="text-xs text-gray-500">Tausche dich mit Gleichgesinnten aus.</p>
          </div>
        </div>
      </div>
    </>
  );
};
