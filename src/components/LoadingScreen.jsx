export default function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0f1419]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div className="rounded-3xl border border-border/70 bg-card/60 px-6 py-4 text-sm text-muted-foreground backdrop-blur-xl">
          Loading...
        </div>
      </div>
    </div>
  )
}

