import { jsPDF } from 'jspdf'
import fs from 'fs'

// Read the BMAD guide content
const guideContent = `# BMAD Method - Complete Reference Guide

**Fleet Management V2 - B767 Pilot Management System**

---

## BMAD Method Overview

**BMAD (Business Modeling and Development)** - Comprehensive business analysis and product management framework for requirements gathering, PRD creation, and documentation.

---

## BMAD Agents

### Available Agents

Located in \`.bmad-core/agents/\`

#### 1. BMad Master 🧙
**Command**: \`/BMad:agents:bmad-master\`

**Role**: Master orchestrator, knowledge custodian, and workflow executor

**Commands**:
- \`*help\` - Show numbered menu
- \`*list-tasks\` - List all available tasks from task manifest
- \`*list-workflows\` - List all workflows from workflow manifest
- \`*party-mode\` - Group chat with all agents (brainstorming sessions)
- \`*exit\` - Exit with confirmation

**When to Use**: Task execution, workflow orchestration, multi-agent coordination

---

#### 2. Product Manager 📋
**Command**: \`/BMad:agents:pm\`

**Role**: Product strategy, PRD creation, feature prioritization, stakeholder communication

**Commands**:
1. \`*help\` - Show numbered list of commands
2. \`*correct-course\` - Execute course correction task for project alignment
3. \`*create-brownfield-epic\` - Create epic for existing brownfield project
4. \`*create-brownfield-prd\` - Create PRD for brownfield project enhancement
5. \`*create-brownfield-story\` - Create user story for brownfield project
6. \`*create-epic\` - Create epic for brownfield projects
7. \`*create-prd\` - Create Product Requirements Document (greenfield)
8. \`*create-story\` - Create user story from requirements
9. \`*doc-out\` - Output full document to current destination file
10. \`*shard-prd\` - Shard/split PRD into manageable sections
11. \`*yolo\` - Toggle Yolo Mode (fast execution)
12. \`*exit\` - Exit PM mode

**When to Use**: Creating PRDs, user stories, epics, product documentation

---

#### 3. Analyst 📊
**Command**: \`/BMad:agents:analyst\`

**Role**: Data analysis, requirements research, market research, competitive analysis

**When to Use**: Requirements elicitation, data analysis, research tasks

---

#### 4. UX Expert 🎨
**Command**: \`/BMad:agents:ux-expert\`

**Role**: User experience design, usability analysis, interface design, user flow optimization

**When to Use**: UX design, user flow mapping, usability improvements

---

## BMAD Workflows

### Workflow Files

Located in \`.bmad-core/workflows/\`

#### 1. Brainstorming Workflow
**File**: \`workflows/brainstorming/workflow.yaml\`

**Purpose**: Facilitate interactive brainstorming sessions using diverse creative techniques

**Components**:
- \`instructions.md\` - Workflow instructions
- \`template.md\` - Output template
- \`brain-methods.csv\` - Brainstorming techniques database
- \`checklist.md\` - Validation checklist

**Output**: \`{output_folder}/brainstorming-session-results-{date}.md\`

**Features**:
- Multiple brainstorming techniques
- Advanced elicitation methods
- Interactive AI facilitation

**How to Activate**:
/BMad:agents:bmad-master
*party-mode

---

#### 2. Party Mode Workflow
**File**: \`workflows/party-mode/workflow.yaml\`

**Purpose**: Group chat with all BMAD agents for multi-perspective analysis

**Use Case**: Complex problems requiring multiple expert perspectives

**How to Activate**:
/BMad:agents:bmad-master
*party-mode

---

## BMAD Tasks

Located in \`.bmad-core/tasks/\`

### Core Tasks

1. **brownfield-create-epic.md**
   - Create epic for existing brownfield projects
   - Used by: PM agent (\`*create-brownfield-epic\`)

2. **brownfield-create-story.md**
   - Create user story for brownfield projects
   - Used by: PM agent (\`*create-brownfield-story\`)

3. **create-doc.md**
   - Generic document creation with template support
   - Used by: PM agent (\`*create-prd\`, \`*create-brownfield-prd\`)

4. **execute-checklist.md**
   - Run quality checklists
   - Used by: All agents for validation

5. **shard-doc.md**
   - Split large documents into manageable sections
   - Used by: PM agent (\`*shard-prd\`)

6. **correct-course.md**
   - Project alignment and course correction
   - Used by: PM agent (\`*correct-course\`)

7. **apply-qa-fixes.md**
   - Apply QA corrections to documents

8. **validate-next-story.md**
   - Story validation against standards

---

## BMAD Templates

Located in \`.bmad-core/templates/\`

### Document Templates

1. **prd-tmpl.yaml**
   - Product Requirements Document (Greenfield)
   - For new products/features from scratch
   - Used by: \`*create-prd\`

2. **brownfield-prd-tmpl.yaml**
   - Product Requirements Document (Brownfield)
   - For existing systems and enhancements
   - Used by: \`*create-brownfield-prd\`

3. **story-tmpl.yaml**
   - User Story Template
   - Standard user story format
   - Used by: \`*create-story\`, \`*create-brownfield-story\`

---

## BMAD Checklists

Located in \`.bmad-core/checklists/\`

### Quality Checklists

1. **pm-checklist.md**
   - Product management quality checklist
   - Validates PRDs and product docs

2. **change-checklist.md**
   - Change management checklist
   - For architectural/system changes

3. **story-dod-checklist.md**
   - Story Definition of Done
   - Acceptance criteria validation

4. **story-draft-checklist.md**
   - Story draft validation
   - Pre-refinement checks

---

## BMAD Data Files

Located in \`.bmad-core/data/\`

1. **technical-preferences.md**
   - Technical standards and preferences
   - Technology stack guidelines

2. **brainstorming-techniques.md**
   - Brainstorming method reference

3. **elicitation-methods.md**
   - Requirements elicitation techniques

4. **test-levels-framework.md**
   - Testing strategy framework

5. **test-priorities-matrix.md**
   - Test prioritization guide

6. **bmad-kb.md**
   - BMAD knowledge base

---

## BMAD Workflow Order

### Standard BMAD Workflow

#### Phase 1: Requirements Gathering
# Option A: Use Analyst for research
/BMad:agents:analyst
# Gather requirements, conduct research

# Option B: Use PM for direct story creation
/BMad:agents:pm
*create-brownfield-story

#### Phase 2: Documentation
# Activate PM Agent
/BMad:agents:pm

# For existing systems (brownfield)
*create-brownfield-prd

# For new products (greenfield)
*create-prd

# For epics
*create-brownfield-epic

#### Phase 3: Refinement
# Still in PM mode

# Split large PRDs
*shard-prd

# Correct course if needed
*correct-course

# Output final document
*doc-out

#### Phase 4: UX Design (if needed)
# Activate UX Expert
/BMad:agents:ux-expert
# Create user flows, wireframes, UX specs

#### Phase 5: Multi-Agent Review (complex features)
# Activate BMad Master
/BMad:agents:bmad-master

# Start party mode (all agents collaborate)
*party-mode

---

## Common BMAD Workflows

### Workflow 1: Create User Story for Existing System
1. /BMad:agents:pm
2. *create-brownfield-story
3. Follow interactive prompts
4. Story saved to docs/stories/

### Workflow 2: Create Comprehensive PRD
1. /BMad:agents:pm
2. *create-brownfield-prd
3. Follow template sections
4. PRD saved to docs/

### Workflow 3: Brainstorm New Feature
1. /BMad:agents:bmad-master
2. *party-mode
3. Collaborative brainstorming session
4. Results saved to docs/brainstorming-session-results-{date}.md

### Workflow 4: Split Large PRD
1. /BMad:agents:pm
2. *shard-prd
3. Provide PRD path
4. Sharded sections created

### Workflow 5: Create Epic with Stories
1. /BMad:agents:pm
2. *create-brownfield-epic
3. Epic saved to docs/
4. *create-brownfield-story (repeat for each story)

---

## PM Agent Command Reference

### Command Usage Pattern

# 1. Activate agent
/BMad:agents:pm

# 2. Agent greets and shows help automatically
# John displays numbered menu (1-12)

# 3. Use commands in two ways:

# Option A: Type number
3  # Executes command #3 (create-brownfield-prd)

# Option B: Type command with asterisk
*create-brownfield-prd

---

## All PM Commands

| # | Command | Purpose | Output |
|---|---------|---------|--------|
| 1 | *help | Show command list | Terminal |
| 2 | *correct-course | Project alignment | docs/ |
| 3 | *create-brownfield-epic | Create epic (existing system) | docs/ |
| 4 | *create-brownfield-prd | Create PRD (existing system) | docs/ |
| 5 | *create-brownfield-story | Create story (existing system) | docs/stories/ |
| 6 | *create-epic | Create epic | docs/ |
| 7 | *create-prd | Create PRD (greenfield) | docs/ |
| 8 | *create-story | Create user story | docs/stories/ |
| 9 | *doc-out | Output document to file | Specified path |
| 10 | *shard-prd | Split PRD into sections | docs/shards/ |
| 11 | *yolo | Toggle fast mode | N/A |
| 12 | *exit | Exit PM mode | N/A |

---

## BMAD Quick Reference Card

### Quick Start

# Activate PM
/BMad:agents:pm

# Most Common Commands
*create-brownfield-story    # User story for existing system
*create-brownfield-prd      # PRD for existing system
*shard-prd                  # Split large PRD

# Multi-Agent
/BMad:agents:bmad-master
*party-mode                 # All agents collaborate

### When to Use BMAD

✓ Use BMAD for:
- Creating Product Requirements Documents
- Writing user stories and epics
- Requirements gathering
- Brownfield (existing system) documentation
- Multi-agent brainstorming sessions

✗ Don't use BMAD for:
- Code implementation (use SpecKit)
- Code review (use Compounding Engineering)
- Technical architecture (use OpenSpec)

---

**Generated by**: John (PM Agent)
**For**: Maurice
**Project**: Fleet Management V2
**Date**: October 24, 2025
`

