import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { GameTitleGenerator } from "@/components/ui/game-title-generator";
import { ReviewFormData, Genre } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface BasicInformationProps {
  formData: ReviewFormData;
  genres: Genre[];
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const BasicInformation = ({ formData, genres, onUpdate }: BasicInformationProps) => {
  const [currentGenreOfMonthId, setCurrentGenreOfMonthId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentGenreOfMonth();
  }, []);

  useEffect(() => {
    // When genre changes, check if it matches genre of the month
    if (formData.genreId && currentGenreOfMonthId) {
      const isGenreOfMonth = formData.genreId === currentGenreOfMonthId;
      const hasGenreOfMonthSection = formData.homepage_sections.includes("genre_of_month");

      if (isGenreOfMonth && !hasGenreOfMonthSection) {
        // Add genre_of_month section if genre matches
        onUpdate({
          homepage_sections: [...formData.homepage_sections, "genre_of_month"]
        });
      } else if (!isGenreOfMonth && hasGenreOfMonthSection) {
        // Remove genre_of_month section if genre doesn't match
        onUpdate({
          homepage_sections: formData.homepage_sections.filter(s => s !== "genre_of_month")
        });
      }
    }
  }, [formData.genreId, currentGenreOfMonthId]);

  const fetchCurrentGenreOfMonth = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_section_order')
        .select('current_genre_id')
        .eq('section_id', 'genre_of_month')
        .single();

      if (error) throw error;

      if (data?.current_genre_id) {
        setCurrentGenreOfMonthId(data.current_genre_id);
      }
    } catch (error) {
      console.error('Error fetching current genre of month:', error);
    }
  };

  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Basic Information</h3>
        <div className="z-10">
          <AIGenerateButton
            gameTitle={formData.title}
            section="excerpt"
            onGenerated={(content) => {
              console.log("Received excerpt:", content);
              // Find the first genre that matches the game's genre
              const matchingGenre = genres.find(g => 
                content.toLowerCase().includes(g.name.toLowerCase())
              );
              onUpdate({ 
                excerpt: content,
                // If a matching genre is found, update the genreId
                ...(matchingGenre && { genreId: matchingGenre.id })
              });
            }}
          />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <GameTitleGenerator
              onTitleGenerated={(title) => onUpdate({ title })}
              existingTitles={[]}
              currentTitle={formData.title}
            />
            <div className="flex-1">
              <Input
                placeholder="Review Title"
                value={formData.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
        <div>
          <Textarea
            placeholder="Excerpt (short summary)"
            value={formData.excerpt}
            onChange={(e) => onUpdate({ excerpt: e.target.value })}
            required
          />
        </div>
        <div>
          <Select
            value={formData.genreId}
            onValueChange={(value) => onUpdate({ genreId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Genre" />
            </SelectTrigger>
            <SelectContent>
              {genres.map((genre) => (
                <SelectItem 
                  key={genre.id} 
                  value={genre.id}
                >
                  {genre.name}
                  {genre.id === currentGenreOfMonthId && " (Genre of the Month)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            placeholder="Star Rating out of 10"
            min="0"
            max="10"
            step="0.1"
            value={formData.rating || ''}
            onChange={(e) => onUpdate({ rating: parseFloat(e.target.value) })}
            required
          />
          <Input
            type="number"
            placeholder="Hours played"
            min="0"
            value={formData.playtime || ''}
            onChange={(e) => onUpdate({ playtime: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>
    </Card>
  );
}; 