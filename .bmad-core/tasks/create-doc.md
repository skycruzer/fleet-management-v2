# Task: Create Document

**Task ID**: create-doc
**Version**: 1.0.0
**Purpose**: Create structured documents from BMAD templates

---

## Overview

This task creates documents using BMAD templates. It prompts for necessary information and generates a complete document based on the selected template.

---

## Inputs

- **template**: Template file name from `.bmad-core/templates/` (required)
- **output_path**: Where to save the document (optional, defaults to `docs/`)

---

## Process

### Step 1: Load Template
Load the specified template from `.bmad-core/templates/{template}`

### Step 2: Extract Template Metadata
Read the YAML frontmatter to understand:
- template_name
- template_version
- template_type
- description
- output_format

### Step 3: Gather Required Information
Prompt user for placeholders found in template:
- {project_name}
- {feature_name}
- {author}
- {date}
- {story_id}
- {epic_name}
- etc.

Use project config (`.bmad-core/core-config.yaml`) for defaults where available.

### Step 4: Generate Document
Replace all placeholders with provided values.

### Step 5: Interactive Completion
Present the document structure and guide user through completing each section:

1. Show section heading
2. Show section description/purpose
3. Prompt user for content
4. Fill in section
5. Move to next section

### Step 6: Save Document
Save completed document to:
- Default: `{output_folder}/{template_type}-{feature_name}-{date}.md`
- Custom: User-specified path

### Step 7: Confirm Completion
Display summary:
- Document path
- Document type
- Sections completed
- Next steps

---

## Output

- Completed markdown document saved to specified location
- Summary of document creation

---

## Example Usage

```
*create-doc brownfield-prd-tmpl.yaml
```

User is prompted for:
1. Feature name
2. Author (defaults from config)
3. Section content (guided through each section)

Output: `docs/prd-feature-name-2025-10-24.md`

---

## Notes

- Uses config from `.bmad-core/core-config.yaml` for defaults
- Supports all templates in `.bmad-core/templates/`
- Output format determined by template
- Interactive mode for section completion

---

*BMAD Method - Document Creation Task*
