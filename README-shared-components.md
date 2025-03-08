# Shared Component Architecture for Sophs Reviews

This document outlines the shared component architecture implemented for displaying content across different sections of the Sophs Reviews application.

## Overview

We've created a unified component system that can be used across:
- Homepage sections (featured, latest, genre of month, etc.)
- Author page review listings
- Browse by genre functionality

This architecture reduces code duplication, ensures consistent UI/UX across the application, and makes future maintenance easier.

## Component Structure

### 1. ContentGrid Component
`src/components/shared/ContentGrid.tsx`

This is the base component responsible for rendering content in a grid or carousel layout. It can handle two types of content:
- Reviews (both large and normal variants)
- Genres

Features:
- Responsive layouts for different screen sizes
- Separate handling for large and normal reviews
- Chunking of genres for better display
- Consistent styling and animations
- Empty state handling
- Interactive filtering and sorting capabilities:
  - Sort by highest rating (star icon)
  - Sort by most liked (heart icon)
  - Filter by online co-op (monitor icon)
  - Filter by couch co-op (users icon)
  - Filter by split screen (split icon)
- Tooltips for all interactive elements
- Visual feedback for active filters and sorts
- Mutually exclusive sorting options (rating vs likes)

### 2. SectionContainer Component
`src/components/shared/SectionContainer.tsx`

This is a wrapper component that:
- Handles the section header with title and icon
- Manages loading and error states
- Uses the ContentGrid component for actual content display
- Provides a consistent section layout across the application

### 3. useContentFetch Hook
`src/hooks/useContentFetch.ts`

A custom hook that:
- Fetches content (reviews or genres) from the Supabase database
- Handles filtering by section, author, or genre
- Formats the data for use by the ContentGrid component
- Manages loading and error states

## Implementation

The architecture has been implemented across:

1. **Homepage Sections**
   - Each section (featured, latest, genre of month, etc.) now uses the SectionContainer component
   - The browse-by-genre section is now consistent with other sections

2. **Author Page**
   - The author's reviews are now displayed using the SectionContainer component
   - Maintains the same look and feel as the homepage

3. **Browse by Genre Page**
   - Uses the SectionContainer component to display genres
   - Maintains the same look and feel as the homepage

4. **Section Pages**
   - All section pages (featured, latest, genre of month, etc.) now use the SectionPage component
   - SectionPage uses SectionContainer internally, providing a consistent experience
   - Special handling for the browse-genres section to display genres instead of reviews

## Benefits

1. **Code Reusability**
   - Significant reduction in duplicate code
   - Centralized styling and behavior

2. **Consistency**
   - Uniform appearance and behavior across different parts of the application
   - Consistent loading and error states

3. **Maintainability**
   - Changes to layout or behavior can be made in one place
   - Easier to add new features or modify existing ones

4. **Performance**
   - Optimized data fetching with custom hooks
   - Efficient rendering with conditional component logic

## Future Enhancements

Potential improvements to this architecture:

1. Add more content types beyond reviews and genres
2. Implement more layout variants for different use cases
3. Add caching for improved performance
4. Create more specialized section types for specific needs

## Usage Example

```tsx
// Example of using the SectionContainer component
<SectionContainer
  id="featured-reviews"
  title="Featured Reviews"
  icon={Star}
  sectionType="reviews"
  section="featured"
  variant="medium"
  linkPath="/sections/featured"
/>
``` 