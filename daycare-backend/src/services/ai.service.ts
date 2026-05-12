import dotenv from "dotenv";

dotenv.config();

// Type definitions
export interface DailyReportInput {
  childId: number;
  childName: string;
  age: number;
  activities: string[];
  meals: string[];
  behavior: string;
  sleep: string;
  incidents?: string[];
  notes?: string;
}

export interface AssessmentInput {
  childId: number;
  childName: string;
  age: number;
  ageGroup: string;
  developmentArea: string;
  observations: string;
  concerns?: string;
}

export interface AIReport {
  summary: string;
  highlights: string[];
  recommendations: string[];
  areas_of_growth: string[];
}

export interface AIAssessment {
  developmentLevel: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  milestones_achieved: string[];
}

// AI Service Factory - supports multiple providers
class AIService {
  private apiProvider: "openai" | "anthropic" | "google" | "mock";
  private apiKey: string;

  constructor() {
    this.apiProvider = (process.env.AI_PROVIDER || "openai") as any;
    this.apiKey = process.env.AI_API_KEY || "";

    if (!this.apiKey && this.apiProvider !== "mock") {
      console.warn(`⚠️ AI_API_KEY not set. Using mock provider. Set AI_API_KEY and AI_PROVIDER in .env`);
      this.apiProvider = "mock";
    }
  }

  /**
   * Generate daily report for a child
   * Uses AI to create comprehensive daily activity report based on collected data
   */
  async generateDailyReport(input: DailyReportInput): Promise<AIReport> {
    switch (this.apiProvider) {
      case "openai":
        return this.generateWithOpenAI(input);
      case "anthropic":
        return this.generateWithAnthropic(input);
      case "google":
        return this.generateWithGoogle(input);
      case "mock":
      default:
        return this.generateWithMock(input);
    }
  }

  /**
   * Generate child development assessment
   * Uses AI to evaluate child's progress across developmental domains
   */
  async generateAssessment(input: AssessmentInput): Promise<AIAssessment> {
    switch (this.apiProvider) {
      case "openai":
        return this.assessWithOpenAI(input);
      case "anthropic":
        return this.assessWithAnthropic(input);
      case "google":
        return this.assessWithGoogle(input);
      case "mock":
      default:
        return this.assessWithMock(input);
    }
  }

