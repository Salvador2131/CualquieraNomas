export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
