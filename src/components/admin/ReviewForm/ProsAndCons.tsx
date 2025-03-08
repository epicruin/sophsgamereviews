import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { ReviewFormData } from "./types";

interface ProsAndConsProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const ProsAndCons = ({ formData, onUpdate }: ProsAndConsProps) => {
  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Pros & Cons</h3>
        <div className="z-10">
          <AIGenerateButton
            gameTitle={formData.title}
            section="prosAndCons"
            onGenerated={(data) => {
              console.log("Received pros and cons:", data);
              if (data) {
                onUpdate({
                  pros: data.pros || formData.pros,
                  cons: data.cons || formData.cons
                });
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Pros</label>
          {formData.pros.map((pro, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <Input
                value={pro}
                onChange={(e) => onUpdate({
                  pros: formData.pros.map((p, i) => i === index ? e.target.value : p)
                })}
                placeholder="Add a pro"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onUpdate({
                  pros: formData.pros.filter((_, i) => i !== index)
                })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => onUpdate({ pros: [...formData.pros, ""] })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Pro
          </Button>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Cons</label>
          {formData.cons.map((con, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <Input
                value={con}
                onChange={(e) => onUpdate({
                  cons: formData.cons.map((c, i) => i === index ? e.target.value : c)
                })}
                placeholder="Add a con"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onUpdate({
                  cons: formData.cons.filter((_, i) => i !== index)
                })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => onUpdate({ cons: [...formData.cons, ""] })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Con
          </Button>
        </div>
      </div>
    </Card>
  );
}; 