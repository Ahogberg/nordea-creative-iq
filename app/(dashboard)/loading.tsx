// Laddningsläge för arbetsytan medan en vy hämtar data på servern.

import { Skeleton } from "@/components/ui/states";

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Laddar" className="min-h-screen bg-nordea-bg">
      <div className="h-14 border-b border-nordea-hairline bg-white" />
      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-8 w-72 mb-3" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="nordea-card p-5">
              <Skeleton className="h-3 w-24 mb-4" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="nordea-card p-5">
          <Skeleton className="h-4 w-40 mb-5" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[200px] w-[120px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
