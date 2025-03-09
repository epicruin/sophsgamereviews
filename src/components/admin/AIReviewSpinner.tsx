import { useState, useEffect } from "react";
import { X, Plus, Wand2, CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateGameInfo, GameInfo } from "@/lib/openai";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIGenerateButton } from "@/components/ui/ai-generate-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GameTitleGenerator } from "@/components/ui/game-title-generator";
import { getGameImages } from "@/lib/igdb";

interface Genre {
  id: string;
  name: string;
}

interface ReviewData {
  title: string;
  excerpt: string;
  content: string;
  rating: number;
  author_id: string;
  genre_id: string | null;
  scheduled_for: string;
  pros: string[];
  cons: string[];
  developer: string;
  publisher: string;
  age_rating: string;
  price_usd: number;
  price_gbp: number;
  price_eur: number;
  purchase_links: { name: string; url: string }[];
  release_date: string;
  systems: string[];
  min_os: string;
  min_processor: string;
  min_memory: string;
  min_graphics: string;
  min_storage: string;
  rec_os: string;
  rec_processor: string;
  rec_memory: string;
  rec_graphics: string;
  rec_storage: string;
  image: string;
  screenshots: { url: string; order_index: number }[];
  playtime: number;
  feature_size: "normal" | "large";
  homepage_sections: ("featured" | "latest" | "genre_of_month" | "custom_section" | "cozy_corner" | "hidden_gems")[];
  awards: string[];
  award_dates: Record<string, string>;
  youtube_trailer_url: string | null;
  online_coop: boolean;
  couch_coop: boolean;
  split_screen: boolean;
  max_players: number;
}

type GenerationStep = 'excerpt' | 'releaseDetails' | 'purchaseLinks' | 'multiplayerDetails' | 'prosAndCons' | 'systemRequirements' | 'fullReview' | 'awards' | 'images' | 'database' | 'youtubeTrailer';
type GenerationStatus = 'pending' | 'inProgress' | 'completed' | 'error';

interface GameProgress {
  title: string;
  steps: Record<GenerationStep, {
    status: GenerationStatus;
    error?: string;
  }>;
}

const GENERATION_STEPS: { key: GenerationStep; label: string }[] = [
  { key: 'excerpt', label: 'Generating Excerpt' },
  { key: 'releaseDetails', label: 'Getting Release Details' },
  { key: 'purchaseLinks', label: 'Getting Where to Buy Links' },
  { key: 'multiplayerDetails', label: 'Getting Multiplayer Details' },
  { key: 'prosAndCons', label: 'Creating Pros & Cons' },
  { key: 'systemRequirements', label: 'Fetching System Requirements' },
  { key: 'awards', label: 'Finding Awards' },
  { key: 'fullReview', label: 'Writing Full Review' },
  { key: 'images', label: 'Fetching Images' },
  { key: 'youtubeTrailer', label: 'Finding Game Trailer' },
  { key: 'database', label: 'Saving to Database' }
];

interface GameTitle {
  title: string;
  scheduledFor: string | null;
  isDatePickerOpen: boolean;
}

