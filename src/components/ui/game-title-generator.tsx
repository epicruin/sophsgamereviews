import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface GameTitleGeneratorProps {
  onTitleGenerated: (title: string) => void;
  existingTitles: string[];
  currentTitle?: string;
}

export const GameTitleGenerator = ({ onTitleGenerated, existingTitles, currentTitle }: GameTitleGeneratorProps) => {
  // Keep track of all suggestions made in this session
  const [sessionSuggestions, setSessionSuggestions] = useState<string[]>([]);

  const generateGameTitle = async () => {
    try {
      // Combine all titles to avoid: existing titles, current title, and previous suggestions
      const titlesToAvoid = [...existingTitles, ...sessionSuggestions];
      if (currentTitle?.trim()) {
        titlesToAvoid.push(currentTitle);
      }
      const existingTitlesStr = titlesToAvoid.filter(t => t.trim()).join(", ");
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          existingTitles: titlesToAvoid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate title');
      }

      const { title: suggestedTitle } = await response.json();
      
      if (suggestedTitle) {
        // Double check that the suggested title isn't in any of our avoid lists (case insensitive)
        if (titlesToAvoid.some(title => title.toLowerCase() === suggestedTitle.toLowerCase())) {
          toast.error("Duplicate title suggested, trying again...");
          generateGameTitle(); // Try again
          return;
        }
        // Add the new suggestion to our session history
        setSessionSuggestions(prev => [...prev, suggestedTitle]);
        onTitleGenerated(suggestedTitle);
      } else {
        toast.error("Failed to generate game title");
      }
    } catch (error) {
      console.error("Error generating game title:", error);
      toast.error("Failed to generate game title");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={generateGameTitle}
      className="shrink-0"
      title="Generate game title"
    >
      <Wand2 className="h-4 w-4" />
    </Button>
  );
};