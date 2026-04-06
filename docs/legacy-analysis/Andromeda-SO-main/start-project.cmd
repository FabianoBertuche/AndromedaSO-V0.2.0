@echo off
setlocal

where node >nul 2>nul
if errorlevel 1 (
  echo [start] Node.js nao encontrado no PATH.
  exit /b 1
)

node "%~dp0start-project.mjs" %*
