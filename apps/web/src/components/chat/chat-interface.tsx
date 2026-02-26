"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { queryClient, trpc } from "@/utils/trpc";

import { ChatInput } from "./chat-input";
import { EmptyState } from "./empty-state";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

interface InitialMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export function ChatInterface({
  chatId,
  initialMessages,
  projectName,
  logoUrl,
}: {
  chatId: string | null;
  initialMessages: InitialMessage[];
  projectName: string;
  logoUrl?: string | null;
}) {
  const [activeChatId, setActiveChatId] = useState(chatId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasRedirected = useRef(false);
  const newChatIdRef = useRef<string | null>(null);

  const formattedInitialMessages = useMemo(
    () =>
      initialMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
        createdAt: m.createdAt,
      })),
    [initialMessages],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai",
        body: { chatId: activeChatId },
      }),
    [activeChatId],
  );

  // For new chats, use a custom fetch to capture the X-Chat-Id header
  useEffect(() => {
    if (activeChatId || hasRedirected.current) return;

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
      const response = await originalFetch.call(this, input, init);

      // Safely extract URL
      let url: string | undefined;
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input instanceof Request) {
        url = input.url;
      }

      if (url?.includes("/api/ai")) {
        const headerValue = response.headers.get("X-Chat-Id");
        if (headerValue && !hasRedirected.current) {
          newChatIdRef.current = headerValue;
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [activeChatId]);

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    messages: formattedInitialMessages,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() });

      // Update URL without triggering a full page navigation
      if (newChatIdRef.current && !hasRedirected.current) {
        hasRedirected.current = true;
        const newId = newChatIdRef.current;
        setActiveChatId(newId);
        window.history.replaceState(null, "", `/chat/${newId}`);
      }
    },
  });

  // Listen for "new-chat" event from sidebar to reset state without page reload
  useEffect(() => {
    const handleNewChat = () => {
      setMessages([]);
      setActiveChatId(null);
      hasRedirected.current = false;
      newChatIdRef.current = null;
      window.history.replaceState(null, "", "/chat");
    };
    window.addEventListener("new-chat", handleNewChat);
    return () => window.removeEventListener("new-chat", handleNewChat);
  }, [setMessages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage({ text });
    },
    [sendMessage],
  );

  const isStreaming = status === "streaming";
  const isThinking = status === "submitted";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSend} projectName={projectName} logoUrl={logoUrl} />
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
              />
            ))}
            {isThinking && <TypingIndicator />}
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} isStreaming={isStreaming || isThinking} projectName={projectName} />
    </div>
  );
}
