import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { generateGameInfo, GameInfo } from "@/lib/openai";
import { toast } from "sonner";

interface AIGenerateButtonProps {
  gameTitle: string;
  section: keyof GameInfo;
  onGenerated: (data: any) => void;
  disabled?: boolean;
}

export function AIGenerateButton({
  gameTitle,
  section,
  onGenerated,
  disabled = false
}: AIGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!gameTitle.trim()) {
      toast.error("Please enter a game title first");
      return;
    }

    try {
      setIsGenerating(true);
      console.log("Generating content for:", gameTitle, "section:", section);
      
      const result = await generateGameInfo(gameTitle, section);
      console.log("Generated result:", result);
      
      // Extract the correct data from the result
      const generatedContent = result[section];
      console.log("Extracted content:", generatedContent);
      
      if (generatedContent) {
        onGenerated(generatedContent);
        toast.success("Content generated successfully!");
      } else {
        toast.error("No content was generated");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled || isGenerating}
      onClick={handleGenerate}
      className="h-8 w-8"
    >
      <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
    </Button>
  );
} 