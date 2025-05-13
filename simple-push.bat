@echo off
cd /d "%~dp0"

git add .
git commit -m "Update development branch"
git push origin development

pause 