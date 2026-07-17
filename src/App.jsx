import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const highlights = [
  '60 shadcn components installed',
  'Tailwind v4 + design tokens wired',
  'Reusable primitives ready for your UI',
]

function App() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <Sparkles className="size-3.5" />
                  shadcn/ui installed
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Ready for production UI work
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  A clean shadcn foundation for the football academy app.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  The project now includes the full shadcn component registry,
                  shared utilities, and design tokens so you can build the UI on
                  top of standard primitives instead of the default Vite starter.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2">
                  Start building
                  <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" size="lg">
                  Browse components
                </Button>
              </div>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/60 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-sm leading-6 text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-border/60 bg-background/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Installed primitives</CardTitle>
                <CardDescription>
                  The registry has been added under src/components/ui.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-dashed border-border p-4">
                  <div className="text-sm font-medium">Core building blocks</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    button, card, badge, separator, input, dialog, sheet, tabs,
                    tooltip, and more.
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <span>Alias</span>
                    <code className="rounded-md bg-background px-2 py-1">
                      @/components/ui
                    </code>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <span>Utility</span>
                    <code className="rounded-md bg-background px-2 py-1">
                      cn()
                    </code>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground">
                  shadcn setup completed successfully.
                </span>
                <Button variant="secondary" size="sm" className="gap-2">
                  View ui folder
                  <ArrowRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
