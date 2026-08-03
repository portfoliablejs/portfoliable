import { defineConfig } from 'vitepress';

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
      '/docs/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/docs/' },
            { text: 'Install', link: '/docs/getting-started/install' },
            { text: 'Quickstart', link: '/docs/getting-started/quickstart' }
          ]
        },
        {
          text: 'Guides',
          items: [
            { text: 'Configuration', link: '/docs/guides/configuration' },
            { text: 'Content Authoring', link: '/docs/guides/content' },
            { text: 'Deploy', link: '/docs/guides/deploy' }
          ]
        },
        {
          text: 'Case Studies',
          items: [
            { text: 'Adding Case Studies', link: '/docs/case-studies/adding' },
            { text: 'Editing Case Studies', link: '/docs/case-studies/editing' }
          ]
        },
        {
          text: 'Device Thumbnails',
          items: [
            { text: 'Thumbnail Catalog', link: '/docs/device-thumbnails/catalog' },
            { text: 'Custom Thumbnail Setup', link: '/docs/device-thumbnails/customizing' }
          ]
        },
        {
          text: 'Accessibility',
          items: [
            { text: 'Accessibility Overview', link: '/docs/accessibility/overview' },
            { text: 'Accessibility Checklist', link: '/docs/accessibility/checklist' }
          ]
        },
        {
          text: 'Releases',
          items: [
            { text: 'Versioning', link: '/docs/releases/versioning' },
            { text: 'Changelog', link: '/docs/releases/changelog' }
          ]
        }
      ]
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
      noExternal: ['@portfoliablejs/valence']
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
