# Auto-Documentation Update Slash Command

You are a documentation maintenance specialist for this auto logistics platform codebase. When invoked with `/update-docs`, you will:

## 1. Analyze Recent Code Changes

First, detect what has changed in the codebase:

```bash
# Check git status for modified files
git status --porcelain

# Show recent commits if available
git log --oneline -10 2>/dev/null || echo "No git history available"

# Look for recently modified files
find . -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.sql" -newermt "1 day ago" 2>/dev/null | grep -v node_modules | head -20
```

## 2. Scan Current Documentation Files

Identify all documentation that needs to be kept current:

- `README.md` - Main project overview and setup
- `CLAUDE.md` - Claude Code guidance file
- `TESTING_PLAN.md` - Admin system testing procedures
- `QUICK_TEST_CHECKLIST.md` - 5-minute validation checklist
- `MULTI_VIN_COMPLETION_GUIDE.md` - Multi-VIN implementation guide
- `SUPABASE_UPLOAD_SETUP.md` - File upload debugging guide

## 3. Code Analysis Strategy

For each modified file, analyze:

### Architecture Changes
- New components in `/components/`
- New pages in `/app/`
- API route modifications in `/app/api/`
- Database schema changes in `/database/`
- Library/utility updates in `/lib/`

### Feature Changes
- Authentication system modifications (especially raw auth)
- Admin panel functionality updates
- Order management workflow changes
- Payment processing updates
- Multi-vehicle/VIN handling changes
- File upload system modifications

### Configuration Changes
- Environment variable requirements
- Package.json dependencies
- Database setup requirements
- API integrations (Google Maps, NHTSA, Stripe)

## 4. Documentation Update Rules

### README.md Updates
- **Features Section**: Add/remove features based on new components/pages
- **Tech Stack**: Update if new major dependencies added
- **Setup Instructions**: Update if new env vars or setup steps required
- **Project Structure**: Update if significant folder structure changes
- **Development Phases**: Mark phases complete or add new ones

### CLAUDE.md Updates
- **Commands**: Add new npm scripts if package.json changed
- **Architecture**: Update for major structural changes
- **Authentication**: Update if auth system modified
- **Database Schema**: Update if new tables/columns added
- **Key Implementation Details**: Update for significant feature changes
- **Environment Variables**: Add new required variables
- **Development Workflow**: Update for new patterns or processes

### Testing Documentation Updates
- **TESTING_PLAN.md**: Add test cases for new admin features
- **QUICK_TEST_CHECKLIST.md**: Update quick validation steps for new functionality

### Feature-Specific Guides Updates
- **MULTI_VIN_COMPLETION_GUIDE.md**: Update if vehicle handling code changes
- **SUPABASE_UPLOAD_SETUP.md**: Update if upload system modified

## 5. Update Execution Process

For each documentation file that needs updates:

1. **Read the current version** completely
2. **Identify sections that need updates** based on code changes
3. **Preserve the existing structure** and tone
4. **Update only what has actually changed** - don't rewrite unchanged sections
5. **Maintain consistency** with existing documentation style
6. **Verify accuracy** against actual code implementation

## 6. Change Detection Priorities

### High Priority Updates (Always Update)
- New environment variables required
- Breaking changes to setup process
- New major features in admin panel
- Authentication system changes
- Database schema modifications

### Medium Priority Updates (Update if Significant)
- New components with public APIs
- Modified API endpoints
- Updated testing procedures
- New development workflows

### Low Priority Updates (Update if Major)
- Minor bug fixes
- Code refactoring without feature changes
- Dependency updates without API changes

## 7. Quality Checks

Before completing updates:

- Ensure all mentioned file paths exist
- Verify environment variables are correctly listed
- Check that setup instructions are complete and accurate
- Confirm code examples reflect actual implementation
- Validate that architecture descriptions match current structure

## 8. Output Format

For each updated file, provide:
1. **Summary of changes made**
2. **Reasoning for each update**
3. **Verification that updates are accurate**

If no updates are needed, state: "Documentation is current with recent code changes."

## Example Usage

When invoked: `/update-docs`

The assistant will:
1. Scan for recent code changes
2. Analyze impact on documentation
3. Update relevant documentation files
4. Provide summary of changes made

This ensures documentation stays synchronized with the evolving codebase automatically.