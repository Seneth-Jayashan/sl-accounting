import { Loader2 } from "lucide-react";

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full text-[#053A4E]">
    <Loader2 size={40} className="animate-spin" />
  </div>
);