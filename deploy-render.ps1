# Deploy OrionOps to Render from local .env
# This script:
# 1. Loads secrets from .env (not committed)
# 2. Deploys/updates all services using render.yaml blueprint
# 3. Configures environment variables for each service

param(
    [switch]$Force = $false,
    [string]$EnvFile = ".env"
)

# Check if .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Error "❌ .env file not found at $EnvFile"
    Write-Host "Create .env with these variables:"
    Write-Host "  SPRING_DATASOURCE_PASSWORD=..."
    Write-Host "  SPRING_DATA_REDIS_URL=..."
    Write-Host "  APP_AUTH_JWT_SECRET=..."
    Write-Host "  KEYCLOAK_ADMIN_PASSWORD=admin"
    exit 1
}

# Load .env file
Write-Host "📄 Loading secrets from $EnvFile..."
$env_vars = @{}
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $env_vars[$key] = $value
        Write-Host "  ✓ $key"
    }
}

# Validate required variables
$required = @(
    'SPRING_DATASOURCE_PASSWORD',
    'SPRING_DATA_REDIS_URL',
    'APP_AUTH_JWT_SECRET',
    'KEYCLOAK_ADMIN_PASSWORD'
)

foreach ($var in $required) {
    if (-not $env_vars.ContainsKey($var)) {
        Write-Error "❌ Missing required variable: $var"
        exit 1
    }
}

Write-Host "`n✅ All required variables loaded`n"

# List of services and their required env vars
$services = @(
    @{
        name = "orionops-api"
        vars = @('SPRING_DATASOURCE_PASSWORD', 'SPRING_DATA_REDIS_URL', 'APP_AUTH_JWT_SECRET')
    },
    @{
        name = "orionops-workflow"
        vars = @('SPRING_DATASOURCE_PASSWORD', 'SPRING_DATA_REDIS_URL', 'APP_AUTH_JWT_SECRET')
    },
    @{
        name = "orionops-worker"
        vars = @('SPRING_DATASOURCE_PASSWORD', 'SPRING_DATA_REDIS_URL', 'APP_AUTH_JWT_SECRET')
    },
    @{
        name = "orionops-notifier"
        vars = @('SPRING_DATASOURCE_PASSWORD', 'SPRING_DATA_REDIS_URL', 'APP_AUTH_JWT_SECRET')
    },
    @{
        name = "orionops-connector"
        vars = @('SPRING_DATASOURCE_PASSWORD', 'SPRING_DATA_REDIS_URL', 'APP_AUTH_JWT_SECRET')
    },
    @{
        name = "orionops-keycloak"
        vars = @('SPRING_DATASOURCE_PASSWORD', 'KEYCLOAK_ADMIN_PASSWORD')
    }
)

# Deploy blueprint
Write-Host "🚀 Deploying render.yaml blueprint..."
$deploy_cmd = "render deploy"
if ($Force) {
    $deploy_cmd += " --force"
}

Write-Host "  Running: $deploy_cmd"
Invoke-Expression $deploy_cmd

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Blueprint deployment failed"
    exit 1
}

Write-Host "✅ Blueprint deployed`n"

# Set environment variables for each service
Write-Host "⚙️  Configuring environment variables..."

foreach ($service in $services) {
    Write-Host "`n📌 $($service.name):"

    foreach ($var in $service.vars) {
        $value = $env_vars[$var]
        $render_var = $var

        # Map to Keycloak var names if needed
        if ($service.name -eq "orionops-keycloak" -and $var -eq "SPRING_DATASOURCE_PASSWORD") {
            $render_var = "KC_DB_PASSWORD"
        }

        Write-Host "  Setting $render_var..."
        $cmd = "render env set $($service.name) $render_var `"$value`""
        Invoke-Expression $cmd

        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Set"
        } else {
            Write-Warning "    ⚠ May have failed (check Render dashboard)"
        }
    }
}

Write-Host "`n✅ Deployment complete!`n"
Write-Host "🔍 Check service status:"
Write-Host "  https://dashboard.render.com"
Write-Host "`n📋 Next steps:"
Write-Host "  1. Check each service status in Render dashboard"
Write-Host "  2. Verify database connectivity in service logs"
Write-Host "  3. Test API: curl https://orionops-api.onrender.com/api/actuator/health"
