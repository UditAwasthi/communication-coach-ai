import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Communication Coach AI
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Your personal AI mentor that learns from creator methodology and provides
            personalized communication coaching with long-term memory.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Start Coaching
              </Button>
            </Link>
            <Link href="/knowledge">
              <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10">
                Explore Knowledge
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-purple-300">Personalized Coaching</CardTitle>
              <CardDescription className="text-slate-400">
                Get advice tailored to your specific situation using extracted principles and frameworks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">
                The AI remembers your struggles, goals, and progress to provide increasingly relevant coaching.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-purple-300">Conversation Analysis</CardTitle>
              <CardDescription className="text-slate-400">
                Paste any conversation and get detailed analysis with specific improvement suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">
                Understand exactly what went wrong and what went right, backed by creator principles.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-purple-300">Roleplay Practice</CardTitle>
              <CardDescription className="text-slate-400">
                Practice conversations with AI simulations for networking, dating, and professional settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">
                Get real-time feedback and coaching as you practice different scenarios.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Ingest", desc: "Feed a YouTube playlist" },
              { step: "2", title: "Distill", desc: "Extract principles & frameworks" },
              { step: "3", title: "Coach", desc: "Get personalized advice" },
              { step: "4", title: "Grow", desc: "Track progress over time" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nav Links */}
        <div className="mt-16 flex justify-center gap-6 text-slate-400">
          <Link href="/chat" className="hover:text-white transition">Chat</Link>
          <Link href="/knowledge" className="hover:text-white transition">Knowledge</Link>
          <Link href="/admin" className="hover:text-white transition">Admin</Link>
          <Link href="/auth/signin" className="hover:text-white transition">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
