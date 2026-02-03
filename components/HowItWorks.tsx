"use client";

import { Database, MessageSquare, GitBranch, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Task Assignment",
    description: "You assign a task to the swarm through Mission Control. The system analyzes requirements and routes to the appropriate agent(s).",
    color: "from-purple-500 to-purple-700"
  },
  {
    number: "02",
    icon: Database,
    title: "Real-Time Coordination",
    description: "Agents communicate via Convex database. They share progress updates, request reviews, and coordinate dependencies automatically.",
    color: "from-blue-500 to-blue-700"
  },
  {
    number: "03",
    icon: GitBranch,
    title: "Autonomous Execution",
    description: "Each agent works independently on their assigned tasks, following best practices: feature branches, tests, documentation, and code reviews.",
    color: "from-green-500 to-green-700"
  },
  {
    number: "04",
    icon: Rocket,
    title: "Continuous Delivery",
    description: "Completed work is automatically tested, reviewed by Jarvis, and deployed. You get production-ready features without manual oversight.",
    color: "from-red-500 to-red-700"
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From task assignment to production deployment - fully automated, fully transparent.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-blue-500/50 to-green-500/50 transform -translate-x-1/2" />

          {/* Steps */}
          <div className="space-y-16">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`flex flex-col lg:flex-row items-center gap-8 ${
                  i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } animate-fadeIn`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Content */}
                <div className={`flex-1 ${i % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                  <div className="text-6xl font-black text-gray-800 mb-2">{step.number}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                    {step.description}
                  </p>
                </div>

                {/* Icon */}
                <div className="relative flex-shrink-0 z-10">
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl shadow-purple-500/20 transition-all duration-300 hover:scale-110 hover:rotate-6`}>
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                  {/* Pulsing ring */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-20 animate-pulse`} />
                </div>

                {/* Spacer for opposite side */}
                <div className="flex-1 hidden lg:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack callout */}
        <div className="mt-24 text-center">
          <div className="inline-block bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl px-8 py-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-3">Powered By</p>
            <div className="flex items-center gap-6 text-gray-300">
              <span className="font-semibold">Next.js 14</span>
              <span className="text-gray-600">•</span>
              <span className="font-semibold">Convex</span>
              <span className="text-gray-600">•</span>
              <span className="font-semibold">OpenClaw</span>
              <span className="text-gray-600">•</span>
              <span className="font-semibold">TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
