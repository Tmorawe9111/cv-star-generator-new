import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const REJECTION_OPTIONS = [
  { value: "not_fit", label: "Profil passt nicht zur Stelle" },
  { value: "position_filled", label: "Stelle bereits besetzt" },
  { value: "experience_mismatch", label: "Erfahrung passt nicht" },
  { value: "other", label: "Eigener Grund" },
] as const;

type ReasonValue = (typeof REJECTION_OPTIONS)[number]["value"];

type RejectApplicationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { reasonShort: ReasonValue; reasonCustom?: string }) => Promise<void> | void;
  isSubmitting?: boolean;
  candidateName?: string | null;
  jobTitle?: string | null;
};

export function RejectApplicationDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
  candidateName,
  jobTitle,
}: RejectApplicationDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReasonValue>("not_fit");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedReason("not_fit");
      setCustomReason("");
      setError("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (selectedReason === "other" && !customReason.trim()) {
      setError("Bitte geben Sie einen Grund an.");
      return;
    }

    setError("");
    await onConfirm({
      reasonShort: selectedReason,
      reasonCustom: selectedReason === "other" ? customReason.trim() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bewerbung ablehnen</DialogTitle>
          <DialogDescription>
            {candidateName ? `${candidateName} ` : "Diese Bewerbung "}
            {jobTitle ? `für "${jobTitle}" ` : ""}
            wird archiviert. Bitte Grund auswählen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedReason} onValueChange={(value) => setSelectedReason(value as ReasonValue)} className="space-y-3">
            {REJECTION_OPTIONS.map((option) => (
              <Label
                key={option.value}
                htmlFor={`reject-${option.value}`}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                  selectedReason === option.value ? "border-blue-500 bg-blue-50" : "border-border"
                }`}
              >
                <RadioGroupItem id={`reject-${option.value}`} value={option.value} className="mt-1" />
                <span>{option.label}</span>
              </Label>
            ))}
          </RadioGroup>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-sm font-medium">
                Eigener Grund
              </Label>
              <Textarea
                id="reject-reason"
                rows={3}
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Grund für die Ablehnung"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Wird abgelehnt..." : "Jetzt absagen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RejectApplicationDialog;
