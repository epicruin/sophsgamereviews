import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import { ReviewFormData } from "./types";

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url?.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
};

interface YoutubeTrailerProps {
  formData: ReviewFormData;
  onUpdate: (formData: Partial<ReviewFormData>) => void;
}

export const YoutubeTrailer = ({ formData, onUpdate }: YoutubeTrailerProps) => {
  return (
    <Card className="p-6">
      <div className="relative flex justify-end items-center mb-4">
        <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">YouTube Trailer</h3>
        <div className="z-10">
          <AIGenerateButton
            gameTitle={formData.title}
            section="youtubeTrailer"
            onGenerated={(data) => {
              console.log("Received YouTube trailer:", data);
              if (data?.url) {
                onUpdate({ youtubeTrailerUrl: data.url });
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-4">
        <Input
          type="url"
          placeholder="YouTube video URL (e.g., https://www.youtube.com/watch?v=...)"
          value={formData.youtubeTrailerUrl || ''}
          onChange={(e) => onUpdate({ youtubeTrailerUrl: e.target.value })}
        />
        {formData.youtubeTrailerUrl && getYouTubeVideoId(formData.youtubeTrailerUrl) && (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(formData.youtubeTrailerUrl)}`}
              title="Game Trailer Preview"
              className="w-full h-full rounded-md"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </Card>
  );
}; 