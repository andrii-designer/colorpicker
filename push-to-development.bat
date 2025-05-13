@echo off
setlocal
cd /d "%~dp0"
echo Pushing changes to development branch...

REM Check if git is available
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed or not in your PATH.
    pause
    exit /b 1
)

REM Make sure we're on the development branch
git checkout development
if %ERRORLEVEL% NEQ 0 (
    echo Failed to checkout development branch.
    pause
    exit /b 1
)

REM Get commit message from user
set /p COMMIT_MESSAGE=Enter commit message (press Enter to use default 'Update development branch'): 
if "%COMMIT_MESSAGE%"=="" set COMMIT_MESSAGE=Update development branch

REM Add all changes
echo Adding all changes...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo Failed to add changes.
    pause
    exit /b 1
)

REM Commit changes
echo Committing changes with message: %COMMIT_MESSAGE%
git commit -m "%COMMIT_MESSAGE%"
if %ERRORLEVEL% NEQ 0 (
    echo Note: No changes to commit or commit failed.
    pause
)

REM Pull latest changes from remote to avoid conflicts
echo Pulling latest changes from remote development branch...
git pull origin development
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Failed to pull latest changes. There might be conflicts.
    set /p CONTINUE=Continue with push anyway? (y/n): 
    if /i not "%CONTINUE%"=="y" (
        echo Push aborted.
        pause
        exit /b 1
    )
)

REM Push changes to remote
echo Pushing changes to remote development branch...
git push origin development
if %ERRORLEVEL% NEQ 0 (
    echo Failed to push changes.
    pause
    exit /b 1
)

echo Successfully pushed changes to development branch.
pause 