import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'type-prisma-gql',
  description: 'Lightweight TypeGraphQL optimized for Prisma 7 — no reflect-metadata required',
  base: '/type-prisma-gql/',

  head: [
    ['link', { rel: 'icon', href: '/type-prisma-gql/favicon.ico' }]
  ],

  themeConfig: {
    logo: null,

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'npm', link: 'https://www.npmjs.com/package/type-prisma-gql' },
      { text: 'GitHub', link: 'https://github.com/mo-fouad/type-prisma-gql' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/' },
          { text: 'Installation', link: '/guide/installation' },
        ]
      },
      {
        text: 'Core API',
        items: [
          { text: 'Decorators', link: '/guide/decorators' },
          { text: 'Type Utilities', link: '/guide/type-utilities' },
        ]
      },
      {
        text: 'Features',
        items: [
          { text: 'Validation', link: '/guide/validation' },
          { text: 'Authorization', link: '/guide/authorization' },
          { text: 'Middleware', link: '/guide/middleware' },
        ]
      },
      {
        text: 'Prisma Integration',
        items: [
          { text: 'Prisma Generator', link: '/guide/prisma-generator' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mo-fouad/type-prisma-gql' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 mo-fouad'
    },

    search: {
      provider: 'local'
    }
  }
})
