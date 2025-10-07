#!/bin/bash
# Helper script to load .env file and run commands
# Usage: ./scripts/load-env.sh deno test --allow-all tests/integration/

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo ""
    echo "Integration tests require API keys to be set."
    echo "You have two options:"
    echo ""
    echo -e "${BLUE}Option 1: Create .env file (Recommended)${NC}"
    echo "  1. Copy the example: cp .env.example .env"
    echo "  2. Edit .env and add your API keys"
    echo "  3. Run tests again: deno task test:integration"
    echo ""
    echo -e "${BLUE}Option 2: Set environment variables in shell${NC}"
    echo "  export OPENAI_API_KEY='sk-...'"
    echo "  export SENDGRID_API_KEY='SG....'"
    echo "  export SERVICE_EMAIL_ADDRESS='assistant@yourdomain.com'"
    echo ""
    echo -e "${YELLOW}Note: Tests will skip gracefully without credentials${NC}"
    echo "Running tests anyway (they will be skipped)..."
    echo ""

    # Still run the command even without .env
    # Tests will skip gracefully
    exec "$@"
fi

# Load .env file
set -a
source .env
set +a

# Count how many required vars are set
VARS_SET=0
[ -n "$OPENAI_API_KEY" ] && ((VARS_SET++))
[ -n "$SENDGRID_API_KEY" ] && ((VARS_SET++))
[ -n "$SERVICE_EMAIL_ADDRESS" ] && ((VARS_SET++))

if [ $VARS_SET -eq 3 ]; then
    echo -e "${GREEN}✅ Environment variables loaded from .env${NC}"
    echo "   - OPENAI_API_KEY: ${OPENAI_API_KEY:0:8}...${OPENAI_API_KEY: -4}"
    echo "   - SENDGRID_API_KEY: ${SENDGRID_API_KEY:0:8}...${SENDGRID_API_KEY: -4}"
    echo "   - SERVICE_EMAIL_ADDRESS: $SERVICE_EMAIL_ADDRESS"
    [ -n "$TEST_RECIPIENT_EMAIL" ] && echo "   - TEST_RECIPIENT_EMAIL: $TEST_RECIPIENT_EMAIL"
    echo ""
elif [ $VARS_SET -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some environment variables are missing in .env${NC}"
    echo "   Variables set: $VARS_SET/3 required"
    echo "   Edit .env to add missing API keys"
    echo ""
else
    echo -e "${YELLOW}⚠️  No API keys found in .env${NC}"
    echo "   Edit .env and add your API keys"
    echo "   Tests will be skipped without credentials"
    echo ""
fi

# Run the command passed as arguments
if [ $# -eq 0 ]; then
    echo "Usage: ./scripts/load-env.sh <command>"
    echo "Example: ./scripts/load-env.sh deno test --allow-all tests/integration/"
    exit 1
fi

# Execute the command
exec "$@"

