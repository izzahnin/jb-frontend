const STYLES: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  partial: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pickup: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  available: 'bg-green-100 text-green-700',
  on_duty: 'bg-yellow-100 text-yellow-700',
  maintenance: 'bg-orange-100 text-orange-700',
  off: 'bg-slate-100 text-slate-600',
};

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const cls = STYLES[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls} ${className}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}
