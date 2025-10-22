# /research-framework

Research framework documentation and best practices.

## When to Use

Use this command when you need:
- Official documentation for Next.js, React, Supabase
- Best practices for specific framework features
- Version-specific constraints and patterns
- Implementation guidance from official sources
- Understanding new library features

## What It Does

Invokes the **framework-docs-researcher** agent which:
- Fetches official framework documentation
- Explores library source code
- Identifies version-specific constraints
- Gathers implementation patterns
- Synthesizes best practices
- Provides comprehensive guidance

## Usage

```bash
/research-framework {topic}
```

Examples:
```
/research-framework Next.js 15 server actions
/research-framework Supabase RLS policies
/research-framework React 19 use hook
/research-framework TypeScript 5.7 decorators
```

## Example Use Cases

**Next.js Questions:**
```
"Research Next.js 15 app router best practices"
"How to implement Server Actions in Next.js 15"
"Next.js 15 caching strategies"
```

**Supabase Questions:**
```
"Research Supabase real-time subscriptions"
"Best practices for Supabase RLS policies"
"Supabase Edge Functions implementation"
```

**React Questions:**
```
"React 19 server components patterns"
"Research React 19 new hooks"
"React performance optimization techniques"
```

## Benefits

- ✅ Always gets latest official documentation
- ✅ Version-specific information (Next.js 15, React 19)
- ✅ Best practices from framework maintainers
- ✅ Real implementation examples
- ✅ Avoids outdated Stack Overflow answers

---

**Agent**: framework-docs-researcher
**Frameworks**: Next.js 15 | React 19 | TypeScript 5.7 | Supabase
**Project**: Fleet Management V2
