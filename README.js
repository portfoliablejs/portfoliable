# Interactive AI-Powered Portfolio 🤖

A high-performance, responsive portfolio featuring a secure, server-side AI proxy integrated with Google Gemini. This architecture allows users to chat directly with my project history, UX case studies, and engineering metrics in real-time without exposing sensitive API credentials.

## 🚀 Key Features
- **Gemini AI Proxy:** Interactive chat agent tailored to mirror my professional persona and instantly parse deep project metrics.
- **Server-Side Architecture:** Built with a secure PHP backend bridge to safely handle API requests and protect keys.
- **Privacy & Security:** Implemented strict directory privacy controls to prevent public indexing and direct configuration access.
- **Performance First:** Optimized for near-instantaneous loading speeds and clean asset delivery.

## 🛠️ Tech Stack
- **Frontend:** Semantic HTML5, CSS3, JavaScript (ES6+)
- **Backend:** PHP (Server-side API bridge)
- **AI Engine:** Google Gemini 3.5 Flash API
- **Build Tools:** esbuild (Zero-config JS bundler)

## 🏗️ Development & Build Architecture
To ensure lightning-fast load times for recruiters while keeping the developer experience clean, case study data is managed modularly and compiled into a single static payload.

**Authoring Environment:** Individual case studies are authored as isolated ES Modules inside the `scripts/src/cases/` directory. 

**Compilation:**
To add or update a case study, edit the respective file in `src/` and run the build script. This aggregates all modules into the single, production-ready `scripts/data.js` file.

```bash
# Ensure local esbuild dependencies are locked
npm install esbuild --save-dev

# Option 1: Run the build shortcut defined in package.json
npm run build

# Option 2: Run esbuild directly via npx from local project dependencies
npx esbuild scripts/src/data.js --bundle --outfile=scripts/data.js --charset=utf8
```

## Automated Version Release Workflow

### Step 1: Automated Version Bumping & Tagging
Instead of opening `package.json` to edit strings manually, run a single versioning command in the VS Code Integrated Terminal. This updates your configuration JSON file and generates your local Git release tag simultaneously. These examples follow a hypothetical release from v2.0.2.

Choose **one** of the options below depending on how you prefer your tags generated:

#### Option A: Major Update (Not recommended)
Run the following command in your VS Code Integrated Terminal (``Ctrl+`` or ``Cmd+``). This command modifies package.json to "version": "3.0.0" and mints a local Git release tag named v3.0.0 simultaneously:
```bash
npm version major -m "breaking: release major framework version %s"
```
#### Commit Prefix Conventions & Usage
- **breaking: / feat!: / fix!**: (Breaking Changes): Used when core logic paths are entirely altered or removed, rendering previous iterations incompatible. A common practice is appending an exclamation mark ! to the standard prefix to alert developers of the breaking interface mutation.
    - Example: ``breaking: drop legacy sequential loader pipeline layout``
    - Example: ``feat!: rewrite core routing architecture to utilize isolated modules``

#### Option B: Minor Update (Recommended)
This flags the architecture change as a minor feature addition, programmatically rewriting `package.json` from ``version: 2.0.2`` to `"version": "2.1.0"` and automatically writing a git tag named `v2.1.0` behind the scenes:
```bash
npm version minor -m "chore: bump version to %s and isolate domain modules"
```

##### Commit Prefix Conventions & Usage
- **feat: (Feature)**: Used when adding a completely new functional capability or structural expansion that doesn't break existing behavior. 
    - Example: ``feat: split monolithic engine into decoupled domain sub-modules``
- **chore: (Maintenance)**: Used for everyday build changes, updating documentation files, restructuring internal folders, or adjusting project configurations without adding user-facing code. 
    - Example: ``chore: restructure build manifest directories``

#### Option C: Simple Patch Automation
If you ever want to run a quick maintenance bugfix version release (e.g., jumping from 2.1.0 to 2.1.1) without touching the files yourself:
```bash
npm version patch -m "fix: patch release %s"
```
#### Commit Prefix Conventions & Usage
- **fix: (Bug Fix)**: Used for standard patches that repair a broken runtime asset, structural error, layout visual regression, or programmatic code exception. 
    - Example: ``fix: resolve runtime TypeError in contextual paragraph menu``
- **docs: (Documentation Only)**: Used when modifying only markdown guides, readmes, text explanations, or code comment tags with zero structural logic impact.
    - Example: ``docs: correct markdown spacing parameters inside asset guide``
- **style: (Formatting adjustments)**: Used strictly for adjustments that don't alter logic execution flow (missing semicolons, white-space cleanup, code indentation).
    - Example: ``style: enforce layout indentation normalization across scripts``

### Step 2: Stage and Commit the Code Modifications
Use the Source Control panel (Ctrl+Shift+G) or your terminal to stage and record the script architecture split. Note: ``git add .`` means you are staging every single saved change across your entire project directory at once.

```bash
# 1. Stage all your saved architectural modifications and new files
git add .

# 2. Commit the modular script changes to clear your working directory
git commit -m "feat: deconstruct script monolith into modular domain extensions"

# 3. Now run your automatic minor update (it will work perfectly now!)
npm version minor -m "chore: bump version to %s and isolate domain modules"
```

### Step 3: Synchronize and Push Tags with Remote Server
To finalize the release, push your commits and synchronize your newly minted version tag to your upstream repository.
```bash
# Pull down upstream updates to guarantee a clean merge path
git pull origin main

# Push the modular script commits to the main operational timeline
git push origin main

# Explicitly push the automated version tag to the server
git push origin --tags
```