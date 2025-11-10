# BMad CORE + BMad Method Skill

This skill provides access to the BMad framework for human-AI collaboration and agile development.

## What is BMad?

BMad CORE (Collaboration Optimized Reflection Engine) amplifies human potential through specialized AI agents. It guides reflective workflows that bring out your best ideas and AI's full capabilities.

## Installed Modules

### 1. BMad CORE
- **BMad Master Agent**: Orchestrates other agents and workflows
- Foundation framework for all BMad modules

### 2. BMad Method (BMM)
- **12 Specialized Agents**: PM, Analyst, Architect, Scrum Master, Developer, Test Architect, UX Designer, Technical Writer, Game Designer, Game Developer, Game Architect, BMad Master
- **34 Workflows**: Across 4 phases (Analysis, Planning, Solutioning, Implementation)
- **3 Planning Tracks**: Quick Flow (bugs/small features), BMad Method (products/platforms), Enterprise (compliance/security)

### 3. BMad Builder (BMB)
- **1 Agent**: BMad Builder
- **7 Workflows**: Create agents, workflows, modules
- Build custom solutions for any domain

### 4. Creative Intelligence Suite (CIS)
- **5 Agents**: Brainstorming Coach, Design Thinking Coach, Creative Problem Solver, Innovation Strategist, Storyteller
- **5 Workflows**: Proven creative methodologies

## Quick Start

### For New Projects
1. Say: "Initialize BMad for a new project"
2. BMad Master will guide you through workflow-init
3. Choose appropriate planning track based on your goals

### For Bug Fixes / Small Features
1. Say: "I need to fix a bug" or "Add a small feature"
2. Use Quick Flow track with quick-spec workflow
3. Implement with dev-story workflow

### For Full Products / Platforms
1. Say: "I want to build a new product"
2. Use BMad Method track:
   - Phase 2: Create PRD (Product Requirements Document)
   - Phase 3: Design Architecture
   - Phase 4: Create Stories → Implement iteratively

### For Brainstorming
1. Say: "Help me brainstorm ideas"
2. Load Brainstorming Coach from CIS
3. Run brainstorming workflow with 30+ techniques

## File Structure

```
bmad/
├── core/        # BMad CORE + BMad Master
├── bmm/         # BMad Method (development)
├── bmb/         # BMad Builder (custom solutions)
├── cis/         # Creative Intelligence Suite
├── _cfg/        # Your customizations
└── docs/        # Documentation
```

## Key Principles

1. **Human Amplification** - Augments thinking, doesn't replace it
2. **Reflection-Driven** - Strategic questions unlock solutions
3. **Scale-Adaptive** - Adjusts to project size automatically
4. **Agent-Powered** - Specialized AI personas
5. **Workflow-Guided** - Battle-tested processes

## How to Use This Skill

Simply activate the skill and Claude will have access to all BMad agents, workflows, and documentation. Claude will:

- Understand BMad concepts and terminology
- Load appropriate agents for your tasks
- Execute workflows step-by-step
- Guide you through the BMad Method
- Help you choose the right planning track

## Documentation

- **BMad Docs**: `bmad/docs/`
- **BMad Method Docs**: `bmad/bmm/docs/`
- **Quick Start Guide**: `bmad/bmm/docs/quick-start.md`
- **Workflow Guides**: `bmad/bmm/docs/workflows/`
- **Agent Guides**: `bmad/bmm/docs/agents/`

## Need Help?

Just ask Claude:
- "How does BMad Method work?"
- "What planning track should I use?"
- "Show me available workflows"
- "Load the PM agent"
- "Run the PRD workflow"

Claude will guide you through the BMad framework!

## Version

BMad Method v6.0.0-alpha.7 (Alpha Release)

Documentation is being refined. Subscribe to [BMadCode YouTube](https://youtube.com/@bmadcode) for updates!

## License

MIT License
