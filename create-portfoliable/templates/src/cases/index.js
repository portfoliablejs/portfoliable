import { parseCaseMarkdownWithDiagnostics } from '@portfoliablejs/portfoliable/src/parser/markdown.js';
import iPhone12BlackFrame from '../assets/devices/iphone-12-black.avif';
import iPadPro11SilverLandscapeFrame from '../assets/devices/ipad-pro-11-silver-landscape.avif';
import macBookPro13SpaceGreyFrame from '../assets/devices/macbook-pro-13-space-grey.avif';
import appleWatch44SilverAluminumFrame from '../assets/devices/apple-watch-44mm-silver-aluminum.avif';

const STARTER_DEVICE_FRAMES = {
  'mobile-product-launch': iPhone12BlackFrame,
  'mobile-checkout-flow': iPadPro11SilverLandscapeFrame,
  'compact-research-archive': macBookPro13SpaceGreyFrame,
  'wearable-companion': appleWatch44SilverAluminumFrame
};

const DEVICE_FRAMES_BY_MODEL = {
  'apple iphone 12': iPhone12BlackFrame,
  'apple ipad pro 11': iPadPro11SilverLandscapeFrame,
  'apple macbook pro 13': macBookPro13SpaceGreyFrame,
  'apple watch 44mm': appleWatch44SilverAluminumFrame
};

function toLocalized(value, fallback) {
  if (value && typeof value === 'object' && value.en !== undefined && value.pt !== undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return { en: value, pt: value };
  }

  if (fallback && typeof fallback === 'object' && fallback.en !== undefined && fallback.pt !== undefined) {
    return fallback;
  }

  return { en: '', pt: '' };
}

function normalizeMarkdownCase(markdownCase) {
  const modelKey = typeof markdownCase.thumbModel === 'string'
    ? markdownCase.thumbModel.trim().toLowerCase()
    : '';
  const deviceFrameFallback = STARTER_DEVICE_FRAMES[markdownCase.id] || DEVICE_FRAMES_BY_MODEL[modelKey] || '';

  return {
    ...markdownCase,
    id: markdownCase.id,
    slug: markdownCase.slug,
    title: toLocalized(markdownCase.title),
    shortDesc: toLocalized(markdownCase.shortDesc),
    readTime: toLocalized(markdownCase.readTime),
    year: toLocalized(markdownCase.year),
    thumbSrc: toLocalized(markdownCase.thumbSrc),
    desc: toLocalized(markdownCase.desc),
    descRecruiter: toLocalized(markdownCase.descRecruiter, markdownCase.desc),
    thumbDeviceSrc: markdownCase.thumbDeviceSrc || deviceFrameFallback
  };
}

function loadMarkdownCases() {
  const modules = import.meta.glob('../content/cases/*.md', {
    eager: true,
    import: 'default',
    query: '?raw'
  });

  const diagnostics = [];

  const parsedCases = Object.entries(modules)
    .map(([filePath, rawText]) => {
      const result = parseCaseMarkdownWithDiagnostics(rawText, { filePath });
      if (result.errors.length > 0) {
        diagnostics.push(...result.errors);
      }
      return result.caseData;
    })
    .filter(Boolean);

  if (diagnostics.length > 0) {
    console.warn('[portfoliable] Content validation warnings:');
    diagnostics.forEach((message) => console.warn(`- ${message}`));
  }

  return parsedCases;
}

export function getPortfolioCases() {
  const markdownCases = loadMarkdownCases();

  if (markdownCases.length === 0) {
    console.warn('[portfoliable] No markdown cases were loaded from src/content/cases.');
  }

  return markdownCases.map((markdownCase) => normalizeMarkdownCase(markdownCase));
}

export const portfolioCases = getPortfolioCases();