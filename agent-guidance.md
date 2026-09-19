# eT3 2026 Software Development Internship — Technical Assignment

> Instruction reference for an LLM coding agent. This document consolidates the full assignment brief so it can be used as persistent context while building the solution.

## 1. Overview

This is a technical challenge for the eT3 Software Development Internship, evaluating programming fundamentals, logical thinking, and the ability to write clean, understandable code. Any programming language may be used.

## 2. Objective

Evaluate: programming fundamentals, problem solving, code clarity, attention to edge cases, and ability to explain technical decisions. No specific framework, database, or web technology is required.

| Item | Detail |
|---|---|
| Programming language | Any language |
| Expected effort | Approximately 2–4 hours |
| Submission deadline | 17-9-2026 (Thursday 17 Sep 2026, 11:59 pm) |
| Submission method | GitHub repository or ZIP file |

## 3. The Challenge: Delivery Route Planner

A delivery company receives a list of delivery requests. Write a program that organizes these requests into delivery trips following the rules below.

### 3.1 Sample Delivery Data

| ID | Area | Priority | Package Weight (kg) |
|----|------|----------|----------------------|
| 1 | Nasr City | 2 | 4.5 |
| 2 | Maadi | 1 | 2.0 |
| 3 | Nasr City | 3 | 1.2 |
| 4 | Zamalek | 1 | 7.0 |
| 5 | Maadi | 2 | 3.5 |

### 3.2 Requirements

- Each delivery has an ID, area, priority, and package weight.
- A vehicle can carry a maximum of **10 kg per trip**.
- A trip must **never** exceed the vehicle capacity.
- Deliveries going to the same area should be grouped together **where reasonably possible** (soft constraint).
- Lower priority numbers represent more urgent deliveries and should be handled first.
- Every valid delivery must appear in **exactly one** trip.

### 3.3 Input

- The program must read deliveries from a file.
- Acceptable formats: CSV, JSON, or a simple text format.
- The chosen format must be clearly documented, and a sample input file must be provided with the submission.

### 3.4 Edge Cases

The solution should behave sensibly when:

- There are no deliveries.
- A package is heavier than the vehicle's 10 kg capacity.
- Multiple deliveries have the same priority.
- Adding the next package would exceed the vehicle capacity.

There is no single correct way to handle every edge case. What matters: the decision is reasonable, the program behaves consistently, and the decision is explained.

## 4. README and Reasoning

The submission must include a `README.md` that explains how to run the program and answers these questions:

1. Explain your solution approach in your own words.
2. What was the most difficult part of the assignment?
3. Are there situations where your algorithm may not produce the best possible grouping? Explain.
4. If the input contained 1,000,000 delivery requests, what part of your solution might become slow or memory-intensive?
5. What would you improve if you had another day to work on the solution?

## 5. Your Extension

Add **one** useful feature of your choice that is not explicitly required above. It must be relevant to the problem, and the choice must be briefly explained in the README. Feature quality matters more than feature size.

## 6. Use of AI and Other Resources

- Documentation, search engines, AI assistants, and other development tools may be used as part of normal workflow.
- No extra credit is given for avoiding these tools.
- **The candidate is responsible for understanding every part of the submission.**
- Candidates who advance will take part in a short technical discussion, where they may be asked to:
  - Explain design decisions.
  - Trace the execution of the program.
  - Identify a problem in the code.
  - Make a small change to their own solution.

## 7. Submission Requirements

- Source code for the complete solution.
- A `README.md` containing setup/run instructions and the answers to the 5 reasoning questions.
- At least one sample input file usable to run the program.
- Submit via a GitHub repository (a ZIP file is acceptable if GitHub isn't possible).
- Send the solution to: **HR@et3.co**

## 8. What They Are Looking For

- Not looking for: advanced frameworks, complicated architecture, or clever code for its own sake.
- Looking for: evidence of understanding the problem, breaking it down, writing correct and readable code, thinking about unusual cases, and explaining decisions.
- **A simple, fully-understood solution is preferred over a sophisticated one the candidate cannot explain.**

## 9. Submission Checklist

- [ ] Program runs successfully.
- [ ] Sample input is included.
- [ ] README explains how to run the program.
- [ ] README answers all five reasoning questions.
- [ ] One additional feature is included and explained.
- [ ] Submission is sent before the deadline.

## 10. Deadline

**Thursday 17 Sep 2026, 11:59 pm.** Contact eT3 in advance if more time or clarification is needed.

## 11. Company Information

- 11.1 Company Profile — link provided in original PDF (not extractable as plain text here; see source document).
- 11.2 Company Projects Portfolio — link provided in original PDF (not extractable as plain text here; see source document).

---

## Agent Working Notes (non-original content, for context management only)

These notes are not part of the official brief — they're scaffolding to help an LLM agent stay oriented across a long build session.

**Core deliverable**: a program (any language) that reads delivery records from a file and outputs a set of trips, each respecting the 10 kg cap, grouped by area where reasonable, and processed in priority order.

**Definition of done**:
1. Source code, runnable end to end.
2. Sample input file included.
3. `README.md` with run instructions + 5 reasoning answers.
4. One extra feature, explained.
5. Packaged as a GitHub repo or ZIP, sent to HR@et3.co before 2026-09-17 23:59.

**Constraints to keep satisfied throughout implementation**:
- Trip weight ≤ 10 kg, always.
- Every valid delivery placed in exactly one trip.
- Priority order respected as primary ordering signal; area grouping is best-effort, not absolute.
- All four listed edge cases handled explicitly and consistently.
