# Profile Page Documentation

## Overview

The Profile page allows users to view and edit all the information they set during onboarding, plus additional account details.

## Features

### 1. Personal Information Tab
- View account details (name, email, phone, account type)
- Read-only display of user information
- Shows admin badge if user is an administrator

### 2. Locations Tab
- **Home Location**
  - View current home location coordinates
  - Edit using "Use Current Location" button
  - Edit by searching for an address
  - Same intuitive search interface as onboarding
  
- **Work/School Location**
  - View current work location coordinates
  - Edit using "Use Current Location" button
  - Edit by searching for an address
  - Can be left unset

### 3. Emergency Contacts Tab
- **View all emergency contacts** (up to 5)
  - Priority number display
  - Name, phone, and relationship
  
- **Edit existing contacts**
  - Click edit button to modify
  - Update name, phone, or relationship
  - Save or cancel changes
  
- **Add new contacts**
  - Form to add additional contacts
  - Maximum of 5 contacts allowed
  - Validates all fields are filled
  
- **Delete contacts**
  - Remove contacts with confirmation
  - Automatically reorders priorities

## Access

Users can access their profile from:
1. **User dropdown menu** in the top navigation bar
2. Click on their name → "My Profile"

## Technical Details

### API Integration
- `getUserProfile()` - Fetches user profile data
- `updateUserProfile()` - Updates location information
- `getEmergencyContacts()` - Fetches all emergency contacts
- `addEmergencyContact()` - Adds a new contact
- `updateEmergencyContact()` - Updates existing contact
- `deleteEmergencyContact()` - Removes a contact

### Location Search
- Uses OpenStreetMap Nominatim API (same as onboarding)
- Debounced search (500ms delay)
- Real-time results dropdown
- Reverse geocoding for "Use Current Location"

### State Management
- Tab-based navigation (Personal Info, Locations, Contacts)
- Edit mode for locations and contacts
- Success/error alerts with auto-dismiss
- Loading states for async operations

## User Experience

### Smooth Editing Flow
1. User clicks "Edit" button
2. Search interface appears
3. User searches or uses current location
4. Location updates immediately
5. Success message confirms change

### Contact Management
1. View all contacts in priority order
2. Edit inline with save/cancel buttons
3. Add new contacts with validation
4. Delete with confirmation dialog

### Responsive Design
- Mobile-friendly tabs
- Stacked layout on small screens
- Touch-friendly buttons
- Scrollable search results

## Benefits

1. **Complete Control** - Users can update all onboarding data
2. **Easy Access** - One click from navigation menu
3. **Consistent UX** - Same location search as onboarding
4. **Safe Updates** - Confirmation for destructive actions
5. **Real-time Feedback** - Success/error messages for all actions

## Future Enhancements

Potential additions:
- Change password functionality
- Profile picture upload
- Notification preferences
- Privacy settings
- Account deletion option
