import CompanyNewPostComposer from "@/components/community/CompanyNewPostComposer";
import { ProfilePostsSection } from "@/components/profile/ProfilePostsSection";

interface CompanyPostsTabProps {
  companyId: string;
  isOwner?: boolean;
}

export function CompanyPostsTab({ companyId, isOwner }: CompanyPostsTabProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {isOwner && (
        <div className="mb-6">
          <CompanyNewPostComposer companyId={companyId} />
        </div>
      )}

      <ProfilePostsSection
        profileId={companyId}
        isOwner={isOwner}
        isCompany={true}
        companyId={companyId}
      />
    </div>
  );
}
