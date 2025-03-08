import React from "react";
import { CarouselModal } from "./CarouselModal";
import { Menu, Grid } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Reuse the same interface from SectionsCarousel
interface SectionConfig {
  id: string;
  title: React.ReactNode;
  label: string;
  icon: () => JSX.Element;
}

interface ReviewCarouselButtonProps {
  initialSlide?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "fixed" | "responsive";
  onSectionChange?: (sectionId: string) => void;
  className?: string;
}

export const ReviewCarouselButton = ({
  initialSlide = 0,
  position = "top-right",
  onSectionChange,
  className = ""
}: ReviewCarouselButtonProps) => {
  // Define position classes
  const positionClasses = {
    "top-right": "absolute top-4 right-4",
    "top-left": "absolute top-4 left-4",
    "bottom-right": "absolute bottom-4 right-4", 
    "bottom-left": "absolute bottom-4 left-4",
    "fixed": "fixed top-4 right-4 z-50",
    "responsive": "fixed z-50 max-[480px]:bottom-4 max-[480px]:right-4 min-[480px]:top-4 min-[480px]:right-4"
  };

  return (
    <motion.div 
      className={`${positionClasses[position]} ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <CarouselModal
                initialSlide={initialSlide}
                onSectionChange={onSectionChange}
                buttonIcon={<Grid className="h-4 w-4 stroke-[2.5px]" />}
                buttonText=""
                buttonClassName="w-10 h-10 rounded-full p-0 inline-flex items-center justify-center shadow-md bg-gradient-to-br from-rose-400/80 via-pink-400/80 to-rose-400/80 hover:from-rose-600/90 hover:via-rose-500/90 hover:to-pink-600/90 text-white hover:text-white border border-rose-300/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                buttonVariant="default"
                modalTitle="All Sections"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="left" 
            className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-white text-sm px-3 py-1.5"
          >
            Browse All Reviews
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}; 