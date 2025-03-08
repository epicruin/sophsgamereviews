import { LucideIcon } from "lucide-react";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import { ShootingStarsBackground } from "@/components/home/ShootingStarsBackground";
import { StaticStarsBackground } from "@/components/home/StaticStarsBackground";
import { HomepageSection } from "@/types/Review";
import { SectionContainer } from "@/components/shared/SectionContainer";

interface SectionPageProps {
  title: string;
  icon: LucideIcon;
  section: HomepageSection;
}

export const SectionPage = ({ title, icon, section }: SectionPageProps) => {
  // Determine if this is a genres section or a reviews section
  const sectionType = section === 'browse_genres' ? 'genres' : 'reviews';

  return (
    <div className="min-h-screen relative">
      <StaticStarsBackground />
      <AuroraBackground />
      <ShootingStarsBackground />
      
      <div className="pt-8">
        <SectionContainer
          id={`section-${section}`}
          title={title}
          icon={icon}
          sectionType={sectionType}
          variant="medium"
          section={section !== 'browse_genres' ? section : undefined}
          className="pt-8"
        />
      </div>
    </div>
  );
}; 