import type { UIMessage } from "ai";
import { Bot, User } from "lucide-react";
import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";
import { CitationLink } from "./citation-link";

export function MessageBubble({
  message,
}: {
  message: UIMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex items-center justify-center size-8 rounded-full shrink-0 mt-1",
          isUser ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground",
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={cn(
          "min-w-0 rounded-lg px-4 py-3",
          isUser
            ? "max-w-[80%] bg-accent/10 text-foreground"
            : "flex-1 bg-secondary/50 text-foreground",
        )}
      >
        {message.parts?.map((part, index) => {
          if (part.type === "text") {
            return (
              <Streamdown
                key={index}
                components={{ a: CitationLink }}
              >
                {part.text}
              </Streamdown>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
