import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Gamepad2,
  Sword,
  Swords,
  Trophy,
  Ghost,
  Car,
  Puzzle,
  Target,
  Mountain,
  Lamp,
  Compass,
  Bot,
  Users,
  Dices,
  Heart,
  Crown,
  Globe,
  Tent,
  Skull,
  Axe,
  Book,
  Music,
  Castle,
  GraduationCap,
  Footprints,
  ScrollText,
  Gauge,
  Wheat,
  ShieldAlert,
  Sword as SwordAlt,
  MousePointer,
  Crosshair,
  Building2,
  Home,
  Map,
  Timer,
  MessageSquare,
  Plane,
  Rocket,
  Command,
  Clock,
  PartyPopper,
  Users2,
  Network,
  Box,
  ArrowLeftRight,
  Blocks,
  Binary,
  Radiation,
  History,
  ClipboardList,
  CircleDot,
  Search,
  Hourglass,
  Utensils,
  Eye,
  Camera,
  Shield,
  Glasses,
  Gamepad
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface SmallCardProps {
  title: string;
  count: number;
  color: string;
}

const getIconForGenre = (genre: string): LucideIcon => {
  switch (genre.toLowerCase()) {
    case "action":
      return Sword;
    case "adventure":
      return Compass;
    case "rpg":
      return Trophy;
    case "strategy":
      return Swords;
    case "simulation":
      return Bot;
    case "sports":
      return Gamepad2;
    case "racing":
      return Car;
    case "fighting":
      return Sword;
    case "horror":
      return Ghost;
    case "shooter":
      return Target;
    case "platformer":
      return Mountain;
    case "puzzle":
      return Puzzle;
    case "mmo":
      return Users;
    case "indie":
      return Lamp;
    case "casual":
      return Heart;
    case "card game":
      return Dices;
    case "battle royale":
      return Crown;
    case "open world":
      return Globe;
    case "survival":
      return Tent;
    case "roguelike":
      return Skull;
    case "action rpg":
      return Axe;
    case "moba":
      return Swords;
    case "visual novel":
      return Book;
    case "rhythm":
      return Music;
    case "tower defense":
      return Castle;
    case "educational":
      return GraduationCap;
    case "stealth":
      return Footprints;
    case "jrpg":
      return ScrollText;
    case "farming sim":
      return Wheat;
    case "beat 'em up":
      return ShieldAlert;
    case "hack and slash":
      return SwordAlt;
    case "point and click":
      return MousePointer;
    case "tactical":
      return Crosshair;
    case "city builder":
      return Building2;
    case "life sim":
      return Home;
    case "exploration":
      return Map;
    case "flight simulator":
      return Plane;
    case "space sim":
      return Rocket;
    case "rts":
      return Command;
    case "tbs":
      return Clock;
    case "party game":
      return PartyPopper;
    case "co-op":
      return Users2;
    case "mmorpg":
      return Network;
    case "sandbox":
      return Box;
    case "metroidvania":
      return ArrowLeftRight;
    case "dungeon crawler":
      return Blocks;
    case "cyberpunk":
      return Binary;
    case "post-apocalyptic":
      return Radiation;
    case "historical":
      return History;
    case "walking simulator":
      return Footprints;
    case "management sim":
      return ClipboardList;
    case "retro games":
      return Gamepad;
    case "driving sim":
      return Gauge;
    case "mystery":
      return Search;
    case "time management":
      return Hourglass;
    case "cooking":
      return Utensils;
    case "first-person shooter":
      return Eye;
    case "third-person shooter":
      return Camera;
    case "soulslike":
      return Shield;
    case "vr":
      return Glasses;
    default:
      return Gamepad2;
  }
};

export const SmallCard = ({ title, count, color }: SmallCardProps) => {
  const IconComponent = getIconForGenre(title);
  
  return (
    <Link to={`/genre/${title.toLowerCase()}`}>
      <Card className="w-full sm:w-24 h-20 sm:h-24 p-2 sm:p-3 hover:shadow-lg transition-all cursor-pointer bg-white/80 backdrop-blur-sm">
        <div className="h-full flex flex-col items-center justify-center gap-1">
          <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
          <h3 className="text-[10px] sm:text-xs font-medium text-center line-clamp-1">{title}</h3>
          <p className="text-[8px] sm:text-[10px] text-muted-foreground">{count} reviews</p>
        </div>
      </Card>
    </Link>
  );
};
