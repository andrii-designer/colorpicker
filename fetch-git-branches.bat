@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
echo Fetching all branches from GitHub repository...

REM Set the repository URL directly
set REPO_URL=https://github.com/andrii-designer/colorpicker.git

echo Using repository: %REPO_URL%

REM Check if .git directory exists
if exist .git (
  echo Git repository already exists. Fetching from remote...
  
  REM Add the remote if it doesn't exist as origin
  git remote -v | findstr origin > nul
  if errorlevel 1 (
    git remote add origin %REPO_URL%
  ) else (
    git remote set-url origin %REPO_URL%
  )
) else (
  echo Initializing new Git repository...
  git init
  git remote add origin %REPO_URL%
)

REM Fetch all branches
echo Fetching all branches...
git fetch origin

REM List all remote branches
echo Remote branches:
git branch -r

REM Create local branches tracking remote branches
echo Creating local branches for all remote branches...
for /f "tokens=1" %%b in ('git branch -r ^| findstr -v HEAD') do (
  set branch=%%b
  set branch=!branch:origin/=!
  git checkout -b !branch! %%b 2>nul || echo Branch !branch! already exists
)

REM Checkout main or master branch (whichever exists)
git checkout main 2>nul || git checkout master 2>nul || echo No main or master branch found.

echo All branches have been fetched and created locally.
pause 