import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateArticleContent, ArticleInfo } from "@/lib/article-openai";

interface ArticleTitleGeneratorProps {
  onTitleGenerated: (title: string, summary: string) => void;
  existingTitles: string[];
  currentTitle?: string;
}

export const ArticleTitleGenerator = ({ onTitleGenerated, existingTitles, currentTitle }: ArticleTitleGeneratorProps) => {
  // Keep track of all suggestions made in this session
  const [sessionSuggestions, setSessionSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateArticleTitle = async () => {
    try {
      setIsGenerating(true);
      
      // Combine all titles to avoid: existing titles, current title, and previous suggestions
      const titlesToAvoid = [...existingTitles, ...sessionSuggestions];
      if (currentTitle?.trim()) {
        titlesToAvoid.push(currentTitle);
      }
      
      // Get a random topic to generate an article title about
      const topics = [
        "gaming trends",
        "upcoming games",
        "game reviews",
        "gaming community",
        "indie games",
        "AAA titles",
        "gaming nostalgia",
        "multiplayer games",
        "female gamers",
        "gaming tips",
        "gaming hardware",
        "gaming culture"
      ];
      
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      // Generate a new title and summary using the existing API
      const result = await generateArticleContent(`Article about ${randomTopic}`, "titleAndSummary");
      
      let title = `Article about ${randomTopic}`;
      let summary = "Generated article summary";
      
      // Extract title and summary from the result
      if (result.titleAndSummary) {
        // According to ArticleInfo, titleAndSummary is an object with title and summary properties
        title = result.titleAndSummary.title || title;
        summary = result.titleAndSummary.summary || summary;
      }
      
      // Double check that the suggested title isn't in any of our avoid lists (case insensitive)
      if (titlesToAvoid.some(t => t.toLowerCase() === title.toLowerCase())) {
        toast.error("Duplicate title suggested, trying again...");
        generateArticleTitle(); // Try again
        return;
      }
      
      // Add the new suggestion to our session history
      setSessionSuggestions(prev => [...prev, title]);
      onTitleGenerated(title, summary);
      toast.success("Title and summary generated!");
    } catch (error: any) {
      console.error("Error generating article title:", error);
      toast.error(error.message || "Failed to generate article title");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={generateArticleTitle}
      className="shrink-0"
      disabled={isGenerating}
      title="Generate article title"
    >
      <Wand2 className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
    </Button>
  );
}; 