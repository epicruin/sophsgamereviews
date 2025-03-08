import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  GripVertical, 
  Star, 
  Library, 
  Clock, 
  Medal, 
  Gem, 
  Coffee, 
  Swords,
  ChevronUp, 
  ChevronDown,
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
  Eye,
  EyeOff,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";

// Define available icons
const availableIcons = {
  Star: <Star className="h-4 w-4" />,
  Library: <Library className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Medal: <Medal className="h-4 w-4" />,
  Gem: <Gem className="h-4 w-4" />,
  Coffee: <Coffee className="h-4 w-4" />,
  Swords: <Swords className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Gamepad: <Gamepad className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Trophy: <Trophy className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Flame: <Flame className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Crown: <Crown className="h-4 w-4" />,
  Rocket: <Rocket className="h-4 w-4" />,
  Bookmark: <Bookmark className="h-4 w-4" />,
  Award: <Award className="h-4 w-4" />,
  ThumbsUp: <ThumbsUp className="h-4 w-4" />,
  Glasses: <Glasses className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Compass: <Compass className="h-4 w-4" />,
  MapPin: <MapPin className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
  Palette: <Palette className="h-4 w-4" />,
  Music: <Music className="h-4 w-4" />,
  Film: <Film className="h-4 w-4" />,
  Tv2: <Tv2 className="h-4 w-4" />,
  Headphones: <Headphones className="h-4 w-4" />,
  Camera: <Camera className="h-4 w-4" />,
  Puzzle: <Puzzle className="h-4 w-4" />,
  Dice5: <Dice5 className="h-4 w-4" />,
  Ghost: <Ghost className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />
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

interface Section {
  id: string;
  title: string;
  icon: JSX.Element;
  iconName?: string;
  isHiding?: boolean;
  isCustom?: boolean;
}

const defaultSections: Section[] = [
  { id: "featured", title: "Featured Reviews", icon: availableIcons.Star, iconName: "Star" },
  { id: "browse_genres", title: "Browse by Genre", icon: availableIcons.Library, iconName: "Library" },
  { id: "latest", title: "Latest Reviews", icon: availableIcons.Clock, iconName: "Clock" },
  { id: "genre_of_month", title: "Genre of the Month", icon: availableIcons.Medal, iconName: "Medal" },
  { id: "hidden_gems", title: "Hidden Gems", icon: availableIcons.Gem, iconName: "Gem" },
  { id: "cozy_corner", title: "Cozy Corner", icon: availableIcons.Coffee, iconName: "Coffee" },
  { id: "developer_spotlight", title: "Our Authors", icon: availableIcons.Users, iconName: "Users" },
];

export function SectionOrderDialog() {
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [isHiddenSectionsExpanded, setIsHiddenSectionsExpanded] = useState(false);
  const { confirm, ConfirmationDialog } = useConfirm();

  useEffect(() => {
    if (isOpen) {
      loadSavedOrder();
    }
  }, [isOpen]);

  const loadSavedOrder = async () => {
    try {
      setIsLoading(true);
      
      // Get all sections from homepage_section_order, including custom sections
      const { data: orderData, error: orderError } = await supabase
        .from('homepage_section_order')
        .select('*')
        .order('display_order', { ascending: true });

      if (orderError) throw orderError;

      // Start with default sections
      let updatedSections = [...defaultSections];

      // Update hidden sections
      const hiddenSet = new Set<string>();
      
      if (orderData && orderData.length > 0) {
        // Create a map of sections for easy lookup
        const sectionsMap = new Map(updatedSections.map(section => [section.id, section]));
        
        // Process each section from the database
        orderData.forEach(order => {
          if (order.is_hidden) {
            hiddenSet.add(order.section_id);
          }

          // If it's a custom section, add it to the sections list
          if (order.is_custom) {
            const title = order.section_id.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            sectionsMap.set(order.section_id, {
              id: order.section_id,
              title,
              icon: availableIcons[order.icon_name as keyof typeof availableIcons] || availableIcons.Swords,
              iconName: order.icon_name || "Swords",
              isCustom: true
            });
          }
          // For existing sections, update their icon if specified
          else if (sectionsMap.has(order.section_id) && order.icon_name) {
            const section = sectionsMap.get(order.section_id)!;
            sectionsMap.set(order.section_id, {
              ...section,
              icon: availableIcons[order.icon_name as keyof typeof availableIcons] || section.icon,
              iconName: order.icon_name
            });
          }
        });

        // Order sections according to saved order
        const orderedSections = orderData
          .map(order => sectionsMap.get(order.section_id))
          .filter((section): section is Section => section !== undefined);
        
        // Add any sections that aren't in the order table at the end
        const unorderedSections = Array.from(sectionsMap.values()).filter(
          section => !orderData.some(order => order.section_id === section.id)
        );
        
        updatedSections = [...orderedSections, ...unorderedSections];
      }

      setHiddenSections(hiddenSet);
      setSections(updatedSections);
    } catch (error) {
      console.error('Error loading saved order:', error);
      toast.error('Failed to load saved order');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
        user_id: session.user.id
      });

      if (adminError) throw adminError;
      if (!isAdmin) throw new Error('Not authorized as admin');

      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    const newSections = [...sections];
    const [draggedSection] = newSections.splice(dragIndex, 1);
    newSections.splice(dropIndex, 0, draggedSection);
    setSections(newSections);
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sections.length) return;
    
    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    setSections(newSections);
  };

  const handleMoveUp = (index: number) => {
    moveSection(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    moveSection(index, index + 1);
  };

  const handleIconChange = (index: number, iconName: keyof typeof availableIcons) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      icon: availableIcons[iconName],
      iconName: iconName
    };
    setSections(newSections);
  };

  const saveOrder = async () => {
    try {
      setIsSaving(true);
      
      // Prepare the updates
      const updates = sections.map((section, index) => ({
        section_id: section.id,
        display_order: index,
        icon_name: section.iconName,
        is_hidden: hiddenSections.has(section.id),
        is_custom: section.isCustom || false
      }));
      
      // Delete all existing entries first
      const { error: deleteError } = await supabase
        .from('homepage_section_order')
        .delete()
        .neq('section_id', 'placeholder'); // Delete all rows
      
      if (deleteError) throw deleteError;
      
      // Insert the new order
      const { error: insertError } = await supabase
        .from('homepage_section_order')
        .insert(updates);
      
      if (insertError) throw insertError;
      
      toast.success('Section order saved successfully');
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving section order:', error);
      toast.error('Failed to save section order');
    } finally {
      setIsSaving(false);
    }
  };

  const isDefaultIcon = (sectionId: string, iconName: string): boolean => {
    // For custom sections (not in defaultIconMap), check if using default Swords icon
    if (!defaultIconMap[sectionId] && iconName === "Swords") {
      return true;
    }
    // For standard sections, check against defaultIconMap
    return defaultIconMap[sectionId] === iconName;
  };

  const handleHideSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const confirmed = await confirm(
      `Are you sure you want to hide the "${section.title}" section? This will remove it from all current reviews (scheduled reviews won't be affected).`,
      { title: 'Hide Section' }
    );

    if (!confirmed) return;

    if (sectionId === "latest") {
      toast.error("The Latest Reviews section cannot be hidden");
      return;
    }

    try {
      // Mark section as loading
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, isHiding: true } : s
      ));

      // For browse_genres and developer_spotlight, we don't need to update reviews
      if (sectionId === "browse_genres" || sectionId === "developer_spotlight") {
        // Just update the is_hidden flag in the database
        const { error: updateError } = await supabase
          .from('homepage_section_order')
          .update({ is_hidden: true })
          .eq('section_id', sectionId);

        if (updateError) {
          console.error('Error updating is_hidden flag:', updateError);
          toast.error('Failed to update section visibility in the database');
        } else {
          // Update the hiddenSections state
          setHiddenSections(prev => {
            const newSet = new Set(prev);
            newSet.add(sectionId);
            return newSet;
          });
          
          toast.success(`Successfully hid the ${sections.find(s => s.id === sectionId)?.title} section`);
        }
        return;
      }

      // Get all reviews that have this section
      const { data: reviews, error: fetchError } = await supabase
        .from('reviews')
        .select('id, homepage_sections')
        .contains('homepage_sections', [sectionId])
        .is('scheduled_for', null); // Only affect non-scheduled reviews

      if (fetchError) throw fetchError;

      if (reviews && reviews.length > 0) {
        // Update reviews in batches of 100
        const batchSize = 100;
        for (let i = 0; i < reviews.length; i += batchSize) {
          const batch = reviews.slice(i, i + batchSize);
          
          // Update each review in the batch
          for (const review of batch) {
            const { error: updateError } = await supabase
              .from('reviews')
              .update({
                homepage_sections: (review.homepage_sections || []).filter(s => s !== sectionId)
              })
              .eq('id', review.id);

            if (updateError) throw updateError;
          }
        }

        toast.success(`Successfully hid ${reviews.length} reviews from the ${sections.find(s => s.id === sectionId)?.title} section`);
      } else {
        toast.success(`Successfully hid the ${sections.find(s => s.id === sectionId)?.title} section`);
      }

      // Update the is_hidden flag in the database
      const { error: updateError } = await supabase
        .from('homepage_section_order')
        .update({ is_hidden: true })
        .eq('section_id', sectionId);

      if (updateError) {
        console.error('Error updating is_hidden flag:', updateError);
        toast.error('Failed to update section visibility in the database');
      } else {
        // Update the hiddenSections state
        setHiddenSections(prev => {
          const newSet = new Set(prev);
          newSet.add(sectionId);
          return newSet;
        });
      }
    } catch (error: any) {
      console.error('Error hiding section:', error);
      toast.error(`Failed to hide section: ${error.message}`);
    } finally {
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, isHiding: false } : s
      ));
    }
  };

  const handleUnhideSection = async (sectionId: string) => {
    const isHiddenInDB = hiddenSections.has(sectionId);
    
    // If not hidden in DB, nothing to do
    if (!isHiddenInDB) {
      toast.error("This section is not hidden");
      return;
    }

    try {
      // Mark section as loading
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, isHiding: true } : s
      ));
      
      // Update the is_hidden flag in the database
      const { error: updateError } = await supabase
        .from('homepage_section_order')
        .update({ is_hidden: false })
        .eq('section_id', sectionId);

      if (updateError) {
        console.error('Error updating is_hidden flag:', updateError);
        toast.error('Failed to update section visibility in the database');
      } else {
        // Update the hiddenSections state
        setHiddenSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });
        
        toast.success(`Successfully unhid the ${sections.find(s => s.id === sectionId)?.title} section`);
      }
    } catch (error: any) {
      console.error('Error unhiding section:', error);
      toast.error(`Failed to unhide section: ${error.message}`);
    } finally {
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, isHiding: false } : s
      ));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Configure Homepage Section Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[90vw] h-auto max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl">Homepage Section Settings</DialogTitle>
          <DialogDescription className="text-sm">
            Use the up/down buttons to reorder sections on mobile, or drag and drop on desktop.
            Click on an icon to change it. Click the eye icon to hide or show a section.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 my-3">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <>
              {/* Visible Sections */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Visible Sections</h3>
                {sections
                  .filter(section => !hiddenSections.has(section.id))
                  .map((section, index) => {
                    // Calculate the actual index in the full sections array
                    const actualIndex = sections.findIndex(s => s.id === section.id);
                    return (
                      <Card
                        key={section.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, actualIndex)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, actualIndex)}
                        className="p-3 cursor-move hover:bg-accent"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground hidden sm:block" />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-6 w-6 p-0 ${isDefaultIcon(section.id, section.iconName || '') ? 'ring-1 ring-green-500' : ''}`}
                                  title={isDefaultIcon(section.id, section.iconName || '') ? 'Default icon' : 'Custom icon'}
                                >
                                  {section.icon}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2">
                                <div className="flex flex-col gap-2">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Default icons are highlighted in green
                                  </div>
                                  <div className="grid grid-cols-6 gap-2 max-w-[280px]">
                                    {Object.entries(availableIcons).map(([name, icon]) => (
                                      <Button
                                        key={name}
                                        variant="ghost"
                                        size="icon"
                                        className={`h-8 w-8 ${
                                          section.iconName === name 
                                            ? 'bg-accent' 
                                            : ''
                                        } ${
                                          isDefaultIcon(section.id, name)
                                            ? 'ring-1 ring-green-500'
                                            : ''
                                        }`}
                                        onClick={() => handleIconChange(actualIndex, name as keyof typeof availableIcons)}
                                        title={name}
                                      >
                                        {icon}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <span className="text-sm sm:text-base">{section.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={() => handleMoveUp(actualIndex)}
                              disabled={actualIndex === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={() => handleMoveDown(actualIndex)}
                              disabled={actualIndex === sections.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            {section.id !== "latest" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleHideSection(section.id)}
                                disabled={section.isHiding}
                                title="Hide section"
                              >
                                {section.isHiding ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>

              {/* Hidden Sections */}
              <div className="flex flex-col gap-2 mt-4">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => setIsHiddenSectionsExpanded(!isHiddenSectionsExpanded)}
                >
                  <h3 className="text-sm font-medium">Hidden Sections</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {isHiddenSectionsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {isHiddenSectionsExpanded && (
                  <div className="flex flex-col gap-2 mt-1">
                    {sections
                      .filter(section => hiddenSections.has(section.id))
                      .map((section, index) => {
                        // Calculate the actual index in the full sections array
                        const actualIndex = sections.findIndex(s => s.id === section.id);
                        return (
                          <Card
                            key={section.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, actualIndex)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, actualIndex)}
                            className="p-3 cursor-move hover:bg-accent bg-muted/50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground hidden sm:block" />
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className={`h-6 w-6 p-0 ${isDefaultIcon(section.id, section.iconName || '') ? 'ring-1 ring-green-500' : ''}`}
                                      title={isDefaultIcon(section.id, section.iconName || '') ? 'Default icon' : 'Custom icon'}
                                    >
                                      {section.icon}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="flex flex-col gap-2">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Default icons are highlighted in green
                                      </div>
                                      <div className="grid grid-cols-6 gap-2 max-w-[280px]">
                                        {Object.entries(availableIcons).map(([name, icon]) => (
                                          <Button
                                            key={name}
                                            variant="ghost"
                                            size="icon"
                                            className={`h-8 w-8 ${
                                              section.iconName === name 
                                                ? 'bg-accent' 
                                                : ''
                                            } ${
                                              isDefaultIcon(section.id, name)
                                                ? 'ring-1 ring-green-500'
                                                : ''
                                            }`}
                                            onClick={() => handleIconChange(actualIndex, name as keyof typeof availableIcons)}
                                            title={name}
                                          >
                                            {icon}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <span className="text-sm sm:text-base">{section.title}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={() => handleMoveUp(actualIndex)}
                                  disabled={actualIndex === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={() => handleMoveDown(actualIndex)}
                                  disabled={actualIndex === sections.length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleUnhideSection(section.id)}
                                  disabled={section.isHiding}
                                  title="Unhide section"
                                >
                                  {section.isHiding ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                )}
                
                {!isHiddenSectionsExpanded && sections.filter(section => hiddenSections.has(section.id)).length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {sections.filter(section => hiddenSections.has(section.id)).length} hidden section(s). Click to expand.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={saveOrder} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
      <ConfirmationDialog />
    </Dialog>
  );
} 