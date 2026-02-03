import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Use OpenClaw Gateway instead of direct Anthropic API
    const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
    const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '0b48799949ee51d30237dc9f133c0a339de659d088146e25';
    
    // Build prompt for Sonnet
    const prompt = buildPrompt(formData);
    
    // Dynamic model selection (from request or env default)
    const model = formData.model || process.env.DEFAULT_MODEL || 'anthropic/claude-sonnet-4-5';
    
    // Call OpenClaw Gateway (which uses YOUR Claude subscription)
    const response = await fetch(`${OPENCLAW_GATEWAY}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4096,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenClaw Gateway error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const sonnetResponse = data.choices[0].message.content;
    
    // Parse task breakdown
    const tasks = parseResponse(sonnetResponse);
    
    return NextResponse.json({ tasks });
    
  } catch (error: any) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function buildPrompt(formData: any): string {
  return `You are a project manager breaking down a website project into tasks for a 7-agent development swarm.

**Project Details:**
- Name: ${formData.projectName}
- Type: ${formData.websiteType}
- Description: ${formData.description}
- Target Audience: ${formData.targetAudience || 'General'}
- Primary Color: ${formData.primaryColor || 'Default'}
- Secondary Color: ${formData.secondaryColor || 'Default'}
- Pages: ${formData.pages?.join(', ') || 'Not specified'}
- Features: ${formData.features?.join(', ') || 'Not specified'}
- Additional Notes: ${formData.additionalNotes || 'None'}

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
    "description": "Design a modern hero section with gradient background, CTA button, and hero image. Style: Modern. Colors: ${formData.primaryColor}, ${formData.secondaryColor}.",
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

function parseResponse(text: string): any[] {
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
    tasks.forEach((task, index) => {
      const required = ['title', 'description', 'assignedAgent', 'type'];
      for (const field of required) {
        if (!task[field]) {
          throw new Error(`Task ${index} missing field: ${field}`);
        }
      }
    });
    
    return tasks;
    
  } catch (error: any) {
    throw new Error(`Failed to parse Sonnet response: ${error.message}`);
  }
}
