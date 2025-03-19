import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings } from "lucide-react";

interface BackgroundSettingsDialogProps {
  trigger?: React.ReactNode;
}

const BackgroundSettingsDialog = ({ trigger }: BackgroundSettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [homepageBackground, setHomepageBackground] = useState<string | null>(null);
  const [modalBackground, setModalBackground] = useState<string | null>(null);
  const [reviewBackground, setReviewBackground] = useState<string | null>(null);
  const [articleBackground, setArticleBackground] = useState<string | null>(null);
  const [authorBackground, setAuthorBackground] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Check admin status first
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (adminError || !isAdmin) {
        toast.error("You don't have permission to access these settings");
        setOpen(false);
        return;
      }

      // Load settings
      const { data: homepageSetting, error: homepageError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'homepage_background')
        .single();

      const { data: modalSetting, error: modalError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'modal_background')
        .single();

      const { data: reviewSetting, error: reviewError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'review_background')
        .single();

      const { data: articleSetting, error: articleError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'article_background')
        .single();
        
      const { data: authorSetting, error: authorError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'author_background')
        .single();

      // Set defaults if no settings exist
      const defaultHomepage = 'aurora';
      const defaultModal = 'auroraBlue';

      // Parse and set homepage background
      if (homepageSetting?.value) {
        const value = JSON.parse(homepageSetting.value);
        setHomepageBackground(value.background);
      } else {
        setHomepageBackground(defaultHomepage);
      }
      
      // Parse and set modal background
      if (modalSetting?.value) {
        const value = JSON.parse(modalSetting.value);
        setModalBackground(value.background);
      } else {
        setModalBackground(defaultModal);
      }

      // Parse and set review background
      if (reviewSetting?.value) {
        const value = JSON.parse(reviewSetting.value);
        setReviewBackground(value.background);
      } else {
        setReviewBackground(defaultHomepage);
      }

      // Parse and set article background
      if (articleSetting?.value) {
        const value = JSON.parse(articleSetting.value);
        setArticleBackground(value.background);
      } else {
        setArticleBackground(defaultModal);
      }
      
      // Parse and set author background
      if (authorSetting?.value) {
        const value = JSON.parse(authorSetting.value);
        setAuthorBackground(value.background);
      } else {
        setAuthorBackground(defaultHomepage);
      }

      if (homepageError || modalError || reviewError || articleError || authorError) {
        console.error("Error loading settings:", homepageError || modalError || reviewError || articleError || authorError);
        toast.error("Failed to load background settings");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Verify admin status
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (adminError || !isAdmin) {
        toast.error("You don't have permission to save these settings");
        return;
      }

      // Update homepage background
      const { error: homepageError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'homepage_background',
          value: JSON.stringify({ background: homepageBackground }),
          description: 'Background type for the homepage: "aurora" or other valid background types',
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'key'
        });

      // Update modal background
      const { error: modalError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'modal_background',
          value: JSON.stringify({ background: modalBackground }),
          description: 'Background type for modals and dialogs: "aurora" or other valid background types',
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'key'
        });

      // Update review background
      const { error: reviewError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'review_background',
          value: JSON.stringify({ background: reviewBackground }),
          description: 'Background type for single review pages: "aurora" or other valid background types',
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'key'
        });

      // Update article background
      const { error: articleError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'article_background',
          value: JSON.stringify({ background: articleBackground }),
          description: 'Background type for single article pages: "aurora" or other valid background types',
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'key'
        });

      // Update author background
      const { error: authorError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'author_background',
          value: JSON.stringify({ background: authorBackground }),
          description: 'Background type for author profile pages: "aurora" or other valid background types',
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'key'
        });

      // Save to localStorage as backup
      try {
        localStorage.setItem('sophsreviews_homepage_background', homepageBackground || '');
        localStorage.setItem('sophsreviews_modal_background', modalBackground || '');
        localStorage.setItem('sophsreviews_review_background', reviewBackground || '');
        localStorage.setItem('sophsreviews_article_background', articleBackground || '');
        localStorage.setItem('sophsreviews_author_background', authorBackground || '');
      } catch (localStorageError) {
        console.warn('Error writing to localStorage:', localStorageError);
      }

      if (homepageError || modalError || reviewError || articleError || authorError) {
        console.error("Error saving settings:", homepageError || modalError || reviewError || articleError || authorError);
        toast.error("Failed to save background settings");
      } else {
        toast.success("Background settings saved successfully");
        setOpen(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const getModalBackground = (color: string) => {
    const gradients = {
      // Animated backgrounds (for reference)
      aurora: 'linear-gradient(to bottom right, rgb(245, 190, 220), rgb(235, 120, 170), rgb(70, 65, 75))',
      auroraBlue: 'linear-gradient(to bottom right, rgb(180, 210, 250), rgb(140, 180, 245), rgb(65, 70, 85))',
      // Static versions of aurora colors
      staticPink: 'linear-gradient(to bottom right, rgb(245, 190, 220), rgb(235, 120, 170), rgb(70, 65, 75))',
      staticBlue: 'linear-gradient(to bottom right, rgb(180, 210, 250), rgb(140, 180, 245), rgb(65, 70, 85))',
      // Other static colors
      lavender: 'linear-gradient(to bottom right, rgb(220, 200, 245), rgb(180, 160, 235), rgb(75, 70, 95))',
      peach: 'linear-gradient(to bottom right, rgb(245, 205, 180), rgb(235, 165, 140), rgb(85, 70, 75))',
      mint: 'linear-gradient(to bottom right, rgb(200, 235, 215), rgb(160, 225, 185), rgb(70, 85, 80))',
      lilac: 'linear-gradient(to bottom right, rgb(225, 205, 245), rgb(185, 165, 235), rgb(80, 70, 95))',
      rosePetal: 'linear-gradient(to bottom right, rgb(245, 210, 220), rgb(235, 170, 180), rgb(85, 65, 75))',
      babyBlue: 'linear-gradient(to bottom right, rgb(195, 220, 245), rgb(155, 180, 235), rgb(70, 75, 90))',
      coral: 'linear-gradient(to bottom right, rgb(245, 195, 185), rgb(235, 155, 145), rgb(90, 70, 75))',
      periwinkle: 'linear-gradient(to bottom right, rgb(205, 210, 245), rgb(165, 170, 235), rgb(75, 75, 95))'
    };
    return gradients[color as keyof typeof gradients] || gradients.aurora;
  };

  // Disable the dialog content while loading
  const isDisabled = isLoading || isSaving;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Background Settings</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" style={{ background: getModalBackground(modalBackground || 'aurora') }}>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Background Settings</DialogTitle>
          <DialogDescription>
            Configure the background effects for different parts of the site.
            {isLoading && " Loading settings..."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="homepageBackground">Homepage Background</Label>
            <Select 
              value={homepageBackground || undefined}
              onValueChange={setHomepageBackground}
              disabled={isDisabled}
            >
              <SelectTrigger id="homepageBackground">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select background"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aurora">Aurora (Pink) (animated)</SelectItem>
                <SelectItem value="auroraBlue">Aurora (Blue) (animated)</SelectItem>
                <SelectItem value="staticPink">Colour: Pink (static)</SelectItem>
                <SelectItem value="staticBlue">Colour: Blue (static)</SelectItem>
                <SelectItem value="lavender">Colour: Lavender (static)</SelectItem>
                <SelectItem value="peach">Colour: Peach (static)</SelectItem>
                <SelectItem value="mint">Colour: Mint (static)</SelectItem>
                <SelectItem value="lilac">Colour: Lilac (static)</SelectItem>
                <SelectItem value="rosePetal">Colour: Rose Petal (static)</SelectItem>
                <SelectItem value="babyBlue">Colour: Baby Blue (static)</SelectItem>
                <SelectItem value="coral">Colour: Coral (static)</SelectItem>
                <SelectItem value="periwinkle">Colour: Periwinkle (static)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="modalBackground">Modal Background</Label>
            <Select 
              value={modalBackground || undefined}
              onValueChange={setModalBackground}
              disabled={isDisabled}
            >
              <SelectTrigger id="modalBackground">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select background"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aurora">Colour: Pink (static)</SelectItem>
                <SelectItem value="auroraBlue">Colour: Blue (static)</SelectItem>
                <SelectItem value="lavender">Colour: Lavender (static)</SelectItem>
                <SelectItem value="peach">Colour: Peach (static)</SelectItem>
                <SelectItem value="mint">Colour: Mint (static)</SelectItem>
                <SelectItem value="lilac">Colour: Lilac (static)</SelectItem>
                <SelectItem value="rosePetal">Colour: Rose Petal (static)</SelectItem>
                <SelectItem value="babyBlue">Colour: Baby Blue (static)</SelectItem>
                <SelectItem value="coral">Colour: Coral (static)</SelectItem>
                <SelectItem value="periwinkle">Colour: Periwinkle (static)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reviewBackground">Review Page Background</Label>
            <Select 
              value={reviewBackground || undefined}
              onValueChange={setReviewBackground}
              disabled={isDisabled}
            >
              <SelectTrigger id="reviewBackground">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select background"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aurora">Aurora (Pink) (animated)</SelectItem>
                <SelectItem value="auroraBlue">Aurora (Blue) (animated)</SelectItem>
                <SelectItem value="staticPink">Colour: Pink (static)</SelectItem>
                <SelectItem value="staticBlue">Colour: Blue (static)</SelectItem>
                <SelectItem value="lavender">Colour: Lavender (static)</SelectItem>
                <SelectItem value="peach">Colour: Peach (static)</SelectItem>
                <SelectItem value="mint">Colour: Mint (static)</SelectItem>
                <SelectItem value="lilac">Colour: Lilac (static)</SelectItem>
                <SelectItem value="rosePetal">Colour: Rose Petal (static)</SelectItem>
                <SelectItem value="babyBlue">Colour: Baby Blue (static)</SelectItem>
                <SelectItem value="coral">Colour: Coral (static)</SelectItem>
                <SelectItem value="periwinkle">Colour: Periwinkle (static)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="articleBackground">Article Page Background</Label>
            <Select 
              value={articleBackground || undefined}
              onValueChange={setArticleBackground}
              disabled={isDisabled}
            >
              <SelectTrigger id="articleBackground">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select background"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aurora">Aurora (Pink) (animated)</SelectItem>
                <SelectItem value="auroraBlue">Aurora (Blue) (animated)</SelectItem>
                <SelectItem value="staticPink">Colour: Pink (static)</SelectItem>
                <SelectItem value="staticBlue">Colour: Blue (static)</SelectItem>
                <SelectItem value="lavender">Colour: Lavender (static)</SelectItem>
                <SelectItem value="peach">Colour: Peach (static)</SelectItem>
                <SelectItem value="mint">Colour: Mint (static)</SelectItem>
                <SelectItem value="lilac">Colour: Lilac (static)</SelectItem>
                <SelectItem value="rosePetal">Colour: Rose Petal (static)</SelectItem>
                <SelectItem value="babyBlue">Colour: Baby Blue (static)</SelectItem>
                <SelectItem value="coral">Colour: Coral (static)</SelectItem>
                <SelectItem value="periwinkle">Colour: Periwinkle (static)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="authorBackground">Author Page Background</Label>
            <Select 
              value={authorBackground || undefined}
              onValueChange={setAuthorBackground}
              disabled={isDisabled}
            >
              <SelectTrigger id="authorBackground">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select background"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aurora">Aurora (Pink) (animated)</SelectItem>
                <SelectItem value="auroraBlue">Aurora (Blue) (animated)</SelectItem>
                <SelectItem value="staticPink">Colour: Pink (static)</SelectItem>
                <SelectItem value="staticBlue">Colour: Blue (static)</SelectItem>
                <SelectItem value="lavender">Colour: Lavender (static)</SelectItem>
                <SelectItem value="peach">Colour: Peach (static)</SelectItem>
                <SelectItem value="mint">Colour: Mint (static)</SelectItem>
                <SelectItem value="lilac">Colour: Lilac (static)</SelectItem>
                <SelectItem value="rosePetal">Colour: Rose Petal (static)</SelectItem>
                <SelectItem value="babyBlue">Colour: Baby Blue (static)</SelectItem>
                <SelectItem value="coral">Colour: Coral (static)</SelectItem>
                <SelectItem value="periwinkle">Colour: Periwinkle (static)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isDisabled}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={isDisabled}
          >
            {isSaving ? "Saving..." : isLoading ? "Loading..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackgroundSettingsDialog; 