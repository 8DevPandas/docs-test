'use client';

import { Send } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '../ui/button';

export function ChatInput({
  onSend,
  isStreaming,
  projectName,
}: {
  onSend: (text: string) => void;
  isStreaming: boolean;
  projectName: string;
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    const newHeight = Math.min(target.scrollHeight, 200);
    target.style.height = `${newHeight}px`;
    // Only show scrollbar when content exceeds max height
    target.style.overflowY = target.scrollHeight > 200 ? 'auto' : 'hidden';
  };

  return (
    <div className="border-t bg-background p-4 shrink-0">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu mensaje..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-[200px] overflow-hidden"
        />
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || isStreaming}
          size="icon"
          className="shrink-0 h-[44px] w-[44px]"
        >
          <Send className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        {projectName} puede cometer errores. Verificá la información importante.
      </p>
    </div>
  );
}
