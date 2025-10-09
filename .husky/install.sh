#!/usr/bin/env sh

# Install Husky for Git hooks
# This script should be run once after cloning the repository

set -e

echo "📦 Installing Husky Git hooks..."

# Check if we're in a git repository
if [ ! -d .git ]; then
  echo "❌ Error: Not a git repository. Run 'git init' first."
  exit 1
fi

# Create .husky directory if it doesn't exist
mkdir -p .husky

# Initialize Husky (if not already done)
if [ ! -f .husky/_/husky.sh ]; then
  # Create the husky.sh script manually (Deno alternative to npx husky install)
  mkdir -p .husky/_
  cat > .husky/_/husky.sh << 'EOF'
#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename -- "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi

  readonly husky_skip_init=1
  export husky_skip_init
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "husky - $hook_name hook exited with code $exitCode (error)"
  fi

  if [ $exitCode = 127 ]; then
    echo "husky - command not found in PATH=$PATH"
  fi

  exit $exitCode
fi
EOF
fi

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
chmod +x .husky/_/husky.sh

# Set up Git hooks path
git config core.hooksPath .husky

echo "✅ Husky hooks installed successfully!"
echo ""
echo "Git hooks configured:"
echo "  - pre-commit: Runs format, lint, type-check, unit & contract tests"
echo "  - pre-push: Runs full check task"
echo ""
echo "To skip hooks temporarily, use:"
echo "  git commit --no-verify"
echo "  git push --no-verify"

