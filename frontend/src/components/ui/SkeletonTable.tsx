export function SkeletonTable({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="w-full border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
      {/* Table Header Skeleton */}
      <div className="flex bg-slate-50 border-b border-slate-200 p-4 gap-4">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/6"></div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/5"></div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/6"></div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
      </div>
      
      {/* Table Body Rows Skeleton */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="flex p-4 gap-4 items-center">
            {/* File Name */}
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3"></div>
            {/* Category Tag */}
            <div className="h-6 bg-slate-200 rounded-full animate-pulse w-20"></div>
            {/* Date */}
            <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
            {/* Status */}
            <div className="h-6 bg-slate-200 rounded animate-pulse w-24"></div>
            {/* Action */}
            <div className="h-4 bg-slate-200 rounded animate-pulse w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
