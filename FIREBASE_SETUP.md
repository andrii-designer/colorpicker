# Firebase Setup Guide

To make the Color Palette App work correctly with shared palettes across different users, you need to set up Firebase. Follow these steps:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Give your project a name and continue with the setup

## 2. Set Up Firestore Database

1. In your Firebase project, go to Firestore Database from the left sidebar
2. Click "Create database"
3. Start in production mode or test mode (you can change this later)
4. Choose a location closest to your users

## 3. Configure Security Rules

In Firestore Database, go to the "Rules" tab and set the following rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

**Note:** These rules allow anyone to read and write to your database. For a production application, you should implement proper authentication and more restrictive rules.

## 4. Get Your Firebase Configuration

1. Go to Project Settings (gear icon in the left sidebar)
2. Under "General" tab, scroll down to "Your apps" section
3. If you haven't added an app yet, click the web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "color-palette-app")
5. Copy the Firebase configuration object

## 5. Add Firebase Configuration to Your App

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Replace the placeholder values with your actual Firebase project configuration.

## 6. Deploy to Vercel

When deploying to Vercel, add these same environment variables in the Vercel project settings:

1. Go to your project in the Vercel dashboard
2. Click on Settings > Environment Variables
3. Add each of the Firebase configuration variables

## 7. Test Your Application

After setting up Firebase and redeploying your application, test it by:

1. Creating and saving a palette on one device/browser
2. Checking if it appears in the "Popular Palettes" page on another device/browser

Now palettes should be shared across all users of your application! 