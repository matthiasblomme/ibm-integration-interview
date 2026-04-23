# Pending questions, drafts awaiting review

Questions drafted but NOT yet added to `src/data/questions.json`. Walk through
these, annotate with **keep / tweak / rewrite** and any missing detail, then
they'll be folded into the main bank.

Fields are the same as in `questions.json`, rendered for readability.

---

## 1. `ace-dev-026`, Where is the Switch Server managed in a SaaS setup?

- **Product / Role / Topic:** ACE / Dev / Callable flows
- **Difficulty:** medium
- **Tags:** callable-flow, switch-server, saas, ace-as-a-service

### Question
Where is the Switch Server managed when you use App Connect as a SaaS
offering (App Connect on IBM Cloud / ACEaaS)?

### Answer, bullets
- In an on-prem / self-hosted deployment, **you** deploy and run the Switch
  Server, typically as its own process or container, and both endpoints
  (cloud-side and on-prem-side) register with it
- In a **SaaS / ACEaaS** deployment, the Switch Server is **managed by IBM
  as part of the service**: you don't run one yourself
- You still register your on-prem integration(s) as callable-flow endpoints,
  but they dial out to IBM's managed switch rather than to one you host
- Consequence: fewer moving parts on the customer side, but the switch is
  now part of IBM's availability story, not yours, know the SaaS SLA
- Credentials / endpoint identities still belong to you; the switch routes,
  but doesn't own the callable-flow content

### Explanation
The Switch Server is the rendezvous point that lets on-prem and cloud
flows call each other without opening inbound firewall holes. Who runs it
changes with the deployment model: on-prem = you run it; SaaS = IBM runs
it. For candidates, the tell is that they distinguish 'who manages the
switch' from 'what the switch does', the pattern is the same, ownership
and SLA differ.

### References
- (pending) https://www.ibm.com/docs/en/app-connect/13.0.x, switch server topic

---

## 2. `ace-dev-027`, Fried vs baked processing in App Connect

- **Product / Role / Topic:** ACE / Dev / Deployment
- **Difficulty:** medium
- **Tags:** deployment, container, image, bar, config

### Question
What do "fried" and "baked" processing mean in App Connect, and when would
you choose one over the other?

