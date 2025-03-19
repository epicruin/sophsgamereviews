import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Constants for localStorage keys
const STORAGE_KEY_HOMEPAGE = 'sophsreviews_homepage_background';
const STORAGE_KEY_MODAL = 'sophsreviews_modal_background';
const STORAGE_KEY_REVIEW = 'sophsreviews_review_background';
const STORAGE_KEY_ARTICLE = 'sophsreviews_article_background';
const STORAGE_KEY_AUTHOR = 'sophsreviews_author_background';

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
  authorBackground: BackgroundType;
  isLoading: boolean;
  error: Error | null;
  ready: boolean;
}

type BackgroundSettingValue = {
  background: BackgroundType;
};

// Function to get cached settings from localStorage
const getCachedSettings = (): { 
  homepageBackground: BackgroundType | null, 
  modalBackground: BackgroundType | null,
  reviewBackground: BackgroundType | null,
  articleBackground: BackgroundType | null,
  authorBackground: BackgroundType | null
} => {
  try {
    const homepageBackground = localStorage.getItem(STORAGE_KEY_HOMEPAGE);
    const modalBackground = localStorage.getItem(STORAGE_KEY_MODAL);
    const reviewBackground = localStorage.getItem(STORAGE_KEY_REVIEW);
    const articleBackground = localStorage.getItem(STORAGE_KEY_ARTICLE);
    const authorBackground = localStorage.getItem(STORAGE_KEY_AUTHOR);
    
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
        : null,
      authorBackground: authorBackground && validBackgrounds.includes(authorBackground)
        ? authorBackground as BackgroundType
        : null
    };
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
    return { 
      homepageBackground: null, 
      modalBackground: null, 
      reviewBackground: null, 
      articleBackground: null,
      authorBackground: null 
    };
  }
};

// Function to save settings to localStorage
const cacheSettings = (
  homepageBackground: BackgroundType, 
  modalBackground: BackgroundType,
  reviewBackground: BackgroundType,
  articleBackground: BackgroundType,
  authorBackground: BackgroundType
) => {
  try {
    localStorage.setItem(STORAGE_KEY_HOMEPAGE, homepageBackground);
    localStorage.setItem(STORAGE_KEY_MODAL, modalBackground);
    localStorage.setItem(STORAGE_KEY_REVIEW, reviewBackground);
    localStorage.setItem(STORAGE_KEY_ARTICLE, articleBackground);
    localStorage.setItem(STORAGE_KEY_AUTHOR, authorBackground);
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
    authorBackground: cachedSettings.authorBackground || 'aurora',
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
          .single<{ value: BackgroundSettingValue }>();

        // Load modal background setting
        const { data: modalSetting, error: modalError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'modal_background')
          .single<{ value: BackgroundSettingValue }>();

        // Load review background setting
        const { data: reviewSetting, error: reviewError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'review_background')
          .single<{ value: BackgroundSettingValue }>();

        // Load article background setting
        const { data: articleSetting, error: articleError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'article_background')
          .single<{ value: BackgroundSettingValue }>();
          
        // Load author background setting
        const { data: authorSetting, error: authorError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'author_background')
          .single<{ value: BackgroundSettingValue }>();

        if (homepageError || modalError || reviewError || articleError || authorError) {
          console.error("Error loading background settings:", homepageError || modalError || reviewError || articleError || authorError);
          setSettings(prev => ({
            ...prev,
            isLoading: false,
            error: new Error("Failed to load background settings"),
            ready: true
          }));
          return;
        }

        // Get the fetched values with fallbacks
        const newHomepageBackground = (homepageSetting?.value && typeof homepageSetting.value === 'string' ? JSON.parse(homepageSetting.value).background : 'aurora') as BackgroundType;
        const newModalBackground = (modalSetting?.value && typeof modalSetting.value === 'string' ? JSON.parse(modalSetting.value).background : 'auroraBlue') as BackgroundType;
        const newReviewBackground = (reviewSetting?.value && typeof reviewSetting.value === 'string' ? JSON.parse(reviewSetting.value).background : 'aurora') as BackgroundType;
        const newArticleBackground = (articleSetting?.value && typeof articleSetting.value === 'string' ? JSON.parse(articleSetting.value).background : 'auroraBlue') as BackgroundType;
        const newAuthorBackground = (authorSetting?.value && typeof authorSetting.value === 'string' ? JSON.parse(authorSetting.value).background : 'aurora') as BackgroundType;

        console.log('Database values:', {
          homepage: homepageSetting?.value,
          modal: modalSetting?.value,
          review: reviewSetting?.value,
          article: articleSetting?.value,
          author: authorSetting?.value
        });

        console.log('Parsed values:', {
          homepage: newHomepageBackground,
          modal: newModalBackground,
          review: newReviewBackground,
          article: newArticleBackground,
          author: newAuthorBackground
        });

        setSettings(currentSettings => {
          const hasChanged = 
            newHomepageBackground !== currentSettings.homepageBackground ||
            newModalBackground !== currentSettings.modalBackground ||
            newReviewBackground !== currentSettings.reviewBackground ||
            newArticleBackground !== currentSettings.articleBackground ||
            newAuthorBackground !== currentSettings.authorBackground;

          if (hasChanged) {
            // Update cached values
            cacheSettings(
              newHomepageBackground, 
              newModalBackground, 
              newReviewBackground, 
              newArticleBackground,
              newAuthorBackground
            );

            return {
              homepageBackground: newHomepageBackground,
              modalBackground: newModalBackground,
              reviewBackground: newReviewBackground,
              articleBackground: newArticleBackground,
              authorBackground: newAuthorBackground,
              isLoading: false,
              error: null,
              ready: true
            };
          }

          return {
            ...currentSettings,
            isLoading: false,
            ready: true
          };
        });
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
        { event: '*', schema: 'public', table: 'site_settings' }, 
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