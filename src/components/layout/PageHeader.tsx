import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  breadcrumbs, title, subtitle, action,
}: {
  breadcrumbs: string[];
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-1 flex items-center gap-1 text-xs text-slate-500">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" />}
              <span className={i === breadcrumbs.length - 1 ? "text-slate-700" : ""}>{b}</span>
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
