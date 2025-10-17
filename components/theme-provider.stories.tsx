import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from './theme-provider'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'

const meta = {
  title: 'Components/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeProvider>

export default meta
type Story = StoryObj<typeof meta>

// Theme switcher component
const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Theme System</h1>
          <p className="text-muted-foreground">
            Current theme: <span className="font-semibold">{theme}</span>
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
            className="flex items-center gap-2"
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
            className="flex items-center gap-2"
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            onClick={() => setTheme('system')}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            System
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card Component</CardTitle>
              <CardDescription>Adapts to theme automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card changes its appearance based on the selected theme.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Theme-aware button styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full">Default</Button>
              <Button variant="secondary" className="w-full">
                Secondary
              </Button>
              <Button variant="outline" className="w-full">
                Outline
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Theme colors in action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-primary" />
                <p className="text-xs text-center">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-secondary" />
                <p className="text-xs text-center">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-accent" />
                <p className="text-xs text-center">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-muted" />
                <p className="text-xs text-center">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-destructive" />
                <p className="text-xs text-center">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md border bg-card" />
                <p className="text-xs text-center">Card</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeSwitcher />
    </ThemeProvider>
  ),
}

export const LightTheme: Story = {
  render: () => (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeSwitcher />
    </ThemeProvider>
  ),
}

export const DarkTheme: Story = {
  render: () => (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ThemeSwitcher />
    </ThemeProvider>
  ),
}

export const PilotDashboard: Story = {
  render: () => {
    const DashboardDemo = () => {
      const { theme, setTheme } = useTheme()

      return (
        <div className="min-h-screen bg-background p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Pilot Dashboard</h1>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Pilots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">27</div>
                  <p className="text-xs text-muted-foreground">
                    15 Captains, 12 First Officers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">607</div>
                  <p className="text-xs text-muted-foreground">
                    8 expiring soon
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>On Leave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    25 available
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">
                        Leave request approved
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Captain Smith - RP12/2025
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">
                        Certification expiring
                      </p>
                      <p className="text-xs text-muted-foreground">
                        F/O Jones - Line Check in 15 days
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <DashboardDemo />
      </ThemeProvider>
    )
  },
}
