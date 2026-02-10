import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Abolish Us | Official Records of Systemic Failure',
      },
      {
        name: 'description',
        content:
          'When the ship is held together by decades of coverups, patching the leaks is not enough.',
      },
      {
        name: 'theme-color',
        content: '#0f0f0f',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'Abolish Us',
      },
      {
        property: 'og:title',
        content: 'Abolish Us | It\'s time to rebuild tomorrow',
      },
      {
        property: 'og:description',
        content:
          'When the ship is held together by decades of coverups, patching the leaks is not enough.',
      },
      {
        property: 'og:image',
        content: '/og-card.svg',
      },
      {
        property: 'og:image:type',
        content: 'image/svg+xml',
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        property: 'og:url',
        content: 'https://abolish.us',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Abolish Us | We\'re Tired of Systemic Failure',
      },
      {
        name: 'twitter:description',
        content:
          'When the ship is held together by decades of coverups, patching the leaks is not enough.',
      },
      {
        name: 'twitter:image',
        content: '/og-card.svg',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
