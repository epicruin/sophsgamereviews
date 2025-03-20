// Type definitions for the Notes feature

// Categories for notes
export type NoteCategory = "reviews" | "articles" | "general";

// Priority levels for notes
export type Priority = "low" | "medium" | "high" | null;

// Valid categories for type checking
export const VALID_CATEGORIES: NoteCategory[] = ["reviews", "articles", "general"];

// Valid priorities for type checking
export const VALID_PRIORITIES: Priority[] = ["low", "medium", "high", null];

// Interface matching our Supabase notes table structure
export interface NoteDatabaseRow {
  id: string;
  title: string;
  content: string;
  category: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  priority: string | null;
  user_id: string;
}

// Application interface with properly typed values
export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  completed: boolean;
  created_at: string;
  due_date: string | null;
  priority: Priority;
  user_id: string;
}

/**
 * Safe conversion helpers for working with note data
 */

// Convert string to safe category
export const safeCategory = (category: string): NoteCategory => {
  return VALID_CATEGORIES.includes(category as NoteCategory) 
    ? (category as NoteCategory) 
    : "general"; // Fallback to general if invalid
};

// Convert string to safe priority
export const safePriority = (priority: string | null): Priority => {
  return VALID_PRIORITIES.includes(priority as Priority) 
    ? (priority as Priority) 
    : "medium"; // Fallback to medium if invalid
}; 