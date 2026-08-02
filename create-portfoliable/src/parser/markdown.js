// File: src/parser/markdown.js
// Purpose: Parse Portfoliable case markdown into structured case data.
// Author: Lio Schimanko

function stripInlineMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

const REQUIRED_SCALAR_FIELDS = ['id', 'slug', 'thumbCategory', 'thumbBrand', 'thumbModel', 'thumbColor'];
const REQUIRED_LOCALIZED_FIELDS = ['title', 'shortDesc', 'readTime', 'year', 'thumbSrc'];

// Convert the supported markdown subset into HTML for case bodies.
function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
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
function parseFrontmatter(frontmatterText) {
  const output = {};
  const lines = frontmatterText.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key) continue;

    const normalizedValue = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    const keyParts = key.split('.');

    let cursor = output;
    for (let i = 0; i < keyParts.length - 1; i += 1) {
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
function parseLocalizedBody(bodyText) {
  const sections = {
    en: '',
    pt: ''
  };

  const langRegex = /<!--\s*lang:(en|pt)\s*-->/gi;
  let activeLang = null;
  let lastIndex = 0;
  let match;

  while ((match = langRegex.exec(bodyText)) !== null) {
    if (activeLang) {
      sections[activeLang] += bodyText.slice(lastIndex, match.index);
    }
    activeLang = match[1].toLowerCase();
    lastIndex = langRegex.lastIndex;
  }

  if (activeLang) {
    sections[activeLang] += bodyText.slice(lastIndex);
  } else {
    sections.en = bodyText;
    sections.pt = bodyText;
  }

  return {
    html: {
      en: markdownToHtml(sections.en.trim()),
      pt: markdownToHtml(sections.pt.trim())
    },
    meta: {
      hasLangEnMarker: /<!--\s*lang:en\s*-->/i.test(bodyText),
      hasLangPtMarker: /<!--\s*lang:pt\s*-->/i.test(bodyText),
      rawEn: sections.en.trim(),
      rawPt: sections.pt.trim()
    }
  };
}

// Guard against empty or non-string values.
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Validate the parsed case structure and surface human-readable errors.
function validateCaseObject(caseData, bodyMeta, contextLabel) {
  const errors = [];

  REQUIRED_SCALAR_FIELDS.forEach((field) => {
    if (!isNonEmptyString(caseData?.[field])) {
      errors.push(`${contextLabel}: missing required field '${field}'.`);
    }
  });

  REQUIRED_LOCALIZED_FIELDS.forEach((field) => {
    const localized = caseData?.[field];
    const validEn = isNonEmptyString(localized?.en);
    const validPt = isNonEmptyString(localized?.pt);

    if (!validEn || !validPt) {
      errors.push(`${contextLabel}: field '${field}' must define both '${field}.en' and '${field}.pt'.`);
    }
  });

  if (!isNonEmptyString(caseData?.desc?.en) || !isNonEmptyString(caseData?.desc?.pt)) {
    errors.push(`${contextLabel}: body content must produce non-empty EN and PT article sections.`);
  }

  if (bodyMeta.hasLangEnMarker !== bodyMeta.hasLangPtMarker) {
    errors.push(`${contextLabel}: language markers are unbalanced. Use both '<!-- lang:en -->' and '<!-- lang:pt -->'.`);
  }

  if (isNonEmptyString(caseData?.thumbDeviceSrc)) {
    errors.push(`${contextLabel}: field 'thumbDeviceSrc' is not supported. Use thumbCategory + thumbBrand + thumbModel + thumbColor.`);
  }

  return errors;
}

// Parse a single case markdown file and retain diagnostics for validation.
export function parseCaseMarkdownWithDiagnostics(rawText, options = {}) {
  const contextLabel = options.filePath || 'markdown-case';
  const hasFrontmatter = rawText.startsWith('---');
  if (!hasFrontmatter) {
    return {
      caseData: null,
      errors: [`${contextLabel}: missing opening frontmatter delimiter '---'.`]
    };
  }

  const endMarkerIndex = rawText.indexOf('\n---', 3);
  if (endMarkerIndex < 0) {
    return {
      caseData: null,
      errors: [`${contextLabel}: missing closing frontmatter delimiter '---'.`]
    };
  }

  const frontmatterText = rawText.slice(3, endMarkerIndex).trim();
  const bodyText = rawText.slice(endMarkerIndex + 4).trim();

  const metadata = parseFrontmatter(frontmatterText);
  const body = parseLocalizedBody(bodyText);

  const caseData = {
    ...metadata,
    desc: body.html,
    descRecruiter: metadata.descRecruiter || body.html
  };

  const errors = validateCaseObject(caseData, body.meta, contextLabel);

  return {
    caseData,
    errors
  };
}

// Parse a case markdown file and return null when validation fails.
export function parseCaseMarkdown(rawText) {
  const { caseData, errors } = parseCaseMarkdownWithDiagnostics(rawText);
  if (errors.length > 0) {
    return null;
  }

  return caseData;
}
