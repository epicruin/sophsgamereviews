import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { ReviewFormData } from "./types";

interface AwardsProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const Awards = ({ formData, onUpdate }: AwardsProps) => {
  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Awards</h3>
        <div className="z-10">
          <AIGenerateButton
            gameTitle={formData.title}
            section="awards"
            onGenerated={(data) => {
              console.log("Received awards:", data);
              if (data && data.awards) {
                // Create a proper JSONB object for award_dates
                const awardDatesObj = {};
                data.awards.forEach(award => {
                  if (data.award_dates && data.award_dates[award]) {
                    // Ensure the date is in ISO format for JSONB
                    awardDatesObj[award] = new Date(data.award_dates[award]).toISOString();
                  }
                });

                onUpdate({
                  awards: data.awards,
                  award_dates: awardDatesObj
                });
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-4">
        {formData.awards.map((award, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Award name"
                value={award}
                onChange={(e) => {
                  const newAwards = [...formData.awards];
                  newAwards[index] = e.target.value;
                  onUpdate({
                    awards: newAwards
                  });
                }}
              />
            </div>
            <div className="flex-1">
              <Input
                type="date"
                value={formData.award_dates[award]?.split('T')[0] || ''}
                onChange={(e) => {
                  onUpdate({
                    award_dates: {
                      ...formData.award_dates,
                      [award]: new Date(e.target.value).toISOString()
                    }
                  });
                }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newAwards = formData.awards.filter((_, i) => i !== index);
                const newAwardDates = { ...formData.award_dates };
                delete newAwardDates[award];
                onUpdate({
                  awards: newAwards,
                  award_dates: newAwardDates
                });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onUpdate({
              awards: [...formData.awards, '']
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Award
        </Button>
      </div>
    </Card>
  );
}; 