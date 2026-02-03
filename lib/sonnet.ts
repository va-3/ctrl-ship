/**
 * Sonnet Integration for Task Generation
 * Phase 2: AI-powered task breakdown from website requirements
 */

export interface TaskInput {
  title: string;
  description: string;
  assignedAgent: string;
  type: string;
  priority?: string;
  estimatedHours?: number;
  dependencies?: string[];
}

export interface WebsiteFormData {
  projectName: string;
  websiteType: string;
  description: string;
  targetAudience: string;
  primaryColor: string;
  secondaryColor: string;
  pages: string[];
  features: string[];
  designStyle?: string;
  additionalNotes?: string;
}

/**
 * Build a structured prompt for Sonnet to generate tasks
 */
export function buildPrompt(formData: WebsiteFormData): string {
  const {
    projectName,
    websiteType,
    description,
    targetAudience,
    primaryColor,
    secondaryColor,
    pages = [],
    features = [],
    designStyle = 'modern',
    additionalNotes = '',
  } = formData;

  return `You are a project manager breaking down a website project into tasks for a 7-agent development swarm.

**Project Details:**
- Name: ${projectName}
- Type: ${websiteType}
- Description: ${description}
- Target Audience: ${targetAudience}
- Primary Color: ${primaryColor}
- Secondary Color: ${secondaryColor}
- Pages: ${pages.join(', ')}
- Features: ${features.join(', ')}
- Design Style: ${designStyle}
- Additional Notes: ${additionalNotes || 'None'}

**Available Agents:**
1. Jarvis (Tech Lead) - Architecture, code reviews, coordination
2. Wanda (Designer) - UI/UX design, mockups, design systems
3. Tony (Frontend) - React/Next.js components, styling
4. Bruce (Backend) - APIs, databases, server logic
5. Natasha (QA) - Testing, bug fixes, quality assurance
6. Thor (DevOps) - Deployment, CI/CD, hosting
7. Strange (AI) - AI integrations, chatbots, recommendations

**Your Task:**
Create a detailed task list that breaks this project into specific, actionable tasks.

**Requirements:**
1. Each task must be assigned to the appropriate agent
2. Tasks must have clear dependencies (e.g., Tony depends on Wanda for designs)
3. Include time estimates in hours
4. Be specific and actionable
5. Follow this workflow:
   - Wanda creates designs first
   - Tony builds frontend after Wanda
   - Bruce adds backend if needed
   - Natasha tests after implementation
   - Thor deploys at the end
   - Strange only if AI features requested

**Output Format (JSON):**
[
  {
    "title": "Create hero section mockup",
    "description": "Design a modern hero section with gradient background, CTA button, and hero image. Style: ${designStyle}. Colors: ${primaryColor}, ${secondaryColor}.",
    "assignedAgent": "Wanda",
    "type": "design",
    "priority": "high",
    "estimatedHours": 2,
    "dependencies": []
  },
  {
    "title": "Build hero component",
    "description": "Implement the hero section in Next.js with Tailwind CSS based on Wanda's mockup.",
    "assignedAgent": "Tony",
    "type": "feature",
    "priority": "high",
    "estimatedHours": 3,
    "dependencies": ["Create hero section mockup"]
  }
]

Return ONLY the JSON array. No explanation. No markdown. Just valid JSON.`;
}

/**
 * Parse Sonnet's response and extract task array
 */
export function parseResponse(text: string): TaskInput[] {
  try {
    // Remove markdown code blocks if present
    const jsonText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const tasks = JSON.parse(jsonText);
    
    // Validate structure
    if (!Array.isArray(tasks)) {
      throw new Error('Response is not an array');
    }
    
    // Validate each task has required fields
    tasks.forEach((task: any, index: number) => {
      const required = ['title', 'description', 'assignedAgent', 'type'];
      for (const field of required) {
        if (!task[field]) {
          throw new Error(`Task ${index} missing field: ${field}`);
        }
      }
    });
    
    return tasks as TaskInput[];
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse Sonnet response: ${errorMessage}`);
  }
}
