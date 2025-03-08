import React, { useState, useEffect } from "react";
import { SectionsCarousel } from "@/components/home/SectionsCarousel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useBackgroundSettings } from "@/hooks/useBackgroundSettings";
import { 
  X, 
  Star, 
  Library, 
  Clock, 
  Medal, 
  Gem, 
  Coffee, 
  Swords,
  BookOpen,
  Gamepad,
  Heart,
  Trophy,
  Sparkles,
  Flame,
  Zap,
  Crown,
  Rocket,
  Bookmark,
  Award,
  ThumbsUp,
  Glasses,
  Lightbulb,
  Compass,
  MapPin,
  Gift,
  Palette,
  Music,
  Film,
  Tv2,
  Headphones,
  Camera,
  Puzzle,
  Dice5,
  Ghost,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Reuse the same interface from SectionsCarousel
interface SectionConfig {
  id: string;
  title: React.ReactNode;
  label: string;
  icon: () => JSX.Element;
}

interface CarouselModalProps {
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  buttonClassName?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  initialSlide?: number;
  onSectionChange?: (sectionId: string) => void;
  className?: string;
  modalTitle?: string;
}

// Define available icons
const availableIcons: Record<string, (props: any) => JSX.Element> = {
  Star: (props: any) => <Star {...props} />,
  Library: (props: any) => <Library {...props} />,
  Clock: (props: any) => <Clock {...props} />,
  Medal: (props: any) => <Medal {...props} />,
  Gem: (props: any) => <Gem {...props} />,
  Coffee: (props: any) => <Coffee {...props} />,
  Swords: (props: any) => <Swords {...props} />,
  BookOpen: (props: any) => <BookOpen {...props} />,
  Gamepad: (props: any) => <Gamepad {...props} />,
  Heart: (props: any) => <Heart {...props} />,
  Trophy: (props: any) => <Trophy {...props} />,
  Sparkles: (props: any) => <Sparkles {...props} />,
  Flame: (props: any) => <Flame {...props} />,
  Zap: (props: any) => <Zap {...props} />,
  Crown: (props: any) => <Crown {...props} />,
  Rocket: (props: any) => <Rocket {...props} />,
  Bookmark: (props: any) => <Bookmark {...props} />,
  Award: (props: any) => <Award {...props} />,
  ThumbsUp: (props: any) => <ThumbsUp {...props} />,
  Glasses: (props: any) => <Glasses {...props} />,
  Lightbulb: (props: any) => <Lightbulb {...props} />,
  Compass: (props: any) => <Compass {...props} />,
  MapPin: (props: any) => <MapPin {...props} />,
  Gift: (props: any) => <Gift {...props} />,
  Palette: (props: any) => <Palette {...props} />,
  Music: (props: any) => <Music {...props} />,
  Film: (props: any) => <Film {...props} />,
  Tv2: (props: any) => <Tv2 {...props} />,
  Headphones: (props: any) => <Headphones {...props} />,
  Camera: (props: any) => <Camera {...props} />,
  Puzzle: (props: any) => <Puzzle {...props} />,
  Dice5: (props: any) => <Dice5 {...props} />,
  Ghost: (props: any) => <Ghost {...props} />,
  Users: (props: any) => <Users {...props} />
};

// Map section IDs to their default icons
const defaultIconMap: Record<string, keyof typeof availableIcons> = {
  "featured": "Star",
  "browse_genres": "Library",
  "latest": "Clock",
  "genre_of_month": "Medal",
  "hidden_gems": "Gem",
  "cozy_corner": "Coffee",
  "developer_spotlight": "Users",
  "custom_section": "Swords", // Default icon for custom sections
};

const getModalBackground = (background: string) => {
  const gradients = {
    aurora: 'linear-gradient(to bottom right, rgb(245, 190, 220), rgb(235, 120, 170), rgb(70, 65, 75))',
    auroraBlue: 'linear-gradient(to bottom right, rgb(180, 210, 250), rgb(140, 180, 245), rgb(65, 70, 85))',
    lavender: 'linear-gradient(to bottom right, rgb(220, 200, 245), rgb(180, 160, 235), rgb(75, 70, 95))',
    peach: 'linear-gradient(to bottom right, rgb(245, 205, 180), rgb(235, 165, 140), rgb(85, 70, 75))',
    mint: 'linear-gradient(to bottom right, rgb(200, 235, 215), rgb(160, 225, 185), rgb(70, 85, 80))',
    lilac: 'linear-gradient(to bottom right, rgb(225, 205, 245), rgb(185, 165, 235), rgb(80, 70, 95))',
    rosePetal: 'linear-gradient(to bottom right, rgb(245, 210, 220), rgb(235, 170, 180), rgb(85, 65, 75))',
    babyBlue: 'linear-gradient(to bottom right, rgb(195, 220, 245), rgb(155, 180, 235), rgb(70, 75, 90))',
    coral: 'linear-gradient(to bottom right, rgb(245, 195, 185), rgb(235, 155, 145), rgb(90, 70, 75))',
    periwinkle: 'linear-gradient(to bottom right, rgb(205, 210, 245), rgb(165, 170, 235), rgb(75, 75, 95))'
  };
  return gradients[background as keyof typeof gradients] || gradients.aurora;
};

export const CarouselModal = ({ 
  buttonText = "Open Sections",
  buttonIcon,
  buttonClassName = "",
  buttonVariant = "outline",
  initialSlide = 0,
  onSectionChange,
  className = "",
  modalTitle
}: CarouselModalProps) => {
  const { modalBackground } = useBackgroundSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [currentGenreOfMonth, setCurrentGenreOfMonth] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Set up initial state on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Fetch sections when the modal opens
    if (isOpen) {
      fetchSectionOrder();
    }
  }, [isOpen]);

  // Update current section when sections change
  useEffect(() => {
    if (sections.length > 0 && initialSlide < sections.length) {
      setCurrentSection(sections[initialSlide].id);
    }
  }, [initialSlide, sections]);

  const fetchSectionOrder = async () => {
    try {
      setIsLoading(true);
      
      // Fetch section order from homepage_section_order table
      const { data: orderData, error: orderError } = await supabase
        .from('homepage_section_order')
        .select(`
          section_id,
          display_order,
          is_hidden,
          is_custom,
          icon_name,
          current_genre_id,
          genre:genres!homepage_section_order_current_genre_id_fkey(id, name)
        `)
        .order('display_order', { ascending: true });

      if (orderError) throw orderError;

      // Get current genre of the month
      const genreOfMonth = orderData?.find(section => 
        section.section_id === 'genre_of_month' && 
        section.genre?.name
      )?.genre?.name || await getCurrentGenreOfMonth();

      setCurrentGenreOfMonth(genreOfMonth);

      // Get custom icons from the database
      const customIconMap = new Map<string, keyof typeof availableIcons>();
      if (orderData) {
        orderData.forEach(item => {
          if (item.icon_name) {
            customIconMap.set(item.section_id, item.icon_name as keyof typeof availableIcons);
          }
        });
      }

      // Helper function to get the icon for a section
      const getIconForSection = (sectionId: string) => {
        // Check if there's a custom icon
        const customIcon = customIconMap.get(sectionId);
        if (customIcon && availableIcons[customIcon]) {
          return () => availableIcons[customIcon]({ width: 16, height: 16 });
        }
        
        // For standard sections, use the mapped default
        // For custom sections (not in defaultIconMap), use Swords
        const defaultIcon = defaultIconMap[sectionId] || "Swords";
        return () => availableIcons[defaultIcon]({ width: 16, height: 16 });
      };

      // Create base sections with current genre
      const baseSections: SectionConfig[] = [
        { id: "featured", title: <>Featured Reviews</>, label: "Featured Reviews", icon: getIconForSection("featured") },
        { id: "latest", title: <>Latest Reviews</>, label: "Latest Reviews", icon: getIconForSection("latest") },
        {
          id: "genre_of_month",
          title: <>Genre of the Month ({genreOfMonth})</>,
          label: `Genre of the Month (${genreOfMonth})`,
          icon: getIconForSection("genre_of_month"),
        },
        { id: "hidden_gems", title: <>Hidden Gems</>, label: "Hidden Gems", icon: getIconForSection("hidden_gems") },
        { id: "cozy_corner", title: <>Cozy Corner</>, label: "Cozy Corner", icon: getIconForSection("cozy_corner") },
        { id: "browse_genres", title: <>Browse Genres</>, label: "Browse Genres", icon: getIconForSection("browse_genres") },
        { id: "developer_spotlight", title: <>Our Authors</>, label: "Our Authors", icon: getIconForSection("developer_spotlight") },
      ];

      // Process custom sections from homepage_section_order
      const customSections = orderData
        ?.filter(section => section.is_custom)
        .map(section => ({
          id: section.section_id,
          title: <>{section.section_id.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}</>,
          label: section.section_id.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          icon: getIconForSection(section.section_id)
        })) || [];

      const allSections = [...baseSections, ...customSections];

      // Fetch content counts for each section
      const countPromises = allSections.map(section => {
        const now = new Date().toISOString();
        const baseQuery = supabase.from("reviews").select("*", { count: "exact", head: true })
          .or(`scheduled_for.is.null,scheduled_for.lte.${now}`);

        if (section.id === "browse_genres") return Promise.resolve(1); // Always has content
        else if (section.id === "developer_spotlight") return Promise.resolve(1); // Always has content
        else if (section.id === "featured") {
          return baseQuery
            .contains("homepage_sections", ["featured"])
            .then(({ count }) => count || 0);
        }
        else if (section.id === "latest") {
          return baseQuery
            .then(({ count }) => count || 0);
        }
        else if (section.id === "genre_of_month") {
          // For genre_of_month, first check if there's a current_genre_id in the homepage_section_order table
          return supabase
            .from('homepage_section_order')
            .select('current_genre_id')
            .eq('section_id', 'genre_of_month')
            .single()
            .then(({ data: sectionData }) => {
              if (sectionData?.current_genre_id) {
                // If there's a current genre, check for reviews with that genre_id
                return baseQuery
                  .eq('genre_id', sectionData.current_genre_id)
                  .then(({ count }) => count || 0);
              } else {
                // Fallback to checking for reviews with genre_of_month in homepage_sections
                return baseQuery
                  .contains("homepage_sections", ["genre_of_month"])
                  .then(({ count }) => count || 0);
              }
            });
        }
        else if (section.id === "hidden_gems") {
          return baseQuery
            .contains("homepage_sections", ["hidden_gems"])
            .then(({ count }) => count || 0);
        }
        else if (section.id === "cozy_corner") {
          return baseQuery
            .contains("homepage_sections", ["cozy_corner"])
            .then(({ count }) => count || 0);
        }
        else {
          // For custom sections, check if the section ID is in the homepage_sections array
          return baseQuery
            .contains("homepage_sections", [section.id])
            .then(({ count }) => count || 0);
        }
      });

      const counts = await Promise.all(countPromises);
      
      // Only include sections that have content and aren't hidden
      const sectionsWithContent = allSections.filter((_, index) => 
        counts[index] > 0 && 
        !orderData?.find(order => 
          order.section_id === allSections[index].id && 
          order.is_hidden
        )
      );
      
      // Apply the order from homepage_section_order table
      if (orderData && orderData.length > 0) {
        // Create a map for quick lookup of sections by ID
        const sectionsMap = new Map(sectionsWithContent.map(section => [section.id, section]));
        
        // Create an array of ordered sections based on the order data
        const orderedResult = orderData
          .filter(order => !order.is_hidden) // Filter out hidden sections
          .map(order => sectionsMap.get(order.section_id))
          .filter((section): section is SectionConfig => section !== undefined);
        
        // Add any sections that aren't in the order table at the end
        const unorderedSections = sectionsWithContent.filter(
          section => !orderData.some(order => order.section_id === section.id)
        );
        
        // Set the final ordered sections
        setSections([...orderedResult, ...unorderedSections]);
      } else {
        // If no order data, just use the sections with content
        setSections(sectionsWithContent);
      }
    } catch (error) {
      console.error('Error fetching section order:', error);
      // Fallback to default sections
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    setCurrentSection(sectionId);
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
  };

  // Handle closing the modal
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant}
          className={`transition-all hover:bg-rose-500/10 hover:text-rose-500 ${buttonClassName} ${
            !buttonText && buttonIcon ? 'flex items-center justify-center' : ''
          }`}
        >
          {buttonIcon && (
            <span className={`inline-flex items-center justify-center ${buttonText ? 'mr-2' : ''}`}>
              {buttonIcon}
            </span>
          )}
          {buttonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className={`max-w-[95vw] max-h-[95vh] w-[1225px] h-[1100px] overflow-hidden rounded-lg ${className}`}
        style={{
          background: getModalBackground(modalBackground)
        }}
      >
        <div className="relative h-full w-full overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-4 border-rose-500 rounded-full border-t-transparent"></div>
            </div>
          ) : sections.length > 0 ? (
            <SectionsCarousel 
              sections={sections} 
              initialSlide={initialSlide} 
              isModal={true}
              onSectionChange={handleSectionChange}
              onArticleClick={() => setIsOpen(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No sections available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to get current genre of the month
const getCurrentGenreOfMonth = async (): Promise<string> => {
  try {
    // Try to get the genre of the month from reviews with the genre_of_month section
    const { data } = await supabase
      .from('reviews')
      .select('genre_id')
      .contains('homepage_sections', ['genre_of_month'])
      .limit(1);
    
    if (data && data.length > 0 && data[0].genre_id) {
      // Get the genre name
      const { data: genreData } = await supabase
        .from('genres')
        .select('name')
        .eq('id', data[0].genre_id)
        .single();
      
      return genreData?.name || 'RPG';
    }
    
    return 'RPG'; // Default fallback
  } catch (error) {
    console.error('Error fetching genre of the month:', error);
    return 'RPG'; // Default fallback on error
  }
}; 