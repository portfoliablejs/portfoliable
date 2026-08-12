// File: scripts/terminal-ui.mjs
// Purpose: Shared terminal UI helpers for boxed output, progress rails, and first-run interactive prompts.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

// MARK: STYLE TOKENS
export const ui = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

const ANSI_ESCAPE_PATTERN = /[\u001B\u009B][[\]()#;?]*(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~])/g;
const PROJECT_UI_MARKER = '.portfoliable-ui.json';

// MARK: WIDTH AND BOX RENDERING
// Removes ANSI escape sequences so visible width can be measured correctly.
export function stripAnsi(input) {
  return String(input).replace(ANSI_ESCAPE_PATTERN, '');
}

// Computes user-visible width while ignoring ANSI style codes.
export function visibleLength(input) {
  return Array.from(stripAnsi(input)).length;
}

// Right pads a string by visible width and preserves ANSI styling.
export function padVisible(input, targetWidth) {
  const text = String(input);
  const fill = Math.max(0, targetWidth - visibleLength(text));
  return text + ' '.repeat(fill);
}

// Builds a top or bottom border line for boxed terminal UI.
function border(width, left, right) {
  return `${left}${'─'.repeat(width - 2)}${right}`;
}

// Builds a full box from content lines and matching border width.
function buildBoxLines({ width, lines }) {
  return [
    border(width, '╭', '╮'),
    ...lines.map((line) => boxLine(line, width)),
    border(width, '╰', '╯')
  ];
}

// Returns one boxed content line with ANSI-safe padding.
export function boxLine(text = '', width = 72) {
  return `│ ${padVisible(text, width - 4)} │`;
}

// Prints a boxed block with consistent borders and line padding.
export function printBox({ width = 72, lines = [] }) {
  const block = buildBoxLines({ width, lines });
  for (const line of block) {
    console.log(line);
  }
}

// Prints a box attached to the right of the rail column.
export function printRailAttachedBox({ width = 72, lines = [] }) {
  const block = buildBoxLines({ width, lines });
  for (const line of block) {
    console.log(`${ui.dim}│${ui.reset} ${line}`);
  }
}

// Prints one or more empty rail lines.
export function printRailSpacer(lines = 1) {
  for (let i = 0; i < lines; i += 1) {
    console.log(railOnlyLine());
  }
}

// Returns a standalone rail line used as vertical spacing.
function railOnlyLine() {
  return `${ui.dim}│${ui.reset}`;
}

// Returns a content line visually attached to the rail column.
function railAttachedLine(content) {
  return `${ui.dim}│${ui.reset} ${content}`;
}

// MARK: TERMINAL PREFERENCES
// Prints a rail line segment used to emulate vertical progress connectors.
export function printRailSegment({ dot = false, label = '', color = ui.cyan } = {}) {
  if (dot) {
    console.log(`${color}●${ui.reset} ${label}`.trimEnd());
    return;
  }
  console.log(`${ui.dim}│${ui.reset}${label ? ` ${label}` : ''}`);
}

// Resolves marker path for project-level terminal UI preferences.
export function resolveUiMarkerPath(projectDir) {
  return path.resolve(projectDir, PROJECT_UI_MARKER);
}

// Reads project-level terminal UI preferences with safe defaults.
export function readProjectUiPreferences(projectDir) {
  const markerPath = resolveUiMarkerPath(projectDir);
  if (!fs.existsSync(markerPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
    if (typeof parsed?.fancyDots === 'boolean') {
      return parsed;
    }
  } catch {
    // Falls back to null so callers can recover with defaults.
  }

  return null;
}

// Persists project-level terminal UI preferences.
export function writeProjectUiPreferences(projectDir, fancyDots) {
  const markerPath = resolveUiMarkerPath(projectDir);
  const payload = {
    version: 1,
    fancyDots: Boolean(fancyDots),
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(markerPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

// Returns true only when stdin/stdout are interactive terminals.
export function isInteractiveTerminal() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

// Renders selectable yes/no dot prompt content with optional rail attachment.
function renderDotPrompt({ selected, question, width, yesLabel, noLabel, attachedToRail }) {
  const yesDot = selected === 0 ? `${ui.blue}●${ui.reset}` : '○';
  const noDot = selected === 1 ? `${ui.blue}●${ui.reset}` : '○';

  const rawLines = [
    `${ui.bold}${question}${ui.reset}`,
    `${ui.dim}Use Up/Down arrows and press Enter.${ui.reset}`,
    `${yesDot} ${yesLabel}`,
    `${noDot} ${noLabel}`
  ];

  const boxLines = buildBoxLines({ width, lines: rawLines });

  if (!attachedToRail) {
    return boxLines;
  }

  return boxLines.map((line) => railAttachedLine(line));
}

// Repaints an interactive prompt in place without stacking old frames.
function repaintPrompt(lines, renderedLineCount) {
  if (renderedLineCount > 0) {
    readline.moveCursor(process.stdout, 0, -renderedLineCount);
    for (let i = 0; i < renderedLineCount; i += 1) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      if (i < renderedLineCount - 1) {
        readline.moveCursor(process.stdout, 0, 1);
      }
    }
    readline.moveCursor(process.stdout, 0, -(renderedLineCount - 1));
  }

  for (let i = 0; i < lines.length; i += 1) {
    process.stdout.write(lines[i]);
    process.stdout.write('\n');
  }

  return lines.length;
}

// MARK: INTERACTIVE PROMPTS
// Shows an interactive yes/no prompt rendered with selectable dot options.
export async function promptYesNoDots({
  question,
  yesLabel = 'Yes',
  noLabel = 'No',
  defaultValue = true,
  width = 86,
  attachedToRail = true
} = {}) {
  if (!isInteractiveTerminal()) {
    return defaultValue;
  }

  let selected = defaultValue ? 0 : 1;
  let renderedLineCount = 0;

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve) => {
    // Renders current prompt frame whenever selection state changes.
    const render = () => {
      const lines = renderDotPrompt({
        selected,
        question,
        width,
        yesLabel,
        noLabel,
        attachedToRail
      });
      renderedLineCount = repaintPrompt(lines, renderedLineCount);
    };

    // Finalizes prompt, restores terminal state, and resolves selected value.
    const finish = (value) => {
      process.stdin.removeListener('keypress', onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      if (attachedToRail) {
        console.log(railOnlyLine());
      }
      resolve(value);
    };

    // Handles arrow navigation, confirmation, and escape/cancel shortcuts.
    const onKeypress = (_str, key = {}) => {
      if (key.name === 'up' || key.name === 'left') {
        selected = 0;
        render();
        return;
      }

      if (key.name === 'down' || key.name === 'right') {
        selected = 1;
        render();
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        finish(selected === 0);
        return;
      }

      if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        finish(defaultValue);
      }
    };

    process.stdin.on('keypress', onKeypress);
    render();
  });
}

// Shows a first-run yes/no prompt rendered with selectable dot options.
export async function promptFancyDotsPreference({ question = 'Enable decorative terminal lines and dots?', defaultValue = true, width = 86 } = {}) {
  return promptYesNoDots({
    question,
    yesLabel: 'Yes, keep the line-and-dot terminal style',
    noLabel: 'No, use simpler terminal output',
    defaultValue,
    width,
    attachedToRail: true
  });
}