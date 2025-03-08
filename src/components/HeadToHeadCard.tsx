
import { motion } from "framer-motion";
import { Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface HeadToHeadCardProps {
  id: string;
  game1: {
    title: string;
    image: string;
    rating: number;
    excerpt: string;
    genre: string;
  };
  game2: {
    title: string;
    image: string;
    rating: number;
    excerpt: string;
    genre: string;
  };
  author: string;
  likes: number;
}

export const HeadToHeadCard = ({
  id,
  game1,
  game2,
  author,
  likes
}: HeadToHeadCardProps) => {
  return (
    <Link to={`/headtohead/${id}`} className="block w-full">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative flex gap-4 p-6">
          <div className="w-1/2">
            <div className="aspect-video rounded-lg overflow-hidden mb-4">
              <img src={game1.image} alt={game1.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{game1.title}</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm">{game1.rating}</span>
              </div>
            </div>
            <span className="text-sm text-rose-500">{game1.genre}</span>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              initial={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              className="bg-gradient-to-br from-rose-500 to-lavender-500 rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white"
            >
              <span className="text-white font-bold text-lg">VS</span>
            </motion.div>
          </div>

          <div className="w-1/2">
            <div className="aspect-video rounded-lg overflow-hidden mb-4">
              <img src={game2.image} alt={game2.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{game2.title}</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm">{game2.rating}</span>
              </div>
            </div>
            <span className="text-sm text-rose-500">{game2.genre}</span>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">By {author}</span>
            <div className="flex items-center gap-2 text-rose-400">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{likes}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
