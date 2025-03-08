import { Star, Heart, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface MediumCardProps {
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
  likes: number | null;
  genre: string;
  isModal?: boolean;
  onArticleClick?: () => void;
}

export const MediumCard = ({
  id,
  title,
  image,
  imagePosition = 50,
  rating,
  excerpt,
  author,
  likes,
  genre,
  isModal = false,
  onArticleClick
}: MediumCardProps) => {
  return (
    <Card className="overflow-hidden card-hover group w-full">
      <Link 
        to={`/reviews/${id}`} 
        className="block relative aspect-[4/5] sm:aspect-[3/4]"
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
        <div className="absolute inset-0 w-full z-10 flex flex-col">
          {/* Top badges */}
          <div className="pt-2 px-2 flex justify-between items-start">
            <Link 
              to={`/genre/${genre.toLowerCase()}`}
              className="glass-effect px-2 py-[2px] sm:px-2 sm:py-[3px] rounded-full hover:bg-rose-500/10 transition-colors flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] sm:text-[11px] md:text-[12px] font-medium text-rose-500 whitespace-nowrap leading-none">{genre}</span>
            </Link>
            <div className="glass-effect px-2 py-[2px] sm:px-2 sm:py-[3px] rounded-full flex items-center gap-0.5">
              <Star className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] sm:text-[11px] md:text-[12px] font-medium whitespace-nowrap leading-none">{rating}</span>
            </div>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 text-center">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold line-clamp-2 text-white opacity-0 group-hover:opacity-100 group-hover:text-rose-500 transition-all duration-300 max-w-[90%]">
              {title}
            </h3>
          </div>

          {/* Bottom content */}
          <div className="p-2 sm:p-3 lg:p-4 space-y-2 flex flex-col items-center text-center">
            <p className="text-xs sm:text-xs lg:text-sm text-white/90 line-clamp-2 lg:line-clamp-3">
              {excerpt}
            </p>
            <div className="flex items-center justify-between w-full">
              <Link to={`/author/${author.name}`} className="flex items-center gap-1 sm:gap-1.5 group/author">
                <Avatar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ring-1 ring-white/20">
                  <AvatarImage src={author.avatar} alt={author.name} />
                  <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-[8px] sm:text-[9px] md:text-xs font-medium px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 rounded-full text-black relative overflow-hidden group-hover/author:shadow-md transition-all duration-300 truncate max-w-[80px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[140px]">
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-100 via-pink-300 to-pink-100 opacity-90 animate-gradient-x" style={{ backgroundSize: "200% 100%" }}></span>
                  <span className="relative">{author.name}</span>
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Heart 
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 ${(likes ?? 0) > 0 ? 'fill-rose-500' : ''}`}
                />
                <span className="text-[8px] sm:text-xs font-medium text-white">{likes ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};