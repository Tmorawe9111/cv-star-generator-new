import { useCompanyPeople } from "@/hooks/useCompanyPeople";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { AddEmployeeDialog } from "../AddEmployeeDialog";

interface CompanyPeopleTabProps {
  companyId: string;
  isOwner?: boolean;
}

export function CompanyPeopleTab({ companyId, isOwner }: CompanyPeopleTabProps) {
  const { data: people, refetch, isLoading } = useCompanyPeople(companyId);
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {isOwner && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Mitarbeiter hinzufügen
          </Button>
        </div>
      )}
      
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Lade Mitarbeiter...
        </div>
      )}

      {!isLoading && !people?.length && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Noch keine Mitarbeiter
              </p>
              {isOwner && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Mitarbeiter hinzufügen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid md:grid-cols-2 gap-4">
        {people?.map((person) => (
          <Card key={person.user_id}>
            <CardContent className="p-4">
              <Link to={`/u/${person.user_id}`} className="flex items-center gap-3 group">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={person.avatar_url || undefined} />
                  <AvatarFallback>{person.full_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold group-hover:text-primary transition-colors">
                    {person.full_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mitarbeiter
                  </div>
                </div>
                {isOwner && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      // handleRemovePerson(person.user_id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Add Employee Dialog */}
      {isOwner && (
        <AddEmployeeDialog 
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          companyId={companyId}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
