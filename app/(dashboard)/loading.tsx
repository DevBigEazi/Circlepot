"use client";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <div className="flex flex-col items-center gap-1">
        <h3 className="font-black text-lg tracking-tight uppercase opacity-60">
          Updating Dashboard
        </h3>
        <p className="text-xs font-bold text-text-light/50 uppercase tracking-widest">
          Fetching your savings data...
        </p>
      </div>
    </div>
  );
}
