import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const requestSchema = z.object({
  interests: z.string().trim().min(2).max(500),
  gradeLevel: z.string().trim().min(1).max(100),
  resources: z.string().trim().max(500).optional().default(""),
  projectType: z.enum(["Experiment", "Engineering", "Research", "Any"]).default("Any"),
  question: z.string().trim().max(1500).optional()
});

type MentorState = {
  interests: string;
  gradeLevel: string;
  resources: string;
  projectType: string;
  question: string;
  response: string;
};

const State = Annotation.Root({
  interests: Annotation<string>(),
  gradeLevel: Annotation<string>(),
  resources: Annotation<string>(),
  projectType: Annotation<string>(),
  question: Annotation<string>(),
  response: Annotation<string>()
});

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  temperature: 0.7
});

const mentorGraph = new StateGraph(State)
  .addNode("mentor", async (state) => {
    const prompt = `You are a supportive, safety-conscious science fair mentor.
Suggest practical, age-appropriate science fair projects based on the student's details.
Do not claim that an idea guarantees a result. Avoid hazardous chemicals, weapons, human/animal
experimentation, or unsafe electrical/mechanical builds. Encourage adult supervision where appropriate.
Return clear, valid JSON only, with this shape:
{
  "intro": "brief encouraging introduction",
  "ideas": [
    {
      "title": "project title",
      "question": "testable research question",
      "overview": "what the student will investigate or build",
      "materials": ["item 1", "item 2"],
      "steps": ["step 1", "step 2", "step 3"],
      "variables": {"independent": "...", "dependent": "...", "controlled": ["..."]},
      "dataToCollect": ["..."],
      "difficulty": "Beginner|Intermediate|Advanced",
      "safety": "relevant safety guidance"
    }
  ],
  "nextSteps": ["..."]
}
Provide 3 distinct ideas. Use straightforward language for the stated grade level.
Student grade/level: ${state.gradeLevel}
Interests: ${state.interests}
Available resources: ${state.resources || "Not specified"}
Preferred project type: ${state.projectType}
Additional question or constraints: ${state.question || "None"}`;

    const result = await model.invoke(prompt);
    return { response: typeof result.content === "string" ? result.content : JSON.stringify(result.content) };
  })
  .addEdge(START, "mentor")
  .addEdge("mentor", END)
  .compile();

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/ideas", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please check your inputs.", details: parsed.error.flatten() });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "The server is missing GROQ_API_KEY. Add it to your .env file." });
  }
  try {
    const result = await mentorGraph.invoke({
      ...parsed.data,
      question: parsed.data.question || "",
      response: ""
    } as MentorState);
    let content = result.response.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      return res.json(JSON.parse(content));
    } catch {
      return res.status(502).json({ error: "The AI returned an unreadable response. Please try again.", raw: content });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to generate ideas right now. Please try again later." });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`Mentor API running on http://localhost:${port}`));
