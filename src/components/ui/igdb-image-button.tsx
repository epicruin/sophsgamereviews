import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import { getGameImages } from "@/lib/igdb";
import { toast } from "sonner";

interface IGDBImageButtonProps {
  gameTitle: string;
  onImagesFound: (images: { cover: string; screenshots: string[] }) => void;
}

export const IGDBImageButton = ({ gameTitle, onImagesFound }: IGDBImageButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!gameTitle) {
      toast.error("Please enter a game title first");
      return;
    }

    try {
      setIsLoading(true);
      const images = await getGameImages(gameTitle);
      onImagesFound(images);
      toast.success("Images fetched successfully");
    } catch (error: any) {
      console.error('Error fetching images:', error);
      toast.error(error.message || "Failed to fetch images");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      title="Fetch images from IGDB"
      className="h-8 w-8"
    >
      <Image className="h-4 w-4" />
    </Button>
  );
}; 