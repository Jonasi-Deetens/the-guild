# Docker management script for The Guild

param(
    [Parameter(Position=0)]
    [ValidateSet("up", "down", "restart", "logs", "status", "reset")]
    [string]$Action = "status"
)

switch ($Action) {
    "up" {
        Write-Host "🚀 Starting Docker services..." -ForegroundColor Green
        docker-compose up -d
        Write-Host "✅ Services started! Check status with: .\scripts\docker.ps1 status" -ForegroundColor Green
    }
    
    "down" {
        Write-Host "🛑 Stopping Docker services..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✅ Services stopped!" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "🔄 Restarting Docker services..." -ForegroundColor Blue
        docker-compose down
        docker-compose up -d
        Write-Host "✅ Services restarted!" -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "📋 Showing Docker logs..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    
    "status" {
        Write-Host "📊 Docker services status:" -ForegroundColor Cyan
        docker-compose ps
        Write-Host "`n🌐 Access URLs:" -ForegroundColor Green
        Write-Host "  • Redis Commander: http://localhost:8081" -ForegroundColor White
        Write-Host "  • PostgreSQL: localhost:5432" -ForegroundColor White
        Write-Host "  • Redis: localhost:6379" -ForegroundColor White
    }
    
    "reset" {
        Write-Host "⚠️  Resetting all data (this will delete all database data)..." -ForegroundColor Red
        $confirm = Read-Host "Are you sure? Type 'yes' to continue"
        if ($confirm -eq "yes") {
            docker-compose down -v
            docker-compose up -d
            Write-Host "✅ All data reset! Run 'npx prisma migrate dev' to recreate the database schema." -ForegroundColor Green
        } else {
            Write-Host "❌ Reset cancelled." -ForegroundColor Yellow
        }
    }
}

# Usage examples:
# .\scripts\docker.ps1 up      # Start services
# .\scripts\docker.ps1 down    # Stop services  
# .\scripts\docker.ps1 restart # Restart services
# .\scripts\docker.ps1 logs    # View logs
# .\scripts\docker.ps1 status  # Check status
# .\scripts\docker.ps1 reset   # Reset all data
