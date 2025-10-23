# APA - Analyze, Plan, Apply

**Shortcut for the complete development workflow**

## What This Does

This command runs the full development workflow in one go:
1. **Analyze** - Review the codebase comprehensively
2. **Plan** - Create detailed implementation plan
3. **Apply** - Implement the changes with quality gates

## Instructions for Claude

When this command is invoked with a task description, follow this workflow:

### 1. ANALYZE THE CODEBASE (Required)
- Use the Task tool with subagent_type=Explore to understand the codebase structure
- Identify all relevant files, components, and dependencies
- Create a mental model of how the system works
- Document key findings and existing patterns

### 2. CREATE DETAILED PLAN (Required)
- Design the complete solution architecture
- Plan database schema changes if needed
- Identify all files that need to be created or modified
- Consider edge cases and potential issues
- Break down into logical steps
- Use TodoWrite to create a task list

### 3. IMPLEMENT WITH QUALITY GATES (Required)
- Implement the plan step by step
- Follow existing code patterns and conventions
- Write clean, maintainable code
- Test thoroughly after implementation
- Run code quality checks before completion
- Update documentation as needed

## Usage

```
/apa <description of what to build>
```

## Examples

```
/apa Add user authentication with Supabase
/apa Create a fleet management dashboard
/apa Fix the vehicle assignment bug
/apa Optimize the database queries for better performance
```

## Quality Standards

- Always analyze before planning
- Always plan before implementing
- Test thoroughly after implementation
- Follow the project's existing patterns
- Maintain high code quality standards
- Document all changes

---

**Remember**: This is the mandated workflow per CLAUDE.md global standards. No shortcuts, no exceptions.
