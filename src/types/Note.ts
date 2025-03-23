// Type definitions for the Notes feature

import { z } from "zod";

// Categories for notes
export type NoteCategory = "reviews" | "articles" | "general" | "docs";

// Priority levels for notes
export type Priority = "high" | "medium" | "low";

// Document categories for notes
export type DocumentCategory = 
  | "instructional" 
  | "technical" 
  | "gamedev" 
  | "gameplay" 
  | "story" 
  | "mechanics" 
  | "graphics" 
  | "audio" 
  | "performance" 
  | "pricing" 
  | "marketing" 
  | "business" 
  | "industry" 
  | "platform" 
  | "hardware" 
  | "software" 
  | "review_guidance" 
  | "article_guidance" 
  | "style_guide" 
  | "reference" 
  | "other";

// Valid categories for type checking
export const VALID_CATEGORIES: NoteCategory[] = ["reviews", "articles", "general", "docs"];

// Valid priorities for type checking
export const VALID_PRIORITIES: Priority[] = ["high", "medium", "low"];

// Valid document categories for type checking
export const VALID_DOC_CATEGORIES: DocumentCategory[] = [
  "instructional",
  "technical",
  "gamedev",
  "gameplay",
  "story",
  "mechanics",
  "graphics",
  "audio",
  "performance",
  "pricing",
  "marketing",
  "business",
  "industry",
  "platform",
  "hardware",
  "software",
  "review_guidance",
  "article_guidance",
  "style_guide",
  "reference",
  "other"
];

// Interface matching our Supabase notes table structure
export interface NoteDatabaseRow {
  id: string;
  title: string;
  content: string;
  category: string;
  completed: boolean;
  priority: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  doc_category?: string;
  pinned?: boolean;
}

// Application interface with properly typed values
export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  doc_category?: DocumentCategory;
  pinned?: boolean;
}

/**
 * Safe conversion helpers for working with note data
 */

// Convert string to safe category
export const safeCategory = (category: string | null): NoteCategory => {
  return VALID_CATEGORIES.includes(category as NoteCategory) 
    ? category as NoteCategory 
    : "general";
};

// Convert string to safe priority
export const safePriority = (priority: string | null): Priority => {
  return VALID_PRIORITIES.includes(priority as Priority) 
    ? priority as Priority 
    : "medium";
};

// Convert string to safe document category
export const safeDocCategory = (category: string | null): DocumentCategory => {
  return VALID_DOC_CATEGORIES.includes(category as DocumentCategory)
    ? category as DocumentCategory
    : "other";
}; 