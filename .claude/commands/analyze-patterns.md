# /analyze-patterns

Analyze code for design patterns, anti-patterns, and consistency.

## When to Use

Use this command for:

- ✅ Design pattern identification
- ✅ Anti-pattern detection
- ✅ Code smell identification
- ✅ Naming convention analysis
- ✅ Code duplication detection
- ✅ Architectural pattern review

## What It Does

Invokes the **pattern-recognition-specialist** agent which:

- Identifies design patterns
- Detects anti-patterns
- Analyzes naming conventions
- Finds code duplication
- Ensures consistency
- Reviews architectural patterns

## Usage

```bash
/analyze-patterns
```

Optional: Target specific analysis

```
"Analyze patterns in service layer"
"Check for anti-patterns in API routes"
"Find code duplication in components"
"Review naming conventions"
```

## Example

After codebase changes:

```
User: "Added multiple API endpoints - check for consistency"
Assistant: "Analyzing patterns with /analyze-patterns"
```

## What It Identifies

**Design Patterns:**

- ✅ Factory Pattern
- ✅ Repository Pattern
- ✅ Service Layer Pattern
- ✅ Singleton Pattern
- ✅ Observer Pattern
- ✅ Strategy Pattern

**Anti-Patterns:**

- ❌ God Objects
- ❌ Spaghetti Code
- ❌ Copy-Paste Programming
- ❌ Magic Numbers/Strings
- ❌ Premature Optimization
- ❌ Tight Coupling

**Code Smells:**

- 🔍 Long Methods
- 🔍 Large Classes
- 🔍 Duplicated Code
- 🔍 Inconsistent Naming
- 🔍 Dead Code
- 🔍 Speculative Generality

## Critical for This Project

**Service Layer Pattern:**

- ✅ Validates service layer implementation
- ✅ Ensures consistent service patterns
- ✅ Identifies service anti-patterns

**API Patterns:**

- ✅ RESTful endpoint consistency
- ✅ Response format patterns
- ✅ Error handling patterns
- ✅ Validation patterns

**Component Patterns:**

- ✅ React component patterns
- ✅ Server vs Client component usage
- ✅ Props patterns
- ✅ State management patterns

**OpenSpec Compliance:**

- ✅ API specification patterns
- ✅ Endpoint naming conventions
- ✅ Request/response patterns

---

**Agent**: pattern-recognition-specialist
**Focus**: Patterns, Anti-Patterns, Consistency
**Project**: Fleet Management V2 (Service-Layer Architecture)
**Works With**: Code patterns, API patterns, Specifications
