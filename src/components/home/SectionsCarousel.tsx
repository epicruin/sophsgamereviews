import React, { useState, useEffect } from "react";
import { SectionContainer } from "@/components/shared/SectionContainer";
import { DeveloperSpotlightSection } from "@/components/home/DeveloperSpotlightSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SectionConfig {
  id: string;
  title: React.ReactNode;
  label: string;
  icon: () => JSX.Element;
}

interface SectionsCarouselProps {
  sections: SectionConfig[];
  initialSlide?: number;
  isModal?: boolean;
  onSectionChange?: (sectionId: string) => void;
  onArticleClick?: () => void;
}

export const SectionsCarousel = ({ 
  sections, 
  initialSlide = 0,
  isModal = false,
  onSectionChange,
  onArticleClick
}: SectionsCarouselProps) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isChangingSlide, setIsChangingSlide] = useState(false);

  useEffect(() => {
    if (carouselApi && initialSlide > 0 && initialSlide < sections.length) {
      carouselApi.scrollTo(initialSlide);
    }
  }, [carouselApi, initialSlide, sections.length]);

  useEffect(() => {
    if (!carouselApi) return;
    
    const onChange = () => {
      const newIndex = carouselApi.selectedScrollSnap();
      setCurrentSlide(newIndex);
      
      if (onSectionChange && sections[newIndex]) {
        onSectionChange(sections[newIndex].id);
      }
    };

    const onSettled = () => {
      setIsChangingSlide(false);
    };

    const onSelect = () => {
      setIsChangingSlide(true);
      setTimeout(() => {
        onChange();
      }, 50);
    };
    
    carouselApi.on("select", onSelect);
    carouselApi.on("settle", onSettled);
    carouselApi.on("reInit", onChange);
    
    return () => {
      carouselApi.off("select", onSelect);
      carouselApi.off("settle", onSettled);
      carouselApi.off("reInit", onChange);
    };
  }, [carouselApi, onSectionChange, sections]);

  useEffect(() => {
    if (!carouselApi) return;
    
    const totalSlides = sections.length;
    if (totalSlides <= 1) return;
    
    const nextSlide = (currentSlide + 1) % totalSlides;
    const prevSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    
    carouselApi.scrollSnapList();
    
  }, [currentSlide, carouselApi, sections.length]);

  const renderDotNav = () => (
    <div className={`flex flex-wrap items-center justify-center gap-1 sm:gap-2 mx-1 sm:mx-2 py-1 sm:py-2 px-2 sm:px-3 rounded-full bg-rose-500/10 backdrop-blur-sm relative z-[9999]`}>
      <TooltipProvider>
        {sections.map((section, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setIsChangingSlide(true);
                  carouselApi?.scrollTo(i);
                }}
                className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all ${
                  i === currentSlide
                    ? "bg-rose-500 text-white scale-110 shadow-md shadow-rose-500/30"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 hover:text-white"
                }`}
                aria-label={`Go to ${section.label}`}
              >
                <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex items-center justify-center">
                  {section.icon()}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-white text-sm px-3 py-1.5 z-[9999]"
              style={{ zIndex: 9999, position: 'relative' }}
            >
              {section.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );

  return (
    <section className={`relative ${isModal ? 'h-full' : ''} pb-0 mb-0`}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
          skipSnaps: false,
          dragFree: false,
          duration: 25,
          watchDrag: false,
          startIndex: initialSlide,
        }}
        className="w-full h-full"
        setApi={setCarouselApi}
      >
        <CarouselContent className="h-full">
          {sections.map((section) => (
            <CarouselItem 
              key={section.id} 
              className={`basis-full h-full flex items-center transition-opacity duration-300 ${
                isChangingSlide ? 'opacity-95' : 'opacity-100'
              }`}
            >
              {section.id === "browse_genres" ? (
                <div className="container mx-auto px-4 w-full max-w-full 3xl:max-w-[1920px] 4xl:max-w-[2400px]">
                  <SectionContainer
                    id={`section-${section.id}`}
                    title={section.title}
                    sectionType="genres"
                    dotNavPosition={renderDotNav()}
                    className="genres-section"
                  />
                </div>
              ) : section.id === "developer_spotlight" ? (
                <div className="container mx-auto px-4 w-full max-w-full 3xl:max-w-[1920px] 4xl:max-w-[2400px]">
                  <DeveloperSpotlightSection 
                    dotNavPosition={renderDotNav()}
                  />
                </div>
              ) : (
                <div className="container mx-auto px-4 w-full max-w-full 3xl:max-w-[1920px] 4xl:max-w-[2400px]">
                  <SectionContainer
                    id={`section-${section.id}`}
                    title={section.title}
                    sectionType="reviews"
                    variant="medium"
                    section={section.id}
                    dotNavPosition={renderDotNav()}
                    onArticleClick={onArticleClick}
                  />
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};