// src/data.js

import iPhone12BlackFrame from './assets/devices/iphone-12-black.avif';

const i18n = (en, pt) => ({ en, pt });

const templateProductLaunch = {
  id: 'template-product-launch',
  slug: 'template-product-launch',
  year: i18n('2026 - Template Project', '2026 - Projeto Template'),
  readTime: i18n('3 min', '3 min'),
  title: i18n('Template Product Launch', 'Template Lancamento de Produto'),
  shortDesc: i18n(
    'A sample case showing how to describe a launch strategy using the design system.',
    'Um case de exemplo mostrando como descrever uma estrategia de lancamento usando o design system.'
  ),
  repositoryUrl: 'https://github.com/your-org/your-project',
  liveUrl: 'https://example.com',
  thumbSrc: i18n(
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop'
  ),
  thumbCategory: 'mobile',
  thumbBrand: 'apple',
  thumbModel: 'Apple iPhone 12',
  thumbColor: 'Black',
  thumbDeviceSrc: iPhone12BlackFrame,
  deviceClass: 'iphone-17',
  desc: i18n(
    '<p class="p1">Template content. Replace this with your own markdown-driven case story.</p>',
    '<p class="p1">Conteudo template. Substitua com sua propria historia de case em markdown.</p>'
  ),
  descRecruiter: i18n(
    '<p class="p1">Template recruiter view. Replace with your technical summary.</p>',
    '<p class="p1">Visao template para recrutador. Substitua com seu resumo tecnico.</p>'
  )
};

const templateMobileRedesign = {
  id: 'template-mobile-redesign',
  slug: 'template-mobile-redesign',
  year: i18n('2025 - Template Project', '2025 - Projeto Template'),
  readTime: i18n('4 min', '4 min'),
  title: i18n('Template Mobile Redesign', 'Template Redesign Mobile'),
  shortDesc: i18n(
    'A sample case focused on accessibility and mobile interaction improvements.',
    'Um case de exemplo focado em acessibilidade e melhorias de interacao mobile.'
  ),
  repositoryUrl: 'https://github.com/your-org/your-mobile-project',
  liveUrl: 'https://example.com/mobile',
  thumbSrc: i18n(
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1200&auto=format&fit=crop'
  ),
  thumbCategory: 'mobile',
  thumbBrand: 'apple',
  thumbModel: 'Apple iPhone 12',
  thumbColor: 'Black',
  thumbDeviceSrc: iPhone12BlackFrame,
  deviceClass: 'iphone-17',
  desc: i18n(
    '<p class="p1">Template content. Replace this with your own markdown-driven case story.</p>',
    '<p class="p1">Conteudo template. Substitua com sua propria historia de case em markdown.</p>'
  ),
  descRecruiter: i18n(
    '<p class="p1">Template recruiter view. Replace with your technical summary.</p>',
    '<p class="p1">Visao template para recrutador. Substitua com seu resumo tecnico.</p>'
  )
};

export const portfolioCases = [
  templateProductLaunch,
  templateMobileRedesign
];
