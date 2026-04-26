# System Forge Implementation Task List

## Phase 1: Foundation & Schema [x]
- [x] Define `GameDriver` and `CharacterSheetTemplate` interfaces in `src/types/drivers.ts`
- [x] Create basic directory structure for `src/modules/forge`
- [x] Register forge-related IPC handlers in Main process (if needed for file saving)

## Phase 2: AI Foundry Engine [x]
- [x] Redesign Dashboard Forge v2 (Stitch approach)
- [x] Correction Authentification AI (Proxy + Headers)
- [x] Sélection Dynamique du Modèle (Pro/Flash)
- [x] Bouton Navigation "Return to Cockpit" (Header central)
- [x] Integrate Game Driver bridge to Session OS
- [x] Create Game Sheets Dashboard (Templates)
- [x] Fix AI Timeout for heavy PDF analysis (increased to 120s)
- [x] Enhance System Forge with User Instructions
    - [x] Update `ForgeService.ts` to accept instructions
    - [x] Update `ForgeDashboard.tsx` UI
- [x] Expand System Forge Capabilities
    - [x] Add support for Markdown (.md) file analysis
    - [x] Implement local system explorer (scanning `docs/systems`)
    - [x] Link local files to Forge analysis
- [x] Refine Character Sheet View & AI Integration
    - [x] Update store with `template-editor` view and `editingTemplateId`
    - [x] Add "Edit" button to `TemplateDashboard.tsx`
    - [x] Create `SheetTemplateEditor.tsx` with full-window layout
    - [x] Implement Back button and restore AI Persona / Gems customization
    - [x] Update `SessionDashboard.tsx` router
- [x] Integrate Game Drivers (Rulebooks) into the Library UI
    - [x] Update `CampaignForm.tsx` to include Drivers in system selection
    - [x] Add "Règles / Drivers" tab to `TemplateDashboard.tsx`
    - [x] Update `TemplateDashboard` to display Game Drivers
    - [x] Selector `getActiveDriver` dans `useSessionOSStore`
    - [x] `DiceEngine.rollFromConfig` pour l'automatisation
    - [x] Mode "Système" dans le `DiceBoard`
    - [x] Affichage des infos Driver dans `CampaignDetails`

## Phase 3: Forge UI [x]
- [x] Create `ForgeModal.tsx` for PDF/Image upload (Implemented as ForgeDashboard)
- [x] Implement "Analysis Preview" where user can review and edit the generated schema
- [x] Add "Publish" action to save the new System Driver to the application state/store

## Phase 5: Stitch-Based UI Redesign [x]
- [x] Retrieve premium 'System Forge' design from Stitch project
- [x] Refactor `ForgeDashboard.tsx` to match the Stitch design (Glassmorphism, Neon Blue/Violet theme)
- [x] Implement the 'Chamber of Extraction' ritual scanner UI
- [x] Add dynamic energy flow animations for 'Forge Progress'
- [x] Integrate 'Aetheric Mapping' for stat linking
- [x] Enrich Rule Engine & AI
    - [x] Implement AI Personas & NotebookLM in Driver types
    - [x] Create Rule Engine Editor (full-window)
    - [x] Allow "Shadow Drivers" for built-in systems to enable AI customization
    - [x] Refactor Sheet Template Editor to source AI logic from Drivers
    - [x] Verify integration with Forge logic
    - [x] Technical documentation (Brain vs Body architecture)
