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
  const [homepageBackground, setHomepageBackground] = useState<string>("aurora");
  const [modalBackground, setModalBackground] = useState<string>("auroraBlue");
  const [reviewBackground, setReviewBackground] = useState<string>("aurora");
  const [articleBackground, setArticleBackground] = useState<string>("auroraBlue");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
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

      if (homepageSetting) {
        const value = JSON.parse(homepageSetting.value);
        setHomepageBackground(value.background);
      }
      
      if (modalSetting) {
        const value = JSON.parse(modalSetting.value);
        setModalBackground(value.background);
      }

      if (reviewSetting) {
        const value = JSON.parse(reviewSetting.value);
        setReviewBackground(value.background);
      } else {
        // Default to homepage background if not set
        setReviewBackground(homepageSetting ? JSON.parse(homepageSetting.value).background : 'aurora');
      }

      if (articleSetting) {
        const value = JSON.parse(articleSetting.value);
        setArticleBackground(value.background);
      } else {
        // Default to modal background if not set
        setArticleBackground(modalSetting ? JSON.parse(modalSetting.value).background : 'auroraBlue');
      }

      if (homepageError || modalError || reviewError || articleError) {
        console.error("Error loading settings:", homepageError || modalError || reviewError || articleError);
        toast.error("Failed to load background settings");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
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
        .update({ 
          value: JSON.stringify({ background: homepageBackground }),
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('key', 'homepage_background');

      // Update modal background
      const { error: modalError } = await supabase
        .from('site_settings')
        .update({ 
          value: JSON.stringify({ background: modalBackground }),
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('key', 'modal_background');

      // Update review background
      const { error: reviewError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'review_background',
          value: JSON.stringify({ background: reviewBackground }),
          description: 'Background type for single review pages: "aurora" or other valid background types',
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
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
        });

      // Save to localStorage as backup
      try {
        localStorage.setItem('sophsreviews_review_background', reviewBackground);
        localStorage.setItem('sophsreviews_article_background', articleBackground);
      } catch (localStorageError) {
        console.warn('Error writing to localStorage:', localStorageError);
      }

      if (homepageError || modalError || reviewError || articleError) {
        console.error("Error saving settings:", homepageError || modalError || reviewError || articleError);
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
      <DialogContent className="sm:max-w-[425px]" style={{ background: getModalBackground(modalBackground) }}>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Background Settings</DialogTitle>
          <DialogDescription>
            Configure the background effects for different parts of the site.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="homepageBackground">Homepage Background</Label>
            <Select 
              value={homepageBackground} 
              onValueChange={setHomepageBackground}
            >
              <SelectTrigger id="homepageBackground">
                <SelectValue placeholder="Select background" />
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
              value={modalBackground} 
              onValueChange={setModalBackground}
            >
              <SelectTrigger id="modalBackground">
                <SelectValue placeholder="Select background" />
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
              value={reviewBackground} 
              onValueChange={setReviewBackground}
            >
              <SelectTrigger id="reviewBackground">
                <SelectValue placeholder="Select background" />
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
              value={articleBackground} 
              onValueChange={setArticleBackground}
            >
              <SelectTrigger id="articleBackground">
                <SelectValue placeholder="Select background" />
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
          >
            Cancel
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackgroundSettingsDialog; 