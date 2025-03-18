import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { ArticleFormProps, ArticleFormData, initialFormData } from "./types";
import { ArticleAIGenerateButton } from "@/components/ui/article-ai-generate-button";

export const ArticleForm = ({ articleData }: ArticleFormProps) => {
  const [formData, setFormData] = useState<ArticleFormData>(
    articleData ? {
      title: articleData.title,
      summary: articleData.summary,
      content: articleData.content,
      tldr: articleData.tldr,
      image: articleData.image,
      scheduled_for: articleData.scheduled_for ? new Date(articleData.scheduled_for).toISOString().slice(0, 16) : null,
    } : initialFormData
  );

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const articleFormData = {
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        tldr: formData.tldr,
        image: formData.image,
        author_id: session.user.id,
        scheduled_for: formData.scheduled_for,
      };

      let article;
      if (articleData?.id) {
        // Update existing article
        const { data, error: updateError } = await supabase
          .from("articles")
          .update(articleFormData)
          .eq('id', articleData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        article = data;
        toast.success("Article updated successfully");
      } else {
        // Create new article
        const { data, error: insertError } = await supabase
          .from("articles")
          .insert(articleFormData)
          .select()
          .single();

        if (insertError) throw insertError;
        article = data;
        toast.success("Article created successfully");
      }
      
      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error(error.message || "Failed to save article");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormUpdate = (field: keyof ArticleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Article Details</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="title">Title</Label>
              <ArticleAIGenerateButton
                articleTitle={formData.title}
                section="title"
                onGenerated={(content) => handleFormUpdate('title', content)}
              />
            </div>
            <Input
              id="title"
              placeholder="Article Title"
              value={formData.title}
              onChange={(e) => handleFormUpdate('title', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="image">Featured Image URL</Label>
            <Input
              id="image"
              placeholder="Image URL"
              value={formData.image}
              onChange={(e) => handleFormUpdate('image', e.target.value)}
              required
            />
            {formData.image && (
              <div className="mt-2">
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className="max-h-40 rounded-md object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image';
                  }}
                />
              </div>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="summary">Summary</Label>
              <ArticleAIGenerateButton
                articleTitle={formData.title}
                section="summary"
                onGenerated={(content) => handleFormUpdate('summary', content)}
              />
            </div>
            <Textarea
              id="summary"
              placeholder="A brief summary of the article"
              value={formData.summary}
              onChange={(e) => handleFormUpdate('summary', e.target.value)}
              required
              rows={3}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="content">Article Content</Label>
              <ArticleAIGenerateButton
                articleTitle={formData.title}
                section="content"
                onGenerated={(content) => handleFormUpdate('content', content)}
              />
            </div>
            <Textarea
              id="content"
              placeholder="Full article content (supports markdown)"
              value={formData.content}
              onChange={(e) => handleFormUpdate('content', e.target.value)}
              required
              rows={15}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="tldr">TL;DR</Label>
              <ArticleAIGenerateButton
                articleTitle={formData.title}
                section="tldr"
                onGenerated={(content) => handleFormUpdate('tldr', content)}
              />
            </div>
            <Textarea
              id="tldr"
              placeholder="A concise TL;DR summary"
              value={formData.tldr}
              onChange={(e) => handleFormUpdate('tldr', e.target.value)}
              required
              rows={3}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/admin/dashboard")}
        >
          Cancel
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              id="scheduleTime"
              value={formData.scheduled_for || ''}
              onChange={(e) => handleFormUpdate('scheduled_for', e.target.value || null)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFormUpdate('scheduled_for', null)}
            >
              Clear Schedule
            </Button>
          </div>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : formData.scheduled_for ? "Schedule Article" : "Save Article"}
          </Button>
        </div>
      </div>
    </form>
  );
}; 