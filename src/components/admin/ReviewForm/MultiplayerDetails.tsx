import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { ReviewFormData } from "./types";

interface MultiplayerDetailsProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const MultiplayerDetails = ({ formData, onUpdate }: MultiplayerDetailsProps) => {
  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Multiplayer Details</h3>
        <div className="z-10">
          <AIGenerateButton
            gameTitle={formData.title}
            section="multiplayerDetails"
            onGenerated={(details) => {
              if (details) {
                onUpdate({
                  online_coop: details.online_coop ?? formData.online_coop,
                  couch_coop: details.couch_coop ?? formData.couch_coop,
                  split_screen: details.split_screen ?? formData.split_screen,
                  max_players: details.max_players ?? formData.max_players
                });
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="online_coop" 
              checked={formData.online_coop}
              onCheckedChange={(checked) => onUpdate({ online_coop: !!checked })}
            />
            <Label htmlFor="online_coop">Online Co-Op</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="couch_coop" 
              checked={formData.couch_coop}
              onCheckedChange={(checked) => onUpdate({ couch_coop: !!checked })}
            />
            <Label htmlFor="couch_coop">Couch Co-Op</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="split_screen" 
              checked={formData.split_screen}
              onCheckedChange={(checked) => onUpdate({ split_screen: !!checked })}
            />
            <Label htmlFor="split_screen">Split Screen</Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="max_players">Maximum Number of Players</Label>
          <Input
            id="max_players"
            type="number"
            min="0"
            value={formData.max_players || ''}
            onChange={(e) => onUpdate({ max_players: parseInt(e.target.value) || 0 })}
            placeholder="Enter maximum number of players"
          />
        </div>
      </div>
    </Card>
  );
}; 