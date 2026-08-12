import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..', 'docs');

const SIDEBAR_DIRECTORY_ORDER = [
  'getting-started',
  'guides',
  'sharing-visibility',
  'case-decorators',
  'accessibility',
  'releases'
];

function slugToTitle(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function readMarkdownTitle(filePath) {
  if (!fs.existsSync(filePath)) {
    return slugToTitle(path.basename(filePath, '.md'));
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);
  let inFrontmatter = false;
  let frontmatterStarted = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!frontmatterStarted && line === '---') {
      frontmatterStarted = true;
      inFrontmatter = true;
      continue;
    }

    if (inFrontmatter && line === '---') {
      inFrontmatter = false;
      continue;
    }

    if (inFrontmatter) {
      const titleMatch = line.match(/^title:\s*(.+)$/i);
      if (titleMatch?.[1]) {
        return titleMatch[1].replace(/^['"]|['"]$/g, '').trim();
      }
      continue;
    }

    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match?.[1]) {
      return h1Match[1].trim();
    }
  }

  return slugToTitle(path.basename(filePath, '.md'));
}

function buildSidebarItemsForDirectory(dirName) {
  const directoryPath = path.join(docsRoot, dirName);
  if (!fs.existsSync(directoryPath)) return [];

  return fs.readdirSync(directoryPath)
    .filter((entry) => entry.toLowerCase().endsWith('.md'))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => {
      const slug = entry.replace(/\.md$/i, '');
      const filePath = path.join(directoryPath, entry);
      return {
        text: readMarkdownTitle(filePath),
        link: `/docs/${dirName}/${slug}`
      };
    });
}

function listDocsDirectories() {
  const knownOrder = new Map(SIDEBAR_DIRECTORY_ORDER.map((dirName, index) => [dirName, index]));

  return fs.readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => {
      const leftKnownIndex = knownOrder.has(left) ? knownOrder.get(left) : Number.MAX_SAFE_INTEGER;
      const rightKnownIndex = knownOrder.has(right) ? knownOrder.get(right) : Number.MAX_SAFE_INTEGER;

      if (leftKnownIndex !== rightKnownIndex) {
        return leftKnownIndex - rightKnownIndex;
      }

      return left.localeCompare(right);
    });
}

function buildDocsSidebar() {
  const directoryNames = listDocsDirectories();

  return [
    {
      text: slugToTitle('getting-started'),
      items: [
        { text: readMarkdownTitle(path.join(docsRoot, 'index.md')), link: '/docs/' },
        ...buildSidebarItemsForDirectory('getting-started')
      ]
    },
    ...directoryNames
      .filter((dirName) => dirName !== 'getting-started')
      .map((dirName) => ({
        text: slugToTitle(dirName),
        items: buildSidebarItemsForDirectory(dirName)
      }))
  ];
}

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const actionsBase = repository ? `/${repository}/` : '/';
const base = process.env.VITEPRESS_BASE || (process.env.GITHUB_ACTIONS ? actionsBase : '/');

export default defineConfig({
  title: 'Portfoliable',
  description: 'Turn case studies into a polished portfolio site with a design-system-first workflow.',
  base,
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://portfoliablejs.github.io'
  },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/docs/' },
      { text: 'GitHub', link: 'https://github.com/portfoliablejs/portfoliable' }
    ],
    sidebar: {
      '/docs/': buildDocsSidebar()
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/portfoliablejs/portfoliable' }
    ],
    search: {
      provider: 'local'
    },
    editLink: {
      pattern: 'https://github.com/portfoliablejs/portfoliable/edit/main/web/:path',
      text: 'Edit this page on GitHub'
    },
    footer: {
      message: 'Built with VitePress and Valence.',
      copyright: 'MIT License'
    }
  },
  vite: {
    define: {
      __WEB_BASE__: JSON.stringify(base)
    },
    css: {
      devSourcemap: true
    },
    esbuild: {
      legalComments: 'none'
    },
    ssr: {
      noExternal: ['@portfoliable/valence']
    },
    plugins: [],
    resolve: {
      alias: {}
    }
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('ds-')
      }
    }
  }
});
