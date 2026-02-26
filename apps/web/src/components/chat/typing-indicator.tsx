import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center size-8 rounded-full shrink-0 bg-secondary text-secondary-foreground">
        <Bot className="size-4" />
      </div>
      <div className="rounded-lg px-4 py-3 bg-secondary/50">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
