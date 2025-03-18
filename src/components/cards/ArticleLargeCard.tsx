import { BookOpen, UserRound, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ArticleLargeCardProps {
  id: string;
  title: string;
  image: string;
  imagePosition?: number;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  likes?: number;
  isModal?: boolean;
  onArticleClick?: () => void;
}

export const ArticleLargeCard = ({
  id,
  title,
  image,
  imagePosition = 50,
  excerpt,
  author,
  likes = 0,
  isModal = false,
  onArticleClick
}: ArticleLargeCardProps) => {
  return (
    <Card className="overflow-hidden card-hover group w-full">
      <Link 
        to={`/articles/${id}`} 
        className="block relative aspect-[16/10] md:aspect-[16/9]"
        onClick={(e) => {
          if (onArticleClick) {
            onArticleClick();
          }
        }}
      >
        <div className="absolute inset-0 w-full h-full">
          <img
            src={image}
            alt={title}
            className="object-cover w-full h-full transition-all duration-500 group-hover:blur-sm"
            style={{ objectPosition: `center ${imagePosition}%` }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 w-full z-10 flex flex-col justify-between">
          {/* Top badges */}
          <div className="pt-2 px-2 flex justify-between items-start">
            <div className="glass-effect px-2 py-[2px] sm:px-2 sm:py-[3px] rounded-full flex items-center">
              <BookOpen className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 text-rose-500" />
              <span className="text-[10px] sm:text-[11px] md:text-[12px] ml-0.5 font-medium whitespace-nowrap leading-none">Article</span>
            </div>
          </div>
          
          {/* Middle section for title - moved up from center */}
          <div className="absolute inset-x-0 top-[40%] transform -translate-y-1/2 px-3">
            {/* Title */}
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold line-clamp-2 text-white opacity-0 group-hover:opacity-100 group-hover:text-rose-500 transition-all duration-300 text-center">
              {title}
            </h3>
          </div>
          
          {/* Description section - positioned below title but above bottom section */}
          <div className="absolute inset-x-0 top-[53%] px-3">
            {/* Excerpt - now centered and moved up */}
            <p className="text-xs sm:text-xs lg:text-sm text-white/90 line-clamp-2 mb-0.5 md:mb-1 text-center">
              {excerpt}
            </p>
          </div>

          {/* Bottom section containing author info and likes */}
          <div className="p-1.5 sm:p-2 md:p-3">
            {/* Author and likes */}
            <div className="flex items-center justify-between">
              <Link to={`/author/${author.name}`} className="flex items-center gap-1 group/author min-w-0">
                <Avatar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ring-1 ring-white/20 flex-shrink-0">
                  <AvatarImage src={author.avatar} alt={author.name} />
                  <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-[8px] sm:text-[10px] md:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded-full text-black relative overflow-hidden group-hover/author:shadow-md transition-all duration-300 truncate flex-shrink">
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-100 via-pink-300 to-pink-100 opacity-90 animate-gradient-x" style={{ backgroundSize: "200% 100%" }}></span>
                  <span className="relative">{author.name}</span>
                </span>
              </Link>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Heart 
                  className={`w-3 sm:w-3.5 h-3 sm:h-3.5 text-rose-500 ${likes > 0 ? 'fill-rose-500' : ''}`}
                />
                <span className="text-[8px] sm:text-[10px] md:text-xs font-medium text-white">{likes}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}; 