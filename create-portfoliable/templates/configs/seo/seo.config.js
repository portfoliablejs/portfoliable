// Optional site-level SEO and agent configuration.
// Consumers can replace these values without changing Portfoliable runtime code.
export default {
  identity: {
    personName: '',
    personUrl: '',
    organizationName: '',
    organizationUrl: '',
    email: ''
  },
  sameAs: [],
  pages: {
    contact: '',
    terms: '',
    license: ''
  },
  mcp: {
    enabled: true,
    name: '',
    version: '1.0.0',
    endpoint: '',
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    }
  }
};
