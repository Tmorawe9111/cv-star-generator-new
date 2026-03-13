import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface OverlappingAvatarsProps {
  avatars: (string | null)[];
  count: number;
  label: string;
  type?: "mutual" | "employees";
  names?: string[];
}

export const OverlappingAvatars: React.FC<OverlappingAvatarsProps> = ({
  avatars,
  count,
  label,
  type = "mutual",
  names = [],
}) => {
  const displayNames = names.slice(0, 2);
  const remainingCount = count > 2 ? count - 2 : 0;
  const displayAvatars = avatars.slice(0, Math.min(2, displayNames.length || 2));

  return (
    <div className="flex flex-col items-center gap-1.5 h-[50px] justify-center w-full">
      <div className="flex -space-x-1.5 justify-center">
        {displayAvatars.map((url, i) => (
          <Avatar
            key={i}
            className="h-5 w-5 border-[1.5px] border-white ring-0.5 ring-gray-200/50"
          >
            <AvatarImage src={url ?? undefined} className="object-cover" />
            <AvatarFallback className="text-[8px] bg-gray-200">
              {displayNames[i] ? displayNames[i].slice(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        ))}
        {count > 2 && (
          <div className="h-5 w-5 rounded-full bg-gray-100 border-[1.5px] border-white ring-0.5 ring-gray-200/50 flex items-center justify-center">
            <span className="text-[8px] font-semibold text-gray-600">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
      {type === "mutual" && count > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center px-1">
          {displayNames.map((name, idx) => (
            <span
              key={idx}
              className="text-[9px] text-gray-700 font-medium leading-none"
            >
              {name}
              {idx < displayNames.length - 1 && ","}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="text-[9px] text-gray-500 font-light leading-none">
              und {remainingCount} weitere gemeinsame Kontakte
            </span>
          )}
          {count === 1 && displayNames.length === 1 && (
            <span className="text-[9px] text-gray-500 font-light leading-none">
              gemeinsamer Kontakt
            </span>
          )}
          {count === 2 && displayNames.length === 2 && (
            <span className="text-[9px] text-gray-500 font-light leading-none">
              gemeinsame Kontakte
            </span>
          )}
        </div>
      ) : (
        count > 0 && (
          <span className="text-[9px] text-gray-500 leading-none text-center">
            {label || (count > 1 ? `${count} gemeinsame` : "1 gemeinsamer")}
          </span>
        )
      )}
    </div>
  );
};
