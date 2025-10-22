# Slash Commands Setup

## Active Commands

### Main Commands
- `/build` - Quick development workflow (Analyze → Plan → Implement)
- `/apa` - (Custom workflow)

### BMad Commands (in BMad/ subdirectory)
Business analysis and documentation commands:
- Various task-specific commands for requirements engineering
- Located in `.claude/commands/BMad/tasks/`

## Usage

### Using /build

```bash
# Development workflow
/build
```

### Using /apa

```bash
# Custom workflow
/apa
```

## How Slash Commands Work

1. **File Location:** `.claude/commands/<name>.md`
2. **Command Name:** Filename becomes command (e.g., `build.md` → `/build`)
3. **Format:** Markdown file with frontmatter
4. **Arguments:** User input available as `$ARGUMENTS`

## File Structure

```
.claude/commands/
├── build.md            ← Development workflow
├── apa.md              ← Custom workflow
└── BMad/               ← Business analysis commands
    └── tasks/
```

## Notes

- **Reload Required:** Claude Code may need to restart to pick up new slash commands
