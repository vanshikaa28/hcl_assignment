import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/Navbar"
import { Zap, BarChart2, Share2, Eye } from "lucide-react"

const steps = [
  { num: "01", icon: Zap, title: "Create", desc: "Build your poll with multiple options in seconds." },
  { num: "02", icon: Share2, title: "Share", desc: "Send your unique link to any audience." },
  { num: "03", icon: Eye, title: "Vote", desc: "Your audience votes instantly — no sign-up needed." },
  { num: "04", icon: BarChart2, title: "Watch Live", desc: "Results update automatically in real time." },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="container mx-auto px-4 flex flex-col items-center gap-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live polling, powered by WebSockets & Redis
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl max-w-4xl">
          Create polls.{" "}
          <span className="text-primary">Get instant</span>{" "}
          responses.
        </h1>
        
        <p className="max-w-2xl text-lg text-muted-foreground">
          Launch a poll in seconds and watch your audience respond in real time.
          No page refresh. No delays. Fast live results.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link to="/signup">Create a Poll</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>

        {/* Preview Card */}
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg text-left mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground">Which programming language do you prefer?</h3>
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
            </span>
          </div>
          {[
            { label: "Go", pct: 45 },
            { label: "Python", pct: 32 },
            { label: "TypeScript", pct: 15 },
            { label: "Rust", pct: 8 },
          ].map((item) => (
            <div key={item.label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="text-muted-foreground">{item.pct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-4">128 total responses</p>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="mt-2 text-muted-foreground">Four simple steps to real-time live polling</p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.num} className="flex flex-col gap-3 rounded-lg border p-6 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-muted-foreground/30">{step.num}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">Create your first poll and share it with your audience.</p>
          <Button size="lg" className="mt-6" asChild>
            <Link to="/signup">Start Free Now</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© PulsePoll · Create polls. Share instantly. Watch responses live.</p>
      </footer>
    </div>
  )
}
