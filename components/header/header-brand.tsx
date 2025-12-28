import { Tv } from "lucide-react";

interface HeaderBrandProps {
  title?: string;
}

export default function HeaderBrand({ title = "Shoowflix" }: HeaderBrandProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
        <Tv className="w-5 h-5 text-white" />
      </div>
      <h1 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
        {title}
      </h1>
    </div>
  );
}
