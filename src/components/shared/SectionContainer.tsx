import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { ContentGrid } from "./ContentGrid";
import { useContentFetch } from "@/hooks/useContentFetch";

interface SectionContainerProps {
  id: string;
  title: ReactNode;
  icon?: LucideIcon;
  sectionType: "reviews" | "genres";
  variant?: "large" | "medium";
  section?: string;
  authorId?: string;
  genreId?: string;
  linkPath?: string;
  className?: string;
  showTitle?: boolean;
  dotNavPosition?: ReactNode;
  onArticleClick?: () => void;
}

export const SectionContainer = ({
  id,
  title,
  icon,
  sectionType,
  variant = "medium",
  section,
  authorId,
  genreId,
  linkPath,
  className = "",
  showTitle = true,
  dotNavPosition,
  onArticleClick,
}: SectionContainerProps) => {
  // Determine the content type based on section type
  const contentType = sectionType === "genres" ? "genres" : "reviews";

  // Fetch the appropriate content
  const { items, isLoading, error, currentGenre } = useContentFetch({
    contentType,
    section,
    authorId,
    genreId,
  });

  // Handle loading state
  if (isLoading) {
    return (
      <section className={`container mx-auto px-4 py-16 max-w-full 3xl:max-w-[1920px] 4xl:max-w-[2400px] ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-center">
            <div className="h-8 w-64 bg-gray-200 rounded-md mx-auto mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded-md mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  // If there are no items, don't render anything
  if (!isLoading && !error && items.length === 0) {
    return null;
  }

  // Handle error state
  if (error) {
    return (
      <section className={`container mx-auto px-4 py-16 max-w-full 3xl:max-w-[1920px] 4xl:max-w-[2400px] ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Error Loading Content</h2>
          <p className="text-muted-foreground">{error.toString()}</p>
        </div>
      </section>
    );
  }

  // Determine the title to display
  const displayTitle = currentGenre && section === "genre_of_month" 
    ? <>Genre of the Month: <span className="text-pink-500">{currentGenre}</span></>
    : title;

  // Render the content grid with the fetched items
  return (
    <ContentGrid
      title={displayTitle}
      icon={icon}
      items={items}
      variant={variant}
      contentType={contentType}
      sectionId={id}
      linkPath={linkPath}
      className={className}
      showTitle={showTitle}
      dotNavPosition={dotNavPosition}
      onArticleClick={onArticleClick}
    />
  );
}; 