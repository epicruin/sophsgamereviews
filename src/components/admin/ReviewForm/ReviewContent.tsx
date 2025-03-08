import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { ReviewFormData } from "./types";

interface ReviewContentProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const ReviewContent = ({ formData, onUpdate }: ReviewContentProps) => {
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
      <Textarea
        placeholder="Full review content"
        value={formData.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        className="min-h-[300px]"
        required
      />
    </Card>
  );
}; 