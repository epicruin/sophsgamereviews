import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReviewFormData } from "@/components/admin/ReviewForm/types";
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  formData: ReviewFormData;
  genres: { id: string; name: string }[];
}

export function AIChat({ formData, genres }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get genre name from ID
  const getGenreName = (id: string) => {
    const genre = genres.find(g => g.id === id);
    return genre ? genre.name : 'Unknown Genre';
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsLoading(true);
      
      // Add user message to chat
      const userMessage = { role: "user" as const, content: newMessage };
      setMessages(prev => [...prev, userMessage]);
      setNewMessage("");

      // Get AI response
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          history: messages,
          formData,
          genres
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  message.role === "assistant" ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {message.role === "assistant" && (
                  <Bot className="w-6 h-6 text-primary" />
                )}
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    message.role === "assistant"
                      ? "bg-muted prose prose-sm dark:prose-invert prose-p:text-left prose-headings:text-left !max-w-none"
                      : "bg-primary text-primary-foreground ml-auto"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Override default element styling
                        p: ({ children }) => <p className="mb-2 last:mb-0 text-left">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 list-disc pl-4 text-left">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 text-left">{children}</ol>,
                        li: ({ children }) => <li className="mb-1 text-left">{children}</li>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-left">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-left">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-2 text-left">{children}</h3>,
                        code: ({ children }) => <code className="bg-muted-foreground/20 rounded px-1">{children}</code>,
                        pre: ({ children }) => <pre className="bg-muted-foreground/20 rounded p-2 overflow-x-auto">{children}</pre>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask for suggestions or feedback..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !newMessage.trim()}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
} 