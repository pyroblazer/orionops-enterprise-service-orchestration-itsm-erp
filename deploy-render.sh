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
    echo "⚠️  This will forcefully update all 6 services on Render:"
    echo "  - orionops-api"
    echo "  - orionops-workflow"
    echo "  - orionops-worker"
    echo "  - orionops-notifier"
    echo "  - orionops-connector"
    echo "  - orionops-keycloak"
    echo ""
    echo "Services will redeploy (brief downtime expected)."
    echo ""
    read -p "Continue with deployment? (yes/no) " response
    if [[ "$response" != "yes" ]]; then
        echo "❌ Deployment cancelled"
        exit 0
    fi
fi

# Deploy blueprint
echo ""
echo "🚀 Deploying render.yaml blueprint (--force)..."
render deploy --force

if [[ $? -ne 0 ]]; then
    echo "❌ Blueprint deployment failed"
    exit 1
fi

echo "✅ Blueprint deployed"
echo ""

# Services and their env vars
services=(
    "orionops-api:SPRING_DATASOURCE_PASSWORD SPRING_DATA_REDIS_URL APP_AUTH_JWT_SECRET"
    "orionops-workflow:SPRING_DATASOURCE_PASSWORD SPRING_DATA_REDIS_URL APP_AUTH_JWT_SECRET"
    "orionops-worker:SPRING_DATASOURCE_PASSWORD SPRING_DATA_REDIS_URL APP_AUTH_JWT_SECRET"
    "orionops-notifier:SPRING_DATASOURCE_PASSWORD SPRING_DATA_REDIS_URL APP_AUTH_JWT_SECRET"
    "orionops-connector:SPRING_DATASOURCE_PASSWORD SPRING_DATA_REDIS_URL APP_AUTH_JWT_SECRET"
    "orionops-keycloak:SPRING_DATASOURCE_PASSWORD KEYCLOAK_ADMIN_PASSWORD"
)

# Set environment variables for each service
echo "⚙️  Configuring environment variables..."

for service_entry in "${services[@]}"; do
    service_name="${service_entry%:*}"
    vars="${service_entry#*:}"

    echo ""
    echo "📌 $service_name:"

    for var in $vars; do
        render_var="$var"

        # Map to Keycloak var name if needed
        if [[ "$service_name" == "orionops-keycloak" && "$var" == "SPRING_DATASOURCE_PASSWORD" ]]; then
            render_var="KC_DB_PASSWORD"
        fi

        echo "  Setting $render_var..."
        render env set "$service_name" "$render_var" "${!var}"

        if [[ $? -eq 0 ]]; then
            echo "    ✓ Set"
        else
            echo "    ⚠ May have failed (check Render dashboard)"
        fi
    done
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Check service status:"
echo "  https://dashboard.render.com"
echo ""
echo "📋 Next steps:"
echo "  1. Check each service status in Render dashboard"
echo "  2. Verify database connectivity in service logs"
echo "  3. Test API: curl https://orionops-api.onrender.com/api/actuator/health"
