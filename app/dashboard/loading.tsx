export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-100">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    </div>
  );
}
