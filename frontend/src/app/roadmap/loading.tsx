export default function RoadmapLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
        <p className="text-muted-foreground text-sm">Loading roadmap...</p>
      </div>
    </div>
  );
}