// Create PDF
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
})

// Set font
doc.setFont('helvetica')

// Title page
doc.setFontSize(24)
doc.text('BMAD Method', 105, 40, { align: 'center' })

doc.setFontSize(18)
doc.text('Complete Reference Guide', 105, 55, { align: 'center' })

doc.setFontSize(12)
doc.text('Fleet Management V2', 105, 70, { align: 'center' })
doc.text('B767 Pilot Management System', 105, 80, { align: 'center' })

doc.setFontSize(10)
doc.text('Generated: October 24, 2025', 105, 100, { align: 'center' })
doc.text('Generated by: John (PM Agent)', 105, 107, { align: 'center' })
doc.text('For: Maurice', 105, 114, { align: 'center' })

// Footer
doc.setFontSize(8)
doc.text('Fleet Management V2 - BMAD Method Reference', 105, 280, { align: 'center' })

// Parse content into sections
const lines = guideContent.split('\n')
let currentY = 20
let pageNum = 1

// Add new page for content
doc.addPage()

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  // Check if we need a new page
  if (currentY > 270) {
    doc.addPage()
    currentY = 20
    pageNum++

    // Add page number
    doc.setFontSize(8)
    doc.text(`Page ${pageNum}`, 200, 287, { align: 'right' })
  }

  // Handle different markdown elements
  if (line.startsWith('# ')) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(line.substring(2), 15, currentY)
    currentY += 12
  } else if (line.startsWith('## ')) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(line.substring(3), 15, currentY)
    currentY += 10
  } else if (line.startsWith('### ')) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(line.substring(4), 15, currentY)
    currentY += 8
  } else if (line.startsWith('#### ')) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(line.substring(5), 15, currentY)
    currentY += 7
  } else if (line.startsWith('---')) {
    doc.setLineWidth(0.5)
    doc.line(15, currentY, 195, currentY)
    currentY += 5
  } else if (line.startsWith('- ') || line.startsWith('* ')) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const bulletText = line.substring(2)
    const wrappedText = doc.splitTextToSize(bulletText, 175)
    doc.text('•', 15, currentY)
    doc.text(wrappedText, 20, currentY)
    currentY += wrappedText.length * 5
  } else if (line.trim().match(/^\d+\./)) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const wrappedText = doc.splitTextToSize(line, 175)
    doc.text(wrappedText, 15, currentY)
    currentY += wrappedText.length * 5
  } else if (line.startsWith('**') && line.endsWith('**')) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(line.replace(/\*\*/g, ''), 15, currentY)
    currentY += 6
  } else if (line.trim() !== '') {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const cleanLine = line.replace(/\*\*/g, '').replace(/`/g, '')
    const wrappedText = doc.splitTextToSize(cleanLine, 180)
    doc.text(wrappedText, 15, currentY)
    currentY += wrappedText.length * 5
  } else {
    currentY += 4
  }
}

// Save PDF
const outputPath =
  '/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/BMAD-METHOD-GUIDE.pdf'
doc.save(outputPath)

console.log('PDF created successfully at:', outputPath)
console.log('Opening with Adobe Acrobat...')
