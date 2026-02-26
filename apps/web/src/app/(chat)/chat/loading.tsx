import { Loader2 } from "lucide-react";

export default function ChatPageLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
