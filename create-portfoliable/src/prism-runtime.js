import * as PrismModule from 'prismjs';

const Prism = PrismModule.default ?? PrismModule;

if (typeof globalThis.Prism === 'undefined') {
    globalThis.Prism = Prism;
}
