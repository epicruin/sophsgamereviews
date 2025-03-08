import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, LayoutTemplate, Move } from "lucide-react";
import { IGDBImageButton } from "@/components/ui/igdb-image-button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReviewFormData } from "./types";
import { ImagePositionModal } from "./ImagePositionModal";

interface ImagesSectionProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const ImagesSection = ({ formData, onUpdate }: ImagesSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "main" | "heading" | "screenshot") => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("reviews")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("reviews")
        .getPublicUrl(fileName);

      if (type === "main") {
        onUpdate({ image: publicUrl, imagePosition: 50 }); // Default position
      } else if (type === "heading") {
        onUpdate({ headingImage: publicUrl });
      } else {
        onUpdate({ screenshots: [...formData.screenshots, publicUrl] });
      }
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePositionSave = (position: number) => {
    onUpdate({ imagePosition: position });
    setShowPositionModal(false);
    toast.success("Image position saved");
  };

  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Images</h3>
        <div className="z-10">
          <IGDBImageButton
            gameTitle={formData.title}
            onImagesFound={(images) => {
              onUpdate({
                image: images.cover,
                imagePosition: 50, // Default position
                screenshots: [...formData.screenshots, ...images.screenshots]
              });
            }}
          />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Card Image</label>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "main")}
              />
              {formData.image && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPositionModal(true)}
                  title="Adjust image position"
                >
                  <Move className="h-4 w-4" />
                </Button>
              )}
            </div>
            {formData.image && (
              <div className="flex items-center gap-2">
                <img src={formData.image} alt="Preview" className="w-20 h-20 object-cover rounded" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => onUpdate({ image: "", imagePosition: undefined })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Single Review Heading Image</label>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "heading")}
              />
            </div>
            {formData.headingImage && (
              <div className="flex items-center gap-2">
                <img src={formData.headingImage} alt="Preview" className="w-20 h-20 object-cover rounded" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => onUpdate({ headingImage: null })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Screenshots (max 20)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.screenshots.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt={`Screenshot ${index + 1}`} className="w-full aspect-video object-cover rounded" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate({ headingImage: url })}
                    title="Use as single review heading image"
                  >
                    <LayoutTemplate className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onUpdate({
                      screenshots: formData.screenshots.filter((_, i) => i !== index)
                    })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {formData.screenshots.length < 20 && (
              <div className="aspect-video flex items-center justify-center border-2 border-dashed rounded">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "screenshot")}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      <ImagePositionModal
        open={showPositionModal}
        onOpenChange={setShowPositionModal}
        image={formData.image || ""}
        title={formData.title}
        excerpt={formData.excerpt}
        initialPosition={formData.imagePosition}
        onSave={handlePositionSave}
      />
    </Card>
  );
}; 