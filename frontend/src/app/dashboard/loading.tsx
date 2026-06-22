export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
        <p className="text-muted-foreground text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
}
