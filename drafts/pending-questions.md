# Pending questions, drafts awaiting review

Questions drafted but NOT yet added to `src/data/questions.json`. Walk through
these, annotate with **keep / tweak / rewrite** and any missing detail, then
they'll be folded into the main bank.

Fields are the same as in `questions.json`, rendered for readability.

---

















## 1. `ace-adm-048`, What does `mqsirestart` do, and why is it better than `mqsistop` + `mqsistart`?

- **Product / Role / Topic:** ACE / Admin / Operations
- **Difficulty:** easy
- **Tags:** mqsirestart, mqsistop, mqsistart, operations, ibmint, wrapper

### Question
What is `mqsirestart`, where does it come from, and why is it
worth using instead of `mqsistop` followed by `mqsistart`?

### Answer, bullets
- `mqsirestart` is a community-contributed wrapper script (it
  is **not shipped** with ACE; drop the `.cmd` into
  `%MQSI_FILEPATH%/bin` alongside the built-in scripts) that
  runs `mqsistop` followed by `mqsistart` against the same
  target in one invocation
- Targets both integration **servers**
  (`mqsirestart.cmd <NodeName> --integration-server <IS>`) and
  integration **nodes** (`mqsirestart.cmd <NodeName>`). Same
  flags and syntax as the built-in commands
- Why it beats running the two commands yourself:
  - Closes the **gap between stop and start**, a gap that
    reliably gets interrupted by Slack, an incident, or the
    reflex to grab a coffee, leaving a node stopped longer than
    intended (or worse, forgotten entirely)
  - Removes the **typo surface** (`mqsistpo`, `mqsisart`) that
    costs real minutes on a Friday afternoon
  - Keeps both halves as a single auditable action in logs and
    scripts
- It is not a substitute for `mqsichangeproperties` or
  `mqsichangeflowstats` that do NOT require a restart. Use
  restart only when a restart is the actual requirement
- Check behaviour before using in production: the script
  issues `mqsistop` without special flags; if you rely on
  `mqsistop -i` (immediate) or a custom timeout in your ops
  procedure, either pass those flags or keep doing the two
  commands by hand
- Built-in `ibmint restart server` does **not exist** at the
  time of writing; the modern ibmint pattern is
  `ibmint stop server` + `ibmint start server` separately, so
  a wrapper script fills the same gap on the ibmint side too

### Explanation
`mqsirestart` is a pragmatic operator workaround for the fact
that "stop then start" is two commands you run in sequence a
dozen times a day. It removes the gap, the typos, and the
forgotten-Friday scenario by making the pair atomic from the
operator's point of view. Candidates who know it is a
community script (not shipped), who know the node / server
syntax, and who compare it to the absence of a built-in
`ibmint restart server` understand the ergonomic gap it fills.

### References
- Blog: mqsirestart (matthiasblomme)
- https://github.com/matthiasblomme/ACE_MQ_Tooling

---

## 2. `ace-adm-049`, How does `mqsistopmsgflow` differ from `ibmint stop server`?

- **Product / Role / Topic:** ACE / Admin / Operations
- **Difficulty:** medium
- **Tags:** mqsistopmsgflow, ibmint-stop-server, startmode, stopped-file, operations, lifecycle

### Question
How do `mqsistopmsgflow` and `ibmint stop server` differ, and
what are the deploy-time / restart-time follow-up pieces
needed to make a stop stick?

### Answer, bullets
- **`mqsistopmsgflow`** stops **what runs inside** a running
  integration server (applications, message flows, or all of
  them at once), without stopping the server itself. The
  server keeps running; the flow just stops processing
- Scopes:
  `mqsistopmsgflow <node> --integration-server <is>` stops
  the server; add `--application <app>` for a single app, or
  `--all-applications` for every app in that server; or go
  wider with `--all-integration-servers --all-applications`
  across the node
- **`ibmint stop server <serverName>`** stops the
  **integration server itself**. It shuts the whole process
  down (managed integration servers only, plus the required
  `integrationNodeSpec`). It is NOT an equivalent for stopping
  a single flow
- There is **no `ibmint` equivalent** for stopping an
  application or flow inside a running server; if you need
  that, `mqsistopmsgflow` is the only in-place tool. For
  declarative control at deploy time, set
  `startMode: manual|maintained` on the app / flow, or use a
  `.stopped` file
