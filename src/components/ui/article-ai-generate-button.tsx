import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { generateArticleInfo, ArticleInfo } from "@/lib/article-openai";
import { toast } from "sonner";

interface ArticleAIGenerateButtonProps {
  articleTitle?: string;
  section: keyof ArticleInfo;
  onGenerated: (data: any) => void;
  disabled?: boolean;
}

export function ArticleAIGenerateButton({
  articleTitle = "",
  section,
  onGenerated,
  disabled = false
}: ArticleAIGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      console.log("Generating content for article section:", section);
      
      const result = await generateArticleInfo(articleTitle, section);
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