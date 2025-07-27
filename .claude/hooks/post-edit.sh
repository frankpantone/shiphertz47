#!/bin/bash

# Claude Code Hook: Auto-commit successful code changes
# This hook runs after any file edit/write operation

set -e

# Configuration
REPO_URL="https://github.com/frankpantone/shiphertz47.git"
MAX_COMMIT_MESSAGE_LENGTH=72

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[Auto-Commit]${NC} $1"
}

success() {
    echo -e "${GREEN}[Auto-Commit]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[Auto-Commit]${NC} $1"
}

error() {
    echo -e "${RED}[Auto-Commit]${NC} $1"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository. Initializing..."
        git init
        git remote add origin "$REPO_URL" 2>/dev/null || true
    fi
}

# Function to check for syntax/build errors
check_for_errors() {
    log "Checking for errors..."
    
    # Check TypeScript/JavaScript syntax
    if command -v npm > /dev/null 2>&1; then
        if [ -f "package.json" ]; then
            # Try to run type checking if available
            if npm run --silent lint > /dev/null 2>&1; then
                log "Linting passed"
            else
                warn "Linting failed or not configured"
            fi
            
            # Try TypeScript type checking
            if npm run --silent typecheck > /dev/null 2>&1; then
                log "Type checking passed"
            elif command -v tsc > /dev/null 2>&1; then
                if tsc --noEmit > /dev/null 2>&1; then
                    log "TypeScript compilation check passed"
                else
                    error "TypeScript compilation errors found. Skipping commit."
                    return 1
                fi
            fi
        fi
    fi
    
    return 0
}

# Function to generate a commit message based on changes
generate_commit_message() {
    local changed_files=$(git diff --cached --name-only)
    local num_files=$(echo "$changed_files" | wc -l | tr -d ' ')
    
    if [ -z "$changed_files" ]; then
        echo "Update project files"
        return
    fi
    
    # Categorize changes
    local has_components=$(echo "$changed_files" | grep -q "components/" && echo "true" || echo "false")
    local has_pages=$(echo "$changed_files" | grep -q "app/" && echo "true" || echo "false")
    local has_lib=$(echo "$changed_files" | grep -q "lib/" && echo "true" || echo "false")
    local has_types=$(echo "$changed_files" | grep -q "types/" && echo "true" || echo "false")
    local has_config=$(echo "$changed_files" | grep -qE "\.(json|js|ts)$" | grep -qE "(config|package)" && echo "true" || echo "false")
    local has_docs=$(echo "$changed_files" | grep -q "\.md$" && echo "true" || echo "false")
    local has_database=$(echo "$changed_files" | grep -q "database/" && echo "true" || echo "false")
    
    local message=""
    
    # Generate message based on file types
    if [ "$has_components" = "true" ] && [ "$has_pages" = "true" ]; then
        message="Update components and pages"
    elif [ "$has_components" = "true" ]; then
        message="Update UI components"
    elif [ "$has_pages" = "true" ]; then
        message="Update application pages"
    elif [ "$has_lib" = "true" ]; then
        message="Update utility libraries"
    elif [ "$has_database" = "true" ]; then
        message="Update database schema/migrations"
    elif [ "$has_types" = "true" ]; then
        message="Update TypeScript definitions"
    elif [ "$has_config" = "true" ]; then
        message="Update configuration files"
    elif [ "$has_docs" = "true" ]; then
        message="Update documentation"
    else
        message="Update project files"
    fi
    
    # Add file count if multiple files
    if [ "$num_files" -gt 1 ]; then
        message="$message ($num_files files)"
    fi
    
    # Truncate if too long
    if [ ${#message} -gt $MAX_COMMIT_MESSAGE_LENGTH ]; then
        message=$(echo "$message" | cut -c1-$((MAX_COMMIT_MESSAGE_LENGTH-3)))...
    fi
    
    echo "$message"
}

# Main execution
main() {
    log "Starting auto-commit process..."
    
    # Check if we're in a git repository
    check_git_repo
    
    # Check if there are any changes to commit
    if git diff --quiet && git diff --cached --quiet; then
        log "No changes to commit"
        return 0
    fi
    
    # Check for errors before committing
    if ! check_for_errors; then
        error "Code errors detected. Skipping auto-commit."
        return 1
    fi
    
    # Stage all changes
    git add .
    
    # Check if there are staged changes
    if git diff --cached --quiet; then
        log "No staged changes to commit"
        return 0
    fi
    
    # Generate commit message
    local commit_message=$(generate_commit_message)
    log "Generated commit message: $commit_message"
    
    # Create commit
    if git commit -m "$commit_message" -m "🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"; then
        success "Successfully created commit: $commit_message"
        
        # Try to push to remote
        log "Attempting to push to remote repository..."
        if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
            success "Successfully pushed to GitHub repository"
        else
            warn "Failed to push to remote. You may need to:"
            warn "1. Set up authentication (GitHub token/SSH key)"
            warn "2. Create the remote repository"
            warn "3. Push manually with: git push origin main"
        fi
    else
        error "Failed to create commit"
        return 1
    fi
}

# Run the main function, but don't exit on failure to avoid breaking Claude Code
main || true