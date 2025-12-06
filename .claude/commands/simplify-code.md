# /simplify-code

Review code for simplification and minimalism opportunities.

## When to Use

Use this command:

- After completing feature implementation
- Before finalizing code changes
- When code feels overly complex
- To apply YAGNI principles
- For final review pass before commit

## What It Does

Invokes the **code-simplicity-reviewer** agent which:

- Identifies opportunities for simplification
- Removes unnecessary complexity
- Applies YAGNI (You Aren't Gonna Need It) principles
- Suggests more straightforward approaches
- Eliminates over-engineering
- Improves code maintainability

## Usage

```bash
/simplify-code
```

Optional: Target specific code

```
"Simplify the leave eligibility logic"
"Review certification service for complexity"
"Check if this component can be simpler"
```

## Example

After implementing complex logic:

```
You: "Implemented multi-step validation - feels complex"
Assistant: "Analyzing for simplification with /simplify-code"
```

## Philosophy

**Simple is better than complex. Complex is better than complicated.**

This agent helps ensure:

- ✅ Code is as simple as possible (but no simpler)
- ✅ No premature optimization
- ✅ No unnecessary abstractions
- ✅ Clear, readable implementation
- ✅ YAGNI compliance

---

**Agent**: code-simplicity-reviewer
**Focus**: Simplicity & Minimalism
**Project**: Fleet Management V2
