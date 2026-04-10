# /repo-research

Conduct thorough repository structure and pattern research.

## When to Use

Use this command for:

- ✅ Understanding new repositories
- ✅ Analyzing project structure
- ✅ Finding implementation patterns
- ✅ Reviewing contribution guidelines
- ✅ Checking for templates and conventions
- ✅ Examining GitHub issues for patterns

## What It Does

Invokes the **repo-research-analyst** agent which:

- Analyzes repository structure
- Examines documentation
- Reviews GitHub issues
- Checks contribution guidelines
- Searches for implementation patterns
- Identifies project conventions

## Usage

```bash
/repo-research
```

Optional: Target specific analysis

```
"Research API endpoint patterns in this repo"
"Find service layer implementation patterns"
"Analyze component structure conventions"
```

## Example

When starting on a new feature:

```
User: "Need to add new feature - what patterns should I follow?"
Assistant: "Researching repository patterns with /repo-research"
```

## What It Analyzes

**Repository Structure:**

- 📁 Directory organization
- 📁 File naming conventions
- 📁 Module organization
- 📁 Configuration patterns

**Documentation:**

- 📄 README files
- 📄 CONTRIBUTING guidelines
- 📄 Architecture docs (CLAUDE.md)
- 📄 API documentation

**Implementation Patterns:**

- 🔍 Service layer patterns
- 🔍 Component patterns
- 🔍 API route patterns
- 🔍 Database query patterns
- 🔍 Error handling patterns

**GitHub Integration:**

- 🐙 Issue templates
- 🐙 PR templates
- 🐙 Label conventions
- 🐙 Workflow patterns

## Perfect For

**New Feature Development:**

- Understanding existing patterns
- Following project conventions
- Maintaining consistency
- Avoiding anti-patterns

**Code Reviews:**

- Ensuring pattern compliance
- Validating consistency
- Checking conventions

**Documentation:**

- Creating consistent docs
- Following format standards
- Understanding project structure

## Critical for This Project

**Service Layer Analysis:**

- Pattern identification in `lib/services/`
- Service naming conventions
- Error handling patterns
- Data access patterns

**API Route Patterns:**

- Endpoint structure in `app/api/`
- Response format conventions
- Authentication patterns
- Validation patterns

**Component Organization:**

- Component structure in `components/`
- Naming conventions
- Props patterns
- Storybook story patterns

---

**Agent**: repo-research-analyst
**Focus**: Repository structure, patterns, conventions
**Project**: Fleet Management V2
**Perfect For**: Learning project conventions before implementing
