
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Gamepad } from "lucide-react";

interface CategoryCardProps {
  title: string;
  count: number;
  color: string;
}

export const CategoryCard = ({ title, count, color }: CategoryCardProps) => {
  return (
    <div className="pt-2 pb-3"> {/* Container with padding to prevent cut-off */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`w-24 h-24 relative overflow-hidden ${color} shadow-lg cursor-pointer group`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
            <Gamepad className="w-6 h-6 text-white mb-1" />
            <h3 className="text-xs font-bold text-white leading-tight">{title}</h3>
            <span className="text-[10px] text-white/80">{count} games</span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
