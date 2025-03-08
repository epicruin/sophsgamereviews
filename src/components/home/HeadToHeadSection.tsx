
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { HeadToHeadCard } from "@/components/HeadToHeadCard";

interface HeadToHeadSectionProps {
  comparison: {
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
  };
}

export const HeadToHeadSection = ({ comparison }: HeadToHeadSectionProps) => {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold gradient-text text-center flex-grow">Head to Head</h2>
        <Swords className="w-6 h-6 text-muted-foreground shrink-0" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <HeadToHeadCard {...comparison} />
      </motion.div>
    </section>
  );
};
