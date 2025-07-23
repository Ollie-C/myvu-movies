# Sidebar and Page Layout Updates

## Changes Made

### Sidebar.tsx

- Added labels below navigation icons for better usability
- Increased sidebar width from `w-20` to `w-32` to accommodate labels
- Changed navigation items to display in a column layout with icons above text
- Added "Profile" label below the profile icon
- Restructured profile section with flex column layout

### Layout.tsx

- Updated padding-left from `pl-20` to `pl-32` to match new sidebar width

### Collections.tsx

- Simplified header by replacing "New Collection" button with a clean plus icon
- Divided page into two distinct sections:
  - **Ranked Collections**: Shows collections that have been ranked
  - **Non-Ranked Collections**: Shows regular collections without rankings
- Removed the individual "Create Collection" card and empty state
- Added sample data to demonstrate the new layout

### Rankings.tsx

- Added plus button to top right corner for creating new rankings
- Completely restructured the page layout into two sections:
  - **To Rank**: Main focus section showing collections ready for ranking
    - Displays as horizontal rows of movie posters
    - Shows collection title and "Continue Ranking" button
    - Includes mock data for "Top Nolan Movies" and "Best Sci-Fi Films"
  - **Completed Rankings**: Shows finished rankings as cards
- Removed the ranking method selection from main view (will appear when plus button is clicked)
- Added movie poster rows with horizontal scrolling
- Fixed MoviePoster component props to use `src` and `alt` instead of `title` and `posterPath`

## Files Changed

- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Layout.tsx`
- `src/pages/Collections.tsx`
- `src/pages/Rankings.tsx`

## Result

- Cleaner navigation with labeled icons
- Organized collections with clear ranked/non-ranked distinction
- Rankings page focused on actionable "To Rank" items
- Consistent plus button pattern for creating new items
- Better visual hierarchy and user flow
