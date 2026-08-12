import DefaultTheme from 'vitepress/theme';
import { inBrowser } from 'vitepress';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (inBrowser) {
      import('@portfoliablejs/valence');
    }
  }
};
