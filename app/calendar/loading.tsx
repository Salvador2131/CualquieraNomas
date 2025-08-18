export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1 h-96 bg-muted animate-pulse rounded-lg" />
        <div className="md:col-span-2 h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
