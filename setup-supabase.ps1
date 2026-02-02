#!/usr/bin/env pwsh
# Supabase Setup Helper Script

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "   SUPABASE SETUP HELPER" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`nYou need to add your Supabase credentials to .env.local" -ForegroundColor Yellow
Write-Host "`nFollow these steps:" -ForegroundColor White

Write-Host "`n1. Go to your Supabase Dashboard:" -ForegroundColor Green
Write-Host "   https://app.supabase.com/projects" -ForegroundColor White

Write-Host "`n2. Select your project (or create a new one)" -ForegroundColor Green

Write-Host "`n3. Go to Settings > API" -ForegroundColor Green
Write-Host "   https://app.supabase.com/project/_/settings/api" -ForegroundColor White

Write-Host "`n4. Copy the following values:" -ForegroundColor Green
Write-Host "   - Project URL (looks like: https://xxxxx.supabase.co)" -ForegroundColor White
Write-Host "   - anon/public key (long JWT token)" -ForegroundColor White
Write-Host "   - service_role key (even longer JWT token, keep it secret!)" -ForegroundColor White

Write-Host "`n5. Open .env.local and replace:" -ForegroundColor Green
Write-Host "   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here" -ForegroundColor Yellow
Write-Host "   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here" -ForegroundColor Yellow

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Press Enter to open .env.local in your editor..." -ForegroundColor White
Read-Host

# Open the .env.local file in the default editor
code .env.local

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "After adding credentials, run:" -ForegroundColor Green
Write-Host "   pnpm dev" -ForegroundColor White
Write-Host "==================================" -ForegroundColor Cyan
