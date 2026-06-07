# Deploy OrionOps to Render from local .env
# This script:
# 1. Loads secrets from .env (not committed)
# 2. Deploys/updates all services using render.yaml blueprint
# 3. Configures environment variables for each service

param(
    [switch]$SkipConfirm = $false,
    [string]$EnvFile = ""
)

# Auto-detect .env file (prefer .env.local, then .env)
if ([string]::IsNullOrEmpty($EnvFile)) {
    if (Test-Path ".env.local") {
        $EnvFile = ".env.local"
    } elseif (Test-Path ".env") {
        $EnvFile = ".env"
    } else {
        Write-Error "❌ Neither .env.local nor .env found"
        Write-Host "Use existing .env.local or create .env with:"
        Write-Host "  SPRING_DATASOURCE_PASSWORD=..."
        Write-Host "  SPRING_DATA_REDIS_URL=..."
        Write-Host "  APP_AUTH_JWT_SECRET=..."
        Write-Host "  KEYCLOAK_ADMIN_PASSWORD=..."
        exit 1
    }
}

if (-not (Test-Path $EnvFile)) {
    Write-Error "❌ $EnvFile file not found"
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

# Validate and normalize required variables
$required = @(
    'SPRING_DATASOURCE_PASSWORD',
    'SPRING_DATA_REDIS_URL',
    'KEYCLOAK_ADMIN_PASSWORD'
)

foreach ($var in $required) {
    if (-not $env_vars.ContainsKey($var)) {
        Write-Error "❌ Missing required variable: $var"
        exit 1
    }
}

# Handle JWT secret (could be APP_AUTH_JWT_SECRET or JWT_SECRET)
if ($env_vars.ContainsKey('APP_AUTH_JWT_SECRET')) {
    # Already set, use as-is
} elseif ($env_vars.ContainsKey('JWT_SECRET')) {
    # Map JWT_SECRET to APP_AUTH_JWT_SECRET
    $env_vars['APP_AUTH_JWT_SECRET'] = $env_vars['JWT_SECRET']
} else {
    Write-Error "❌ Missing JWT secret (expected APP_AUTH_JWT_SECRET or JWT_SECRET)"
    exit 1
}

Write-Host "`n✅ All required variables loaded`n"

# Prepare environment group secrets
$groupSecrets = @{
    SPRING_DATASOURCE_PASSWORD = $env_vars['SPRING_DATASOURCE_PASSWORD']
    KC_DB_PASSWORD = $env_vars['SPRING_DATASOURCE_PASSWORD']
    SPRING_DATA_REDIS_URL = $env_vars['SPRING_DATA_REDIS_URL']
    APP_AUTH_JWT_SECRET = $env_vars['APP_AUTH_JWT_SECRET']
    KEYCLOAK_ADMIN_PASSWORD = $env_vars['KEYCLOAK_ADMIN_PASSWORD']
}

# Services list for reference (all use orionops-secrets group)
$services = @(
    "orionops-api",
    "orionops-workflow",
    "orionops-worker",
    "orionops-notifier",
    "orionops-connector",
    "orionops-keycloak"
)

# Confirmation before deploying
if (-not $SkipConfirm) {
    Write-Host "⚠️  This will deploy/update all 6 services on Render:"
    foreach ($svc in $services) {
        Write-Host "  - $svc"
    }
    Write-Host ""
    Write-Host "Steps:"
    Write-Host "  1. Create/update environment group: orionops-secrets"
    Write-Host "  2. Deploy blueprint (services will redeploy)"
    Write-Host ""
    Write-Host "Brief downtime expected."
    Write-Host ""
    $response = Read-Host "Continue with deployment? (yes/no)"
    if ($response -ne "yes") {
        Write-Host "❌ Deployment cancelled"
        exit 0
    }
}

# Create or update environment group
Write-Host "`n📦 Creating/updating environment group: orionops-secrets..."

# Build env-group set command with all secrets
$envGroupCmd = "render env-group set orionops-secrets"
foreach ($key in $groupSecrets.Keys) {
    $value = $groupSecrets[$key]
    $envGroupCmd += " `"$key=$value`""
}

Invoke-Expression $envGroupCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to create/update environment group"
    exit 1
}

Write-Host "✅ Environment group configured`n"

# Deploy blueprint (group auto-attached to all services)
Write-Host "🚀 Deploying render.yaml blueprint (--force)..."
Invoke-Expression "render deploy --force"

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Blueprint deployment failed"
    exit 1
}

Write-Host "✅ Blueprint deployed with environment group`n"

Write-Host "✅ Deployment complete!`n"
Write-Host "🔍 Environment Group Status:"
foreach ($key in $groupSecrets.Keys) {
    Write-Host "  ✓ $key"
}
Write-Host ""
Write-Host "📊 Dashboard:"
Write-Host "  https://dashboard.render.com"
Write-Host ""
Write-Host "📋 Next steps:"
Write-Host "  1. Monitor service deployments in Render dashboard"
Write-Host "  2. Verify all 6 services show environment group attached"
Write-Host "  3. Check logs for database connectivity errors"
Write-Host "  4. Test API: curl https://orionops-api.onrender.com/api/actuator/health"
