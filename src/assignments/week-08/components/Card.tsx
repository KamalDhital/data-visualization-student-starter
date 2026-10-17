import type { ReactNode } from 'react';

// Shared panel wrapper used by every dashboard section.
export function Card({
  children,
  className = '',
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {title ? (
        <div className="border-b border-slate-200 bg-[#f8fafc] px-4 py-3">
          <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        </div>
      ) : null}
      {children}
    </section>
  );
}
