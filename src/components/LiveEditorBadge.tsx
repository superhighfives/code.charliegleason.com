import { ChevronRight } from "lucide-react";

export default function LiveEditorBadge() {
  return (
    <div className="z-10 absolute inline-flex items-center gap-1 top-3 min-[769px]:top-4 min-[769px]:right-0 right-auto left-2 min-[769px]:left-auto pl-3.5 pr-2 min-[769px]:pl-2 min-[769px]:pr-0.5 rounded-full min-[769px]:rounded-r-none bg-gray-50 dark:bg-gray-900 text-gray-400 text-xs py-1">
      <span>Live Editor</span>
      <ChevronRight className="rotate-90 min-[769px]:rotate-0" size={16} />
    </div>
  );
}
