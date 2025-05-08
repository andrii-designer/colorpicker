#!/bin/bash

echo "Starting deployment process..."

# Make sure we have the latest changes
git add .
git commit -m "Comprehensive fix for Vercel deployment issues"

# Push to main branch
echo "Pushing to main branch..."
git push origin main 

# Push to feature/ui-design branch
echo "Pushing to feature/ui-design branch..."
git checkout feature/ui-design
git merge main
git push origin feature/ui-design

# Go back to main branch
git checkout main

echo "All changes have been pushed to both branches"
echo "Check Vercel dashboard to monitor the deployment" 