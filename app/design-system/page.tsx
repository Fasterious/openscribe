'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

type Section = 'foundations' | 'atoms' | 'molecules' | 'patterns' | 'responsive';

function ComponentPreview({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ColorSwatch({ name, variable, className }: { name: string; variable: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-14 h-14 rounded-xl border border-border/50 shadow-sm ${className}`} />
      <span className="text-[11px] font-medium text-foreground">{name}</span>
      <span className="text-[10px] text-muted-foreground font-mono">{variable}</span>
    </div>
  );
}

function FoundationsSection() {
  return (
    <div className="space-y-10">
      {/* Colors */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          OKLCH-based palette with indigo primary, teal accent, and full semantic set. All colors adapt to dark mode.
        </p>

        <div className="space-y-6">
          <div>
            <h4 className="text-[13px] font-medium text-foreground mb-3">Core</h4>
            <div className="flex flex-wrap gap-4">
              <ColorSwatch name="Primary" variable="--primary" className="bg-primary" />
              <ColorSwatch name="Secondary" variable="--secondary" className="bg-secondary" />
              <ColorSwatch name="Accent" variable="--accent" className="bg-accent" />
              <ColorSwatch name="Muted" variable="--muted" className="bg-muted" />
              <ColorSwatch name="Background" variable="--background" className="bg-background" />
              <ColorSwatch name="Card" variable="--card" className="bg-card" />
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-medium text-foreground mb-3">Semantic</h4>
            <div className="flex flex-wrap gap-4">
              <ColorSwatch name="Destructive" variable="--destructive" className="bg-destructive" />
              <ColorSwatch name="Success" variable="--success" className="bg-success" />
              <ColorSwatch name="Warning" variable="--warning" className="bg-warning" />
              <ColorSwatch name="Info" variable="--info" className="bg-info" />
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-medium text-foreground mb-3">Charts</h4>
            <div className="flex flex-wrap gap-4">
              <ColorSwatch name="Chart 1" variable="--chart-1" className="bg-chart-1" />
              <ColorSwatch name="Chart 2" variable="--chart-2" className="bg-chart-2" />
              <ColorSwatch name="Chart 3" variable="--chart-3" className="bg-chart-3" />
              <ColorSwatch name="Chart 4" variable="--chart-4" className="bg-chart-4" />
              <ColorSwatch name="Chart 5" variable="--chart-5" className="bg-chart-5" />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Typography */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Typography</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Geist Sans for body, Geist Mono for code. 4px spacing grid.
        </p>
        <div className="space-y-3">
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">4xl</span>
            <span className="text-4xl font-bold text-foreground">The quick brown fox</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">3xl</span>
            <span className="text-3xl font-bold text-foreground">The quick brown fox</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">2xl</span>
            <span className="text-2xl font-semibold text-foreground">The quick brown fox</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">xl</span>
            <span className="text-xl font-semibold text-foreground">The quick brown fox</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">lg</span>
            <span className="text-lg font-medium text-foreground">The quick brown fox</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">base</span>
            <span className="text-base text-foreground">The quick brown fox jumps over the lazy dog</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">sm</span>
            <span className="text-sm text-foreground">The quick brown fox jumps over the lazy dog</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">xs</span>
            <span className="text-xs text-muted-foreground">The quick brown fox jumps over the lazy dog</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] text-muted-foreground w-20 shrink-0 font-mono">mono</span>
            <span className="text-sm font-mono text-foreground">const x = &quot;hello world&quot;;</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Spacing & Radius */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Spacing &amp; Radius</h3>
        <p className="text-sm text-muted-foreground mb-4">4px base grid. Radius tokens from --radius.</p>
        <div className="flex flex-wrap gap-4">
          {['sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((size) => (
            <div key={size} className="flex flex-col items-center gap-1.5">
              <div className={`w-14 h-14 bg-primary/20 border border-primary/30 rounded-${size}`} />
              <span className="text-[11px] font-mono text-muted-foreground">rounded-{size}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Shadows */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Shadows</h3>
        <div className="flex flex-wrap gap-6">
          {[
            { name: 'shadow-xs', cls: 'shadow-xs' },
            { name: 'shadow-sm', cls: 'shadow-sm' },
            { name: 'shadow', cls: 'shadow' },
            { name: 'shadow-md', cls: 'shadow-md' },
            { name: 'shadow-lg', cls: 'shadow-lg' },
          ].map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-1.5">
              <div className={`w-20 h-14 bg-card rounded-xl border border-border ${s.cls}`} />
              <span className="text-[11px] font-mono text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AtomsSection() {
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(false);
  const [progress] = useState(65);

  return (
    <div className="space-y-8">
      {/* Buttons */}
      <ComponentPreview title="Button" description="Primary action element. 6 variants, 6 sizes.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </ComponentPreview>

      {/* Badge */}
      <ComponentPreview title="Badge" description="Status indicators and labels.">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </ComponentPreview>

      {/* Input */}
      <ComponentPreview title="Input" description="Text input with sizes and states.">
        <div className="space-y-3 max-w-sm">
          <Input placeholder="Default input" />
          <Input placeholder="Small input" size="sm" />
          <Input placeholder="Large input" size="lg" />
          <Input placeholder="Error state" aria-invalid="true" />
          <Input type="file" />
          <Input disabled placeholder="Disabled" />
        </div>
      </ComponentPreview>

      {/* Textarea */}
      <ComponentPreview title="Textarea" description="Multi-line text input.">
        <div className="max-w-sm">
          <Textarea placeholder="Write something..." />
        </div>
      </ComponentPreview>

      {/* Select */}
      <ComponentPreview title="Select" description="Native select dropdown.">
        <div className="max-w-sm">
          <Select>
            <option value="">Choose an option...</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
          </Select>
        </div>
      </ComponentPreview>

      {/* Checkbox */}
      <ComponentPreview title="Checkbox" description="Radix-based checkbox.">
        <div className="flex items-center gap-2">
          <Checkbox id="terms" checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
      </ComponentPreview>

      {/* Switch */}
      <ComponentPreview title="Switch" description="Toggle switch.">
        <div className="flex items-center gap-2">
          <Switch id="dark" checked={switched} onCheckedChange={setSwitched} />
          <Label htmlFor="dark">Dark mode</Label>
        </div>
      </ComponentPreview>

      {/* Avatar */}
      <ComponentPreview title="Avatar" description="User representation with image + fallback.">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>OS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
        </div>
      </ComponentPreview>

      {/* Progress */}
      <ComponentPreview title="Progress" description="Progress indicator bar.">
        <div className="space-y-3 max-w-sm">
          <Progress value={progress} />
          <Progress value={30} />
          <Progress value={100} />
        </div>
      </ComponentPreview>

      {/* Spinner */}
      <ComponentPreview title="Spinner" description="Loading indicator with sizes.">
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </div>
      </ComponentPreview>

      {/* Skeleton */}
      <ComponentPreview title="Skeleton" description="Content loading placeholder.">
        <div className="space-y-2 max-w-sm">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </ComponentPreview>

      {/* Separator */}
      <ComponentPreview title="Separator" description="Visual divider.">
        <div className="space-y-4">
          <Separator />
          <div className="flex items-center gap-4 h-8">
            <span className="text-sm">Left</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Right</span>
          </div>
        </div>
      </ComponentPreview>

      {/* Alert */}
      <ComponentPreview title="Alert" description="Contextual feedback with semantic variants.">
        <div className="space-y-3">
          <Alert>
            <AlertTitle>Default</AlertTitle>
            <AlertDescription>This is a default alert message.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Destructive</AlertTitle>
            <AlertDescription>Something went wrong.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Operation completed successfully.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>Please review before continuing.</AlertDescription>
          </Alert>
          <Alert variant="info">
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>Here is some helpful information.</AlertDescription>
          </Alert>
        </div>
      </ComponentPreview>

      {/* Label */}
      <ComponentPreview title="Label" description="Form label with required indicator.">
        <div className="space-y-3 max-w-sm">
          <div>
            <Label>Regular label</Label>
          </div>
          <div>
            <Label required>Required label</Label>
          </div>
        </div>
      </ComponentPreview>
    </div>
  );
}

function MoleculesSection() {
  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Tabs */}
        <ComponentPreview title="Tabs" description="Organized content sections.">
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Account</TabsTrigger>
              <TabsTrigger value="tab2">Security</TabsTrigger>
              <TabsTrigger value="tab3">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4">
              <p className="text-sm text-muted-foreground">Manage your account settings and preferences.</p>
            </TabsContent>
            <TabsContent value="tab2" className="mt-4">
              <p className="text-sm text-muted-foreground">Update your password and security options.</p>
            </TabsContent>
            <TabsContent value="tab3" className="mt-4">
              <p className="text-sm text-muted-foreground">Configure your notification preferences.</p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>

        {/* Dialog */}
        <ComponentPreview title="Dialog" description="Modal dialog for focused interactions.">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogDescription>This action cannot be undone. Are you sure you want to continue?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Continue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>

        {/* Tooltip */}
        <ComponentPreview title="Tooltip" description="Contextual information on hover.">
          <div className="flex gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </ComponentPreview>

        {/* Popover */}
        <ComponentPreview title="Popover" description="Rich content in a floating panel.">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Popover Content</h4>
                <p className="text-sm text-muted-foreground">
                  Place any rich content here including forms, settings, or additional information.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </ComponentPreview>

        {/* Card */}
        <ComponentPreview title="Card" description="Content container with header, body, and footer.">
          <div className="max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description with supporting text.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Content goes here. Cards are the primary container for grouping related information.
                </p>
              </CardContent>
            </Card>
          </div>
        </ComponentPreview>

        {/* Form Pattern */}
        <ComponentPreview title="Form Pattern" description="Standard form layout combining atoms.">
          <div className="max-w-sm space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" required>Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" required>Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select id="role">
                <option value="">Select a role...</option>
                <option value="researcher">UX Researcher</option>
                <option value="designer">UX Designer</option>
                <option value="pm">Product Manager</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Tell us about your project..." />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="newsletter" />
              <Label htmlFor="newsletter">Subscribe to newsletter</Label>
            </div>
            <Button className="w-full">Submit</Button>
          </div>
        </ComponentPreview>
      </div>
    </TooltipProvider>
  );
}

function PatternsSection() {
  return (
    <div className="space-y-8">
      {/* Empty State */}
      <ComponentPreview title="Empty State" description="When there is no content to display.">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No analyses yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Upload a CSV or Excel file to start your first persona analysis.
          </p>
          <Button>Upload file</Button>
        </div>
      </ComponentPreview>

      {/* Loading State */}
      <ComponentPreview title="Loading State" description="Skeleton-based loading patterns.">
        <div className="space-y-4 max-w-md">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </ComponentPreview>

      {/* Error State */}
      <ComponentPreview title="Error State" description="Standard error display pattern.">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The analysis could not be completed. Please try again.
          </p>
          <Button variant="outline" size="sm">Try again</Button>
        </div>
      </ComponentPreview>

      {/* Step indicator */}
      <ComponentPreview title="Step Indicator" description="Multi-step process visualization.">
        <div className="flex gap-2">
          {['Upload', 'Configure', 'Analyze', 'Results'].map((step, i) => (
            <div
              key={step}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${
                i === 0 ? 'bg-primary/10 text-primary' :
                i === 1 ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}. {step}
            </div>
          ))}
        </div>
      </ComponentPreview>

      {/* Data visualization colors */}
      <ComponentPreview title="Data Visualization Palette" description="Consistent cluster/persona colors.">
        <div className="flex flex-wrap gap-3">
          {['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#14b8a6', '#a855f7'].map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
            </div>
          ))}
        </div>
      </ComponentPreview>
    </div>
  );
}

function ResponsiveSection() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Breakpoints" description="Tailwind responsive breakpoints used across the app.">
        <div className="space-y-2">
          {[
            { bp: 'sm', size: '640px', desc: 'Mobile landscape / small tablet' },
            { bp: 'md', size: '768px', desc: 'Tablet portrait' },
            { bp: 'lg', size: '1024px', desc: 'Tablet landscape / small desktop' },
            { bp: 'xl', size: '1280px', desc: 'Desktop' },
            { bp: '2xl', size: '1536px', desc: 'Large desktop' },
          ].map(({ bp, size, desc }) => (
            <div key={bp} className="flex items-center gap-3 text-sm">
              <span className="w-8 font-mono font-medium text-primary">{bp}</span>
              <span className="w-16 font-mono text-muted-foreground">{size}</span>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </ComponentPreview>

      <ComponentPreview title="Grid Patterns" description="Responsive grid layouts used in module cards.">
        <div className="space-y-4">
          <p className="text-[12px] text-muted-foreground">1 col → 2 col (md) → 4 col (lg)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground border border-border/50">
                Card {i}
              </div>
            ))}
          </div>
        </div>
      </ComponentPreview>

      <ComponentPreview title="Container" description="Max-width content wrapper.">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><code className="font-mono bg-muted px-1.5 py-0.5 rounded">container mx-auto px-4</code> — Standard page wrapper</p>
          <p><code className="font-mono bg-muted px-1.5 py-0.5 rounded">max-w-4xl</code> — Dashboard pages</p>
          <p><code className="font-mono bg-muted px-1.5 py-0.5 rounded">max-w-5xl</code> — Analysis pages with wide content</p>
          <p><code className="font-mono bg-muted px-1.5 py-0.5 rounded">max-w-6xl</code> — Landing page module grid</p>
        </div>
      </ComponentPreview>

      <ComponentPreview title="Mobile Navigation" description="Hamburger menu on small screens, horizontal nav on desktop.">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Desktop (sm+): Horizontal nav links in header with active state highlighting</p>
          <p>Mobile ({'<'}sm): Hamburger icon toggles dropdown nav with click-outside-to-close</p>
          <p>Transition: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">hidden sm:flex</code> / <code className="font-mono bg-muted px-1.5 py-0.5 rounded">sm:hidden</code></p>
        </div>
      </ComponentPreview>
    </div>
  );
}

export default function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState<Section>('foundations');

  const sections: { id: Section; label: string }[] = [
    { id: 'foundations', label: 'Foundations' },
    { id: 'atoms', label: 'Atoms' },
    { id: 'molecules', label: 'Molecules' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'responsive', label: 'Responsive' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">OpenScribe Design System</h1>
              <p className="text-sm text-muted-foreground">
                Component library &amp; design guidelines for UX research tools
              </p>
            </div>
          </div>
        </div>

        {/* Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { title: 'Clarity', desc: 'Clean layouts that let the data speak. Every pixel earns its place.' },
            { title: 'Consistency', desc: 'Shared tokens, patterns and components across all modules.' },
            { title: 'Accessibility', desc: 'WCAG AA contrast, keyboard navigation, semantic markup.' },
          ].map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">{p.title}</h3>
              <p className="text-[12px] text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Section nav */}
        <nav className="flex gap-1 mb-8 border-b border-border pb-0 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        {activeSection === 'foundations' && <FoundationsSection />}
        {activeSection === 'atoms' && <AtomsSection />}
        {activeSection === 'molecules' && <MoleculesSection />}
        {activeSection === 'patterns' && <PatternsSection />}
        {activeSection === 'responsive' && <ResponsiveSection />}
      </main>

      <footer className="bg-card/50 backdrop-blur-sm border-t border-border/30 mt-auto">
        <div className="container mx-auto px-4 py-5">
          <p className="text-center text-sm text-muted-foreground">
            OpenScribe Design System — Built with Tailwind CSS v4, Radix UI, and class-variance-authority
          </p>
        </div>
      </footer>
    </div>
  );
}
