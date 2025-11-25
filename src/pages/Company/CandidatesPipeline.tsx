import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidatePipelineBoard } from "@/components/Company/pipeline/CandidatePipelineBoard";

const CandidatesPipelinePage: React.FC = () => {
  return (
    <div className="p-3 md:p-6 min-h-screen max-w-full space-y-6">
      <CandidatePipelineBoard />
    </div>
  );
};

export default CandidatesPipelinePage;
