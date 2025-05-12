# Vercel Deployment Guide

This guide explains how to properly set up Firebase environment variables for your Vercel deployment.

## Firebase Environment Variables

The app requires the following environment variables to be set in the Vercel dashboard:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBHLhXaqLMY9gmtKYAUjsXdoMPvSoDvoQM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=colorjogger.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=colorjogger
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=colorjogger.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1033978676789
NEXT_PUBLIC_FIREBASE_APP_ID=1:1033978676789:web:49fb21560ccb79bce4137c
```

## Setting Up Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Click on "Settings" tab
4. Navigate to the "Environment Variables" section
5. Add each of the variables above one by one
6. Make sure to select the appropriate environments (Production, Preview, Development)
7. Click "Save" to apply the changes

## Re-deploying Your Project

After setting up the environment variables:

1. Go back to the "Deployments" tab
2. Click on the three dots menu next to your latest deployment
3. Select "Redeploy" to create a new deployment with the updated environment variables

## Verifying Your Setup

After deployment, verify that your Firebase configuration is working by:

1. Opening your deployed site in a browser
2. Opening the browser's developer console
3. Checking for any Firebase-related errors
4. Confirming that the "Firebase initialized successfully" message appears

If you encounter issues, double-check your environment variables and make sure they're correctly set in the Vercel dashboard.

## Fallback Mechanism

The app now includes a fallback mechanism that will use hardcoded Firebase configuration values if the environment variables are not available. While this provides a backup solution, it's still best practice to set up the environment variables properly in the Vercel dashboard. 