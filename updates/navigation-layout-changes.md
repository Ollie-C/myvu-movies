# Navigation Layout Changes

## Changes Made

### Header.tsx

- Centered the search bar by changing `justify-end` to `justify-center`
- Removed the profile icon and user actions section
- Simplified the header to focus solely on the search functionality
- Removed `Bell` and `User` imports as they're no longer used

### Sidebar.tsx

- Added profile icon (User) positioned below the title and above navigation items
- Removed Settings navigation item from the navigation array
- Removed `Settings` import since it's no longer used
- Added `User` import for the profile icon

## Files Changed

- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`

## Result

- Clean, centered search bar at the top of the page
- Profile access moved to sidebar for better organization
- Settings removed from main navigation (accessible through profile page)
- Cleaner, more focused navigation experience
