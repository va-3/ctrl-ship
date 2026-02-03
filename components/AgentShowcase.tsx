"use client";

import { Users, Palette, Server, TestTube, Rocket, Brain, Code2 } from "lucide-react";

const agents = [
  {
    name: "Jarvis",
    role: "Tech Lead & Architect",
    icon: Users,
    color: "from-purple-500 to-purple-700",
    expertise: ["System Architecture", "Code Reviews", "Team Coordination", "Best Practices"],
    description: "Oversees the entire development process, ensures code quality, and coordinates the team."
  },
  {
    name: "Tony",
    role: "Frontend Developer",
    icon: Code2,
    color: "from-blue-500 to-blue-700",
    expertise: ["React/Next.js", "TypeScript", "UI/UX", "Responsive Design"],
    description: "Builds beautiful, performant user interfaces with modern frontend technologies."
  },
  {
    name: "Bruce",
    role: "Backend Developer",
    icon: Server,
    color: "from-green-500 to-green-700",
    expertise: ["APIs", "Databases", "Authentication", "Server Logic"],
    description: "Develops robust backend systems, APIs, and database architectures."
  },
  {
    name: "Natasha",
    role: "QA Engineer",
    icon: TestTube,
    color: "from-red-500 to-red-700",
    expertise: ["Jest Testing", "Playwright E2E", "Test Coverage", "Quality Assurance"],
    description: "Ensures code quality through comprehensive testing and quality assurance."
  },
  {
    name: "Thor",
    role: "DevOps Engineer",
    icon: Rocket,
    color: "from-yellow-500 to-yellow-700",
    expertise: ["CI/CD", "Docker", "Deployment", "Infrastructure"],
    description: "Manages deployments, CI/CD pipelines, and infrastructure automation."
  },
  {
    name: "Wanda",
    role: "UI/UX Designer",
    icon: Palette,
    color: "from-pink-500 to-pink-700",
    expertise: ["Figma", "Design Systems", "Accessibility", "User Research"],
    description: "Creates intuitive, accessible designs and maintains design system consistency."
  },
  {
    name: "Strange",
    role: "AI Integration Specialist",
    icon: Brain,
    color: "from-indigo-500 to-indigo-700",
    expertise: ["LLM Integration", "AI Features", "Recommendations", "Smart Automation"],
    description: "Integrates AI capabilities, chatbots, and intelligent features into applications."
  }
];

export default function AgentShowcase() {
  return (
    <section id="agents" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Meet the Agents
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Each agent specializes in a critical aspect of web development, working together in perfect coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent, i) => (
            <div
              key={agent.name}
              className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 animate-fadeIn"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                <agent.icon className="w-8 h-8 text-white" />
              </div>

              {/* Name & Role */}
              <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{agent.role}</p>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                {agent.description}
              </p>

              {/* Expertise tags */}
              <div className="flex flex-wrap gap-2">
                {agent.expertise.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2 py-1 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20"
                  >
                    {skill}
                  </span>
                ))}
                {agent.expertise.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-gray-700/30 text-gray-400 rounded border border-gray-600/20">
                    +{agent.expertise.length - 3} more
                  </span>
                )}
              </div>

              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-10 transition-opacity -z-10`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
