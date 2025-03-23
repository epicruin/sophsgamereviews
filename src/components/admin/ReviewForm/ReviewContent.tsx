import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { ReviewFormData } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReviewContentProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
  showPreview?: boolean;
}

export const ReviewContent = ({ formData, onUpdate, showPreview = false }: ReviewContentProps) => {
  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Review Content</h3>
        <div className="z-10">
          <AIGenerateButton
            gameTitle={formData.title}
            section="fullReview"
            onGenerated={(content) => {
              console.log("Received full review:", content);
              onUpdate({ content: content || formData.content });
            }}
          />
        </div>
      </div>
      
      {showPreview ? (
        <div className="border rounded-md p-4 min-h-[300px] bg-muted/20">
          {formData.content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formData.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-muted-foreground text-center h-full flex items-center justify-center">
              <p>Your content preview will appear here</p>
            </div>
          )}
        </div>
      ) : (
        <Textarea
          placeholder="Full review content"
          value={formData.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="min-h-[300px]"
          required
        />
      )}
    </Card>
  );
}; 