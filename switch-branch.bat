@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
echo Branch Switcher

REM Check if git is available
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed or not in your PATH.
    pause
    exit /b 1
)

REM Get all available branches
echo Available branches:
git branch -a | findstr -v "remotes"

REM Ask user which branch to switch to
set /p BRANCH_NAME=Enter the branch name to switch to: 

REM Check if branch exists
git show-ref --verify --quiet refs/heads/%BRANCH_NAME%
if %ERRORLEVEL% NEQ 0 (
    echo Branch %BRANCH_NAME% does not exist locally.
    
    REM Check if it exists as a remote branch
    git show-ref --verify --quiet refs/remotes/origin/%BRANCH_NAME%
    if %ERRORLEVEL% NEQ 0 (
        echo Branch %BRANCH_NAME% does not exist remotely either.
        pause
        exit /b 1
    )
    
    REM Create and switch to the branch tracking the remote
    echo Creating local branch tracking remote branch...
    git checkout -b %BRANCH_NAME% origin/%BRANCH_NAME%
) else (
    REM Switch to the branch
    echo Switching to branch %BRANCH_NAME%...
    git checkout %BRANCH_NAME%
)

if %ERRORLEVEL% NEQ 0 (
    echo Failed to switch to branch %BRANCH_NAME%.
    pause
    exit /b 1
)

echo Successfully switched to branch %BRANCH_NAME%.
pause 