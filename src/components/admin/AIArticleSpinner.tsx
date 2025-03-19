import { useState, useEffect } from "react";
import { X, Plus, Wand2, CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateArticleContent, ArticleInfo } from "@/lib/article-openai";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageSearchButton } from "@/components/ui/image-search-button";
import { ArticleTitleGenerator } from "@/components/ui/article-title-generator";

type GenerationStep = 'titleAndSummary' | 'content' | 'tldr' | 'image' | 'database';

type GenerationStatus = 'pending' | 'inProgress' | 'completed' | 'error';

interface ArticleProgress {
  title: string;
  steps: Record<GenerationStep, { status: GenerationStatus; error?: string }>;
}

const GENERATION_STEPS: { key: GenerationStep; label: string }[] = [
  { key: 'titleAndSummary', label: 'Generating Title & Summary' },
  { key: 'content', label: 'Writing Article Content' },
  { key: 'tldr', label: 'Creating TL;DR Summary' },
  { key: 'image', label: 'Finding Featured Image' },
  { key: 'database', label: 'Saving to Database' }
];

interface ArticleTitle {
  title: string;
  summary: string;
  scheduledFor: string | null;
  isDatePickerOpen: boolean;
}

export const AIArticleSpinner = ({ onArticleCreated }: { onArticleCreated: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [articleTitles, setArticleTitles] = useState<ArticleTitle[]>([{ title: "", summary: "", scheduledFor: null, isDatePickerOpen: false }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ArticleProgress[]>([]);

  const addArticleTitle = () => {
    setArticleTitles([...articleTitles, { title: "", summary: "", scheduledFor: null, isDatePickerOpen: false }]);
  };

  const removeArticleTitle = (index: number) => {
    setArticleTitles(articleTitles.filter((_, i) => i !== index));
  };

  const updateArticleTitle = (index: number, value: string) => {
    const newTitles = [...articleTitles];
    newTitles[index] = { ...newTitles[index], title: value };
    setArticleTitles(newTitles);
  };

  const updateArticleSummary = (index: number, value: string) => {
    const newTitles = [...articleTitles];
    newTitles[index] = { ...newTitles[index], summary: value };
    setArticleTitles(newTitles);
  };

  const updateTitleAndSummary = (index: number, title: string, summary: string) => {
    const newTitles = [...articleTitles];
    newTitles[index] = { ...newTitles[index], title, summary };
    setArticleTitles(newTitles);
  };

  const toggleDatePicker = (index: number) => {
    const newTitles = [...articleTitles];
    newTitles[index] = { ...newTitles[index], isDatePickerOpen: !newTitles[index].isDatePickerOpen };
    setArticleTitles(newTitles);
  };

  const updateScheduledTime = (index: number, value: string | null) => {
    const newTitles = [...articleTitles];
    newTitles[index] = { ...newTitles[index], scheduledFor: value };
    setArticleTitles(newTitles);
  };

  const updateArticleProgress = (
    gameIndex: number,
    step: GenerationStep,
    status: GenerationStatus,
    error?: string
  ) => {
    setProgress(prev => {
      const newProgress = [...prev];
      if (newProgress[gameIndex]) {
        newProgress[gameIndex].steps[step] = { status, error };
      }
      return newProgress;
    });
  };

  const generateSummaryForTitle = async (articleTitle: string): Promise<string> => {
    try {
      const result = await generateArticleContent(articleTitle, 'titleAndSummary');
      
      // Extract the summary from the result
      if (result.titleAndSummary) {
        if (typeof result.titleAndSummary === 'object' && result.titleAndSummary.summary) {
          return result.titleAndSummary.summary;
        } else if (typeof result.titleAndSummary === 'string') {
          return result.titleAndSummary;
        }
      }
      return ""; // Default empty summary if extraction fails
    } catch (error) {
      console.error("Error generating summary:", error);
      return ""; // Return empty string on error
    }
  };

  const generateArticles = async () => {
    // Validate titles
    const validTitles = articleTitles.filter(g => g.title.trim() !== "");
    
    if (validTitles.length === 0) {
      toast.error("Please enter at least one article title");
      return;
    }

    try {
      setIsGenerating(true);
      setProgress([]);

      // Check for authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to generate articles");
        return;
      }

      // Get the latest scheduled article date that's in the future
      const { data: latestArticle } = await supabase
        .from('articles')
        .select('scheduled_for')
        .gt('scheduled_for', new Date().toISOString()) // Only get future scheduled articles
        .order('scheduled_for', { ascending: false })
        .limit(1) as { data: { scheduled_for: string | null }[] | null };

      // Set base date as either the latest scheduled article date or current date
      let baseDate = new Date();
      baseDate.setHours(12, 0, 0, 0); // Set to noon

      if (latestArticle && latestArticle.length > 0 && latestArticle[0].scheduled_for) {
        // If we have a future scheduled article, use that as base
        baseDate = new Date(latestArticle[0].scheduled_for);
      } else {
        // If no future articles, start from tomorrow at noon
        baseDate.setDate(baseDate.getDate() + 1);
      }

      // Process each article title sequentially
      for (const [index, article] of validTitles.entries()) {
        try {
          // Create a working copy of the article that we can modify
          const workingArticle = { ...article };
          
          // Initialize progress for this article
          setProgress(prev => [...prev, {
            title: workingArticle.title,
            steps: Object.fromEntries(
              GENERATION_STEPS.map(s => [s.key, { status: 'pending' }])
            ) as Record<GenerationStep, { status: GenerationStatus; error?: string }>
          }]);

          // Generate summary if it's not already provided
          if (!workingArticle.summary || workingArticle.summary.trim() === "") {
            updateArticleProgress(index, 'titleAndSummary', 'inProgress');
            
            try {
              const summary = await generateSummaryForTitle(workingArticle.title);
              workingArticle.summary = summary;
              updateArticleSummary(index, summary); // Update UI state
              updateArticleProgress(index, 'titleAndSummary', 'completed');
            } catch (error: any) {
              console.error('Error generating summary:', error);
              updateArticleProgress(index, 'titleAndSummary', 'error', error.message);
              // Continue with empty summary if generation fails
              workingArticle.summary = "No summary available.";
            }
          } else {
            updateArticleProgress(index, 'titleAndSummary', 'completed');
          }

          // Generate all required content
          const results = [];
          const generationSteps: (keyof ArticleInfo)[] = [
            'content',
            'tldr',
            'imageQuery'
          ];

          for (const step of generationSteps) {
            updateArticleProgress(index, step as GenerationStep, 'inProgress');
            try {
              const result = await generateArticleContent(workingArticle.title, step);
              results.push(result);
              updateArticleProgress(index, step as GenerationStep, 'completed');
            } catch (error: any) {
              console.error(`Error generating ${step}:`, error);
              updateArticleProgress(index, step as GenerationStep, 'error', error.message);
              // Continue with other steps even if one fails
            }
          }

          // Extract the generated content
          const contentData = results.find(r => r.content) || {};
          const tldrData = results.find(r => r.tldr) || {};
          const imageQueryData = results.find(r => r.imageQuery) || {};

          // Generate image based on the imageQuery
          let imageUrl = "";
          updateArticleProgress(index, 'image', 'inProgress');
          try {
            // Default to article title if no image query was generated
            const imageQuery = imageQueryData.imageQuery || workingArticle.title;
            
            // This would normally call an image search API
            // For now, we'll use a placeholder
            imageUrl = `https://source.unsplash.com/random/1200x800/?${encodeURIComponent(imageQuery)}`;
            
            updateArticleProgress(index, 'image', 'completed');
          } catch (error: any) {
            console.error('Error getting image:', error);
            updateArticleProgress(index, 'image', 'error', error.message);
            // Default image if search fails
            imageUrl = "https://source.unsplash.com/random/1200x800/?article";
          }

          // Prepare for database save
          updateArticleProgress(index, 'database', 'inProgress');

          // Calculate scheduled date (use provided date or default to 7 days after the last scheduled article)
          const scheduledDate = workingArticle.scheduledFor 
            ? new Date(workingArticle.scheduledFor)
            : (() => {
                if (index === 0) {
                  // First article: schedule 7 days from base date
                  const date = new Date(baseDate);
                  date.setDate(date.getDate() + 7);
                  baseDate = date;
                  return date;
                } else {
                  // Subsequent articles: schedule 7 days after the previous one
                  const date = new Date(baseDate);
                  date.setDate(date.getDate() + 7);
                  baseDate = date;
                  return date;
                }
              })();

          // Prepare article data
          const articleData = {
            title: workingArticle.title,
            summary: workingArticle.summary,
            content: contentData.content || "Content generation failed. Please try again.",
            tldr: tldrData.tldr || "TL;DR generation failed. Please try again.",
            image: imageUrl,
            author_id: session.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_date: null,
            scheduled_for: scheduledDate.toISOString() // Always set a scheduled date
          };

          console.log('Attempting to insert article data:', articleData);

          // Save to database
          const { data: savedArticle, error } = await supabase
            .from('articles')
            .insert(articleData)
            .select()
            .single();

          if (error) {
            throw error;
          }

          updateArticleProgress(index, 'database', 'completed');
          console.log('Article saved successfully:', savedArticle);
        } catch (error: any) {
          console.error('Error processing article:', error);
          toast.error(`Error creating article: ${error.message}`);
          updateArticleProgress(index, 'database', 'error', error.message);
        }
      }

      // Callback to refresh articles list
      onArticleCreated();
      toast.success(`${validTitles.length} article(s) generated successfully!`);
    } catch (error: any) {
      console.error('Error generating articles:', error);
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

  const isArticleCompleted = (article?: ArticleProgress) => {
    if (!article || !article.steps) return false;
    return Object.values(article.steps).every(step => step.status === 'completed');
  };

  const isArticleInProgress = (article?: ArticleProgress) => {
    if (!article || !article.steps) return false;
    return Object.values(article.steps).some(step => step.status === 'inProgress');
  };

  const isArticleFailed = (article?: ArticleProgress) => {
    if (!article || !article.steps) return false;
    return Object.values(article.steps).some(step => step.status === 'error');
  };

  const ArticleStatusIcon = ({ article }: { article: ArticleProgress }) => {
    if (isArticleCompleted(article)) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (isArticleFailed(article)) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (isArticleInProgress(article)) {
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
        setArticleTitles([{ title: "", summary: "", scheduledFor: null, isDatePickerOpen: false }]);
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Wand2 className="h-4 w-4 mr-2" />
          AI Article Spinner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Article Spinner</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {articleTitles.map((article, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <ArticleTitleGenerator
                  onTitleGenerated={(title, summary) => updateTitleAndSummary(index, title, summary)}
                  existingTitles={articleTitles.map(a => a.title)}
                  currentTitle={article.title}
                />
                <div className="flex-1">
                  <Input
                    placeholder="Enter article title"
                    value={article.title}
                    onChange={(e) => updateArticleTitle(index, e.target.value)}
                  />
                </div>
                <Button
                  variant={article.scheduledFor ? "secondary" : "outline"}
                  size="icon"
                  type="button"
                  onClick={() => toggleDatePicker(index)}
                  className="shrink-0"
                  title={article.scheduledFor ? new Date(article.scheduledFor).toLocaleString() : 'Schedule article'}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                {index === 0 ? (
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={addArticleTitle}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => removeArticleTitle(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {article.summary && (
                <div className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-2 mt-1 mb-1">
                  {article.summary.length > 100 
                    ? `${article.summary.substring(0, 100)}...` 
                    : article.summary}
                </div>
              )}
              
              {article.isDatePickerOpen && (
                <div className="pt-2">
                  <input
                    type="datetime-local"
                    value={article.scheduledFor || ''}
                    onChange={(e) => updateScheduledTime(index, e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
            </div>
          ))}

          {progress.length > 0 && (
            <div className="mt-4 space-y-2">
              {progress.map((article, articleIndex) => (
                <div key={articleIndex} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{article.title}</h4>
                    <ArticleStatusIcon article={article} />
                  </div>
                  
                  {(isArticleInProgress(article) || isArticleFailed(article)) && (
                    <div className="mt-2 space-y-2">
                      {GENERATION_STEPS.map(step => (
                        <div key={step.key} className="flex items-center justify-between text-sm">
                          <span>{step.label}</span>
                          <StatusIcon 
                            status={article.steps[step.key].status} 
                            error={article.steps[step.key].error}
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
            onClick={generateArticles} 
            disabled={isGenerating}
          >
            {isGenerating ? "Generating Articles..." : "Create Articles"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 