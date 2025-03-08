import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { ReviewFormData } from "./types";

interface SystemRequirementsProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const SystemRequirements = ({ formData, onUpdate }: SystemRequirementsProps) => {
  const updateMinSpec = (field: string, value: string) => {
    onUpdate({
      specifications: {
        ...formData.specifications,
        minimum: {
          ...formData.specifications.minimum,
          [field]: value
        },
        recommended: formData.specifications.recommended
      }
    });
  };

  const updateRecSpec = (field: string, value: string) => {
    onUpdate({
      specifications: {
        ...formData.specifications,
        minimum: formData.specifications.minimum,
        recommended: {
          ...formData.specifications.recommended,
          [field]: value
        }
      }
    });
  };

  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">System Requirements (PC)</h3>
        <div className="z-10">
          <AIGenerateButton
            gameTitle={formData.title}
            section="systemRequirements"
            onGenerated={(specs) => {
              console.log("Received system requirements:", specs);
              if (specs) {
                onUpdate({
                  specifications: {
                    minimum: {
                      os: specs.minimum.os || formData.specifications.minimum.os,
                      processor: specs.minimum.processor || formData.specifications.minimum.processor,
                      memory: specs.minimum.memory || formData.specifications.minimum.memory,
                      graphics: specs.minimum.graphics || formData.specifications.minimum.graphics,
                      storage: specs.minimum.storage || formData.specifications.minimum.storage,
                    },
                    recommended: {
                      os: specs.recommended.os || formData.specifications.recommended.os,
                      processor: specs.recommended.processor || formData.specifications.recommended.processor,
                      memory: specs.recommended.memory || formData.specifications.recommended.memory,
                      graphics: specs.recommended.graphics || formData.specifications.recommended.graphics,
                      storage: specs.recommended.storage || formData.specifications.recommended.storage,
                    }
                  }
                });
              }
            }}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-4">Minimum Requirements</h4>
          <div className="space-y-4">
            <Input
              placeholder="Operating System"
              value={formData.specifications.minimum.os}
              onChange={(e) => updateMinSpec('os', e.target.value)}
            />
            <Input
              placeholder="Processor"
              value={formData.specifications.minimum.processor}
              onChange={(e) => updateMinSpec('processor', e.target.value)}
            />
            <Input
              placeholder="Memory"
              value={formData.specifications.minimum.memory}
              onChange={(e) => updateMinSpec('memory', e.target.value)}
            />
            <Input
              placeholder="Graphics"
              value={formData.specifications.minimum.graphics}
              onChange={(e) => updateMinSpec('graphics', e.target.value)}
            />
            <Input
              placeholder="Storage"
              value={formData.specifications.minimum.storage}
              onChange={(e) => updateMinSpec('storage', e.target.value)}
            />
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-4">Recommended Requirements</h4>
          <div className="space-y-4">
            <Input
              placeholder="Operating System"
              value={formData.specifications.recommended.os}
              onChange={(e) => updateRecSpec('os', e.target.value)}
            />
            <Input
              placeholder="Processor"
              value={formData.specifications.recommended.processor}
              onChange={(e) => updateRecSpec('processor', e.target.value)}
            />
            <Input
              placeholder="Memory"
              value={formData.specifications.recommended.memory}
              onChange={(e) => updateRecSpec('memory', e.target.value)}
            />
            <Input
              placeholder="Graphics"
              value={formData.specifications.recommended.graphics}
              onChange={(e) => updateRecSpec('graphics', e.target.value)}
            />
            <Input
              placeholder="Storage"
              value={formData.specifications.recommended.storage}
              onChange={(e) => updateRecSpec('storage', e.target.value)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}; 