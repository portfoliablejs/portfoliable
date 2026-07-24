const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .homeview-layout {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: clamp(16px, 2vw, 28px);
      box-sizing: border-box;
      gap: clamp(12px, 1.5vw, 20px);
      overflow: hidden;
    }

    .homeview-title {
      margin: 0;
      font-size: clamp(30px, 4vw, 38px);
      font-weight: 500;
      letter-spacing: -0.04em;
      line-height: 0.9;
      color: var(--color-black, #000000);
    }

    .gallery-wrap {
      min-height: 0;
      flex: 1;
    }

    .homeview-footer {
      margin: 0;
      font-size: 0.75rem;
      color: var(--color-gray-light, #6c6c70);
    }
  </style>
  <section class="homeview-layout" aria-label="Home view template">
    <h1 class="homeview-title"></h1>
    <div class="gallery-wrap">
      <ds-gallery></ds-gallery>
    </div>
    <footer>
      <p class="homeview-footer"></p>
    </footer>
  </section>
`;

export class HomeViewAdapter extends HTMLElement {
  static get observedAttributes() {
    return ['aria-label', 'title-text', 'footer-text', 'item-count', 'engine'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._items = [];
  }

  connectedCallback() {
    this.layoutEl = this.shadowRoot.querySelector('.homeview-layout');
    this.titleEl = this.shadowRoot.querySelector('.homeview-title');
    this.galleryEl = this.shadowRoot.querySelector('ds-gallery');
    this.footerEl = this.shadowRoot.querySelector('.homeview-footer');
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (!this.layoutEl) return;
    this.render();
  }

  get titleText() {
    return this.getAttribute('title-text') || '';
  }

  set titleText(value) {
    this.setAttribute('title-text', String(value || ''));
  }

  get footerText() {
    return this.getAttribute('footer-text') || '';
  }

  set footerText(value) {
    this.setAttribute('footer-text', String(value || ''));
  }

  get itemCount() {
    const parsed = Number.parseInt(this.getAttribute('item-count') || '', 10);
    return Number.isNaN(parsed) ? 4 : parsed;
  }

  set itemCount(value) {
    this.setAttribute('item-count', String(value || 4));
  }

  get engine() {
    return this.getAttribute('engine') || 'minimal';
  }

  set engine(value) {
    this.setAttribute('engine', String(value || 'minimal'));
  }

  get items() {
    return this._items;
  }

  set items(value) {
    this._items = Array.isArray(value) ? value : [];
    this.render();
  }

  render() {
    if (!this.layoutEl) return;

    this.layoutEl.setAttribute('aria-label', this.getAttribute('aria-label') || 'Home view template');
    this.titleEl.textContent = this.titleText;
    this.footerEl.textContent = this.footerText;

    this.galleryEl.setAttribute('engine', this.engine);
    this.galleryEl.innerHTML = '';

    const maxItems = Math.max(1, this.itemCount);
    const visibleItems = this._items.slice(0, maxItems);

    visibleItems.forEach((item, index) => {
      const galleryItem = document.createElement('ds-gallery-item');
      galleryItem.setAttribute('title', item.title || `Case ${index + 1}`);
      galleryItem.setAttribute('short-desc', item.shortDesc || '');
      galleryItem.setAttribute('read-time', item.readTime || '');
      galleryItem.setAttribute('thumb-src', item.thumbSrc || '');

      if (item.aspectRatio) galleryItem.setAttribute('aspect-ratio', item.aspectRatio);
      if (item.hasVideo) galleryItem.setAttribute('has-video', '');
      if (item.hasRepo) galleryItem.setAttribute('has-repo', '');
      if (item.hasLive) galleryItem.setAttribute('has-live', '');

      if (item.caseId) galleryItem.dataset.caseId = item.caseId;
      galleryItem.dataset.galleryIndex = String(index);

      this.galleryEl.appendChild(galleryItem);
    });
  }
}

if (!customElements.get('pf-home-view')) {
  customElements.define('pf-home-view', HomeViewAdapter);
}