# Feel Forward — Manual Prototype Prompt Flow

This document helps you manually walk through the Feel Forward emotional calibration process using Claude, ChatGPT, or another LLM. You’ll copy-paste prompts, record LLM outputs, and use them as inputs in the next step.

---

## Phase 0: Exploratory Preference Discovery

**Prompt:**

> I’m trying to understand how I *really feel* about different variables when making a decision about [insert topic here, e.g., finding a new job].  
> Can you list 40–60 different factors people typically care about for this topic, broken into categories (like Compensation, Team, Culture, Logistics, etc.)?

---

**Prompt:**

> Now, I’d like you to walk me through each of those categories. Ask me whether that factor matters to me, and if so, what my general preference is. You can do this interactively, one group at a time. Try to be efficient but thorough.

---

## Phase 1: Preference Detailing

**Prompt:**

> Based on the factors I selected, ask me for each one:
> - How strong is my preference?  
> - Is there a hard limit or cutoff?  
> - How would I trade this off with other variables (e.g., salary vs commute)?
>
> Use a 1–5 scale if it helps. Use follow-ups if I give vague answers.

---

## Phase 2: Scenario Generation

**Prompt:**

> Using the structured list of variables and preferences I gave you, generate 5–10 **realistic, vivid scenarios** that combine multiple variables in a way that might actually occur. Make them feel like real situations — include company size, job type, pay range, etc.  
>
> Each scenario should be 3–5 sentences long, and should include subtle trade-offs. Give each scenario a title and short ID.

---

## Phase 3: Emotional Calibration

**Prompt (per scenario):**

> Imagine this scenario is real.  
> Close your eyes, take a breath, and notice how you feel — emotionally and physically.  
> 
> - How excited are you? (1–5)  
> - How anxious or uncertain? (1–5)  
> - Any physical sensation?  
> - What would you likely do?  
>
> Write your answer in the first person, stream-of-consciousness if needed.

---

## Phase 4: Pattern Extraction

**Prompt:**

> Based on my emotional responses to these scenarios, what patterns or insights can you draw?  
> 
> - Are there any consistent deal-breakers?  
> - Are there surprises or contradictions compared to what I said I wanted?
> - Which scenarios generated the strongest positive or negative emotions?
> 
> Create a digest or emotional map to summarize your findings.

---

## Phase 5: Summary Statement

**Prompt:**

> Now that we’ve gone through all of this, help me write a final summary of what I’m really looking for.  
> Be specific. Mention the key variables and thresholds that clearly matter to me based on how I responded, not just what I said.  
> The goal is to help me move from a vague desire like “a good job” to something more like:
> “I’m looking for a [role] at a [type] company that [meets criteria X, Y, and Z].”

---