- Gotcha on re-deploy: stopping a flow with `mqsistopmsgflow`
  is not durable. The next deploy ignores your runtime stop
  and starts the flow again if its `startMode` is `automatic`.
  To keep a flow stopped across deploys, set
  `startMode: maintained` or `manual`, or drop a `.stopped`
  file in the flow's `overrides/<app>/<flow>/` directory
- Summary axis: `mqsistopmsgflow` = runtime state of something
  running inside a server; `ibmint stop server` = lifecycle of
  the server process itself; `.stopped` and `startMode` =
  deploy-time configuration. Different tools for different
  levels of the stack

### Explanation
The two commands live at different levels and are often
confused. `mqsistopmsgflow` is a runtime surgical tool for
stopping apps / flows in place without restarting the server;
`ibmint stop server` is a lifecycle tool for the server
process. Neither is durable across deploys without also using
`startMode` or a `.stopped` file. Candidates who can
articulate the three levels (in-flight runtime state vs
server lifecycle vs deploy-time config) and mention the
`.stopped` file fallback show they have operated ACE in
production, not just labs.

### References
- Blog: Keeping stuff stopped in IBM ACE (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=commands-mqsistopmsgflow-command

---

## 3. `ace-dev-047`, What is Project Bob, and where does it fit compared with a generic Copilot for modernising ACE code?

- **Product / Role / Topic:** ACE / Dev / Tooling
- **Difficulty:** easy
- **Tags:** project-bob, ai, modernization, java-17, watsonx, toolkit

### Question
What is Project Bob, when is it a better fit than a generic
Copilot for ACE modernisation, and how does it relate to
Watsonx Code Assistant in the Toolkit?

### Answer, bullets
- **Project Bob** is IBM's AI-first IDE, launched publicly at
  TechXchange 2025, aimed at **code modernisation**: refactor,
  test, document, and deploy existing codebases rather than
  greenfield scaffolding
- Treats Java as a first-class citizen, which maps directly
  onto the v13 migration story: Java 17 cleanup
  (`javax.xml.bind.*` removals, `DatatypeConverter`, JNA
  version bumps, old JSoup / Jackson / Auth0 JWT / PDFBox),
  per-project trackers, first-pass identification of the
  usual suspects
- Where Bob beats a generic Copilot for ACE work:
  - Opinionated on **modernisation workflows** (upgrade paths,
    deprecation sweeps, test-coverage fill-in) rather than just
    "complete this function"
  - **Integrated with ACE tooling** rather than being a
    language-only assistant; understands project layouts like
    shared libraries, policies and BAR structure
  - Produces **trackers and diffs** you can hand to a
    reviewer, not just inline suggestions
- What it does not try to replace: the human pass at the end,
  a candidate who has seen the code. Bob is a force multiplier
  on the repetitive Java 17 cleanup and test backfill, not a
  one-click migration button
- Compare with embedded **Watsonx Code Assistant** in the
  Toolkit (v13): WCA lives inside the Toolkit for in-flow
  assistance (explain ESQL, generate Java snippets, produce
  schema sample data, write unit tests). Bob is a standalone
  IDE for larger modernisation projects. They overlap but do
  not conflict
- Both require extra subscriptions; Bob is the external
  modernisation-focused tool, WCA is the embedded Toolkit
  assistant

### Explanation
Project Bob is the IBM-branded answer to "there is a lot of
old Java and ESQL in our ACE estate, can AI help with the
first pass of modernisation". Generic Copilot is good at
autocomplete but does not understand ACE's project layout or
its Java 17 migration list; Bob does. The interview signal is
whether the candidate frames Bob as "force multiplier for
modernisation, not a magic button", knows it is separate from
the Toolkit-embedded Watsonx Code Assistant, and understands
the subscription shape.

### References
- Blog: IBM TechXchange 2025, Orlando (matthiasblomme)
- Blog: Migrating ACE to v13 (matthiasblomme)
- https://bob.ibm.com/

---

## 4. `ace-adm-050`, What is the ACE Agent Preview in the Dashboard, and what are its constraints?

- **Product / Role / Topic:** ACE / Admin / AI
- **Difficulty:** easy
- **Tags:** ace-agent, dashboard, watsonx, preview, container, ai

### Question
What does the ACE Agent Preview do, which runtime surface does
it attach to, and how should you treat its "preview" status?

### Answer, bullets
- The **ACE Agent Preview** is a chat-style interface inside
  the App Connect **Dashboard** that lets you query your App
  Connect environment in natural language. Typical questions:
  list integration runtimes and versions, show deployed
  integrations and their dependencies, highlight resource
  usage or topology, surface documentation or troubleshooting
  guidance
- Responses are generated by large language models hosted
  through **watsonx.ai**, so an outbound channel to watsonx
  is a prerequisite, along with the relevant entitlement
- Availability constraint: **container environments only**
  (ACE Operator-deployed Dashboards on OpenShift / CP4I /
  vanilla Kubernetes). Not available on on-prem Windows /
  Linux Toolkit-style installs
- Status: **preview**, not GA. API / behaviour can shift
  between fix packs, it is intended for exploration rather
  than as a foundation for operational automation, and support
  posture is not the same as a GA feature
- Positioning: complements the Dashboard, does not replace it.
  The agent surfaces information the Dashboard already has, in
  a conversational form, for rapid exploration. Do not script
  runbooks around it until it goes GA
- Related v13 AI features worth distinguishing: the
  **Toolkit-embedded Watsonx Code Assistant** (chat inside the
  Toolkit, development-time, separate subscription) and
  **Project Bob** (standalone modernisation IDE). Three
  separate tools, three different audiences (developer in
  Toolkit, modernisation lead in Bob, operator in Dashboard
  Agent Preview)

### Explanation
Agent Preview is the operator-facing AI feature of ACE 13,
and like most preview features it is deliberately bounded:
containers only, watsonx-backed, not for automation. The
interview signal is knowing those three constraints
(container-only, preview, watsonx dependency) and being able
to distinguish it from WCA in the Toolkit and from Project
Bob. Candidates who treat it as "chat on top of the Dashboard
for exploration" and not "Ops AI that runs runbooks" are
reading the preview label correctly.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=app-connect-enterprise-agent-preview

---

## 5. `ace-adm-051`, What is the MCP (Model Context Protocol) feature in ACE v13.0.7.0, and how does it expose REST APIs?

- **Product / Role / Topic:** ACE / Admin / AI
- **Difficulty:** medium
- **Tags:** mcp, model-context-protocol, ai, agent, rest-api, v13, dashboard

### Question
What does ACE's v13.0.7.0 MCP support do, how does the
Dashboard workflow turn a REST API into an MCP server, and
how does it pair with Agent Preview?

### Answer, bullets
- **MCP (Model Context Protocol)** is an open protocol that
  lets AI agents call "tools" in a typed, discoverable way.
  ACE v13.0.7.0 adds support for **exposing any deployed
  REST API as an MCP server**, so AI agents can invoke your
  ACE-hosted APIs as first-class tools
- Workflow in the Dashboard: a new **MCP icon** opens a new
  **MCP Dashboard**. Click **Create MCP server**, a wizard
  opens, pick any deployed REST API from any active
  integration server, and the Dashboard converts it into an
  MCP server exposing the API's operations as MCP tools
- The underlying REST API is unchanged: same BAR, same
  integration server, same endpoints. MCP adds a translation
  layer that advertises the operations to agents in the MCP
  tool format, with the proper input / output schemas derived
  from the REST definition
- What this unlocks: an AI agent (Claude, a watsonx.ai agent,
  an MCP-aware IDE) can call your integration flows without a
  custom integration layer. Your existing REST API is the
  tool; no extra code
- Security considerations still apply: the MCP server inherits
  the auth posture of the underlying REST API (API key, OAuth,
  etc. as configured on the REST API or its HTTPS listener).
  The MCP layer does not replace or relax that
- Positioning: this is the inverse of v13's Agent Preview
  (which is ACE calling watsonx). MCP support is **other
  agents calling ACE**. Pair them and ACE sits on both sides
  of the agent boundary

### Explanation
MCP support from 13.0.7.0 is IBM's bet on MCP as the standard
agent-tool interop protocol. The convenient bit is that you
do not have to write an MCP server from scratch; the Dashboard
wraps an existing REST API and exposes it as one. Candidates
who frame this as "AI agents calling ACE-hosted APIs as
tools, the inverse of Agent Preview which is ACE calling
watsonx", mention that the underlying REST API is unchanged,
and understand that auth is inherited from the REST side are
reading the feature correctly.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=new-whats-app-connect-enterprise

---

## 6. `ace-adm-052`, IIB 10 to ACE v13: how are configurable services migrated, and what practical issue comes with the automation?

- **Product / Role / Topic:** ACE / Admin / Migration
- **Difficulty:** medium
- **Tags:** migration, iib10, configurable-services, policies, ibmint-extract, node-scope

### Question
When migrating from IIB 10 to ACE v13, how are configurable
services transformed, and what practical fix-up do you need to
plan for after the extract runs?

### Answer, bullets
- **Configurable services are gone in v13.** The v13 world is
  policies (`.policyxml`), not configurable services. Anything
  IIB 10 expressed as a configurable service needs a policy
  equivalent on the target
- **`ibmint extract node` does the rewrite automatically.**
  Configurable-service definitions are extracted and converted
  to policy files as part of the extract output. You do not
  write the policies by hand
- **But the generated policies land node-wide, not
  server-scoped.** All policies come out at the node level, even
  ones that only one server actually uses. Same behaviour
  existed on the IIB 10 to v12 path
- **Consequence:** functionally correct but messy. Every
  integration server sees every policy, including ones for
  unrelated applications, which muddies ownership and makes the
  policy list harder to reason about
- **Fix-up pass after extract:** split the generated policy set
  and move each policy onto the server that uses it. Boring but
  worth doing once, before the node grows and the relocation
  gets harder. Especially important if you run multiple apps
  per server with distinct security or resource policies

### Explanation
IIB 10 migration to v13 has one real gotcha beyond Java 17
cleanup: `ibmint extract` translates configurable services to
policies automatically, but it does so at node scope, not at
the specific-server scope where the underlying configurable
service lived. The result is a pile of node-wide policies,
which works but is not how you would structure it if writing
from scratch. Candidates who know about this wrinkle, and say
they budget an explicit fix-up pass to split and relocate, have
done the migration for real.

### References
- Blog: Migrating ACE to v13 (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=130-performing-in-place-migration-integration-node

---

## 7. `ace-adm-053`, Which command pins an integration server to a specific JRE version in ACE v13?

- **Product / Role / Topic:** ACE / Admin / Migration
- **Difficulty:** easy
- **Tags:** migration, java-8, java-17, ibmint, specify-jre, mcq
- **answerType:** single

### Question
Which command pins an integration server to a specific JRE
version (Java 8 or Java 17) in ACE v13?

### Choices

- `mqsispecifyjre`, **wrong.** No such `mqsi*` command exists.
  The `mqsi*` family never had a per-server JRE selector; Java
  selection in older versions was via `mqsichangebroker` flags
  or `MQSI_FORCE_JVM` style environment variables, not a
  dedicated command
- `ibmint set java`, **wrong.** `ibmint set` is a real
  subcommand family (`ibmint set credential`,
  `ibmint set webuser-password`, etc.), but there is no
  `set java` variant. Plausible-sounding distractor for
  candidates who know `ibmint set credential` exists
- `ibmint specify jre`, **correct.** Syntax:
  `ibmint specify jre --version 8|17 --integration-node <n> --integration-server <s>`
  (node-managed) or `--work-directory <d>` (independent).
  Writes `server.java.yaml` next to the server config; change
  takes effect on the next server start. Revert with the same
  command plus `--default`
- `mqsirevertjava`, **wrong.** Invented name. The revert
  mechanism is `ibmint specify jre --default`, not a separate
  command, and the `mqsi*` family never had a paired-revert
  command for JVM selection

### Answer, bullets
- `ibmint specify jre` is the only supported way to pin an
  integration server's JRE in v13
- Writes the choice into `server.java.yaml` next to the server
  config; takes effect on the next server start
- Supports `--version 8|17`, or `--default` to revert to the
  shipped default
- Scope is per-server (or per-work-directory for independent
  servers), not node-wide

### Explanation
The `ibmint` command family replaced the old `mqsi*`-style
broker admin commands for most v12+ operations, and
`specify jre` is the one that sets per-server JVM selection.
Candidates who pick `ibmint specify jre` have used the command;
candidates picking `mqsispecifyjre` or `mqsirevertjava` are
pattern-matching on the old `mqsi*` naming scheme that does
not apply here.

### References
- Blog: Migrating ACE to v13 (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=migrating-app-connect-enterprise-130

---

## 8. `ace-adm-054`, Which of these are documented IBM migration styles for moving to ACE v13? (multi-select MCQ)

- **Product / Role / Topic:** ACE / Admin / Migration
- **Difficulty:** easy
- **Tags:** migration, v13, in-place, parallel, extract, mcq
- **answerType:** multi

### Question
Which of these are documented IBM migration styles for moving
an existing estate to ACE v13? (select all that apply)

### Choices

- `in-place migration`, **correct.** Migrate the integration
  node on the same machine, keeping the same name.
  `ibmint extract node --overwrite-existing` replaces the old
  node with a v13 node in the same spot
- `parallel migration`, **correct.** Stand up a new v13
  integration node beside the old one and move application
  logic across at your own pace. Lets you test old and new
  side by side until you cut over
- `shadow migration`, **wrong.** Invented distractor, not a
  documented ACE migration style. Sounds plausible because it
  echoes real terms elsewhere, but no migration path of this
  name exists in the ACE catalog
- `wave migration`, **wrong.** Invented distractor, not a
  documented ACE migration style
- `extract migration`, **correct.** Use `ibmint extract node`
  or `ibmint extract server` to pull configuration and
  resources out as files, then redeploy them into a fresh v13
  environment, usually as independent integration servers

### Answer, bullets
- IBM documents exactly three migration styles: **in-place**,
  **parallel**, and **extract**
- The three styles differ in where the target lives (same
  machine vs beside it vs fresh environment) and how much
  old-and-new coexistence you get
- Extract is the flexible one: the same `ibmint extract`
  command can feed in-place swaps, parallel setups, or a clean
  split into independent integration servers
- Any other style name in this space is a distractor and
  should be rejected

### Explanation
IBM names three migration styles: in-place, parallel, and
extract. The other two options in the list are made-up
distractors that sound plausible to a candidate pattern-matching
on familiar-sounding words. Picking all three real styles is the
safe answer.

### References
- Blog: Migrating ACE to v13 (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=migrating-app-connect-enterprise-130

---

## 9. `ace-dev-048`, How do you do 2-phase commit with Kafka in ACE?

- **Product / Role / Topic:** ACE / Dev / Kafka
- **Difficulty:** medium
- **Tags:** kafka, transactions, 2pc, xa, transactional-id, mq, database

### Question
A flow consumes from Kafka, writes to a database, and publishes
to MQ. Can you commit all three atomically? How does ACE
coordinate Kafka transactions with other resource managers?

### Answer, bullets
- **Short answer: you cannot.** IBM's Transactional messaging
  with Kafka doc is explicit that "the IBM App Connect
  Enterprise Kafka nodes do not support 2-phase commit". Kafka
  is not an XA resource manager; ACE does not coordinate it
  with MQ or database transactions
- **What you get instead in a mixed flow:** each resource
  manager runs its own independent transaction. Kafka commits
  / rolls back at end-of-flow; MQ commits / rolls back at
  end-of-flow; the database commits / rolls back at
  end-of-flow. Each commits or rolls back independently. If
  one fails after others have committed, you have a partial
  outcome to clean up
- **Kafka-internal transactions are real, just not XA-bridged.**
  Set `Transaction Mode: Yes` and a non-empty `Transactional Id`
  on the KafkaProducer to publish transactionally. Multiple
  KafkaProducer nodes in the same flow with the same
  `Transactional Id` join the same Kafka transaction; different
  Ids = different transactions, each committed independently.
  `Transaction Mode: Automatic` reads the `Transactional`
  property from the message Properties folder
- **Same-Id consumer + producer = atomic Kafka request/reply.**
  Setting the same `Transactional Id` on a KafkaConsumer + a
  KafkaProducer in the same flow makes the consume + produce
  occur or both not occur, the canonical Kafka request/reply
  atomicity pattern. Validation throws an exception if the two
  nodes have incompatible config (bootstrap servers, client
  Id, etc.)
- **Multi-instance gotcha:** if a flow with `Transactional Id`
  set runs additional instances, ACE suffixes the Id with a
  thread identifier per thread to keep transactions distinct.
  You do not have to do this yourself. But you cannot reuse the
  same `Transactional Id` across different message flow
  instances; the transaction is scoped within the flow instance
- **Transaction timeout** is a Kafka-side timeout: if commit
  takes longer than this from the start of the transaction,
  Kafka rolls it back automatically. Tune to match the longest
  realistic flow execution
- **Design pattern when you need cross-RM atomicity:** use the
  transactional outbox pattern, idempotent consumers with
  deduplication, or saga-style compensations. ACE itself
  cannot give you Kafka + MQ + DB in a single 2PC; the
  application has to design around it

### Explanation
The honest answer to "how do I do 2PC with Kafka in ACE?" is
"you do not". Kafka is not an XA resource manager and ACE is
explicit about not coordinating Kafka with MQ or database
transactions. Within Kafka itself you do get transactional
producers + consumers, including the same-`Transactional Id`
pattern that makes consumer + producer atomic in a request/reply
flow, and that is the right answer to "atomicity within Kafka".
Across resource managers, you design around it (outbox,
idempotent consumers, sagas). Candidates who confidently say
"yes, set the transaction node" without flagging the no-2PC
limitation have not hit a partial-outcome incident yet.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0?topic=kafka-transactional-messaging
- https://www.ibm.com/docs/en/app-connect/13.0?topic=nodes-kafkaproducer-node
- https://www.ibm.com/docs/en/app-connect/13.0?topic=nodes-kafkaconsumer-node

---

## 10. `ace-dev-049`, What is the default read mode (isolation level) for KafkaConsumer in ACE?

- **Product / Role / Topic:** ACE / Dev / Kafka
- **Difficulty:** easy
- **Tags:** kafka, kafkaconsumer, kafkaread, isolation-level, read-uncommitted, read-committed

### Question
What is the default Isolation Level for the KafkaConsumer
node, what other value is supported, and what is the practical
difference?

### Answer, bullets
- The KafkaConsumer node's **`Isolation Level`** property
  controls which messages from transactional producers are
  delivered to the consumer
- **Default is `read_uncommitted`.** The consumer receives
  messages as soon as they are published, **without waiting**
  for the publisher's transaction to commit. If the publisher
  later rolls back, the consumer has already seen and possibly
  processed a message that "did not happen"
- **Alternative is `read_committed`.** The consumer only
  receives messages from committed transactions; it blocks on
  uncommitted messages in the partition until they are
  committed or rolled back. This is what you want when
  end-to-end exactly-once semantics matter
- The same `Isolation Level` property is on the **KafkaRead**
  node and behaves identically
- Practical implication of the default: a fresh KafkaConsumer
  pointed at a topic written to by a transactional producer
  will not give you "exactly once" semantics out of the box.
  Flip to `read_committed` to honour the publisher's
  transaction boundary
- Pair `read_committed` with a transactional `Commit Message
  offset` mode (`Transactionally`) on the consumer if you want
  the read offset itself to participate in a Kafka transaction;
  otherwise the offset is saved separately by the consumer's
  own commit policy

### Explanation
The default catches people: ACE's KafkaConsumer is set to
`read_uncommitted`, which means a transactional producer's
in-flight messages reach the consumer immediately. If the
producer rolls back, the consumer has already acted on a
message that should never have been visible. The fix is one
property flip to `read_committed`. Candidates who know the
default value and the Kafka transactional contract behind it
have run real exactly-once flows; candidates who say "Kafka
just gives you exactly-once if you set transactional support"
without naming the consumer side have read the marketing but
not the docs.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0?topic=kafka-transactional-messaging
- https://www.ibm.com/docs/en/app-connect/13.0?topic=nodes-kafkaconsumer-node

---

## Already covered

- "How do you process big files in ACE?", covered by `ace-dev-016`
  ("How do you handle very big files in an ACE flow?"). If the existing
  answer feels incomplete, edit it in place rather than adding a
  duplicate.
- Item #66 from `drafts/blog-sourced-candidates.md` (Global Cache
  embedded / Redis), covered by `ace-dev-034` (graduated in the
  most recent commit). If you want the blog-post wording reflected,
  edit `ace-dev-034` rather than adding a duplicate.
