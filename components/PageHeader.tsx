'use client';

import { useRouter, usePathname } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showBack?: boolean;
}

export function PageHeader({ title, description, action, showBack }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const shouldShowBack = showBack ?? (pathname !== '/dashboard' && pathname.startsWith('/dashboard'));

  return (
    <div className="mb-6">
      {shouldShowBack && (
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 mb-3 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </button>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
