# Blog-sourced T items, handover batch (16 of 32)

Interview-question candidates marked `T` (tweak) in the project's
blog-sourced review. The author is an ACE/MQ specialist; he's sifted a
larger list and this batch covers: **Logging, Unit testing, BAR/deploy,
Flows & ESQL, Connectors, AI/tools, Install, and overlap-with-existing**.

## How to review

For each item you'll see:

- **Question**: a candidate interview question (the thing we want to refine)
- **Source post**: the blog post it was derived from (optional to look up)
- **Hook**: the specific point in the source that makes it interesting

Your job: refine the question and its answer. Fill in the **Your
refinement** block with any of:

- A corrected or sharpened question wording
- Bullets of facts the answer should hit (3-6 ideal)
- A short paragraph of context (2-3 sentences), the "why" / what
  interviewers should listen for
- Authoritative references (IBM Docs / MQ Tech Conf / blog URLs / IBM
  Community links), ideally 1-3 per question
- Any traps, gotchas or production tells worth flagging

If a question feels weak or redundant once you've looked at it, it's
fine to write **"Drop, reason"** and we'll skip it.

Once you've worked through the file, send it back, the maintainer
will fold the refinements into a structured question bank.

**Target answer style:** bullets + a short explanation paragraph,
similar to what a senior candidate would actually say in an interview.
Aim for precision over volume.

---

## Section 5, Logging, tracing & monitoring

### 1. `flow-order-context-tree` · Context Tree vs Environment copies

- **Question:** What is the Context Tree in ACE v13.0.4.0+, and how does it differ from copying messages into the Environment?
- **Hook:** Context Tree is parser-aware and read-only; Environment copies collapse JSON arrays silently.

**Your refinement:**


---

### 2. `generic-log-node` · Referencing input-node context from a subflow

- **Question:** How do you reference the input node's context tree from inside a subflow in ACE v13?
- **Hook:** `CONTEXTREFERENCE(Context.InvocationDetails.NodeName)` enables generic log subflows without hardcoded node names.

**Your refinement:**


---

### 3. `logging-ace-exceptionlist` · ExceptionList `insert` vs full structure

- **Question:** What does the ExceptionList `insert` field contain, and why is it more useful than the full ExceptionList structure in logging?
- **Hook:** Insert has the actionable info (file/line/type); full structure is verbose; JSONata `[0:2]` captures last 2 errors cleanly.

**Your refinement:**


---

### 4. `log-nodes-tips-tricks` · JSONata fallback for missing fields

- **Question:** How do you provide a default or fallback value in an ACE Log node's JSONata expression for a field that may be missing?
- **Hook:** Sequence-flattening trick `[field, "FALLBACK"][0]`, missing fields otherwise leave blanks in logs and complicate troubleshooting.

**Your refinement:**


---

### 5. `eventlogmonitor` · EventLogMonitor with timestamps first

- **Question:** What does EventLogMonitor let you do on Windows, and how do you tail with timestamps first and load the last N entries?
- **Hook:** `tail -f` equivalent for Windows event logs; `-tf` timestamp-first, `-p N` look-back window, `-s` source filter.

**Your refinement:**


---

## Section 6, Unit testing & development

### 6. `ibm-dfdl-tester` · DFDL Tester setup steps

- **Question:** What does the DFDL Tester tool let you do, and what are its three key setup steps to validate a DFDL schema outside the Toolkit?
- **Hook:** `setup-ace-jars.ps1` populates libs, then `validate.ps1` runs parse; `-Trace` flag for detailed diagnostics.

**Your refinement:**


---

### 7. `customize-ace-palette` · Managing node visibility

- **Question:** How does Palette Customization in the Toolkit help manage node visibility, and why does it matter with the v13 connector influx?
- **Hook:** Right-click Palette → Customize; reorder / hide / pin drawers; crucial with ~80+ new discovery connectors cluttering the default view.

**Your refinement:**


---

## Section 7, BAR files & deploy

### 8. `ace-migration` · "Deploy stopped, start in groups" migration pattern

