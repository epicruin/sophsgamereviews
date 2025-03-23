import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { ArticleFormProps, ArticleFormData, initialFormData } from "./types";
import { ArticleAIGenerateButton } from "@/components/ui/article-ai-generate-button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const ArticleForm = ({ articleData }: ArticleFormProps) => {
  // Format datetime for input element (needs YYYY-MM-DDThh:mm format)
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Format to YYYY-MM-DDThh:mm
      return date.toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  const [formData, setFormData] = useState<ArticleFormData>(
    articleData ? {
      id: articleData.id,
      title: articleData.title,
      summary: articleData.summary,
      content: articleData.content,
      tldr: articleData.tldr,
      image: articleData.image,
      scheduled_for: articleData.scheduled_for || null,
      published_date: articleData.published_date || null
    } : initialFormData
  );

  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const now = new Date().toISOString();
      
      // Determine if we need to set published_date
      // If there's no published_date and no scheduled_for, then this is a direct publish now
      const shouldPublish = !formData.published_date && !formData.scheduled_for;
      
      // Prepare article data for database
      const articleSubmitData = {
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        tldr: formData.tldr,
        image: formData.image,
        author_id: session.user.id,
        updated_at: now,
        scheduled_for: formData.scheduled_for,
        published_date: shouldPublish ? now : formData.published_date
      };

      let result;
      if (articleData) {
        // Update existing article
        const { data, error } = await supabase
          .from("articles")
          .update(articleSubmitData)
          .eq('id', articleData.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success("Article updated successfully");
      } else {
        // Create new article
        const { data, error } = await supabase
          .from("articles")
          .insert({
            ...articleSubmitData,
            created_at: now
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success("Article created successfully");
      }

      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Error saving article:", error);
      toast.error(`Failed to ${articleData ? 'update' : 'create'} article: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormUpdate = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card className="p-6">
        <div className="relative flex justify-end items-center mb-4">
          <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Basic Information</h3>
          <div className="z-10">
            <ArticleAIGenerateButton
              articleTitle={formData.title || "New Article"}
              section="titleAndSummary"
              onGenerated={(content) => {
                if (content && content.title && content.summary) {
                  // If we get structured data with title and summary
                  handleFormUpdate("title", content.title);
                  handleFormUpdate("summary", content.summary);
                } else if (typeof content === 'string') {
                  // Fallback to old behavior if we get a string
                  if (!formData.title) {
                    const title = content.split('.')[0].trim();
                    handleFormUpdate("title", title);
                  }
                  handleFormUpdate("summary", content);
                }
              }}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Article Title"
              required
            />
          </div>
          
          <div className="relative">
            {showPreview ? (
              <div className="border rounded-md p-4 min-h-[100px] bg-muted/20">
                {formData.summary ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formData.summary}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center h-full flex items-center justify-center">
                    <p>Your summary preview will appear here</p>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Summary (brief description)"
                rows={3}
                required
              />
            )}
          </div>
        </div>
      </Card>
      
      {/* Image */}
      <Card className="p-6">
        <div className="relative flex justify-end items-center mb-4">
          <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Featured Image</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Input
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Image URL"
              required
            />
          </div>
          {formData.image && (
            <div className="mt-4">
              <img 
                src={formData.image} 
                alt="Article preview" 
                className="max-h-60 rounded-md object-cover"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Article Content */}
      <Card className="p-6">
        <div className="relative flex justify-end items-center mb-4">
          <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">Article Content</h3>
          <div className="z-10">
            <ArticleAIGenerateButton
              articleTitle={formData.title}
              section="content"
              onGenerated={(content) => {
                handleFormUpdate("content", content);
              }}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            {showPreview ? (
              <div className="border rounded-md p-4 min-h-[300px] bg-muted/20">
                {formData.content ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formData.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center h-full flex items-center justify-center">
                    <p>Your content preview will appear here</p>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Main article content"
                rows={10}
                required
              />
            )}
          </div>
        </div>
      </Card>

      {/* TL;DR */}
      <Card className="p-6">
        <div className="relative flex justify-end items-center mb-4">
          <h3 className="absolute left-0 right-0 text-lg font-semibold text-center">TL;DR</h3>
          <div className="z-10">
            <ArticleAIGenerateButton
              articleTitle={formData.title}
              section="tldr"
              onGenerated={(content) => {
                handleFormUpdate("tldr", content);
              }}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            {showPreview ? (
              <div className="border rounded-md p-4 min-h-[100px] bg-muted/20">
                {formData.tldr ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formData.tldr}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center h-full flex items-center justify-center">
                    <p>Your TL;DR preview will appear here</p>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                id="tldr"
                name="tldr"
                value={formData.tldr}
                onChange={handleChange}
                placeholder="Too Long; Didn't Read summary"
                rows={3}
                required
              />
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center gap-4">
        <div className="flex border rounded-md overflow-hidden">
          <Button
            type="button"
            variant={!showPreview ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setShowPreview(false)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant={showPreview ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setShowPreview(true)}
          >
            Preview
          </Button>
        </div>

        <div className="flex gap-4">
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
                id="scheduled_for"
                name="scheduled_for"
                value={formatDateForInput(formData.scheduled_for)}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for: e.target.value || null }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData(prev => ({ ...prev, scheduled_for: null }))}
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
      </div>
    </form>
  );
}; 