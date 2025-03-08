import { motion } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ReviewData } from "@/types/Review";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { X, Image } from "lucide-react";

interface ReviewGalleryProps {
  screenshots: ReviewData["screenshots"];
}

export const ReviewGallery = ({ screenshots }: ReviewGalleryProps) => {
  if (screenshots.length === 0) return null;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Group screenshots into sets of 4 for the 2x2 grid
  const groupedScreenshots = screenshots.reduce((acc, curr, i) => {
    const groupIndex = Math.floor(i / 4);
    if (!acc[groupIndex]) {
      acc[groupIndex] = [];
    }
    acc[groupIndex].push(curr);
    return acc;
  }, [] as any[][]);

  return (
    <>
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl w-full rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Full size screenshot"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      <Card className="p-8 bg-card/95 backdrop-blur-md">
        <h3 className="text-2xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
          <Image className="w-6 h-6" />
          Screenshots
        </h3>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {groupedScreenshots.map((group, groupIndex) => (
              <CarouselItem key={groupIndex} className="pl-4">
                <div className="grid grid-cols-2 gap-4">
                  {group.map((screenshot, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      onClick={() => setSelectedImage(screenshot)}
                      className="cursor-pointer"
                    >
                      <AspectRatio ratio={16 / 9}>
                        <img
                          src={screenshot}
                          alt={`Screenshot ${groupIndex * 4 + index + 1}`}
                          className="rounded-lg object-cover w-full h-full hover:opacity-90 transition-opacity"
                        />
                      </AspectRatio>
                    </motion.div>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex items-center justify-end space-x-2 mt-4">
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>
      </Card>
    </>
  );
};
