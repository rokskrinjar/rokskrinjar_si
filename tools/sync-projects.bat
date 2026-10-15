@echo off
rem Sync the Recent choice from projects-settings.xlsx into projects.json and, on confirmation, publish it.
chcp 65001 >nul
cd /d "%~dp0.."
echo Reading projects-settings.xlsx ...
python tools\sync_projects.py || goto end
git diff --quiet -- projects.json && (echo. & echo Nothing to publish. & goto end)
echo.
git --no-pager diff --stat -- projects.json
echo.
choice /c YN /m "Publish to rokskrinjar.si"
if errorlevel 2 (echo Not published. projects.json is changed locally only. & goto end)
git pull --ff-only -q && git add projects.json && git commit -q -m "Update Recent projects" && git push -q && echo Published. The site updates in about a minute.
:end
echo.
pause
