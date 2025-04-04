import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Upload, Medal, Swords, Palette, ChevronRight, ChevronLeft, FileText, User, Clock, PenLine } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AIReviewSpinner } from "@/components/admin/AIReviewSpinner";
import { AIArticleSpinner } from "@/components/admin/AIArticleSpinner";
import { SectionOrderDialog } from "@/components/admin/SectionOrderDialog";
import BackgroundSettingsDialog from "@/components/admin/BackgroundSettingsDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/hooks/useConfirm";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Review {
  id: string;
  title: string;
  excerpt: string;
  rating: number;
  created_at: string;
  scheduled_for: string | null;
  genre: { name: string } | null;
  author_id: string;
  homepage_sections: string[];
}

interface Profile {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Genre {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  scheduled_for: string | null;
  author_id: string;
  published_date: string | null;
}

const ITEMS_PER_PAGE = 10;

const AdminDashboard = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [scheduledReviews, setScheduledReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({ username: null, avatar_url: null, bio: null });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<string>("");
  const [isUpdatingGenre, setIsUpdatingGenre] = useState(false);
  const [customSections, setCustomSections] = useState<{[key: string]: string}>({});
  const [newCustomSectionName, setNewCustomSectionName] = useState("");
  const [isUpdatingCustomSection, setIsUpdatingCustomSection] = useState(false);
  const [bio, setBio] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [scheduledArticles, setScheduledArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const navigate = useNavigate();
  const { confirm, ConfirmationDialog } = useConfirm();
  
  // Pagination states
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalCount, setReviewTotalCount] = useState(0);
  const [scheduledReviewPage, setScheduledReviewPage] = useState(1);
  const [scheduledReviewTotalCount, setScheduledReviewTotalCount] = useState(0);
  const [articlePage, setArticlePage] = useState(1);
  const [articleTotalCount, setArticleTotalCount] = useState(0);
  const [scheduledArticlePage, setScheduledArticlePage] = useState(1);
  const [scheduledArticleTotalCount, setScheduledArticleTotalCount] = useState(0);

  useEffect(() => {
    checkAdmin();
    fetchReviews();
    fetchProfile();
    fetchGenres();
    fetchCurrentGenreOfMonth();
    fetchCustomSectionName();
    fetchArticles();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/admin");
      return;
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', {
      user_id: session.user.id
    });

    if (!isAdmin) {
      await supabase.auth.signOut();
      navigate("/admin");
    }
  };

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setUsername(data.username || "");
        setBio(data.bio || "");
      }
    } catch (error) {
      toast.error("Failed to load profile");
      console.error("Error loading profile:", error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      setIsUpdatingProfile(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateUsername = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      setIsUpdatingProfile(true);
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', session.user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, username }));
      toast.success("Username updated successfully");
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateBio = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      setIsUpdatingProfile(true);
      const { error } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('id', session.user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, bio }));
      toast.success("Bio updated successfully");
    } catch (error) {
      console.error("Error updating bio:", error);
      toast.error("Failed to update bio");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const fetchReviews = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Get total count of regular reviews
      const { count: regularCount, error: countError } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', session.user.id)
        .or('scheduled_for.is.null,scheduled_for.lte.now()');

      if (countError) throw countError;
      setReviewTotalCount(regularCount || 0);

      // Fetch regular reviews (not scheduled or past scheduled date) with pagination
      const { data: regularData, error: regularError } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          excerpt,
          rating,
          created_at,
          scheduled_for,
          genre:genres!fk_reviews_genre(name),
          author_id,
          homepage_sections
        `)
        .eq('author_id', session.user.id)
        .or('scheduled_for.is.null,scheduled_for.lte.now()')
        .order('created_at', { ascending: false })
        .range((reviewPage - 1) * ITEMS_PER_PAGE, reviewPage * ITEMS_PER_PAGE - 1);

      if (regularError) throw regularError;
      setReviews((regularData || []) as unknown as Review[]);

      // Get total count of scheduled reviews
      const { count: scheduledCount, error: scheduledCountError } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', session.user.id)
        .not('scheduled_for', 'is', null)
        .gt('scheduled_for', new Date().toISOString());

      if (scheduledCountError) throw scheduledCountError;
      setScheduledReviewTotalCount(scheduledCount || 0);

      // Fetch scheduled reviews (future scheduled date) with pagination
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          excerpt,
          rating,
          created_at,
          scheduled_for,
          genre:genres!fk_reviews_genre(name),
          author_id,
          homepage_sections
        `)
        .eq('author_id', session.user.id)
        .not('scheduled_for', 'is', null)
        .gt('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .range((scheduledReviewPage - 1) * ITEMS_PER_PAGE, scheduledReviewPage * ITEMS_PER_PAGE - 1);

      if (scheduledError) throw scheduledError;
      setScheduledReviews((scheduledData || []) as unknown as Review[]);
    } catch (error: any) {
      toast.error("Failed to load reviews");
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update fetchReviews when pagination changes
  useEffect(() => {
    if (!isLoading) {
      fetchReviews();
    }
  }, [reviewPage, scheduledReviewPage]);

  const handleDelete = async (reviewId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this review?',
      { title: 'Delete Review' }
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error: any) {
      toast.error(`Failed to delete review: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const fetchGenres = async () => {
    try {
      const { data, error } = await supabase
        .from('genres')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setGenres(data || []);
    } catch (error) {
      console.error('Error fetching genres:', error);
      toast.error('Failed to load genres');
    }
  };

  const updateGenreOfMonth = async () => {
    if (!selectedGenreId) {
      toast.error('Please select a genre first');
      return;
    }

    try {
      setIsUpdatingGenre(true);

      // Update the current_genre_id for the genre_of_month section
      const { error } = await supabase
        .from('homepage_section_order')
        .update({ current_genre_id: selectedGenreId })
        .eq('section_id', 'genre_of_month');

      if (error) throw error;

      toast.success('Genre of the month updated successfully');
      fetchReviews();
    } catch (error: any) {
      console.error('Error updating genre of the month:', error);
      toast.error('Failed to update genre of the month');
    } finally {
      setIsUpdatingGenre(false);
    }
  };

  const clearGenreOfMonth = async () => {
    try {
      setIsUpdatingGenre(true);

      // Set the current_genre_id to null for the genre_of_month section
      const { error } = await supabase
        .from('homepage_section_order')
        .update({ current_genre_id: null })
        .eq('section_id', 'genre_of_month');

      if (error) throw error;

      // Reset the local state
      setSelectedGenreId("");
      
      toast.success('Genre of the month cleared');
      fetchReviews();
    } catch (error: any) {
      console.error('Error clearing genre of the month:', error);
      toast.error('Failed to clear genre of the month');
    } finally {
      setIsUpdatingGenre(false);
    }
  };

  const fetchCurrentGenreOfMonth = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_section_order')
        .select(`
          current_genre_id,
          genre:genres!homepage_section_order_current_genre_id_fkey(id, name)
        `)
        .eq('section_id', 'genre_of_month')
        .single();

      if (error) throw error;

      if (data && data.current_genre_id) {
        setSelectedGenreId(data.current_genre_id);
      }
    } catch (error) {
      console.error('Error fetching current genre of month:', error);
    }
  };

  const fetchCustomSectionName = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_section_order')
        .select('section_id, display_order')
        .eq('is_custom', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Convert array to object format for backward compatibility
      const sections = (data || []).reduce((acc, section) => ({
        ...acc,
        [section.section_id]: section.section_id // Using section_id as both key and name
      }), {});

      setCustomSections(sections);
    } catch (error) {
      console.error('Error fetching custom sections:', error);
      toast.error('Failed to load custom sections');
    }
  };

  const addCustomSection = async () => {
    if (!newCustomSectionName.trim()) return;

    try {
      setIsUpdatingCustomSection(true);

      // Get the highest display_order
      const { data: orderData } = await supabase
        .from('homepage_section_order')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = orderData?.[0]?.display_order ?? 0;
      const newSectionId = newCustomSectionName.toLowerCase().replace(/\s+/g, '_');

      // Insert new custom section
      const { error } = await supabase
        .from('homepage_section_order')
        .insert({
          section_id: newSectionId,
          display_order: nextOrder + 1,
          is_custom: true,
          icon_name: 'Swords' // Default icon for custom sections
        });

      if (error) throw error;

      // Update local state
      setCustomSections(prev => ({
        ...prev,
        [newSectionId]: newSectionId
      }));
      setNewCustomSectionName("");
      toast.success('Custom section added successfully');
    } catch (error: any) {
      console.error('Error adding custom section:', error);
      toast.error(error.message || 'Failed to add custom section');
    } finally {
      setIsUpdatingCustomSection(false);
    }
  };

  const updateCustomSectionName = async (oldSectionId: string, newName: string) => {
    try {
      setIsUpdatingCustomSection(true);
      const newSectionId = newName.toLowerCase().replace(/\s+/g, '_');

      // Update the section in homepage_section_order
      const { error } = await supabase
        .from('homepage_section_order')
        .update({ section_id: newSectionId })
        .eq('section_id', oldSectionId)
        .eq('is_custom', true);

      if (error) throw error;

      // Update reviews that use this section
      const { error: reviewError } = await supabase.rpc('update_review_section', {
        old_section_id: oldSectionId,
        new_section_id: newSectionId
      });

      if (reviewError) throw reviewError;

      // Update local state
      const { [oldSectionId]: _, ...rest } = customSections;
      setCustomSections({
        ...rest,
        [newSectionId]: newSectionId
      });
      toast.success('Section name updated successfully');
    } catch (error: any) {
      console.error('Error updating section name:', error);
      toast.error(error.message || 'Failed to update section name');
    } finally {
      setIsUpdatingCustomSection(false);
    }
  };

  const deleteCustomSection = async (sectionId: string) => {
    const confirmed = await confirm(
      `Are you sure you want to delete the "${sectionId}" section? This will remove it from all reviews.`,
      { title: 'Delete Custom Section' }
    );
    
    if (!confirmed) return;

    try {
      setIsUpdatingCustomSection(true);

      // Delete from homepage_section_order
      const { error } = await supabase
        .from('homepage_section_order')
        .delete()
        .eq('section_id', sectionId)
        .eq('is_custom', true);

      if (error) throw error;

      // Remove section from all reviews that use it
      const { error: reviewError } = await supabase
        .from('reviews')
        .select('id, homepage_sections')
        .contains('homepage_sections', [sectionId]);

      if (reviewError) throw reviewError;

      // Update each review to remove the section
      const { error: updateError } = await supabase.rpc('update_review_section', {
        old_section_id: sectionId,
        new_section_id: null
      });

      if (updateError) throw updateError;

      // Update local state
      const { [sectionId]: _, ...remainingSections } = customSections;
      setCustomSections(remainingSections);
      toast.success('Custom section deleted successfully');
    } catch (error: any) {
      console.error('Error deleting custom section:', error);
      toast.error(error.message || 'Failed to delete custom section');
    } finally {
      setIsUpdatingCustomSection(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const now = new Date().toISOString();
      
      // Get total count of published articles
      const { count: publishedCount, error: publishedCountError } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', session.user.id)
        .not('published_date', 'is', null)
        .is('scheduled_for', null);
        
      if (publishedCountError) throw publishedCountError;
      setArticleTotalCount(publishedCount || 0);
      
      // Fetch published articles with pagination
      const { data: publishedData, error: publishedError } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', session.user.id)
        .not('published_date', 'is', null)
        .is('scheduled_for', null)
        .order('created_at', { ascending: false })
        .range((articlePage - 1) * ITEMS_PER_PAGE, articlePage * ITEMS_PER_PAGE - 1);
      
      if (publishedError) throw publishedError;
      
      // Get total count of scheduled articles
      const { count: scheduledCount, error: scheduledCountError } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', session.user.id)
        .not('scheduled_for', 'is', null);
        
      if (scheduledCountError) throw scheduledCountError;
      setScheduledArticleTotalCount(scheduledCount || 0);
      
      // Fetch scheduled articles with pagination
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', session.user.id)
        .not('scheduled_for', 'is', null)
        .order('scheduled_for', { ascending: true })
        .range((scheduledArticlePage - 1) * ITEMS_PER_PAGE, scheduledArticlePage * ITEMS_PER_PAGE - 1);
      
      if (scheduledError) throw scheduledError;
      
      setArticles(publishedData || []);
      setScheduledArticles(scheduledData || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setLoadingArticles(false);
    }
  };

  // Update fetchArticles when pagination changes
  useEffect(() => {
    if (!loadingArticles) {
      fetchArticles();
    }
  }, [articlePage, scheduledArticlePage]);

  const handleDeleteArticle = async (id: string) => {
    const confirmed = await confirm("Are you sure you want to delete this article?", {
      title: "Delete Article",
    });

    if (!confirmed) return;

    try {
      // First delete all likes associated with this article
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .eq('article_id', id);
        
      if (likesError) {
        console.error("Error deleting article likes:", likesError);
        toast.error(`Failed to delete article likes: ${likesError.message}`);
        return;
      }
      
      // Now delete the article
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchArticles();
      toast.success("Article deleted successfully");
    } catch (error: any) {
      console.error("Error deleting article:", error);
      toast.error(error.message || "Failed to delete article");
    }
  };

  // Pagination component
  const Pagination = ({ 
    currentPage, 
    totalItems, 
    onPageChange 
  }: { 
    currentPage: number, 
    totalItems: number, 
    onPageChange: (page: number) => void 
  }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center mt-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button size="sm" onClick={() => navigate("/admin/notes")}>
                <PenLine className="h-4 w-4 mr-2" />
                Notes
              </Button>
              <Button size="sm" onClick={() => navigate("/admin/articles/create")}>
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Button>
              <Button size="sm" onClick={() => navigate("/admin/reviews/create")}>
                <Plus className="h-4 w-4 mr-2" />
                New Review
              </Button>
              <AIReviewSpinner onReviewCreated={fetchReviews} />
              <AIArticleSpinner onArticleCreated={fetchArticles} />
              <Button size="sm" variant="outline" onClick={() => navigate("/")}>
                Frontend
              </Button>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 mb-8">
          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-center">Style Settings</h2>
          </div>
          <BackgroundSettingsDialog />
        </Card>

        <Card className="p-6 mb-8">
          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-center">Homepage Section Settings</h2>
          </div>
          <SectionOrderDialog />
        </Card>

        <Card className="p-6 mb-8">
          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <Swords className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-center">Custom Sections</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(customSections).map(([sectionId, name]) => (
              <div key={sectionId} className="flex items-center gap-4">
                <Input
                  value={name}
                  onChange={(e) => updateCustomSectionName(sectionId, e.target.value)}
                  placeholder="Section name"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteCustomSection(sectionId)}
                  disabled={isUpdatingCustomSection}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-4">
              <Input
                value={newCustomSectionName}
                onChange={(e) => setNewCustomSectionName(e.target.value)}
                placeholder="New section name"
              />
              <Button
                onClick={addCustomSection}
                disabled={isUpdatingCustomSection || !newCustomSectionName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-8">
          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <Medal className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-center">Genre of the Month</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:flex-1">
              <Select
                value={selectedGenreId}
                onValueChange={setSelectedGenreId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                size="sm"
                className="w-full sm:w-auto"
                onClick={updateGenreOfMonth}
                disabled={isUpdatingGenre || !selectedGenreId}
              >
                Update Genre of the Month
              </Button>
              <Button 
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={clearGenreOfMonth}
                disabled={isUpdatingGenre}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-8">
          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <User className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-center">Author Info</h2>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full sm:max-w-md"
                />
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleUpdateUsername}
                  disabled={isUpdatingProfile}
                >
                  Update Username
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                {profile.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="relative w-full sm:w-auto"
                  disabled={isUpdatingProfile}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Avatar
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter your bio"
                className="flex-1"
              />
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleUpdateBio}
                disabled={isUpdatingProfile}
              >
                Update Bio
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-8">
          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-center">Published Content</h2>
          </div>
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="articles">Articles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews">
              {isLoading ? (
                <p className="text-muted-foreground">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet. Create your first review!</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Title</th>
                          <th className="py-3 px-4 text-left">Genre</th>
                          <th className="py-3 px-4 text-center">Rating</th>
                          <th className="py-3 px-4 text-left">Published</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((review) => (
                          <tr key={review.id} className="border-b">
                            <td className="py-3 px-4 text-left">{review.title}</td>
                            <td className="py-3 px-4 text-left">{review.genre?.name || 'Uncategorized'}</td>
                            <td className="py-3 px-4 text-center">{review.rating}/10</td>
                            <td className="py-3 px-4 text-left">
                              {format(new Date(review.created_at), 'MMM d, yyyy')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/reviews/${review.id}/edit`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(review.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination 
                    currentPage={reviewPage} 
                    totalItems={reviewTotalCount} 
                    onPageChange={setReviewPage} 
                  />
                </>
              )}
            </TabsContent>
            
            <TabsContent value="articles">
              {loadingArticles ? (
                <p className="text-muted-foreground">Loading articles...</p>
              ) : articles.length === 0 ? (
                <p className="text-muted-foreground">No articles yet. Create your first article!</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Title</th>
                          <th className="py-3 px-4 text-left">Summary</th>
                          <th className="py-3 px-4 text-left">Published</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {articles.map((article) => (
                          <tr key={article.id} className="border-b">
                            <td className="py-3 px-4 text-left">{article.title}</td>
                            <td className="py-3 px-4 text-left">
                              {article.summary.length > 100 
                                ? `${article.summary.substring(0, 100)}...` 
                                : article.summary}
                            </td>
                            <td className="py-3 px-4 text-left">
                              {article.published_date 
                                ? format(new Date(article.published_date), 'MMM d, yyyy')
                                : 'Draft'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteArticle(article.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination 
                    currentPage={articlePage} 
                    totalItems={articleTotalCount} 
                    onPageChange={setArticlePage} 
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-center">Scheduled Content</h2>
          </div>
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="articles">Articles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews">
              {isLoading ? (
                <p className="text-muted-foreground">Loading reviews...</p>
              ) : scheduledReviews.length === 0 ? (
                <p className="text-muted-foreground">No scheduled reviews.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Title</th>
                          <th className="py-3 px-4 text-left">Genre</th>
                          <th className="py-3 px-4 text-center">Rating</th>
                          <th className="py-3 px-4 text-left">Scheduled For</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledReviews.map((review) => (
                          <tr key={review.id} className="border-b">
                            <td className="py-3 px-4 text-left">{review.title}</td>
                            <td className="py-3 px-4 text-left">{review.genre?.name || 'Uncategorized'}</td>
                            <td className="py-3 px-4 text-center">{review.rating}/10</td>
                            <td className="py-3 px-4 text-left">
                              {format(new Date(review.scheduled_for!), 'MMM d, yyyy HH:mm')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/reviews/${review.id}/edit`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(review.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination 
                    currentPage={scheduledReviewPage} 
                    totalItems={scheduledReviewTotalCount} 
                    onPageChange={setScheduledReviewPage} 
                  />
                </>
              )}
            </TabsContent>
            
            <TabsContent value="articles">
              {loadingArticles ? (
                <p className="text-muted-foreground">Loading articles...</p>
              ) : scheduledArticles.length === 0 ? (
                <p className="text-muted-foreground">No scheduled articles.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Title</th>
                          <th className="py-3 px-4 text-left">Summary</th>
                          <th className="py-3 px-4 text-left">Scheduled For</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledArticles.map((article) => (
                          <tr key={article.id} className="border-b">
                            <td className="py-3 px-4 text-left">{article.title}</td>
                            <td className="py-3 px-4 text-left">
                              {article.summary.length > 100 
                                ? `${article.summary.substring(0, 100)}...` 
                                : article.summary}
                            </td>
                            <td className="py-3 px-4 text-left">
                              {format(new Date(article.scheduled_for!), 'MMM d, yyyy HH:mm')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteArticle(article.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination 
                    currentPage={scheduledArticlePage} 
                    totalItems={scheduledArticleTotalCount} 
                    onPageChange={setScheduledArticlePage} 
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </main>
      <ConfirmationDialog />
    </div>
  );
};

export default AdminDashboard;
