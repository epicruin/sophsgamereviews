import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { searchImages, generateArticleContent } from "@/lib/article-openai";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ImageSearchButtonProps {
  articleTitle: string;
  onImageSelected: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ImageSearchButton({
  articleTitle,
  onImageSelected,
  disabled = false
}: ImageSearchButtonProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const generateSearchQuery = async () => {
    if (!articleTitle.trim()) {
      toast.error("Please enter an article title first");
      return;
    }

    try {
      setIsSearching(true);
      
      // Generate an image search query based on the article title
      const result = await generateArticleContent(articleTitle, "imageQuery");
      const query = result.imageQuery || articleTitle;
      setSearchQuery(query);
      
      // Use the generated query to search for images
      await handleSearch(query);
    } catch (error: any) {
      console.error("Search query generation error:", error);
      toast.error(error.message || "Failed to generate search query");
      setIsSearching(false);
    }
  };

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    try {
      setIsSearching(true);
      const imageUrls = await searchImages(query);
      
      if (imageUrls && imageUrls.length > 0) {
        setImages(imageUrls);
        toast.success(`Found ${imageUrls.length} images`);
      } else {
        toast.error("No images found");
      }
    } catch (error: any) {
      console.error("Image search error:", error);
      toast.error(error.message || "Failed to search for images");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    onImageSelected(imageUrl);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isSearching}
          onClick={(e) => {
            e.preventDefault();
            setIsDialogOpen(true);
            if (images.length === 0) {
              generateSearchQuery();
            }
          }}
          className="h-8 w-8"
        >
          <ImageIcon className={`h-4 w-4 ${isSearching ? 'animate-pulse' : ''}`} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search for Images</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 my-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for images..."
            className="flex-1"
          />
          <Button 
            onClick={() => handleSearch()} 
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
        
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {images.map((imageUrl, index) => (
              <div 
                key={index}
                className="aspect-video relative border rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleSelectImage(imageUrl)}
              >
                <img 
                  src={imageUrl} 
                  alt={`Search result ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {isSearching ? "Searching for images..." : "No images found. Try searching for something else."}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 