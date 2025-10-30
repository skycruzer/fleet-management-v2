#!/bin/bash
# Global Claude Code Agents Installation Script
# Version: 1.0.0
# Date: October 22, 2025

echo "📦 Installing Claude Code Agents Globally..."
echo ""

# Create directory
mkdir -p ~/.claude/commands

# Source directory (adjust if needed)
PROJECT_DIR="/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2"

# Check if source directory exists
if [ ! -d "$PROJECT_DIR/.claude/commands" ]; then
    echo "❌ Error: Source directory not found!"
    echo "   Expected: $PROJECT_DIR/.claude/commands"
    exit 1
fi

echo "📋 Copying agent commands to ~/.claude/commands/..."
echo ""

# Copy agent commands
agents=(
    "review-typescript"
    "security-audit"
    "optimize-performance"
    "review-database"
    "simplify-code"
    "research-framework"
    "review-architecture"
    "research-best-practices"
    "analyze-patterns"
    "dhh-rails-review"
    "repo-research"
)

count=0
for agent in "${agents[@]}"; do
    if cp "$PROJECT_DIR/.claude/commands/${agent}.md" ~/.claude/commands/ 2>/dev/null; then
        echo "  ✅ Installed: /$agent"
        ((count++))
    else
        echo "  ⚠️  Not found: /$agent"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Global installation complete! ($count/11 agents)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Installed to: ~/.claude/commands/"
echo ""
echo "🚀 Available globally in all projects:"
echo ""
echo "   Code Quality:"
echo "     /review-typescript"
echo "     /simplify-code"
echo "     /dhh-rails-review"
echo ""
echo "   Security & Performance:"
echo "     /security-audit"
echo "     /optimize-performance"
echo ""
echo "   Database:"
echo "     /review-database"
echo ""
echo "   Architecture:"
echo "     /review-architecture"
echo "     /analyze-patterns"
echo "     /repo-research"
echo ""
echo "   Research:"
echo "     /research-framework"
echo "     /research-best-practices"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Usage: Just type the command in any Claude Code session!"
echo "📚 Documentation: See .claude/AGENTS.md and .claude/GLOBAL_INSTALL.md"
echo ""
