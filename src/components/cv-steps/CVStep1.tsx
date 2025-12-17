import React, { useMemo, useState } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { BRANCHES } from '@/lib/branches';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CVStep1 = () => {
  const { formData, updateFormData, validationErrors } = useCVForm();
  const [otherOpen, setOtherOpen] = useState(false);

  // Use centralized branch definitions
  const branches = useMemo(() => {
    return BRANCHES.map((branch) => ({
      key: branch.key,
      emoji: branch.emoji || '',
      title: branch.label,
      desc: branch.desc || ''
    }));
  }, []);

  const primaryBranchKeys = useMemo(() => ['gesundheit', 'handwerk'] as const, []);
  const otherBranches = useMemo(
    () => branches.filter((b) => !primaryBranchKeys.includes(b.key as any)),
    [branches, primaryBranchKeys]
  );

  const selectedBranch = formData.branche;
  const selectedBranchObj = branches.find((b) => b.key === selectedBranch);
  const isOtherSelected = !!selectedBranch && !primaryBranchKeys.includes(selectedBranch as any);

  const statuses = [
    { key: 'schueler', emoji: '🧑‍🎓', title: 'Schüler:in', desc: 'Ich gehe noch zur Schule' },
    { key: 'azubi', emoji: '🧑‍🔧', title: 'Azubi', desc: 'Ich mache eine Ausbildung' },
    { key: 'fachkraft', emoji: '✅', title: 'Fachkraft', desc: 'Ich habe eine Ausbildung abgeschlossen' }
  ] as const;

  const choiceBase =
    "w-full rounded-3xl border bg-white px-5 py-4 text-left shadow-sm transition-all duration-200 active:scale-[0.99]";
  const choiceUnselected =
    "border-slate-200 hover:border-slate-300 hover:shadow-md";
  const choiceSelected =
    "border-[#2563EB] ring-2 ring-[#2563EB] bg-[#EFF6FF] shadow-md";

  return (
    <div className="h-full min-h-[calc(100dvh-210px)] flex flex-col">
      <div className="flex-1 flex flex-col justify-center gap-6 py-2">
        {/* Branche */}
        <section className="mx-auto w-full max-w-xl">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 text-center">
            Welche Branche passt zu dir?
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground text-center">
            Wähle zuerst deinen Bereich.
          </p>
          {validationErrors.branche && (
            <p className="mt-2 text-xs text-destructive font-medium text-center">
              {validationErrors.branche}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {(['gesundheit', 'handwerk'] as const).map((key) => {
              const b = branches.find((x) => x.key === key)!;
              const selected = formData.branche === key;
              return (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateFormData({ branche: b.key as any })}
                  className={`${choiceBase} ${selected ? choiceSelected : choiceUnselected}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{b.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                            {b.title}
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                            {b.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                        selected ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-white" : "bg-transparent"}`} />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Andere Branche */}
            <button
              type="button"
              aria-pressed={isOtherSelected}
              onClick={() => setOtherOpen(true)}
              className={`${choiceBase} ${isOtherSelected ? choiceSelected : choiceUnselected}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                        {isOtherSelected ? `Andere Branche: ${selectedBranchObj?.title}` : "Andere Branche"}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                        IT, Büro, Verkauf, Gastronomie, Bau
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                    isOtherSelected ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300 bg-white"
                  }`}
                >
                  <div className={`h-2.5 w-2.5 rounded-full ${isOtherSelected ? "bg-white" : "bg-transparent"}`} />
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Status */}
        <section className="mx-auto w-full max-w-xl">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 text-center">
            Deine aktuelle Situation
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground text-center">
            Was beschreibt dich am besten?
          </p>
          {validationErrors.status && (
            <p className="mt-2 text-xs text-destructive font-medium text-center">
              {validationErrors.status}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {statuses.map((status) => {
              const selected = formData.status === status.key;
              return (
                <button
                  key={status.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateFormData({ status: status.key })}
                  className={`${choiceBase} ${selected ? choiceSelected : choiceUnselected}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{status.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                          {status.title}
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                          {status.desc}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                        selected ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-white" : "bg-transparent"}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {formData.branche && formData.status && (
          <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xs sm:text-sm text-slate-700">
              ✅ Perfekt! <strong>{selectedBranchObj?.title}</strong> ·{" "}
              <strong>{statuses.find((s) => s.key === formData.status)?.title}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Dialog: Andere Branche */}
      <Dialog open={otherOpen} onOpenChange={setOtherOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[80dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Andere Branche wählen</DialogTitle>
          </DialogHeader>
          <div className="mt-3 flex flex-col gap-2">
            {otherBranches.map((b) => {
              const selected = formData.branche === b.key;
              return (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    updateFormData({ branche: b.key as any });
                    setOtherOpen(false);
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    selected
                      ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{b.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{b.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{b.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVStep1;