  // ============ OpenAI Implementation ============
  private async generateWithOpenAI(input: DailyReportInput): Promise<AIReport> {
    const prompt = this.buildDailyReportPrompt(input);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert early childhood educator analyzing daily reports for children in a daycare setting. Provide insightful, constructive feedback in JSON format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error("OpenAI error:", error);
      return this.generateWithMock(input);
    }
  }

  private async assessWithOpenAI(input: AssessmentInput): Promise<AIAssessment> {
    const prompt = this.buildAssessmentPrompt(input);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert child development specialist conducting formative assessments. Provide detailed, actionable assessment results in JSON format based on developmental milestones and best practices.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 1200,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error("OpenAI error:", error);
      return this.assessWithMock(input);
    }
  }

  // ============ Anthropic Implementation ============
  private async generateWithAnthropic(input: DailyReportInput): Promise<AIReport> {
    const prompt = this.buildDailyReportPrompt(input);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 1000,
          system:
            "You are an expert early childhood educator analyzing daily reports. Provide JSON responses with summary, highlights, recommendations, and areas of growth.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error("Anthropic error:", error);
      return this.generateWithMock(input);
    }
  }

  private async assessWithAnthropic(input: AssessmentInput): Promise<AIAssessment> {
    const prompt = this.buildAssessmentPrompt(input);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 1200,
          system:
            "You are an expert child development specialist. Provide detailed JSON assessment results including development level, strengths, areas for improvement, recommendations, and milestones achieved.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error("Anthropic error:", error);
      return this.assessWithMock(input);
    }
  }

  // ============ Google Gemini Implementation ============
  private async generateWithGoogle(input: DailyReportInput): Promise<AIReport> {
    const prompt = this.buildDailyReportPrompt(input);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${prompt}\n\nRespond with valid JSON containing: summary, highlights (array), recommendations (array), areas_of_growth (array)`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error("Google Gemini error:", error);
      return this.generateWithMock(input);
    }
  }

  private async assessWithGoogle(input: AssessmentInput): Promise<AIAssessment> {
    const prompt = this.buildAssessmentPrompt(input);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${prompt}\n\nRespond with valid JSON containing: developmentLevel, strengths (array), areas_for_improvement (array), recommendations (array), milestones_achieved (array)`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error("Google Gemini error:", error);
      return this.assessWithMock(input);
    }
  }

  // ============ Mock Implementation (for testing) ============
  private generateWithMock(input: DailyReportInput): AIReport {
    return {
      summary: `${input.childName} had a wonderful day at daycare today. They participated actively in all scheduled activities and showed great engagement with peers.`,
      highlights: [
        `Participated enthusiastically in ${input.activities[0] || "activities"}`,
        "Showed excellent cooperation with classmates",
        "Demonstrated good listening skills during group time",
        `Enjoyed meals and snacks with good appetite`,
      ],
      recommendations: [
        "Continue encouraging social interaction with peers",
        "Practice basic counting and number recognition at home",
        "Read together before bedtime for language development",
      ],
      areas_of_growth: [
        "Fine motor skills developing well",
        "Increased confidence in group settings",
        "Improving vocabulary and communication",
      ],
    };
  }

  private assessWithMock(input: AssessmentInput): AIAssessment {
    return {
      developmentLevel: "On track",
      strengths: [
        "Strong social and emotional development",
        "Good gross motor skills",
        "Curious and engaged learner",
        "Cooperative with adults and peers",
      ],
      areas_for_improvement: [
        "Continue developing fine motor skills",
        "Expand vocabulary and language skills",
        "Practice sharing and turn-taking",
      ],
      recommendations: [
        `Provide age-appropriate activities targeting ${input.developmentArea}`,
        "Encourage parent-child interaction at home",
        "Use positive reinforcement for desired behaviors",
      ],
      milestones_achieved: [
        "Follows simple two-step directions",
        "Engages in cooperative play",
        "Uses words to express needs and feelings",
      ],
    };
  }

  // ============ Prompt Builders ============
  private buildDailyReportPrompt(input: DailyReportInput): string {
    return `
Generate a daily activity report for ${input.childName} (Age: ${input.age}).

Activities Participated In:
${input.activities.map((a) => `- ${a}`).join("\n")}

Meals & Snacks:
${input.meals.map((m) => `- ${m}`).join("\n")}

Behavior Observations:
${input.behavior}

Sleep/Rest Time:
${input.sleep}

Incidents/Concerns:
${input.incidents?.map((i) => `- ${i}`).join("\n") || "None reported"}

Additional Notes:
${input.notes || "None"}

Please provide a comprehensive daily report in JSON format with:
- summary: Brief overview of the day
- highlights: List of positive observations and achievements
- recommendations: Suggestions for parents/educators
- areas_of_growth: Developmental areas showing progress
    `;
  }

  private buildAssessmentPrompt(input: AssessmentInput): string {
    return `
Conduct a development assessment for ${input.childName} (Age: ${input.age}, Age Group: ${input.ageGroup}).

Assessment Area: ${input.developmentArea}

Observations:
${input.observations}

Concerns:
${input.concerns || "None noted"}

Based on early childhood development best practices and developmental milestones for ${input.age}-year-olds, provide assessment in JSON format with:
- developmentLevel: Overall development level (e.g., "On track", "Advanced", "Needs support")
- strengths: List of identified strengths
- areas_for_improvement: Areas needing additional support
- recommendations: Specific activities and strategies
- milestones_achieved: Developmental milestones achieved
    `;
  }
}

// Export singleton instance
export const aiService = new AIService();
