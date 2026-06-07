#!/bin/bash
# Deploy OrionOps to Render from local .env
# Works on: Linux, macOS, Windows (Git Bash, WSL)
# Usage: ./deploy-render.sh [-s|--skip-confirm] [-e|--env FILE]

set -e

# Defaults
SKIP_CONFIRM=false
ENV_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--skip-confirm)
            SKIP_CONFIRM=true
            shift
            ;;
        -e|--env)
            ENV_FILE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-s|--skip-confirm] [-e|--env FILE]"
            exit 1
            ;;
    esac
done

# Auto-detect .env file (prefer .env.local, then .env)
if [[ -z "$ENV_FILE" ]]; then
    if [[ -f ".env.local" ]]; then
        ENV_FILE=".env.local"
    elif [[ -f ".env" ]]; then
        ENV_FILE=".env"
    else
        echo "❌ Neither .env.local nor .env found"
        echo "Use existing .env.local or create .env with:"
        echo "  SPRING_DATASOURCE_PASSWORD=..."
        echo "  SPRING_DATA_REDIS_URL=..."
        echo "  APP_AUTH_JWT_SECRET=..."
        echo "  KEYCLOAK_ADMIN_PASSWORD=..."
        exit 1
    fi
fi

# Check if selected file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ $ENV_FILE file not found"
    exit 1
fi

# Load .env file
echo "📄 Loading secrets from $ENV_FILE..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Validate and normalize required variables
required_vars=(
    "SPRING_DATASOURCE_PASSWORD"
    "SPRING_DATA_REDIS_URL"
    "KEYCLOAK_ADMIN_PASSWORD"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ Missing required variable: $var"
        exit 1
    fi
    echo "  ✓ $var"
done

# Handle JWT secret (could be APP_AUTH_JWT_SECRET or JWT_SECRET)
if [[ -z "${APP_AUTH_JWT_SECRET}" ]]; then
    if [[ -n "${JWT_SECRET}" ]]; then
        # Map JWT_SECRET to APP_AUTH_JWT_SECRET
        export APP_AUTH_JWT_SECRET="$JWT_SECRET"
        echo "  ✓ JWT_SECRET → APP_AUTH_JWT_SECRET"
    else
        echo "❌ Missing JWT secret (expected APP_AUTH_JWT_SECRET or JWT_SECRET)"
        exit 1
    fi
else
    echo "  ✓ APP_AUTH_JWT_SECRET"
fi

echo ""
echo "✅ All required variables loaded"
echo ""

# Confirmation before deploying
if [[ "$SKIP_CONFIRM" == false ]]; then
    echo "⚠️  This will deploy/update all 6 services on Render:"
    for svc in "${services[@]}"; do
        echo "  - $svc"
    done
    echo ""
    echo "Steps:"
    echo "  1. Create/update environment group: orionops-secrets"
    echo "  2. Deploy blueprint (services will redeploy)"
    echo ""
    echo "Brief downtime expected."
    echo ""
    read -p "Continue with deployment? (yes/no) " response
    if [[ "$response" != "yes" ]]; then
        echo "❌ Deployment cancelled"
        exit 0
    fi
fi

# Services list for reference (all use orionops-secrets group)
services=(
    "orionops-api"
    "orionops-workflow"
    "orionops-worker"
    "orionops-notifier"
    "orionops-connector"
    "orionops-keycloak"
)

# Create or update environment group
echo "📦 Creating/updating environment group: orionops-secrets..."

render env-group set orionops-secrets \
    "SPRING_DATASOURCE_PASSWORD=$SPRING_DATASOURCE_PASSWORD" \
    "KC_DB_PASSWORD=$SPRING_DATASOURCE_PASSWORD" \
    "SPRING_DATA_REDIS_URL=$SPRING_DATA_REDIS_URL" \
    "APP_AUTH_JWT_SECRET=$APP_AUTH_JWT_SECRET" \
    "KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD"

if [[ $? -ne 0 ]]; then
    echo "❌ Failed to create/update environment group"
    exit 1
fi

echo "✅ Environment group configured"
echo ""

# Deploy blueprint (group auto-attached to all services)
echo "🚀 Deploying render.yaml blueprint (--force)..."
render deploy --force

if [[ $? -ne 0 ]]; then
    echo "❌ Blueprint deployment failed"
    exit 1
fi

echo "✅ Blueprint deployed with environment group"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "🔍 Environment Group Status:"
echo "  ✓ SPRING_DATASOURCE_PASSWORD"
echo "  ✓ KC_DB_PASSWORD"
echo "  ✓ SPRING_DATA_REDIS_URL"
echo "  ✓ APP_AUTH_JWT_SECRET"
echo "  ✓ KEYCLOAK_ADMIN_PASSWORD"
echo ""
echo "📊 Dashboard:"
echo "  https://dashboard.render.com"
echo ""
echo "📋 Next steps:"
echo "  1. Monitor service deployments in Render dashboard"
echo "  2. Verify all 6 services show environment group attached"
echo "  3. Check logs for database connectivity errors"
echo "  4. Test API: curl https://orionops-api.onrender.com/api/actuator/health"
