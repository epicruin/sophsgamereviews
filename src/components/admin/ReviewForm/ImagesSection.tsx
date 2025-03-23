import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, LayoutTemplate, Move, Loader2 } from "lucide-react";
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
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "main" | "heading" | "screenshot") => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsLoading(true);
      
      if (type === "screenshot") {
        setUploadingScreenshot(true);
        
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
          toast.error("Please select image files only");
          return;
        }
        
        // Limit the number of screenshots to upload
        const availableSlots = 20 - formData.screenshots.length;
        const filesToUpload = imageFiles.slice(0, availableSlots);
        
        if (filesToUpload.length < imageFiles.length) {
          toast.info(`Only uploading ${filesToUpload.length} of ${imageFiles.length} images due to the 20 screenshot limit.`);
        }
        
        setUploadProgress({ current: 0, total: filesToUpload.length });
        
        const uploadedUrls = [];
        
        for (let i = 0; i < filesToUpload.length; i++) {
          const url = await uploadFile(filesToUpload[i], type);
          if (url) {
            uploadedUrls.push(url);
          }
          setUploadProgress({ current: i + 1, total: filesToUpload.length });
        }
        
        if (uploadedUrls.length > 0) {
          onUpdate({ screenshots: [...formData.screenshots, ...uploadedUrls] });
          toast.success(`Uploaded ${uploadedUrls.length} screenshots successfully`);
        }
      } else {
        // For single files (main image and heading image)
        await uploadFile(files[0], type);
      }
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setIsLoading(false);
      setUploadingScreenshot(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const uploadFile = async (file: File, type: "main" | "heading" | "screenshot"): Promise<string | null> => {
    try {
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
      } 
      
      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadingScreenshot) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadingScreenshot) return;
    setIsDragging(true);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (uploadingScreenshot) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    // Filter for image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error("Please drop image files only");
      return;
    }
    
    try {
      setUploadingScreenshot(true);
      
      // Limit the number of screenshots to upload
      const availableSlots = 20 - formData.screenshots.length;
      const filesToUpload = imageFiles.slice(0, availableSlots);
      
      if (filesToUpload.length < imageFiles.length) {
        toast.info(`Only uploading ${filesToUpload.length} of ${imageFiles.length} images due to the 20 screenshot limit.`);
      }
      
      setUploadProgress({ current: 0, total: filesToUpload.length });
      
      const uploadedUrls = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const url = await uploadFile(filesToUpload[i], "screenshot");
        if (url) {
          uploadedUrls.push(url);
        }
        setUploadProgress({ current: i + 1, total: filesToUpload.length });
      }
      
      if (uploadedUrls.length > 0) {
        onUpdate({ screenshots: [...formData.screenshots, ...uploadedUrls] });
        toast.success(`Uploaded ${uploadedUrls.length} screenshots successfully`);
      }
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setUploadingScreenshot(false);
      setUploadProgress({ current: 0, total: 0 });
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
              <div 
                className={`aspect-video flex items-center justify-center border-2 border-dashed rounded cursor-pointer relative group overflow-hidden ${isDragging ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'} transition-colors`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "screenshot")}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  id="screenshot-upload"
                  disabled={uploadingScreenshot}
                  multiple
                />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  {uploadingScreenshot ? (
                    <>
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      {uploadProgress.total > 1 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-primary">Uploading {uploadProgress.current} of {uploadProgress.total}</span>
                          <div className="w-24 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-200" 
                              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-primary">Uploading...</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                        {isDragging ? "Drop to upload" : "Click or drag images here"}
                      </span>
                      <span className="text-xs text-muted-foreground">You can select multiple images</span>
                    </>
                  )}
                </div>
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