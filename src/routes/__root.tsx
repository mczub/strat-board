import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import { useIsInIframe } from '@/hooks/useIsInIframe'

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
        title: 'board.wtfdig.info - view + bundle ff14 strategy board codes',
      },
      {
        name: 'description',
        content: 'View, bundle, and share FF14 strategy board codes.',
      },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
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
  const isInIframe = useIsInIframe()

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        {!isInIframe && (
          <footer className="border-t border-border bg-card/30 py-4 px-6">
            <div className="max-w-5xl mx-auto flex flex-col lg:flex-row justify-between items-left gap-2 text-sm text-muted-foreground">
              <div>
                <p>FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.</p>
                <p>FINAL FANTASY XIV © SQUARE ENIX</p>
              </div>
              <div>
                <div>Made by Mara Kaminagi and S'aize Riya @ Adamantoise</div>
                <div>
                  Really love the site? <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="anchor text-primary"
                    href="https://ko-fi.com/mczub">Support us on Ko-fi!
                  </a>
                </div>
              </div>
            </div>
          </footer>
        )}
        {isInIframe && (
          <div className=" bg-card/30 pb-4 px-6">
            <div className="max-w-5xl mx-auto flex flex-col lg:flex-row justify-between items-left gap-2 text-xs text-muted-foreground">
              <div>
                <p>FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd. FINAL FANTASY XIV © SQUARE ENIX</p>
              </div>
            </div>
          </div>
        )}
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
