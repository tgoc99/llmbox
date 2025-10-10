#!/bin/bash

# Integration Test Runner Script
# This script helps run integration tests with proper configuration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if environment variables are set
check_env_vars() {
    local missing_vars=()

    if [[ -z "${OPENAI_API_KEY}" ]]; then
        missing_vars+=("OPENAI_API_KEY")
    fi

    if [[ -z "${SENDGRID_API_KEY}" ]]; then
        missing_vars+=("SENDGRID_API_KEY")
    fi

    if [[ -z "${SERVICE_EMAIL_ADDRESS}" ]]; then
        missing_vars+=("SERVICE_EMAIL_ADDRESS")
    fi

    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_warning "Some environment variables are not set:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_info "Tests requiring missing variables will be skipped."
        echo ""
        return 1
    else
        print_success "All required environment variables are set"
        return 0
    fi
}

# Display current configuration
show_config() {
    print_header "Current Configuration"

    if [[ -n "${OPENAI_API_KEY}" ]]; then
        echo "✓ OPENAI_API_KEY: ${OPENAI_API_KEY:0:8}...${OPENAI_API_KEY: -4}"
        echo "  Model: ${OPENAI_MODEL:-gpt-4o-mini (default)}"
        echo "  Max Tokens: ${OPENAI_MAX_TOKENS:-1000 (default)}"
        echo "  Temperature: ${OPENAI_TEMPERATURE:-0.7 (default)}"
        echo "  Timeout: ${OPENAI_TIMEOUT_MS:-30000 (default)}ms"
    else
        echo "✗ OPENAI_API_KEY: not set"
    fi

    echo ""

    if [[ -n "${SENDGRID_API_KEY}" ]]; then
        echo "✓ SENDGRID_API_KEY: ${SENDGRID_API_KEY:0:8}...${SENDGRID_API_KEY: -4}"
        echo "  Timeout: ${SENDGRID_TIMEOUT_MS:-10000 (default)}ms"
    else
        echo "✗ SENDGRID_API_KEY: not set"
    fi

    echo ""

    if [[ -n "${SERVICE_EMAIL_ADDRESS}" ]]; then
        echo "✓ SERVICE_EMAIL_ADDRESS: ${SERVICE_EMAIL_ADDRESS}"
    else
        echo "✗ SERVICE_EMAIL_ADDRESS: not set"
    fi

    if [[ -n "${TEST_RECIPIENT_EMAIL}" ]]; then
        echo "✓ TEST_RECIPIENT_EMAIL: ${TEST_RECIPIENT_EMAIL}"
    else
        echo "  TEST_RECIPIENT_EMAIL: not set (will use SERVICE_EMAIL_ADDRESS)"
    fi

    echo ""
}

# Run tests with specified filter
run_tests() {
    local test_file=$1
    local test_name=$2

    if [[ -n "$test_file" ]]; then
        print_info "Running: $test_file"
        deno test "$test_file" --allow-all --allow-env
    else
        print_info "Running all integration tests"
        deno test tests/integration/ --allow-all --allow-env
    fi
}

# Main menu
show_menu() {
    print_header "Integration Test Runner"
    echo "Select which tests to run:"
    echo ""
    echo "  1) All integration tests"
    echo "  2) OpenAI tests only"
    echo "  3) SendGrid tests only"
    echo "  4) End-to-end tests only"
    echo "  5) Show configuration"
    echo "  6) Check environment variables"
    echo "  0) Exit"
    echo ""
}

# Parse command line arguments
if [ $# -gt 0 ]; then
    case "$1" in
        --all|-a)
            print_header "Running All Integration Tests"
            check_env_vars || true
            run_tests
            ;;
        --openai|-o)
            print_header "Running OpenAI Integration Tests"
            check_env_vars || true
            run_tests "tests/integration/openai.test.ts"
            ;;
        --sendgrid|-s)
            print_header "Running SendGrid Integration Tests"
            check_env_vars || true
            run_tests "tests/integration/sendgrid.test.ts"
            ;;
        --config|-c)
            show_config
            ;;
        --check|-k)
            print_header "Checking Environment Variables"
            if check_env_vars; then
                print_success "All environment variables are configured correctly"
            else
                print_error "Some environment variables are missing"
                exit 1
            fi
            ;;
        --help|-h)
            echo "Integration Test Runner"
            echo ""
            echo "Usage: $0 [option]"
            echo ""
            echo "Options:"
            echo "  -a, --all       Run all integration tests"
            echo "  -o, --openai    Run OpenAI tests only"
            echo "  -s, --sendgrid  Run SendGrid tests only"
            echo "  -c, --config    Show current configuration"
            echo "  -k, --check     Check environment variables"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --all                 # Run all tests"
            echo "  $0 --openai              # Run only OpenAI tests"
            echo "  $0 --config              # Show configuration"
            echo ""
            echo "Environment Variables:"
            echo "  OPENAI_API_KEY           Required for OpenAI tests"
            echo "  SENDGRID_API_KEY         Required for SendGrid tests"
            echo "  SERVICE_EMAIL_ADDRESS    Required for SendGrid tests"
            echo "  TEST_RECIPIENT_EMAIL     Optional, defaults to SERVICE_EMAIL_ADDRESS"
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
else
    # Interactive mode
    while true; do
        show_menu
        read -p "Enter your choice [0-6]: " choice

        case $choice in
            1)
                print_header "Running All Integration Tests"
                check_env_vars || true
                echo ""
                read -p "Press Enter to continue or Ctrl+C to cancel..."
                run_tests
                echo ""
                read -p "Press Enter to return to menu..."
                ;;
            2)
                print_header "Running OpenAI Integration Tests"
                check_env_vars || true
                echo ""
                read -p "Press Enter to continue or Ctrl+C to cancel..."
                run_tests "tests/integration/openai.test.ts"
                echo ""
                read -p "Press Enter to return to menu..."
                ;;
            3)
                print_header "Running SendGrid Integration Tests"
                check_env_vars || true
                echo ""
                read -p "Press Enter to continue or Ctrl+C to cancel..."
                run_tests "tests/integration/sendgrid.test.ts"
                echo ""
                read -p "Press Enter to return to menu..."
                ;;
            4)
                print_header "Running End-to-End Integration Tests"
                check_env_vars || true
                echo ""
                read -p "Press Enter to continue or Ctrl+C to cancel..."
                run_tests "tests/integration/end-to-end.test.ts"
                echo ""
                read -p "Press Enter to return to menu..."
                ;;
            5)
                show_config
                read -p "Press Enter to return to menu..."
                ;;
            6)
                print_header "Checking Environment Variables"
                if check_env_vars; then
                    print_success "All environment variables are configured correctly"
                fi
                echo ""
                read -p "Press Enter to return to menu..."
                ;;
            0)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                sleep 1
                ;;
        esac

        clear
    done
fi

