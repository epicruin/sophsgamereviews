import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Fixed import path
import { HeroSection } from "@/components/home/HeroSection"; // Fixed import path
import { StaticStarsBackground } from "@/components/home/StaticStarsBackground";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import { AuroraBackgroundBlue } from "@/components/home/AuroraBackgroundBlue";
import { ShootingStarsBackground } from "@/components/home/ShootingStarsBackground";
import { SectionsCarousel } from "@/components/home/SectionsCarousel";
import { LatestArticlesSection } from "@/components/home/LatestArticlesSection";
import { 
  Star, 
  Medal, 
  Gem, 
  Coffee, 
  Library, 
  Clock, 
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
  Users,
  Settings2,
  ArrowUp,
  ArrowDown
} from "lucide-react"; // Updated icons import
import { useBackgroundSettings } from "@/hooks/useBackgroundSettings";
import { StaticBackground } from "@/components/home/StaticBackground";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

type HomepageSection =
  | "featured"
  | "latest"
  | "genre_of_month"
  | "hidden_gems"
  | "cozy_corner"
  | "browse_genres"
  | "developer_spotlight"
  | string;

interface SectionConfig {
  id: HomepageSection;
  title: JSX.Element;
  label: string;
  icon: () => JSX.Element;
}

// Define available icons
const availableIcons = {
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

const Index = () => {
  const { homepageBackground } = useBackgroundSettings();
  const [orderedSections, setOrderedSections] = useState<SectionConfig[]>([]);
  const [isGamePlaying, setIsGamePlaying] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [currentGenreOfMonth, setCurrentGenreOfMonth] = useState("");

  // Add arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If the game is playing, don't allow down arrow navigation
      if (isGamePlaying && e.key === 'ArrowDown') {
        e.preventDefault();
        return;
      }
      
      // Get hero section height to know where to scroll
      const heroSection = document.getElementById('hero-section');
      if (!heroSection) return;
      
      // Get viewport height
      const viewportHeight = window.innerHeight;
      
      // Current scroll position
      const currentScroll = window.scrollY;
      
      // Get articles section
      const articlesSection = document.getElementById('latest-articles');
      if (!articlesSection) return;
      
      const articlesSectionTop = articlesSection.offsetTop;
      
      if (e.key === 'ArrowDown') {
        // If we're at the top, scroll to the sections
        if (currentScroll < viewportHeight / 2) {
          window.scrollTo({
            top: viewportHeight,
            behavior: 'smooth'
          });
          e.preventDefault();
        } 
        // If we're at sections but not yet at articles, scroll to articles
        else if (currentScroll < articlesSectionTop - (viewportHeight / 2)) {
          window.scrollTo({
            top: articlesSectionTop,
            behavior: 'smooth'
          });
          e.preventDefault();
        }
        // Disable down key when at latest articles section
        else if (currentScroll >= articlesSectionTop - (viewportHeight / 2)) {
          e.preventDefault();
        }
      } else if (e.key === 'ArrowUp') {
        // If we're at hero section (near the top), don't allow further up navigation
        if (currentScroll < viewportHeight / 2) {
          e.preventDefault();
          return;
        }
        // If we're at articles section, scroll to sections
        else if (currentScroll >= articlesSectionTop - 100) {
          window.scrollTo({
            top: viewportHeight,
            behavior: 'smooth'
          });
          e.preventDefault();
        } 
        // If we're at sections, scroll to top
        else if (currentScroll >= viewportHeight / 2) {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGamePlaying]);

  useEffect(() => {
    const restoreScroll = () => window.scrollTo(0, 0);
    window.addEventListener("beforeunload", restoreScroll);
    restoreScroll();
    return () => window.removeEventListener("beforeunload", restoreScroll);
  }, []);

  useEffect(() => {
    fetchSectionOrder();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleGameStateChange = (e: CustomEvent) => {
      setIsGamePlaying(e.detail.gameState === "playing");
    };
    window.addEventListener("gameStateChange", handleGameStateChange as EventListener);
    return () => window.removeEventListener("gameStateChange", handleGameStateChange as EventListener);
  }, []);

  const fetchSectionOrder = async () => {
    try {
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
      console.log('Section counts:', allSections.map((section, i) => ({ id: section.id, count: counts[i] })));
      
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
        setOrderedSections([...orderedResult, ...unorderedSections]);
      } else {
        // If no order data, just use the sections with content
        setOrderedSections(sectionsWithContent);
      }
    } catch (error) {
      console.error('Error fetching section order:', error);
      // Fallback to default sections
      setOrderedSections([]);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StaticStarsBackground />
      {homepageBackground === undefined ? null : homepageBackground === 'aurora' ? (
        <AuroraBackground />
      ) : homepageBackground === 'auroraBlue' ? (
        <AuroraBackgroundBlue />
      ) : (
        <StaticBackground color={homepageBackground} />
      )}
      <ShootingStarsBackground />

      <section id="hero-section" className="h-screen">
        <HeroSection />
      </section>
      
      <section id="carousel-sections" className="min-h-screen pb-16">
        <SectionsCarousel sections={orderedSections} />
      </section>

      <section id="latest-articles" className="min-h-[90vh] pb-16">
        <LatestArticlesSection />
      </section>

      {/* Floating Controls Info Icon - Left */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <motion.button 
              className="fixed bottom-6 left-6 z-50 rounded-full p-3 bg-gradient-to-br from-rose-400/80 via-pink-400/80 to-rose-400/80 text-white border border-rose-300/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] hidden xl:block"
              aria-label="Navigation Controls Info"
              initial={{ scale: 1 }}
              whileHover={{ 
                scale: 1.1,
                background: "linear-gradient(to bottom right, rgba(225,29,72,0.9), rgba(244,63,94,0.9), rgba(225,29,72,0.9))",
                boxShadow: "0 0 20px rgba(244,63,94,0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Settings2 className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-white text-sm px-3 py-1.5"
          >
            Use ↑↓ arrows to navigate sections
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Floating Space Invader - Right */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <motion.button 
              className="fixed bottom-6 right-6 z-50 rounded-full p-3 bg-gradient-to-br from-rose-400/80 via-pink-400/80 to-rose-400/80 text-white border border-rose-300/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] hidden xl:block"
              aria-label="Space Invader"
              initial={{ scale: 1 }}
              whileHover={{ 
                scale: 1.1,
                background: "linear-gradient(to bottom right, rgba(225,29,72,0.9), rgba(244,63,94,0.9), rgba(225,29,72,0.9))",
                boxShadow: "0 0 20px rgba(244,63,94,0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src="/spaceinvaders-enemy-emerald.svg" 
                alt="Space Invader" 
                className="w-5 h-5"
              />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent 
            side="left" 
            className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-white text-sm px-3 py-1.5"
          >
            GAME CONTROLS:   ← → to move   ⎵ to shoot
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

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

export default Index;