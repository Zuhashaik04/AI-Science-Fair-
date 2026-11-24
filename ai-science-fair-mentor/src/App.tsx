import { useState } from "react";

type Idea = {
  title: string; question: string; overview: string; materials: string[];
  steps: string[]; variables: { independent: string; dependent: string; controlled: string[] };
  dataToCollect: string[]; difficulty: string; safety: string;
};
type Result = { intro: string; ideas: Idea[]; nextSteps: string[] };

export default function App() {
  const [interests, setInterests] = useState("");
  const [gradeLevel, setGradeLevel] = useState("High school");
  const [resources, setResources] = useState("");
  const [projectType, setProjectType] = useState("Any");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, gradeLevel, resources, projectType, question })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect to the server.");
    } finally { setLoading(false); }
  }

  return <main className="shell">
    <header className="hero">
      <div className="eyebrow">YOUR PERSONAL SCIENCE FAIR GUIDE</div>
      <h1>AI Science Fair Mentor</h1>
      <p>Turn your curiosity into a science fair project. Share what interests you and get ideas, plans, and ways to measure results.</p>
    </header>

    <section className="panel">
      <h2>Tell us about your project</h2>
      <form onSubmit={generate}>
        <label>What subjects or topics interest you?<textarea required minLength={2} maxLength={500} value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g. plants, renewable energy, space, robotics..." /></label>
        <div className="two">
          <label>Grade / education level<select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}>
            <option>Middle school</option><option>High school</option><option>College</option><option>Other</option>
          </select></label>
          <label>Project type<select value={projectType} onChange={e => setProjectType(e.target.value)}>
            <option>Any</option><option>Experiment</option><option>Engineering</option><option>Research</option>
          </select></label>
        </div>
        <label>Materials or resources available (optional)<textarea value={resources} onChange={e => setResources(e.target.value)} placeholder="e.g. cardboard, phone, measuring cup, garden..." /></label>
        <label>Any extra question or constraints? (optional)<textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. I have two weeks and a small budget." /></label>
        <button disabled={loading}>{loading ? "Creating your ideas..." : "Generate project ideas"}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>

    {result && <section className="results">
      <h2>Your project ideas</h2><p>{result.intro}</p>
      {result.ideas?.map((idea, index) => <article className="idea" key={index}>
        <div className="ideaTop"><span>IDEA {index + 1}</span><span>{idea.difficulty}</span></div>
        <h3>{idea.title}</h3><p><strong>Research question:</strong> {idea.question}</p><p>{idea.overview}</p>
        <h4>Materials</h4><ul>{idea.materials?.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h4>Steps</h4><ol>{idea.steps?.map((x, i) => <li key={i}>{x}</li>)}</ol>
        <h4>Variables</h4><p><strong>Independent:</strong> {idea.variables?.independent}</p><p><strong>Dependent:</strong> {idea.variables?.dependent}</p><p><strong>Keep constant:</strong> {idea.variables?.controlled?.join(", ")}</p>
        <h4>Data to collect</h4><ul>{idea.dataToCollect?.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <p className="safety"><strong>Safety:</strong> {idea.safety}</p>
      </article>)}
      <article className="idea"><h3>Next steps</h3><ul>{result.nextSteps?.map((x, i) => <li key={i}>{x}</li>)}</ul></article>
    </section>}
    <footer>Use AI suggestions as a starting point. Check your school's science fair rules and ask a teacher or guardian before conducting experiments.</footer>
  </main>;
}
