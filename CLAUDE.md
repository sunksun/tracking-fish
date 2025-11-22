# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native application built with Expo SDK 54.0.12 for tracking Mekong River fishing activities. The app allows fishermen to record their daily fishing data including catch details, gear used, weather conditions, and fish utilization.

## Development Commands

All development commands are managed through npm scripts defined in package.json:

- `npm start` - Start the Expo development server
- `npm run android` - Start the app on Android device/emulator  
- `npm run ios` - Start the app on iOS device/simulator
- `npm run web` - Start the app in web browser

## Architecture

### Entry Point
- `index.js` - Registers the root component using Expo's registerRootComponent
- `App.js` - Main application with navigation setup and providers

### Navigation Structure
The app uses React Navigation with stack navigation:
- **HomeScreen** - Main screen with fisher info and navigation buttons
- **DataEntryScreen** - Form for recording fishing session details
- **AddFishScreen** - Interface for adding individual fish species records
- **SummaryScreen** - Review and confirmation before saving
- **HistoryScreen** - View past fishing records with search and filtering

### State Management
- `src/contexts/FishingDataContext.js` - Global state management using React Context and useReducer
- Data persistence using AsyncStorage for offline functionality
- Manages current fishing entry, history, and fisher information

### Key Dependencies
- React Native 0.81.4 with Expo SDK ~54.0.12
- @react-navigation/native & @react-navigation/stack for navigation
- react-native-paper for Material Design components
- @react-native-community/datetimepicker for date/time selection
- @react-native-picker/picker for dropdown selections
- @react-native-async-storage/async-storage for data persistence

### Project Structure
```
├── App.js                          # Main app with navigation
├── index.js                        # App entry point
├── src/
│   ├── contexts/
│   │   └── FishingDataContext.js   # Global state management
│   └── screens/
│       ├── HomeScreen.js           # Main dashboard
│       ├── DataEntryScreen.js      # Fishing data entry form
│       ├── AddFishScreen.js        # Fish species entry
│       ├── SummaryScreen.js        # Review and confirmation
│       └── HistoryScreen.js        # Historical records view
├── app.json                        # Expo configuration
├── package.json                    # Dependencies and scripts
└── assets/                         # Static assets
```

## Key Features

### Data Collection
- Fisher information (name, village)
- Fishing session details (date, location, weather, gear)
- Individual fish species records (name, count, weight, length, price)
- Fish utilization tracking (sold, consumed, processed)

### User Interface
- Thai language interface optimized for local fishermen
- Material Design components for consistent UX
- Date/time pickers for accurate temporal data
- Search and filtering capabilities in history view
- Offline data storage with AsyncStorage

### Data Validation
- Required field validation
- Logical consistency checks (e.g., fish utilization vs total weight)
- User confirmation dialogs for important actions

## Development Notes

- All UI text is in Thai for target user base
- Uses React Native Paper for consistent Material Design
- Implements proper data validation and error handling
- Designed for offline usage with local data persistence
- Responsive design suitable for mobile devices
- Clean separation between data layer (Context) and UI (Screens)