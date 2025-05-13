@echo off
cd /d "%~dp0"

git config user.email "andrii@example.com"
git config user.name "Andrii"

echo Git identity set to:
git config user.email
git config user.name

pause 