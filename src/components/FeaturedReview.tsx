import { LargeCard } from "./cards/LargeCard";
import { MediumCard } from "./cards/MediumCard";

interface FeaturedReviewProps {
  id: string;
  title: string;
  image: string;
  imagePosition?: number;
  rating: number;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  genre: string;
  variant?: "large" | "medium";
  isModal?: boolean;
  onArticleClick?: () => void;
}

export const FeaturedReview = (props: FeaturedReviewProps) => {
  const { variant = "large", isModal = false, onArticleClick } = props;
  
  if (variant === "medium") {
    return <MediumCard {...props} isModal={isModal} onArticleClick={onArticleClick} />;
  }
  
  return <LargeCard {...props} isModal={isModal} onArticleClick={onArticleClick} />;
};
