import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
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
        title: 'FF14 Strategy Board Viewer',
      },
      {
        name: 'description',
        content: 'View and share FF14 Strategy Board codes. Decode share codes and render interactive strategy diagrams.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-card/30 py-4 px-6">
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row justify-between items-left gap-2 text-xs text-muted-foreground">
            <div>
              <p>FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.</p>
              <p>FINAL FANTASY XIV © SQUARE ENIX</p>
            </div>
            <div>Made by Mara Kaminagi and S'aize Riya @ Adamantoise</div>
          </div>
        </footer>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
