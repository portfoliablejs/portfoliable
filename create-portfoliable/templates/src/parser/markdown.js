// File: create-portfoliable/templates/src/parser/markdown.js
// Purpose: Parse template markdown cases into normalized case data.
// Author: Lio Schimanko
// Note: Auto-synced from src/parser/markdown.js. Edit the canonical source only.

// === INLINE MARKDOWN RENDERING ===
// Converts limited inline markdown patterns to sanitized HTML fragments.
function stripInlineMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

// === VALIDATION RULES ===
// Lists required scalar frontmatter fields that every case must define.
const REQUIRED_SCALAR_FIELDS = ['id', 'slug', 'thumbCategory', 'thumbBrand', 'thumbModel', 'thumbColor'];
// Lists required localized fields that must include both EN and PT values.
const REQUIRED_LOCALIZED_FIELDS = ['title', 'shortDesc', 'readTime', 'year', 'thumbSrc'];

// Convert the supported markdown subset into HTML for case bodies.
// Converts the supported markdown subset into HTML for case body rendering.
function markdownToHtml(markdown) {
  // Splits markdown into lines for sequential parser handling.
  const lines = markdown.split(/\r?\n/);
  // Accumulates output HTML fragments.
  const html = [];
  // Tracks whether parser is currently inside a bullet-list block.
  let inList = false;

  // Closes an open list block when switching to a non-list context.
  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    // Trims whitespace for simplified prefix checks.
    // Resolves current normalized line content.
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3>${stripInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${stripInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1>${stripInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${stripInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p class="p1">${stripInlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join('\n');
}

// Parse dotted frontmatter keys into nested objects.
// Parses YAML-like frontmatter using dotted keys to build nested objects.
function parseFrontmatter(frontmatterText) {
  // Initializes parsed metadata object.
  const output = {};
  // Splits frontmatter into processing lines.
  const lines = frontmatterText.split(/\r?\n/);

  for (const rawLine of lines) {
    // Trims current frontmatter line for key/value parsing.
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Finds first key/value separator position.
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;

    // Extracts and trims frontmatter key.
    const key = line.slice(0, separatorIndex).trim();
    // Extracts and trims raw value segment.
    const value = line.slice(separatorIndex + 1).trim();

    if (!key) continue;

    // Normalizes quoted scalar values.
    const normalizedValue = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    // Splits dotted key into path segments.
    const keyParts = key.split('.');

    // Iteratively creates nested objects for dotted key prefixes.
    let cursor = output;
    for (let i = 0; i < keyParts.length - 1; i += 1) {
      // Resolves current key segment while building nested object path.
      const part = keyParts[i];
      if (!cursor[part] || typeof cursor[part] !== 'object') {
        cursor[part] = {};
      }
      cursor = cursor[part];
    }

    cursor[keyParts[keyParts.length - 1]] = normalizedValue;
  }

  return output;
}

// Split the body into localized EN and PT sections.
// Splits article body into localized language sections and renders each to HTML.
function parseLocalizedBody(bodyText) {
  // Stores raw localized markdown blocks before HTML conversion.
  const sections = {
    en: '',
    pt: ''
  };

  // Matches language markers used in case markdown files.
  const langRegex = /<!--\s*lang:(en|pt)\s*-->/gi;
  // Tracks active language section while iterating markers.
  let activeLang = null;
  // Tracks previous marker boundary index.
  let lastIndex = 0;
  // Holds current regex match object during loop.
  let match;

  while ((match = langRegex.exec(bodyText)) !== null) {
    if (activeLang) {
      sections[activeLang] += bodyText.slice(lastIndex, match.index);
    }
    activeLang = match[1].toLowerCase();
    lastIndex = langRegex.lastIndex;
  }

  // Falls back to mirrored EN/PT sections when no explicit markers exist.
  if (activeLang) {
    sections[activeLang] += bodyText.slice(lastIndex);
  } else {
    sections.en = bodyText;
    sections.pt = bodyText;
  }

  return {
    html: {
      // Renders English markdown segment into HTML.
      en: markdownToHtml(sections.en.trim()),
      // Renders Portuguese markdown segment into HTML.
      pt: markdownToHtml(sections.pt.trim())
    },
    meta: {
      // Records whether EN marker exists in source body.
      hasLangEnMarker: /<!--\s*lang:en\s*-->/i.test(bodyText),
      // Records whether PT marker exists in source body.
      hasLangPtMarker: /<!--\s*lang:pt\s*-->/i.test(bodyText),
      // Stores raw EN body content for diagnostics.
      rawEn: sections.en.trim(),
      // Stores raw PT body content for diagnostics.
      rawPt: sections.pt.trim()
    }
  };
}

// Guard against empty or non-string values.
// Returns true only for non-empty trimmed strings.
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Validate the parsed case structure and surface human-readable errors.
// Validates parsed case data and returns a list of user-facing error messages.
function validateCaseObject(caseData, bodyMeta, contextLabel) {
  // Collects validation errors produced by contract checks.
  const errors = [];

  // Validates required scalar metadata fields.
  REQUIRED_SCALAR_FIELDS.forEach((field) => {
    if (!isNonEmptyString(caseData?.[field])) {
      errors.push(`${contextLabel}: missing required field '${field}'.`);
    }
  });

  // Validates required localized metadata fields.
  REQUIRED_LOCALIZED_FIELDS.forEach((field) => {
    // Resolves localized object for current field.
    const localized = caseData?.[field];
    // Validates English localized value.
    const validEn = isNonEmptyString(localized?.en);
    // Validates Portuguese localized value.
    const validPt = isNonEmptyString(localized?.pt);

    if (!validEn || !validPt) {
      errors.push(`${contextLabel}: field '${field}' must define both '${field}.en' and '${field}.pt'.`);
    }
  });

  // Enforces non-empty localized article body content.
  if (!isNonEmptyString(caseData?.desc?.en) || !isNonEmptyString(caseData?.desc?.pt)) {
    errors.push(`${contextLabel}: body content must produce non-empty EN and PT article sections.`);
  }

  // Enforces language marker balance when explicit markers are used.
  if (bodyMeta.hasLangEnMarker !== bodyMeta.hasLangPtMarker) {
    errors.push(`${contextLabel}: language markers are unbalanced. Use both '<!-- lang:en -->' and '<!-- lang:pt -->'.`);
  }

  // Rejects deprecated device source field in favor of catalog metadata fields.
  if (isNonEmptyString(caseData?.thumbDeviceSrc)) {
    errors.push(`${contextLabel}: field 'thumbDeviceSrc' is not supported. Use thumbCategory + thumbBrand + thumbModel + thumbColor.`);
  }

  return errors;
}

// Parse a single case markdown file and retain diagnostics for validation.
// Parses one markdown case and returns structured data plus validation diagnostics.
export function parseCaseMarkdownWithDiagnostics(rawText, options = {}) {
  // Resolves context label used in diagnostic message prefixes.
  const contextLabel = options.filePath || 'markdown-case';
  // Verifies frontmatter starts at file beginning.
  const hasFrontmatter = rawText.startsWith('---');
  if (!hasFrontmatter) {
    return {
      caseData: null,
      errors: [`${contextLabel}: missing opening frontmatter delimiter '---'.`]
    };
  }

  // Locates closing frontmatter delimiter.
  const endMarkerIndex = rawText.indexOf('\n---', 3);
  if (endMarkerIndex < 0) {
    return {
      caseData: null,
      errors: [`${contextLabel}: missing closing frontmatter delimiter '---'.`]
    };
  }

  // Extracts frontmatter block text.
  const frontmatterText = rawText.slice(3, endMarkerIndex).trim();
  // Extracts localized body text after frontmatter.
  const bodyText = rawText.slice(endMarkerIndex + 4).trim();

  // Parses frontmatter metadata.
  const metadata = parseFrontmatter(frontmatterText);
  // Parses and renders localized body content.
  const body = parseLocalizedBody(bodyText);

  // Builds runtime case payload with parser-provided body fields.
  const caseData = {
    ...metadata,
    desc: body.html,
    descRecruiter: metadata.descRecruiter || body.html
  };

  // Runs contract validation against parsed payload.
  const errors = validateCaseObject(caseData, body.meta, contextLabel);

  return {
    caseData,
    errors
  };
}

// Parse a case markdown file and return null when validation fails.
// Parses a markdown case and returns null when diagnostics contain errors.
export function parseCaseMarkdown(rawText) {
  // Reuses diagnostic parser to avoid duplicate parsing logic.
  const { caseData, errors } = parseCaseMarkdownWithDiagnostics(rawText);
  if (errors.length > 0) {
    return null;
  }

  return caseData;
}
