import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

interface KnowledgeCardProps {
  title: string;
  subtitle?: string;
  data: Array<{ label: string; value: string }>;
}

export function KnowledgeCard({ title, subtitle, data }: KnowledgeCardProps) {
  return (
    <div className="my-10 not-prose">
      {/* Container im "Widget Look" - abgerundet, leicht grau/weiß Split */}
      <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-gray-50 shadow-sm">
        {/* Widget Header (Apple Music Style) */}
        <div className="flex items-center gap-4 p-5 bg-white border-b border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-inner">
            <Database size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 leading-tight">{title}</h4>
            {subtitle && (
              <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Data List (Wie die Song-Liste im Screenshot) */}
        <div className="p-2">
          <table className="w-full text-left text-sm border-collapse">
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  className="group hover:bg-white transition-colors border-b border-gray-200/50 last:border-0"
                >
                  {/* Icon Column */}
                  <td className="py-3 pl-3 pr-2 w-10">
                    <CheckCircle2
                      size={16}
                      className="text-gray-400 group-hover:text-blue-500"
                    />
                  </td>
                  {/* Label */}
                  <td className="py-3 px-2 font-medium text-gray-600 group-hover:text-gray-900">
                    {row.label}
                  </td>
                  {/* Value (Right aligned, button style) */}
                  <td className="py-3 pr-3 text-right">
                    <span className="inline-block bg-white group-hover:bg-gray-100 border border-gray-200 px-3 py-1 rounded-md font-mono text-gray-900 shadow-sm text-xs font-bold">
                      {row.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

