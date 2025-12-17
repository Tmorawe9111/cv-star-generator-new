import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Briefcase, Bookmark, Building2, Sparkles } from "lucide-react";
import { ApplicationsList } from "./ApplicationsList";
import { SavedJobsList } from "./SavedJobsList";
import { CompanyInterestsList } from "./CompanyInterestsList";
import UserMatches from "./UserMatches";

export default function MyCareer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("matches");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meine Karriere</h1>
        <p className="text-muted-foreground">
          Verwalte deine Bewerbungen, gespeicherte Jobs und Unternehmensinteressen
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Jobs durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Matches</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Bewerbungen</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Gespeichert</span>
          </TabsTrigger>
          <TabsTrigger value="interests" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Interessierte</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          <UserMatches />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsList searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="saved">
          <SavedJobsList searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="interests">
          <CompanyInterestsList searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