### Answer, bullets
- **Baked**: everything the integration needs (BAR files, `server.conf.yaml`,
  policies, libraries, credentials' structure) is built INTO the container
  image at image-build time. Starting the container is all you need; nothing
  is pulled in at runtime
- **Fried**: the image is a minimal runtime base and the content (BARs,
  config, policies) is injected at deploy time or pulled in at startup from
  a ConfigMap, volume, artifact repo or the ACE Dashboard
- Spectrum, not a binary: many real deployments are **semi-baked**: base
  libraries and config baked, BARs injected
- **Baked wins on** immutability, reproducibility, air-gapped environments
  and GitOps workflows where image tag = promotable artefact
- **Fried wins on** image reuse (same image across many apps), faster
  iteration when only BARs change, and scenarios where multiple teams share
  a standard runtime image
- In CP4I / Operator setups, the IntegrationServer CRD lets you mix: point
  at a standard image, attach BARs via configuration, that's the fried /
  semi-baked pattern

### Explanation
'Fried' and 'baked' are shorthand for where content is combined with the
runtime: at image build (baked) or at deploy/start (fried). They're two
ends of a spectrum, and most real setups sit in between. Candidates who
articulate the trade-offs (immutability and traceability vs flexibility
and image reuse) and can place a real deployment on the spectrum have
thought about this rather than repeated a slogan.

### References
- (pending) IBM App Connect container deployment docs

---

## 3. `ace-dev-028`, Grouping nodes in ACE

- **Product / Role / Topic:** ACE / Dev / Patterns
- **Difficulty:** medium
- **Tags:** collector, group, aggregation, flow-pattern

### Question
What are grouping nodes used for in ACE?

### Answer, bullets
- **Collector node** is the main grouping node, it aggregates multiple
  incoming messages into a single output message based on a configured
  criterion (count, time window, or correlation key)
- Typical uses: wait for N related messages before processing, batch
  up a stream of records, fan-in after a fan-out pattern, or correlate
  messages arriving from different sources
- Collection completion triggers a single downstream propagation carrying
  the whole group, rather than per-message propagation
- The node persists partial collections (so completion can span flow
  restarts) and exposes timeouts so incomplete groups don't hang forever
- Use cases: 'process a customer's orders as a batch', 'wait for all
  three upstream feeds before enriching', 'daily aggregation before
  sending to downstream'

### Explanation
Grouping is the ACE pattern for moving from 'one message at a time' to
'think about a set of messages as a unit'. The Collector node is the
workhorse here, configure the criterion, handle partial-group timeouts,
and downstream code gets a single grouped event instead of N separate
ones. Important to know because it's easy to reinvent (and get wrong) if
you haven't used Collector.

### References
- (pending) IBM ACE Collector node docs

---

## 4. `ace-dev-029`, Sequencing nodes in ACE

- **Product / Role / Topic:** ACE / Dev / Patterns
- **Difficulty:** medium
- **Tags:** sequence, resequence, ordering, flow-pattern

### Question
What are sequencing nodes used for in ACE?

### Answer, bullets
- Two nodes work as a pair: **Sequence** stamps an ordering number onto
  each message as it passes; **Resequence** reorders messages back into
  that stamped order downstream
- Use when processing between the two nodes runs in parallel (multiple
  additional instances, parallel paths) but the downstream consumer
  requires the original order
- Typical pattern: Input → Sequence → parallel-enrichment → Resequence →
  Output
- Resequence buffers out-of-order messages until the expected next
  sequence number arrives; you configure buffer size and timeouts
- Without this pattern you have to choose between ordering and
  parallelism, sequencing nodes let you have both, at the cost of a
  reordering buffer

### Explanation
Sequencing nodes solve the classic tension between 'process in parallel
for throughput' and 'preserve order for downstream correctness'. Sequence
brands each message with a number; Resequence uses that brand to restore
order after whatever parallel work happened between. The catch is buffer
sizing and timeout, a stuck message in the middle can stall the
reordering window, so tune for your worst-case slow path.

### References
- (pending) IBM ACE Sequence / Resequence node docs

---

## 5. `ace-dev-030`, Which parser to use for CSV in ACE

- **Product / Role / Topic:** ACE / Dev / Parsers
- **Difficulty:** easy
- **Tags:** parser, dfdl, csv, tds, mrm

### Question
Which parser do you use to parse CSV in ACE?

### Answer, bullets
- **DFDL** is the modern, recommended answer, define a DFDL schema that
  describes the CSV (record separator, field separator, quote character,
  header row handling, field types) and parse with the DFDL parser
- **MRM with a TDS (Tagged/Delimited String) physical format** is the
  legacy approach, still supported for old message sets but functionally
  deprecated for new work
- **BLOB** if you're passing CSV through without reading it, no parsing,
  best performance
- Don't try to write a CSV parser by hand in ESQL: DFDL handles escaped
  quotes, line endings, optional fields and headers correctly, and you
  keep the structure visible in a schema rather than buried in code
- A DFDL CSV schema is reusable across flows and can ship in a shared
  library

### Explanation
CSV is the textbook DFDL use case, delimited text, optional header,
field types, quoting. New projects should default to DFDL; MRM/TDS is
legacy and shouldn't be the answer for a greenfield flow. If you don't
need to read the body, BLOB still wins on performance.

### References
- (pending) IBM ACE DFDL modelling guide

---

## 6. `ace-adm-020`, Which runtimes are available in App Connect

- **Product / Role / Topic:** ACE / Admin / Runtimes
- **Difficulty:** easy
- **Tags:** aceaas, designer, operator, runtime, iPaaS

### Question
Which runtimes are available in the App Connect family?

### Answer, bullets
- **App Connect Enterprise (ACE), on-prem**: the traditional installed
  runtime on Linux/Windows; Integration Node and/or Standalone Integration
  Server
- **ACE Certified Container (ACECC)**: official container image of the
  ACE runtime; you choose version and build on top
- **App Connect Operator**: Kubernetes/OpenShift operator managing ACE
  resources via CRDs (IntegrationServer, Dashboard, DesignerAuthoring,
  SwitchServer, Configuration); the standard CP4I deployment
- **App Connect as a Service (ACEaaS) / App Connect on IBM Cloud**: IBM-managed SaaS; you author integrations and IBM runs the runtime,
  including the Switch Server for callable flows
- **App Connect Designer**: low-code browser-based designer and light
  runtime; ships both as a SaaS and as a DesignerAuthoring resource on the
  operator
- Key point for interviews: 'App Connect' is a product family, not a
  single runtime, the right answer depends on where the customer is
  running

### Explanation
Candidates sometimes conflate 'App Connect' with 'ACE'. The family covers
on-prem ACE, containerised ACE (certified container + operator), SaaS
(ACEaaS, Designer), and the low-code Designer experience. Being able to
name them and say which is appropriate for which deployment pattern shows
you've seen more than one.

### References
- (pending) IBM App Connect product family overview

---

## 7. `ace-adm-021`, What is the App Connect Operator

- **Product / Role / Topic:** ACE / Admin / Operator
- **Difficulty:** medium
- **Tags:** operator, cp4i, openshift, crd, olm

### Question
What is the App Connect Operator and what is it used for?

### Answer, bullets
- A **Kubernetes/OpenShift operator**: software that extends the cluster
  API with custom resources (CRDs) so App Connect artefacts are managed
  declaratively like any other k8s resource
- Provides CRDs for the key App Connect components:
  **IntegrationServer**, **Dashboard**, **DesignerAuthoring**,
  **SwitchServer**, **Configuration**
- You describe the desired state in YAML (`kind: IntegrationServer …`)
  and the operator handles deploy, upgrade, lifecycle, service creation,
  storage provisioning and health monitoring
- Delivered via OLM channels (LTS / CD) with subscription-based upgrades ,
  separate from the on-prem ACE release model (see the operator-release
  question)
- Standard way to run ACE on Red Hat OpenShift / Cloud Pak for Integration;
  works on vanilla Kubernetes too
- Benefits: declarative config, GitOps-friendly, consistent with other
  CP4I products, shifts lifecycle work from manual scripts into the
  cluster itself

### Explanation
The operator is how you run ACE 'the Kubernetes way', you author YAML
describing what you want, the operator reconciles reality to match. It's
what makes declarative, GitOps-driven ACE deployments practical on
OpenShift/CP4I. Good partner question to the operator-release-model one
already in the bank: this is 'what is it', that is 'how is it shipped'.

### References
- (pending) IBM App Connect Operator overview

---

## 8. `ace-dev-031`, ESQL `[>]` and `[<]` in the logical tree (and building object arrays)

- **Product / Role / Topic:** ACE / Dev / ESQL
- **Difficulty:** medium
- **Tags:** esql, logical-tree, indexing, array, json

### Question
In ESQL, when do you use the `[>]` or `[<]` operator on a tree path, and
how do they help when building an array of JSON objects?

### Answer, bullets
- `[>]` and `[<]` are **index qualifiers** used when navigating or
  assigning to repeating tree elements (arrays)
- `[>]`, "last" / "after the last". When reading, it refers to the last
  occurrence. When assigning, it creates a **new occurrence at the end**
- `[<]`, "first" / "before the first". When reading, it refers to the
  first occurrence. When assigning, it creates a **new occurrence at the
  beginning**
- Typical use: appending a new item to an output array without knowing
  how many are already there:
  `SET OutputRoot.XMLNSC.Root.Item[>] = ...`
- Contrast with `[N]` (position N) and `[=N]` (exactly position N) ,
  `[>]` / `[<]` are positional relative to the current set rather than
  absolute
- **Building an array of JSON objects**: the idiomatic pattern is:
  `CREATE LASTCHILD OF OutputRoot.JSON.Data.Items NAME 'Item';` to open
  the array element, then `CREATE LASTCHILD OF OutputRoot.JSON.Data.Items.Item[<]`
  to add each nested field to the newly-created last item. Repeat per
  record from the source
- Common pattern in transformation flows: loop over an input array, push
  each shaped output element with `Target.Items.Item[>]`

### Explanation
These operators let ESQL build up arrays in the output tree without
tracking indices by hand. The mnemonic: `>` points past the last element
(append), `<` points before the first (prepend). Most of the time you'll
see `[>]` in output-building code and `[<]` / `[N]` when reading or
pushing into the newly-created last record. Building a JSON array of
objects is exactly this pattern: `CREATE LASTCHILD` to add the outer
Item, then use `Item[<]` to populate fields on that latest item.
Candidates who use these fluently have written non-trivial ESQL
transforms, beginners tend to increment their own counters or end up
with malformed arrays.

### References
- (pending) IBM ACE ESQL reference, element indexing

---

## 10. `ace-dev-032`, Setting message persistence on an ACE MQOutput node

- **Product / Role / Topic:** ACE / Dev / MQ
- **Difficulty:** easy
- **Tags:** persistence, mqoutput, mqmd, defpsist

### Question
How do you set message persistence on an ACE MQOutput node, and how do
the options behave?

### Answer, bullets
- The **MQOutput node's `Persistence mode` property** controls how the
  outgoing message's `MQMD.Persistence` is set. Three values:
  - **Yes**: put the message persistently (`MQPER_PERSISTENT`)
  - **No / Not persistent**: put non-persistently (`MQPER_NOT_PERSISTENT`)
  - **Automatic**: carry the persistence from the incoming message's MQMD
    (useful when the flow is passing messages through unchanged)
  - **As Defined for Queue**: set `MQPER_PERSISTENCE_AS_Q_DEF`, so the
    queue's DEFPSIST provides the default at put time
- Setting **Yes** here is the easiest, most explicit way to ensure a flow
  produces persistent messages regardless of what the queue's DEFPSIST is
- **Automatic** is handy for bridge / relay flows: the output inherits
  whatever the input message was, preserving sender intent
- **As Defined for Queue** leaves persistence to the queue default, fine
  when your estate has disciplined DEFPSIST values, risky when teams
  change queue attributes without touching flows
- Pair with the MQOutput node's Transaction setting + a transactional
  input for the full persistent-and-atomic behaviour
- Same model applies to MQReply / MQPublication nodes

### Explanation
In ACE, you rarely touch `MQMD.Persistence` directly, you set it
declaratively via the MQOutput node's Persistence mode. 'Yes' is the
clearest choice when the flow owns the decision; 'Automatic' is right
for pass-through / relay flows; 'As Defined for Queue' defers to
DEFPSIST, which is convenient but couples flow behaviour to queue
config. Know all four and be explicit about which one you'd pick for
a given flow.

### References
- (pending) IBM ACE MQOutput node, Persistence mode property
- https://www.ibm.com/support/pages/ibm-mq-message-persistence-faqs

---

## 9. `ace-adm-022`, Transformation Advisor

- **Product / Role / Topic:** ACE / Admin / Migration
- **Difficulty:** medium
- **Tags:** transformation-advisor, migration, cp4i, modernization

### Question
What is the Transformation Advisor tool and what is it used for?

### Answer, bullets
- **IBM Cloud Transformation Advisor**: a tool that analyses existing
  workloads (WebSphere Java apps, IIB / ACE integrations, messaging
  estates) and recommends a modernization path
- Outputs per application/integration: complexity assessment, estimated
  migration effort, issues flagged (deprecated features, incompatibilities),
  and a suggested target (Liberty, ACE on containers, CP4I, etc.)
- Works against collected data from the source environment, you run a
  data collector against the existing install, upload the results, and the
  advisor produces the reports
- Typical use: planning a lift-and-shift from on-prem WebSphere/IIB to
  Cloud Pak for Integration or a public-cloud Kubernetes platform
- Not a runtime tool, it's a **pre-migration analysis tool** that shapes
  scope, effort estimates and risk for the migration project itself
- Often used alongside MQ's own migration assessments and the ACE
  migration docs to build a consolidated programme plan

### Explanation
Transformation Advisor is the 'know-before-you-start' tool for IBM
middleware modernisation, you feed it your current estate, it tells you
what each workload looks like on the scale of 'trivial to migrate' to
'rewrite'. Candidates who've used it for a real CP4I rollout will mention
data-collector output, per-app complexity scoring, and the gap between
what the tool flags automatically and what still needs a human eye.

### References
- (pending) IBM Cloud Transformation Advisor docs
