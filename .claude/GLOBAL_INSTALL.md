# Global Claude Code Agents Installation Guide

Instructions for installing Claude Code agents globally across all your projects.

## 📋 Overview

You can install these agents **globally** so they're available in every project, or keep them **project-specific**.

---

## Global Installation (Recommended)

### Step 1: Create Global Commands Directory

```bash
mkdir -p ~/.claude/commands
```

### Step 2: Copy Agent Commands to Global Directory

From this project, copy all agent command files:

```bash
# Navigate to this project
cd "/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2"

# Copy all agent commands to global directory
cp .claude/commands/review-typescript.md ~/.claude/commands/
cp .claude/commands/security-audit.md ~/.claude/commands/
cp .claude/commands/optimize-performance.md ~/.claude/commands/
cp .claude/commands/review-database.md ~/.claude/commands/
cp .claude/commands/simplify-code.md ~/.claude/commands/
cp .claude/commands/research-framework.md ~/.claude/commands/
cp .claude/commands/review-architecture.md ~/.claude/commands/
cp .claude/commands/research-best-practices.md ~/.claude/commands/
cp .claude/commands/analyze-patterns.md ~/.claude/commands/
cp .claude/commands/dhh-rails-review.md ~/.claude/commands/
cp .claude/commands/repo-research.md ~/.claude/commands/
```

### Step 3: Verify Global Installation

```bash
ls -la ~/.claude/commands/
```

You should see all 11 agent command files.

---

## Quick Global Install Script

Create and run this script for one-command installation:

```bash
#!/bin/bash
# File: install-global-agents.sh

echo "📦 Installing Claude Code Agents Globally..."

# Create directory
mkdir -p ~/.claude/commands

# Source directory
PROJECT_DIR="/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2"

# Copy agent commands
cp "$PROJECT_DIR/.claude/commands/review-typescript.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/security-audit.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/optimize-performance.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/review-database.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/simplify-code.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/research-framework.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/review-architecture.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/research-best-practices.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/analyze-patterns.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/dhh-rails-review.md" ~/.claude/commands/
cp "$PROJECT_DIR/.claude/commands/repo-research.md" ~/.claude/commands/

echo "✅ Global installation complete!"
echo ""
echo "Available globally in all projects:"
echo "  /review-typescript"
echo "  /security-audit"
echo "  /optimize-performance"
echo "  /review-database"
echo "  /simplify-code"
echo "  /research-framework"
echo "  /review-architecture"
echo "  /research-best-practices"
echo "  /analyze-patterns"
echo "  /dhh-rails-review"
echo "  /repo-research"
```

Make it executable and run:
```bash
chmod +x install-global-agents.sh
./install-global-agents.sh
```

---

## Project-Specific vs Global

### Global Installation Benefits

✅ **Pros:**
- Available in ALL projects
- Consistent tooling across projects
- Update once, apply everywhere
- Easier to maintain

❌ **Cons:**
- Not version controlled per project
- Harder to customize per project
- Changes affect all projects

### Project-Specific Benefits

✅ **Pros:**
- Version controlled with project
- Project-specific customization
- Team can share configurations
- Project-specific agent behavior

❌ **Cons:**
- Must install in each project
- Updates needed per project
- Inconsistent across projects

---

## Recommended Approach

**Hybrid Strategy:**

1. **Install Core Agents Globally:**
   - `/review-typescript`
   - `/security-audit`
   - `/optimize-performance`
   - `/simplify-code`

2. **Keep Project-Specific:**
   - `/review-database` (customized for Supabase)
   - `/research-framework` (customized for Next.js 15)
   - Project-specific agents

---

## Global Agent Locations

### macOS / Linux

```
~/.claude/
├── commands/
│   ├── review-typescript.md
│   ├── security-audit.md
│   ├── optimize-performance.md
│   ├── review-database.md
│   ├── simplify-code.md
│   ├── research-framework.md
│   ├── review-architecture.md
│   ├── research-best-practices.md
│   ├── analyze-patterns.md
│   ├── dhh-rails-review.md
│   └── repo-research.md
└── CLAUDE.md (global instructions)
```

### Windows

```
C:\Users\YourUsername\.claude\
├── commands\
│   ├── review-typescript.md
│   ├── security-audit.md
│   └── ...
└── CLAUDE.md
```

