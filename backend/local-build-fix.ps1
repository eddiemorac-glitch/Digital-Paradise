# Bypass execution policy for the current process only and run the build
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
npm run build
