import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Save } from "lucide-react";
import { LargeCard } from "@/components/cards/LargeCard";
import { MediumCard } from "@/components/cards/MediumCard";

interface ImagePositionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: string;
  title: string;
  excerpt: string;
  initialPosition?: number;
  onSave: (position: number) => void;
}

export const ImagePositionModal = ({
  open,
  onOpenChange,
  image,
  title,
  excerpt,
  initialPosition = 50,
  onSave
}: ImagePositionModalProps) => {
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const adjustPosition = (delta: number) => {
    setPosition(prev => Math.max(0, Math.min(100, prev + delta)));
  };

  const dummyData = {
    id: "preview",
    title,
    image,
    rating: 9.5,
    excerpt,
    author: {
      name: "Preview User",
      avatar: "https://github.com/shadcn.png"
    },
    likes: 42,
    genre: "Preview"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Preview Card Layout</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustPosition(-5)}
                title="Move image up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <span className="min-w-[4rem] text-center">{position}%</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustPosition(5)}
                title="Move image down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onSave(position)}
                className="ml-4"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Position
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <h3 className="text-lg font-medium mb-4">Medium Card</h3>
              <div className="w-full max-w-md mx-auto">
                <MediumCard {...dummyData} imagePosition={position} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium mb-4">Large Card</h3>
              <div className="w-full max-w-2xl mx-auto">
                <LargeCard {...dummyData} imagePosition={position} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 