---

## Testing Global Installation

### Test in Any Project

Navigate to any project and run:

```bash
# Should work globally
/review-typescript
/security-audit
/optimize-performance
```

If not working, check:
1. Files exist in `~/.claude/commands/`
2. Files have `.md` extension
3. File names match command names (without `/`)

---

## Updating Global Agents

When you update an agent in one project:

```bash
# Update in project
edit .claude/commands/review-typescript.md

# Copy to global
cp .claude/commands/review-typescript.md ~/.claude/commands/

# Now available globally with updates
```

---

## Sharing Agents with Team

### Option 1: Commit to Project (Recommended)

Keep agents in project `.claude/commands/` and commit to git:

```bash
git add .claude/commands/
git commit -m "Add Claude Code agents"
git push
```

Team members get agents automatically when cloning.

### Option 2: Shared Installation Script

Share the installation script via:
- Project README
- Team documentation
- Onboarding docs

### Option 3: dotfiles Repository

Add global agents to team dotfiles:

```
dotfiles/
├── .claude/
│   └── commands/
│       ├── review-typescript.md
│       └── ...
└── install.sh
```

---

## Agents for Specify & OpenSpec

The following agents are **specifically optimized** for Specify and OpenSpec workflows:

### Specification & API Design Agents

1. **`/review-architecture`** (architecture-strategist)
   - OpenAPI specification review
   - API endpoint architecture
   - Specification compliance

2. **`/research-best-practices`** (best-practices-researcher)
   - OpenAPI best practices
   - API design standards
   - Specification formats

3. **`/analyze-patterns`** (pattern-recognition-specialist)
   - API pattern consistency
   - Specification patterns
   - Naming conventions

4. **`/dhh-rails-review`** (dhh-rails-reviewer)
   - RESTful API design critique
   - Convention over configuration
   - API simplicity validation

5. **`/repo-research`** (repo-research-analyst)
   - Repository pattern analysis
   - Specification template discovery
   - Convention identification

---

## Integration with Specify

Your project has **Specify** integration in `.specify/` directory.

### Workflow with Specify

```bash
# 1. Research best practices
/research-best-practices OpenAPI specification design

# 2. Create specification
# (use Specify to create OpenAPI spec)

# 3. Review architecture
/review-architecture

# 4. Analyze patterns
/analyze-patterns

# 5. Validate with DHH philosophy
/dhh-rails-review
```

---

## Integration with OpenSpec

Your project has **OpenSpec** in `/openspec/` directory.

### Workflow with OpenSpec

```bash
# 1. Research API patterns
/research-best-practices REST API versioning

# 2. Review specification
/review-architecture

# 3. Check pattern consistency
/analyze-patterns

# 4. Ensure simplicity
/dhh-rails-review
```

---

## Complete Global Agent List

### Code Quality (4 agents)
1. `/review-typescript` - TypeScript code review
2. `/simplify-code` - Code simplification
3. `/review-database` - Database operations review
4. `/dhh-rails-review` - Rails-style pragmatic review

### Security & Performance (2 agents)
5. `/security-audit` - Security vulnerabilities
6. `/optimize-performance` - Performance optimization

### Architecture & Design (3 agents)
7. `/review-architecture` - Architecture validation
8. `/analyze-patterns` - Pattern recognition
9. `/repo-research` - Repository analysis

### Research (2 agents)
10. `/research-framework` - Framework documentation
11. `/research-best-practices` - Best practices research

---

## Summary

**11 Core Claude Code Agents** installed for comprehensive development support across:

- ✅ Code Quality
- ✅ Security
- ✅ Performance
- ✅ Architecture
- ✅ API Design (OpenSpec)
- ✅ Specifications (Specify)
- ✅ Best Practices
- ✅ Pattern Recognition

**Works With:**
- Specify (`.specify/` integration)
- OpenSpec (`/openspec/` integration)
- Next.js 15 / React 19
- TypeScript 5.7
- Supabase

---

**Ready to Use Globally Across All Your Projects!**

Run the installation script above or manually copy files to `~/.claude/commands/`.

---

**Version**: 1.0.0
**Last Updated**: October 22, 2025
**Maintainer**: Maurice (Skycruzer)
