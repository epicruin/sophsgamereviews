import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ReviewData } from '../../types/Review';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReviewContentProps {
  review: ReviewData;
}

export const ReviewContent = ({ review }: ReviewContentProps) => {
  return (
    <div className="lg:col-span-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Summary Card */}
        <Card className="p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={review.author.avatar}
              alt={review.author.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="font-semibold">{review.author.name}</h3>
              <p className="text-sm text-muted-foreground">{review.author.title}</p>
            </div>
          </div>
          <p className="text-lg leading-relaxed mb-8 text-muted-foreground">
            {review.excerpt}
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2 gradient-text">
                <ThumbsUp className="w-5 h-5 text-green-500" />
                Pros
              </h4>
              <ul className="space-y-2">
                {review.pros.map((pro, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2 gradient-text">
                <ThumbsDown className="w-5 h-5 text-rose-500" />
                Cons
              </h4>
              <ul className="space-y-2">
                {review.cons.map((con, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Main Article */}
        <Card className="p-8 mb-8">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {review.content}
            </ReactMarkdown>
          </article>
        </Card>
      </motion.div>
    </div>
  );
};