export const AIReviewSpinner = ({ onReviewCreated }: { onReviewCreated: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [gameTitles, setGameTitles] = useState<GameTitle[]>([{ title: "", scheduledFor: null, isDatePickerOpen: false }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [progress, setProgress] = useState<GameProgress[]>([]);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    const { data: genresData, error } = await supabase
      .from('genres')
      .select('id, name')
      .order('name');

    if (error) {
      toast.error("Failed to load genres");
      return;
    }

    setGenres(genresData);
  };

  const addGameTitle = () => {
    setGameTitles([...gameTitles, { title: "", scheduledFor: null, isDatePickerOpen: false }]);
  };

  const removeGameTitle = (index: number) => {
    setGameTitles(gameTitles.filter((_, i) => i !== index));
  };

  const updateGameTitle = (index: number, value: string) => {
    const newTitles = [...gameTitles];
    newTitles[index] = { ...newTitles[index], title: value };
    setGameTitles(newTitles);
  };

  const toggleDatePicker = (index: number) => {
    const newTitles = [...gameTitles];
    newTitles[index] = { ...newTitles[index], isDatePickerOpen: !newTitles[index].isDatePickerOpen };
    setGameTitles(newTitles);
  };

  const updateScheduledTime = (index: number, value: string | null) => {
    const newTitles = [...gameTitles];
    newTitles[index] = { ...newTitles[index], scheduledFor: value };
    setGameTitles(newTitles);
  };

  const findGenreWithRetries = async (title: string, maxRetries = 3): Promise<string | null> => {
    const genreList = genres.map(g => g.name).join(", ");
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await generateGameInfo(title, 'excerpt');
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/predict-genre`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            genreList
          })
        });

        if (!response.ok) {
          throw new Error('Failed to predict genre');
        }

        const { genre } = await response.json();
        const matchingGenre = genres.find(g => g.name.toLowerCase() === genre?.toLowerCase());
        
        if (matchingGenre) {
          return matchingGenre.id;
        }
        
        console.warn(`No matching genre found in attempt ${attempt}/${maxRetries}, retrying...`);
      } catch (error) {
        console.error(`Error in genre finding attempt ${attempt}:`, error);
      }
    }
    
    console.warn(`No genre found after ${maxRetries} attempts for ${title}`);
    return null;
  };

  const updateGameProgress = (
    gameIndex: number,
    step: GenerationStep,
    status: GenerationStatus,
    error?: string
  ) => {
    setProgress(prev => {
      const newProgress = [...prev];
      if (!newProgress[gameIndex]) {
        newProgress[gameIndex] = {
          title: gameTitles[gameIndex].title,
          steps: Object.fromEntries(
            GENERATION_STEPS.map(s => [s.key, { status: 'pending' }])
          ) as Record<GenerationStep, { status: GenerationStatus; error?: string }>
        };
      }
      newProgress[gameIndex].steps[step] = { status, ...(error ? { error } : {}) };
      return newProgress;
    });
  };

  const generateReviews = async () => {
    const validTitles = gameTitles.filter(game => game.title.trim() !== "");
    if (validTitles.length === 0) {
      toast.error("Please add at least one game title");
      return;
    }

    if (genres.length === 0) {
      toast.error("No genres loaded. Please try again.");
      return;
    }

    setIsGenerating(true);
    setProgress([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      // Get the latest scheduled review date that's in the future
      const { data: latestReview } = await supabase
        .from('reviews')
        .select('scheduled_for')
        .gt('scheduled_for', new Date().toISOString()) // Only get future scheduled reviews
        .order('scheduled_for', { ascending: false })
        .limit(1) as { data: { scheduled_for: string | null }[] | null };

      // Set base date as either the latest scheduled review date or current date
      let baseDate = new Date();
      baseDate.setHours(12, 0, 0, 0); // Set to noon

      if (latestReview && latestReview.length > 0 && latestReview[0].scheduled_for) {
        // If we have a future scheduled review, use that as base
        baseDate = new Date(latestReview[0].scheduled_for);
      } else {
        // If no future reviews, start from tomorrow at noon
        baseDate.setDate(baseDate.getDate() + 1);
      }

      // Process each game title sequentially
      for (const [index, game] of validTitles.entries()) {
        try {
          // Initialize progress for this game
          setProgress(prev => [...prev, {
            title: game.title,
            steps: Object.fromEntries(
              GENERATION_STEPS.map(s => [s.key, { status: 'pending' }])
            ) as Record<GenerationStep, { status: GenerationStatus; error?: string }>
          }]);

          // Try to find genre first with retries
          updateGameProgress(index, 'excerpt', 'inProgress');
          const genreId = await findGenreWithRetries(game.title);
          updateGameProgress(index, 'excerpt', 'completed');

          // Generate all required content
          const results = [];
          const generationSteps: (keyof GameInfo)[] = [
            'excerpt',
            'releaseDetails',
            'multiplayerDetails',
            'prosAndCons',
            'systemRequirements',
            'awards',
            'fullReview'
          ];
          for (const step of generationSteps) {
            updateGameProgress(index, step, 'inProgress');
            try {
              const result = await generateGameInfo(game.title, step);
              results.push(result);
              updateGameProgress(index, step, 'completed');
              
              // After release details completes, update the purchase links step visually
              if (step === 'releaseDetails') {
                updateGameProgress(index, 'purchaseLinks', 'inProgress');
                // Short delay to make it visible to the user
                await new Promise(resolve => setTimeout(resolve, 1000));
                updateGameProgress(index, 'purchaseLinks', 'completed');
              }
            } catch (error: any) {
              updateGameProgress(index, step, 'error', error.message);
              
              // If release details fails, also mark purchase links as failed
              if (step === 'releaseDetails') {
                updateGameProgress(index, 'purchaseLinks', 'error', 'Failed to get purchase links');
              }
              
              throw error;
            }
          }

          // Get images separately through IGDB
          updateGameProgress(index, 'images', 'inProgress');
          let imagesData;
          try {
            const gameImages = await getGameImages(game.title);
            imagesData = { images: gameImages };
            updateGameProgress(index, 'images', 'completed');
          } catch (error: any) {
            updateGameProgress(index, 'images', 'error', error.message);
            imagesData = { images: { cover: '', screenshots: [] } };
          }

          // Get YouTube trailer
          updateGameProgress(index, 'youtubeTrailer', 'inProgress');
          try {
            const trailerResult = await generateGameInfo(game.title, 'youtubeTrailer');
            results.push(trailerResult);
            updateGameProgress(index, 'youtubeTrailer', 'completed');
          } catch (error: any) {
            updateGameProgress(index, 'youtubeTrailer', 'error', error.message);
          }

          const [excerptData, releaseData, multiplayerData, prosConsData, sysReqData, awardsData, fullReviewData] = results;

          // Calculate scheduled date (use provided date or default to 7 days after the last scheduled review)
          const scheduledDate = game.scheduledFor 
            ? new Date(game.scheduledFor)
            : (() => {
                if (index === 0) {
                  // First review: schedule 7 days from base date
                  const date = new Date(baseDate);
                  date.setDate(date.getDate() + 7);
                  baseDate = date;
                  return date;
                } else {
                  // Subsequent reviews: schedule 7 days after the previous one
                  const date = new Date(baseDate);
                  date.setDate(date.getDate() + 7);
                  baseDate = date;
                  return date;
                }
              })();

          // Update database status
          updateGameProgress(index, 'database', 'inProgress');

          // Prepare review data
          const reviewData: ReviewData = {
            title: game.title,
            excerpt: excerptData.excerpt || "",
            content: fullReviewData.fullReview || "",
            rating: 0,
            author_id: session.user.id,
            genre_id: genreId,
            scheduled_for: scheduledDate.toISOString(),
            pros: prosConsData.prosAndCons?.pros || [],
            cons: prosConsData.prosAndCons?.cons || [],
            developer: releaseData.releaseDetails?.developer || "",
            publisher: releaseData.releaseDetails?.publisher || "",
            age_rating: releaseData.releaseDetails?.ageRating || "",
            price_usd: releaseData.releaseDetails?.priceUSD || 0,
            price_gbp: releaseData.releaseDetails?.priceGBP || 0,
            price_eur: releaseData.releaseDetails?.priceEUR || 0,
            purchase_links: releaseData.releaseDetails?.purchaseLinks?.map(link => ({
              name: link.name,
              url: link.url
            })) || [],
            release_date: (() => {
              console.log('Release data from AI:', releaseData);
              const aiReleaseDate = releaseData.releaseDetails?.releaseDate;
              
              if (!aiReleaseDate) {
                console.warn('No release date from AI, using current date');
                return new Date().toISOString();
              }

              // Ensure date is in YYYY-MM-DD format
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (dateRegex.test(aiReleaseDate)) {
                console.log('Using AI release date:', aiReleaseDate);
                // Convert YYYY-MM-DD to full ISO string
                return new Date(aiReleaseDate).toISOString();
              }

              // Try to parse and format the date
              try {
                const parsedDate = new Date(aiReleaseDate);
                if (!isNaN(parsedDate.getTime())) {
                  const formattedDate = parsedDate.toISOString();
                  console.log('Formatted AI release date from', aiReleaseDate, 'to', formattedDate);
                  return formattedDate;
                }
              } catch (error) {
                console.error('Error parsing AI release date:', error);
              }

              console.warn('Invalid release date from AI, using current date');
              return new Date().toISOString();
            })(),
            systems: releaseData.releaseDetails?.systems || [],
            min_os: sysReqData.systemRequirements?.minimum.os || "",
            min_processor: sysReqData.systemRequirements?.minimum.processor || "",
            min_memory: sysReqData.systemRequirements?.minimum.memory || "",
            min_graphics: sysReqData.systemRequirements?.minimum.graphics || "",
            min_storage: sysReqData.systemRequirements?.minimum.storage || "",
            rec_os: sysReqData.systemRequirements?.recommended.os || "",
            rec_processor: sysReqData.systemRequirements?.recommended.processor || "",
            rec_memory: sysReqData.systemRequirements?.recommended.memory || "",
            rec_graphics: sysReqData.systemRequirements?.recommended.graphics || "",
            rec_storage: sysReqData.systemRequirements?.recommended.storage || "",
            image: imagesData.images?.cover || "",
            screenshots: (imagesData.images?.screenshots || []).map((url, index) => ({
              url,
              order_index: index
            })),
            playtime: 0,
            feature_size: "normal",
            homepage_sections: [],
            awards: Array.isArray(awardsData?.awards?.awards) ? awardsData.awards.awards : [],
            award_dates: awardsData?.awards?.award_dates || {},
            youtube_trailer_url: results.find(r => r.youtubeTrailer)?.youtubeTrailer?.url || null,
            online_coop: multiplayerData.multiplayerDetails?.online_coop || false,
            couch_coop: multiplayerData.multiplayerDetails?.couch_coop || false,
            split_screen: multiplayerData.multiplayerDetails?.split_screen || false,
            max_players: multiplayerData.multiplayerDetails?.max_players || 0,
          };

          console.log('Attempting to insert review data:', reviewData);

          // Insert review into database
          try {
            const { data, error } = await supabase
              .from("reviews")
              .insert([reviewData])
              .select()
              .single();

            if (error) {
              console.error('Database insertion error:', error);
              throw new Error(`Database error: ${error.message}`);
            }

            if (!data) {
              throw new Error('No data returned from insert operation');
            }

            console.log('Successfully inserted review:', data);
            updateGameProgress(index, 'database', 'completed');
            toast.success(`Created review for ${game.title}`);
          } catch (dbError: any) {
            console.error('Detailed database error:', dbError);
            updateGameProgress(index, 'database', 'error', dbError.message);
            throw new Error(`Failed to save review: ${dbError.message}`);
          }

          // Don't close the modal if there was an error
          const currentProgress = progress[index];
          if (currentProgress && isGameCompleted(currentProgress)) {
            // Close modal and clear form only if all steps completed successfully
            setIsOpen(false);
            setGameTitles([{ title: "", scheduledFor: null, isDatePickerOpen: false }]);
            setProgress([]);
            onReviewCreated();
          }
        } catch (error: any) {
          console.error(`Error generating review for ${game.title}:`, error);
          toast.error(`Failed to create review for ${game.title}: ${error.message}`);
          updateGameProgress(index, 'database', 'error', error.message);
        }
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const StatusIcon = ({ status, error }: { status: GenerationStatus; error?: string }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return (
          <div className="group relative">
            <XCircle className="h-4 w-4 text-red-500" />
            {error && (
              <div className="absolute left-6 top-0 hidden group-hover:block bg-black text-white text-xs p-2 rounded">
                {error}
              </div>
            )}
          </div>
        );
      case 'inProgress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const isGameCompleted = (game?: GameProgress) => {
    if (!game || !game.steps) return false;
    return Object.values(game.steps).every(step => step.status === 'completed');
  };

  const isGameInProgress = (game?: GameProgress) => {
    if (!game || !game.steps) return false;
    return Object.values(game.steps).some(step => step.status === 'inProgress');
  };

  const isGameFailed = (game?: GameProgress) => {
    if (!game || !game.steps) return false;
    return Object.values(game.steps).some(step => step.status === 'error');
  };

  const GameStatusIcon = ({ game }: { game: GameProgress }) => {
    if (isGameCompleted(game)) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (isGameFailed(game)) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (isGameInProgress(game)) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        // Clear progress when dialog closes
        setProgress([]);
        setGameTitles([{ title: "", scheduledFor: null, isDatePickerOpen: false }]);
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Wand2 className="h-4 w-4 mr-2" />
          AI Review Spinner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Review Spinner</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {gameTitles.map((game, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <GameTitleGenerator
                  onTitleGenerated={(title) => updateGameTitle(index, title)}
                  existingTitles={gameTitles.map(g => g.title)}
                  currentTitle={game.title}
                />
                <div className="flex-1">
                  <Input
                    placeholder="Enter game title"
                    value={game.title}
                    onChange={(e) => updateGameTitle(index, e.target.value)}
                  />
                </div>
                <Button
                  variant={game.scheduledFor ? "secondary" : "outline"}
                  size="icon"
                  type="button"
                  onClick={() => toggleDatePicker(index)}
                  className="shrink-0"
                  title={game.scheduledFor ? new Date(game.scheduledFor).toLocaleString() : 'Schedule review'}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                {gameTitles.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGameTitle(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {game.isDatePickerOpen && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type="datetime-local"
                      value={game.scheduledFor || ''}
                      onChange={(e) => updateScheduledTime(index, e.target.value)}
                      className="flex-1 [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
                  </div>
                  {game.scheduledFor && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateScheduledTime(index, null)}
                      className="shrink-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={addGameTitle}>
            <Plus className="h-4 w-4 mr-2" />
            Add Another Game
          </Button>

          {progress.length > 0 && (
            <div className="mt-4 space-y-2">
              {progress.map((game, gameIndex) => (
                <div key={gameIndex} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{game.title}</h4>
                    <GameStatusIcon game={game} />
                  </div>
                  
                  {(isGameInProgress(game) || isGameFailed(game)) && (
                    <div className="mt-2 space-y-2">
                      {GENERATION_STEPS.map(step => (
                        <div key={step.key} className="flex items-center justify-between text-sm">
                          <span>{step.label}</span>
                          <StatusIcon 
                            status={game.steps[step.key].status} 
                            error={game.steps[step.key].error}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button 
            onClick={generateReviews} 
            disabled={isGenerating}
          >
            {isGenerating ? "Generating Reviews..." : "Create Reviews"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 