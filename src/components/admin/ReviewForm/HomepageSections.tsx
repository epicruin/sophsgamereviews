import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { HomepageSection, homepageSections, ReviewFormData } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { Swords } from "lucide-react";
import { HomepageSectionOrder } from "@/types/Review";

interface HomepageSectionsProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

interface CustomSection {
  id: string;
  name: string;
  icon_name?: string;
}

// Helper function to check if a section is in localStorage (for undo functionality)
const isSectionInLocalStorage = (sectionId: string): boolean => {
  const STORAGE_PREFIX = 'section_assignments_';
  const key = `${STORAGE_PREFIX}${sectionId}`;
  return localStorage.getItem(key) !== null;
};

export const HomepageSections = ({ formData, onUpdate }: HomepageSectionsProps) => {
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [emptySections, setEmptySections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      
      // Fetch hidden sections and custom sections from homepage_section_order
      const { data: sectionData, error: sectionError } = await supabase
        .from('homepage_section_order')
        .select('section_id, is_hidden, is_custom, icon_name')
        .order('display_order', { ascending: true });

      if (sectionError) throw sectionError;

      // Update hidden sections
      const hiddenSet = new Set<string>();
      const customSectionsList: CustomSection[] = [];
      
      sectionData?.forEach(section => {
        if (section.is_hidden) {
          hiddenSet.add(section.section_id);
        }
        if (section.is_custom) {
          customSectionsList.push({
            id: section.section_id,
            name: section.section_id.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            icon_name: section.icon_name || 'Swords'
          });
        }
      });
      
      setHiddenSections(hiddenSet);
      setCustomSections(customSectionsList);
      
      // Fetch all sections that are currently assigned to any reviews
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('homepage_sections')
        .not('homepage_sections', 'is', null);

      if (reviewError) throw reviewError;

      // Get unique sections that are currently in use
      const activeSet = new Set<string>();
      reviewData?.forEach(review => {
        review.homepage_sections?.forEach(section => {
          activeSet.add(section);
        });
      });
      setActiveSections(Array.from(activeSet));
      
      // Determine which sections are empty (not in activeSet)
      const emptySet = new Set<string>();
      
      // Check default sections
      homepageSections.forEach(section => {
        // Skip "latest" as it's always included
        if (section.value !== "latest" && !activeSet.has(section.value)) {
          emptySet.add(section.value);
        }
      });
      
      setEmptySections(emptySet);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    // Don't allow toggling of "latest" or "genre_of_month" sections
    if (section === "latest" || section === "genre_of_month") return;
    
    const newSections = formData.homepage_sections.includes(section)
      ? formData.homepage_sections.filter(s => s !== section)
      : [...formData.homepage_sections, section];
    
    onUpdate({ homepage_sections: newSections });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Homepage Sections</h3>
        <div className="text-center py-4">Loading...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Homepage Sections</h3>
      <div className="grid gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Default sections */}
          {homepageSections
            .filter(section => {
              // Always show "latest" section
              if (section.value === "latest") return true;
              
              // Don't show hidden sections
              if (hiddenSections.has(section.value)) return false;
              
              // Don't show empty sections unless they're in localStorage (for undo functionality)
              if (emptySections.has(section.value) && !isSectionInLocalStorage(section.value)) return false;
              
              return true;
            })
            .map(section => (
              <div key={section.value}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.value)}
                  disabled={section.value === "latest" || section.value === "genre_of_month"}
                  className={`w-full flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    section.value === "latest" || formData.homepage_sections.includes(section.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-muted bg-popover hover:bg-accent hover:text-accent-foreground'
                  } ${(section.value === "latest" || section.value === "genre_of_month") ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  <section.icon className="mb-2 h-6 w-6" />
                  <div className="text-center">
                    <span className="block">{section.label}</span>
                    {section.value === "latest" && (
                      <span className="block text-xs text-muted-foreground mt-1">(Always included)</span>
                    )}
                    {section.value === "genre_of_month" && (
                      <span className="block text-xs text-muted-foreground mt-1">(Auto-assigned by genre)</span>
                    )}
                  </div>
                </button>
              </div>
            ))}
          
          {/* Custom sections */}
          {customSections
            .filter(section => !hiddenSections.has(section.id))
            .map(section => (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    formData.homepage_sections.includes(section.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-muted bg-popover hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Swords className="mb-2 h-6 w-6" />
                  <div className="text-center">
                    <span className="block">{section.name}</span>
                    <span className="block text-sm text-muted-foreground">(Custom Section)</span>
                  </div>
                </button>
              </div>
            ))}
        </div>
        
        <div className="mt-4 flex flex-col items-center">
          <label className="text-sm font-medium mb-2 text-center">Feature Size</label>
          <RadioGroup
            value={formData.feature_size}
            onValueChange={(value: "normal" | "large") => 
              onUpdate({ feature_size: value })
            }
            className="flex justify-center gap-8"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="normal" />
              <Label htmlFor="normal">Normal (1/3 width)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="large" />
              <Label htmlFor="large">Large (1/2 width)</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </Card>
  );
}; 