import { Swords } from "lucide-react";
import { SectionPage } from "@/components/sections/SectionPage";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CustomSection() {
  const [customSectionName, setCustomSectionName] = useState<string>("Custom Section");

  useEffect(() => {
    const fetchCustomSectionName = async () => {
      const { data: customSectionData, error: customSectionError } = await supabase
        .from('reviews')
        .select('custom_section_name')
        .not('custom_section_name', 'is', null)
        .limit(1);

      if (!customSectionError && customSectionData && customSectionData.length > 0) {
        setCustomSectionName(customSectionData[0].custom_section_name);
      }
    };

    fetchCustomSectionName();
  }, []);

  return (
    <SectionPage
      title={customSectionName}
      icon={Swords}
      section="custom_section"
    />
  );
} 