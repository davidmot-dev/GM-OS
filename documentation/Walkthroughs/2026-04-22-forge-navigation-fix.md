# Walkthrough - Forge Navigation Fix (2026-04-22)

I have fixed the navigation bug in the Forge of Rules where returning to the subjects list resulted in an empty or incorrect display.

## Changes Made

### Store Logic (`useBrainstormStore.ts`)
- **Decoupled Step Transition**: Removed the hardcoded `step: 'listing'` from `setCandidates`. This allows the store to update candidates without forcing a view change, enabling smoother transitions between "Discovery" (subjects) and "Listing" (rules).
- **Refined `setSubject`**: Ensures that setting a subject correctly prepares the state for the rule listing phase.

### UI Logic (`BrainstormOverlay.tsx`)
- **Fix "Back to Subjects"**: Updated the button to call `startDiscovery()`. This properly resets the state (clearing previous rules) and triggers a fresh discovery of subjects from the notebook.
- **Fix Loading State**: Removed a redundant `setSubject` call inside `handleSubjectForge` that was overriding the `isProcessing` state, ensuring the loading spinner is visible while rules are being generated.

## Verification Results
- **Seamless Back-and-Forth**: Clicking "Back to Subjects" now correctly re-displays the initial subjects.
- **Dynamic Loading**: Selecting a new subject now correctly triggers the "Igniting the Forge" loading state and displays the correct rules for that subject.
