import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Constants for localStorage keys
const STORAGE_KEY_HOMEPAGE = 'sophsreviews_homepage_background';
const STORAGE_KEY_MODAL = 'sophsreviews_modal_background';
const STORAGE_KEY_REVIEW = 'sophsreviews_review_background';
const STORAGE_KEY_ARTICLE = 'sophsreviews_article_background';

// Valid background types
type BackgroundType = 'aurora' | 'auroraBlue' | 'staticPink' | 'staticBlue' | 'lavender' | 'peach' | 'mint' | 'lilac' | 'rosePetal' | 'babyBlue' | 'coral' | 'periwinkle';

// All valid background values
const validBackgrounds = [
  'aurora', 'auroraBlue', 'staticPink', 'staticBlue', 'lavender', 
  'peach', 'mint', 'lilac', 'rosePetal', 'babyBlue', 'coral', 'periwinkle'
];

export interface BackgroundSettings {
  homepageBackground: BackgroundType;
  modalBackground: BackgroundType;
  reviewBackground: BackgroundType;
  articleBackground: BackgroundType;
  isLoading: boolean;
  error: Error | null;
  ready: boolean;
}

// Function to get cached settings from localStorage
const getCachedSettings = (): { 
  homepageBackground: BackgroundType | null, 
  modalBackground: BackgroundType | null,
  reviewBackground: BackgroundType | null,
  articleBackground: BackgroundType | null
} => {
  try {
    const homepageBackground = localStorage.getItem(STORAGE_KEY_HOMEPAGE);
    const modalBackground = localStorage.getItem(STORAGE_KEY_MODAL);
    const reviewBackground = localStorage.getItem(STORAGE_KEY_REVIEW);
    const articleBackground = localStorage.getItem(STORAGE_KEY_ARTICLE);
    
    return {
      homepageBackground: homepageBackground && validBackgrounds.includes(homepageBackground) 
        ? homepageBackground as BackgroundType 
        : null,
      modalBackground: modalBackground && validBackgrounds.includes(modalBackground) 
        ? modalBackground as BackgroundType 
        : null,
      reviewBackground: reviewBackground && validBackgrounds.includes(reviewBackground)
        ? reviewBackground as BackgroundType
        : null,
      articleBackground: articleBackground && validBackgrounds.includes(articleBackground)
        ? articleBackground as BackgroundType
        : null
    };
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
    return { homepageBackground: null, modalBackground: null, reviewBackground: null, articleBackground: null };
  }
};

// Function to save settings to localStorage
const cacheSettings = (
  homepageBackground: BackgroundType, 
  modalBackground: BackgroundType,
  reviewBackground: BackgroundType,
  articleBackground: BackgroundType
) => {
  try {
    localStorage.setItem(STORAGE_KEY_HOMEPAGE, homepageBackground);
    localStorage.setItem(STORAGE_KEY_MODAL, modalBackground);
    localStorage.setItem(STORAGE_KEY_REVIEW, reviewBackground);
    localStorage.setItem(STORAGE_KEY_ARTICLE, articleBackground);
  } catch (error) {
    console.warn('Error writing to localStorage:', error);
  }
};

export function useBackgroundSettings(): BackgroundSettings {
  // Get cached values for initial state
  const cachedSettings = getCachedSettings();
  
  const [settings, setSettings] = useState<BackgroundSettings>({
    homepageBackground: cachedSettings.homepageBackground || 'aurora',
    modalBackground: cachedSettings.modalBackground || 'auroraBlue',
    reviewBackground: cachedSettings.reviewBackground || 'aurora',
    articleBackground: cachedSettings.articleBackground || 'auroraBlue',
    isLoading: true,
    error: null,
    ready: false
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        // Load homepage background setting
        const { data: homepageSetting, error: homepageError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'homepage_background')
          .single();

        // Load modal background setting
        const { data: modalSetting, error: modalError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'modal_background')
          .single();

        if (homepageError || modalError) {
          console.error("Error loading background settings:", homepageError || modalError);
          setSettings(prev => ({
            ...prev,
            isLoading: false,
            error: new Error("Failed to load background settings"),
            ready: true
          }));
          return;
        }
        
        // Get the fetched values
        const newHomepageBackground = (homepageSetting?.value || 'aurora') as BackgroundType;
        const newModalBackground = (modalSetting?.value || 'auroraBlue') as BackgroundType;
        
        // For review and article backgrounds, use the cached values or fallbacks
        const newReviewBackground = cachedSettings.reviewBackground || newHomepageBackground;
        const newArticleBackground = cachedSettings.articleBackground || newModalBackground;
        
        // Check if settings have changed from what we're currently using
        const hasChanged = 
          newHomepageBackground !== settings.homepageBackground ||
          newModalBackground !== settings.modalBackground ||
          newReviewBackground !== settings.reviewBackground ||
          newArticleBackground !== settings.articleBackground;
        
        // If settings have changed, update both UI and cache
        if (hasChanged) {
          setSettings({
            homepageBackground: newHomepageBackground,
            modalBackground: newModalBackground,
            reviewBackground: newReviewBackground,
            articleBackground: newArticleBackground,
            isLoading: false,
            error: null,
            ready: true
          });
          
          // Update cached values
          cacheSettings(
            newHomepageBackground, 
            newModalBackground, 
            newReviewBackground, 
            newArticleBackground
          );
        } else {
          // Just update loading state if settings haven't changed
          setSettings(prev => ({
            ...prev,
            isLoading: false,
            ready: true
          }));
        }
      } catch (error) {
        console.error("Error fetching background settings:", error);
        setSettings(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error("An unknown error occurred"),
          ready: true
        }));
      }
    }

    loadSettings();

    // Subscribe to changes in site_settings
    const subscription = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'site_settings' }, 
        () => {
          // Reload settings when changes happen
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return settings;
} 