- **Question:** Why is "deploy with flows stopped, then start them in groups" the safest migration approach to a new ACE version?
- **Hook:** Stopped flows allow clean server startup; group-wise startup isolates failures; external calls started last so TLS/cipher issues are caught deliberately, not in a flood.

**Your refinement:**


---

## Section 8, Flows & ESQL

### 9. `select-the-row` · SELECT / ROW / THE in ESQL

- **Question:** What does a `SELECT` statement return in ESQL, and how do `ROW` and `THE` modify the shape of the result?
- **Hook:** Plain SELECT returns a flattened tree; ROW wraps the result as a single array; THE extracts exactly one value; the choice shapes the downstream output.

**Your refinement:**


---

### 10. `flow-order-context-tree` · Flow Order node solves array collapse

- **Question:** How does a Flow Order node solve "my array collapses when I stash a value in the Environment"?
- **Hook:** Two sequential branches, top branch stashes simple values (tokens) in Environment; bottom branch preserves the original message structure intact.

**Your refinement:**


---

## Section 9, Connectors & v13 features

### 11. `ace-v13-new-features-overview` · Dynamic credentials vs static updates

- **Question:** How do Dynamic Credentials in ACE v13 help compared to static credential updates, and which connector types benefit most?
- **Hook:** Dynamic credentials update without a server restart; most cloud connectors support it; reduces operational disruption when rotating secrets.

**Your refinement:**


---

## Section 11, AI & productivity

### 12. `ace-v13-new-features-overview` · Designer vs Toolkit decision

- **Question:** When do you reach for App Connect Designer instead of the Toolkit?
- **Hook:** Designer is for template / connector / pattern-based flows (low-code); Toolkit is for Compute nodes, ESQL, custom logic; Designer isn't a replacement, it's a different surface.

**Your refinement:**


---

## Section 12, Install & Windows

### 13. `ace-v13-new-features-overview` · Three install options on Windows

- **Question:** What three install options does ACE 13 on Windows offer, and what command-line flags control each?
- **Hook:** `-installToolkit`, `-installElectronApp`, `-installCloudConnectors`, granular control; reduces footprint for runtime-only or dev-only setups.

**Your refinement:**


---

## Section 14, Overlaps with existing bank

These are candidates that likely overlap with existing questions in the
bank, the author wants them refined with the idea of **merging into
the existing question** rather than creating a new one. Treat them as
"what additional detail should the existing question pick up?".

### 14. Designer vs Toolkit, merge into App Connect runtimes question

- **Question (candidate):** Designer vs Toolkit, which is for which kind of integration?
- **Existing question target:** "Which runtimes are available in the App Connect family?" (a pending draft covering on-prem ACE, certified container, Operator, ACEaaS, Designer).
- **Hook:** Designer is for connector/pattern/template-based low-code flows; Toolkit is for custom logic; they're complementary surfaces, not a replacement pair.

**Your refinement (extra bullets / nuance to fold into the existing runtimes question):**


---

### 15. What are the vault types in ACE, merge into DBparms vs vault

- **Question (candidate):** What are the vault types in ACE?
- **Existing question target:** "What are the two main ways to securely store credentials in ACE?" (DBparms vs vault).
- **Hook:** Node / server / external vaults; only external requires custom image management; node-level vaults are common on traditional installs, server vaults more common in containers.

**Your refinement (extra bullets / nuance to fold into the existing DBparms vs vault question):**


---

### 16. What is the App Connect Operator, merge into existing operator coverage

- **Question (candidate):** What is the App Connect Operator?
- **Existing question target:** "How does the release model of the ACE Operator (CP4I / OpenShift) differ from on-prem ACE?" (covers operator release model and channels). A shorter intro draft exists as "What is the App Connect Operator and what is it used for?".
- **Hook:** Kubernetes operator managing ACE resources via CRDs (IntegrationServer, Dashboard, DesignerAuthoring, SwitchServer, Configuration); OLM-delivered; the standard CP4I deploy path.

**Your refinement (extra bullets / nuance to fold into the existing Operator question):**


---
