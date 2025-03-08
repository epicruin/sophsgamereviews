import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Link as LinkIcon } from "lucide-react";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { ReviewFormData } from "./types";

interface ReleaseDetailsProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const ReleaseDetails = ({ formData, onUpdate }: ReleaseDetailsProps) => {
  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Release Details</h3>
        <div className="z-10">
          <AIGenerateButton
            gameTitle={formData.title}
            section="releaseDetails"
            onGenerated={(details) => {
              console.log("Received release details:", details);
              if (details) {
                onUpdate({
                  developer: details.developer || formData.developer,
                  publisher: details.publisher || formData.publisher,
                  ageRating: details.ageRating || formData.ageRating,
                  priceUSD: details.priceUSD || formData.priceUSD,
                  priceGBP: details.priceGBP || formData.priceGBP,
                  priceEUR: details.priceEUR || formData.priceEUR,
                  releaseDate: details.releaseDate || formData.releaseDate,
                  systems: details.systems || formData.systems,
                  purchaseLinks: details.purchaseLinks || formData.purchaseLinks
                });
              }
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            placeholder="Developer"
            value={formData.developer}
            onChange={(e) => onUpdate({ developer: e.target.value })}
          />
          <Input
            placeholder="Publisher"
            value={formData.publisher}
            onChange={(e) => onUpdate({ publisher: e.target.value })}
          />
          <Input
            placeholder="Age Rating"
            value={formData.ageRating}
            onChange={(e) => onUpdate({ ageRating: e.target.value })}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-center block">Available Systems</label>
            <div className="flex flex-col items-center gap-2">
              {formData.systems.map((system, index) => (
                <div key={index} className="flex items-center gap-2 w-full max-w-xs">
                  <Input
                    value={system}
                    onChange={(e) => onUpdate({
                      systems: formData.systems.map((s, i) => i === index ? e.target.value : s)
                    })}
                    placeholder="Add system"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => onUpdate({
                      systems: formData.systems.filter((_, i) => i !== index)
                    })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onUpdate({ systems: [...formData.systems, ""] })}
              >
                <Plus className="h-4 w-4 mr-2" /> Add System
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Input
            type="number"
            step="0.01"
            placeholder="Price in $"
            value={formData.priceUSD || ''}
            onChange={(e) => onUpdate({ priceUSD: parseFloat(e.target.value) })}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Price in £"
            value={formData.priceGBP || ''}
            onChange={(e) => onUpdate({ priceGBP: parseFloat(e.target.value) })}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Price in €"
            value={formData.priceEUR || ''}
            onChange={(e) => onUpdate({ priceEUR: parseFloat(e.target.value) })}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-center block">Release date</label>
            <div className="flex justify-center">
              <Input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => onUpdate({ releaseDate: e.target.value })}
                className="w-40"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Where to Buy section - centered and full width */}
      <div className="mt-8 pt-6 border-t border-border">
        <h4 className="text-center font-semibold mb-4">Where to Buy</h4>
        <div className="max-w-xl mx-auto">
          <div className="space-y-4">
            {formData.purchaseLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <Input
                    value={link.name}
                    onChange={(e) => onUpdate({
                      purchaseLinks: formData.purchaseLinks.map((l, i) => 
                        i === index ? { ...l, name: e.target.value } : l
                      )
                    })}
                    placeholder="Store name (e.g. Steam)"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => onUpdate({
                      purchaseLinks: formData.purchaseLinks.map((l, i) => 
                        i === index ? { ...l, url: e.target.value } : l
                      )
                    })}
                    placeholder="URL"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => onUpdate({
                    purchaseLinks: formData.purchaseLinks.filter((_, i) => i !== index)
                  })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex justify-center mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onUpdate({ 
                  purchaseLinks: [...formData.purchaseLinks, { name: "", url: "" }] 
                })}
              >
                <LinkIcon className="h-4 w-4 mr-2" /> Add Purchase Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 