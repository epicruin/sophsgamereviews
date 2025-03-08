import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Building2, Building, AlertOctagon, Calendar, DollarSign, EuroIcon, PoundSterling, Monitor, ShoppingCart } from "lucide-react";

interface ReviewInfoProps {
  developer: string;
  publisher: string;
  ageRating: string;
  priceUSD: number;
  priceGBP: number;
  priceEUR: number;
  releaseDate: string;
  systems?: string[];
  purchaseLinks?: {
    name: string;
    url: string;
  }[];
}

export const ReviewInfo = ({
  developer,
  publisher,
  ageRating,
  priceUSD,
  priceGBP,
  priceEUR,
  releaseDate,
  systems = [],
  purchaseLinks = []
}: ReviewInfoProps) => {
  return (
    <Card className="p-6 mb-8">
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Developer</h4>
          <p className="text-base">{developer}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Building className="w-5 h-5 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Publisher</h4>
          <p className="text-base">{publisher}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Age Rating</h4>
          <p className="text-base">{ageRating}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Release Date</h4>
          <p className="text-base">{format(new Date(releaseDate), 'MMMM d, yyyy')}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <DollarSign className="w-5 h-5 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>{priceUSD.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <PoundSterling className="w-4 h-4 text-muted-foreground" />
              <span>{priceGBP.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <EuroIcon className="w-4 h-4 text-muted-foreground" />
              <span>{priceEUR.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {purchaseLinks.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">Where to Buy</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {purchaseLinks.map((link, index) => (
                <a 
                  key={index} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-sm font-medium text-rose-600 hover:bg-rose-500/20 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {systems.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <Monitor className="w-5 h-5 text-muted-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">Available On</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {systems.map((system) => (
                <span key={system} className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm font-medium">
                  {system}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};