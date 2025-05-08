#!/bin/bash

echo "Installing Vercel CLI if needed..."
npm install -g vercel

echo "Login to Vercel (you may need to authorize)..."
vercel login

echo "Running Vercel deploy..."
vercel --prod

echo "Deployment initiated. Check Vercel dashboard for status." 