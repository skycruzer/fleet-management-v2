# Task: Shard Document

**Task ID**: shard-doc
**Version**: 1.0.0
**Purpose**: Split large documents into manageable, focused sections

---

## Overview

This task takes a large document (typically a PRD or architecture doc) and splits it into multiple smaller, focused documents that are easier to work with and maintain.

---

## Inputs

- **document**: Path to document to shard (required)
- **destination**: Directory to save sharded documents (optional, defaults to `docs/shards/`)

---

## Process

### Step 1: Load Document
Read the specified document and parse its structure.

### Step 2: Analyze Document Structure
Identify major sections (typically H1 or H2 headings) that can be separated:
- Executive Summary
- Requirements sections
- Architecture sections
- Implementation sections
- etc.

### Step 3: Determine Sharding Strategy
Ask user or auto-determine:
- **By Section**: Each major section becomes a document
- **By Topic**: Group related sections into topical documents
- **By Phase**: Split by implementation phases
- **Custom**: User specifies split points

### Step 4: Create Shard Documents
For each shard:

1. **Create new document**
2. **Add metadata header**:
   - Original document reference
   - Shard number/name
   - Creation date
   - Relationship to other shards

3. **Copy relevant content**
4. **Add navigation links** to other shards
5. **Save to destination**

### Step 5: Create Index Document
Create `{document}-index.md` containing:
- Overview of original document
- Links to all shards
- Document map/structure
- How shards relate to each other

### Step 6: Summary
Display:
- Number of shards created
- List of shard file names
- Location of index document
- Suggested next steps

---

## Sharding Strategies

### Strategy 1: By Section (Default)
Each H1 section becomes a separate document.

**Example**: PRD with 15 sections → 15 shard documents

### Strategy 2: By Topic
Group related sections together.

**Example**:
- `requirements-shard.md` (Requirements + Acceptance Criteria)
- `architecture-shard.md` (Architecture + Technical Details)
- `implementation-shard.md` (Implementation Plan + Testing)

### Strategy 3: By Phase
Split by project phases.

**Example**:
- `phase-1-foundation.md`
- `phase-2-core-features.md`
- `phase-3-optimization.md`

---

## Output Structure

```
docs/shards/{document-name}/
├── index.md                    # Master index
├── 01-executive-summary.md     # Shard 1
├── 02-requirements.md          # Shard 2
├── 03-architecture.md          # Shard 3
├── 04-implementation.md        # Shard 4
└── 05-testing.md               # Shard 5
```

---

## Shard Document Template

```markdown
# {Shard Title}

**Part of**: [{Original Document}](../original-doc.md)
**Shard**: {n} of {total}
**Created**: {date}

---

## Navigation

- **Previous**: [Shard {n-1}]({n-1}-title.md)
- **Next**: [Shard {n+1}]({n+1}-title.md)
- **Index**: [Document Index](index.md)

---

{Shard Content}

---

*Shard {n} of {total} | [Back to Index](index.md)*
```

---

## Example Usage

```
*shard-doc docs/prd-large-feature.md docs/shards/large-feature/
```

Result:
- Creates `docs/shards/large-feature/` directory
- Splits PRD into logical sections
- Creates index document
- Adds navigation between shards

---

## Benefits

- **Easier to Work With**: Smaller files are easier to edit and review
- **Better Organization**: Each shard focuses on one topic
- **Parallel Work**: Multiple people can work on different shards
- **Version Control**: Smaller diffs, easier to track changes
- **Reusability**: Individual shards can be referenced independently

---

## Notes

- Preserves original document (doesn't delete it)
- Maintains cross-references between shards
- Generates index for easy navigation
- Supports markdown format only

---

*BMAD Method - Document Sharding Task*
