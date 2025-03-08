import { motion } from "framer-motion";
import { SmallCard } from "@/components/cards/SmallCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface Genre {
  title: string;
  count: number;
  color: string;
}

interface BrowseByGenreProps {
  genres: Genre[];
}

export const BrowseByGenre = ({ genres }: BrowseByGenreProps) => {
  // Split genres into chunks of 30
  const genreChunks = genres.reduce((resultArray: Genre[][], item, index) => {
    const chunkIndex = Math.floor(index / 30);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);

  return (
    <div className="relative w-full max-w-[calc(100vw-2rem)] md:max-w-none">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {genreChunks.map((chunk, chunkIndex) => (
            <CarouselItem key={chunkIndex} className="pl-2 basis-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-4 place-items-center">
                {chunk.map((genre, index) => (
                  <motion.div
                    key={genre.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                  >
                    <SmallCard {...genre} />
                  </motion.div>
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500" />
        <CarouselNext className="border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500" />
      </Carousel>
    </div>
  );
};
