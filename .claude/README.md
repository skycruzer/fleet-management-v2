# Claude Code Configuration

This directory contains Claude Code configuration, slash commands, and agent integrations.

## 📁 Directory Structure

```
.claude/
├── commands/                  # Slash commands (local to this project)
│   ├── BMad/                 # BMAD framework agents
│   │   └── agents/           # 10 BMAD agents
│   ├── speckit.*.md          # 7 Speckit commands
│   ├── review-typescript.md  # 11 Claude Code marketplace agents
│   └── ...other commands
├── AGENTS.md                 # Complete agent documentation
├── GLOBAL_INSTALL.md         # Global installation guide
├── INSTALLATION_COMPLETE.md  # Installation summary
└── README.md                 # This file
```

## 🚀 Quick Start

### Using Agents

Simply type the slash command in any Claude Code conversation:

```bash
/review-typescript          # Review TypeScript code
/security-audit            # Security vulnerability scan
/optimize-performance      # Performance optimization
/review-architecture       # Architecture review
```

### Available Agents

**11 Claude Code Marketplace Agents** (installed globally):
- Code Quality: `/review-typescript`, `/simplify-code`, `/dhh-rails-review`
- Security: `/security-audit`
- Performance: `/optimize-performance`
- Database: `/review-database`
- Architecture: `/review-architecture`, `/analyze-patterns`, `/repo-research`
- Research: `/research-framework`, `/research-best-practices`

**10 BMAD Framework Agents**:
- `/analyst` - Business analysis
- `/architect` - System architecture
- `/dev` - Development
- `/pm` - Project management
- `/po` - Product ownership
- `/qa` - Quality assurance
- `/sm` - Scrum master
- `/ux-expert` - UX/UI design
- `/bmad-master` - BMAD master
- `/bmad-orchestrator` - Orchestration

**7 Speckit Commands**:
- `/speckit.analyze` - Analyze specifications
- `/speckit.checklist` - Specification checklist
- `/speckit.clarify` - Clarify requirements
- `/speckit.constitution` - Project constitution
- `/speckit.implement` - Implementation planning
- `/speckit.plan` - Planning
- `/speckit.specify` - Create specifications

## 📚 Documentation

### Main Documentation
- **[AGENTS.md](./AGENTS.md)** - Complete agent reference (600+ lines)
  - Detailed agent descriptions
  - Usage examples
  - Workflow patterns
  - Best practices

- **[GLOBAL_INSTALL.md](./GLOBAL_INSTALL.md)** - Installation guide
  - Global vs project-specific installation
  - Update procedures
  - Sharing with team

- **[INSTALLATION_COMPLETE.md](./INSTALLATION_COMPLETE.md)** - Installation summary
  - What was installed
  - Quick reference
  - Troubleshooting

### Command Documentation

Each command has its own documentation file:
```bash
cat .claude/commands/review-typescript.md
cat .claude/commands/security-audit.md
```

## 🌐 Global vs Local

### Global Installation (✅ Completed)

**Location**: `~/.claude/commands/`

**83 commands installed globally**, including:
- 11 Claude Code marketplace agents
- 72+ other custom commands

**Benefits**:
- Available in ALL projects
- Update once, applies everywhere
- Consistent tooling

### Project-Specific Commands

**Location**: `.claude/commands/`

**This project has**:
- 11 Claude Code agents (also global)
- 10 BMAD framework agents
- 7 Speckit commands
- 2 custom commands (apa, build)

**Benefits**:
- Version controlled
- Team collaboration
- Project customization

## 🎯 Common Workflows

### Pre-Commit Review

```bash
/review-typescript       # TypeScript quality
/simplify-code          # Simplification
/security-audit         # Security
/optimize-performance   # Performance
```

### API Development (OpenSpec)

```bash
/research-best-practices OpenAPI specification design
/review-architecture    # API spec review
/analyze-patterns       # Pattern consistency
/dhh-rails-review       # RESTful critique
```

### New Feature Development

```bash
/repo-research          # Understand patterns
/research-framework     # Framework guidance
# ...implement feature...
/review-typescript      # Code review
/review-architecture    # Architecture check
```

### Database Changes

```bash
/review-database        # Migration safety
/security-audit         # Security check
# ...deploy migration...
```

## 🔧 Customization

### Edit Agents

Global agents:
```bash
edit ~/.claude/commands/review-typescript.md
```

Project agents:
```bash
edit .claude/commands/review-typescript.md
```

### Create New Agents

```bash
touch .claude/commands/my-agent.md
```

Then add your agent configuration using markdown format.

## 🔄 Updates

### Update Global Agents

After editing an agent in this project:

```bash
# Copy to global
cp .claude/commands/review-typescript.md ~/.claude/commands/

# Now updated globally!
```

### Reinstall All

```bash
./install-global-agents.sh
```

## 🤝 Team Collaboration

### Share Installation

Team members can install using:

```bash
./install-global-agents.sh
```

### Version Control

Project-specific commands are version controlled:

```bash
git add .claude/commands/
git commit -m "Add Claude Code agents"
git push
```

## 📖 Learn More

### Agent Usage

```bash
# Read agent documentation
cat .claude/commands/review-typescript.md

# Use agent
/review-typescript

# Get help in BMAD agents
/analyst
*help
```

### Full Documentation

See [AGENTS.md](./AGENTS.md) for:
- Detailed agent descriptions
- Usage examples
- Workflow patterns
- Best practices
- Troubleshooting

## 🆘 Support

### Troubleshooting

**Agent not found?**
```bash
ls ~/.claude/commands/review-typescript.md
```

**Need to reinstall?**
```bash
./install-global-agents.sh
```

**Command not working?**
Check the agent documentation file for correct usage.

## 🎉 Summary

**Total Commands Available**: 30+
- 11 Claude Code marketplace agents (global)
- 10 BMAD framework agents
- 7 Speckit commands
- 2+ custom commands

**Plus 72+ other global commands** for comprehensive development support!

---

**Version**: 1.0.0
**Last Updated**: October 22, 2025
**Project**: Fleet Management V2 - B767 Pilot Management System
**Maintainer**: Maurice (Skycruzer)

**Status**: ✅ All systems operational
