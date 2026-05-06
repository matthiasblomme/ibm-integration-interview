# Pending questions, drafts awaiting review

Questions drafted but NOT yet added to `src/data/questions.json`. Walk through
these, annotate with **keep / tweak / rewrite** and any missing detail, then
they'll be folded into the main bank.

Fields are the same as in `questions.json`, rendered for readability.

---











## 1. `ace-dev-041`, What is the `Item` element in ACE's JSON-array representation, and why is it needed?

- **Product / Role / Topic:** ACE / Dev / ESQL
- **Difficulty:** easy
- **Tags:** esql, json, array, item, identity, message-tree

### Question
Why does ACE use a special `Item` element when representing
JSON arrays in the message tree, and what happens on the wire?

### Answer, bullets
- JSON array entries are **anonymous** in the wire format (no
  name, only an ordinal position), but ACE's message tree is a
  **named-element** model. To bridge that, ACE requires each
  array entry to have the special name **`Item`** under an
  `IDENTITY(JSON.Array)` parent
- The JSON serializer **ignores** the `Item` names on output:
  the wire format comes out as a normal JSON array. It is
  purely an internal convention for the tree, not something
  that leaks into the payload
- Canonical append pattern:
  `CREATE FIELD OutputRoot.JSON.Data.myArray IDENTITY(JSON.Array)myArray;`
  then
  `CREATE LASTCHILD OF OutputRoot.JSON.Data.myArray NAME 'Item' VALUE 'v1';`
  (or `TYPE NameValue NAME 'Item' VALUE 42`). Repeat per
  element, order is preserved
- Direct-index pattern works too:
  `SET OutputRoot.JSON.Data.myArray.Item[1] = 'v1';` etc. Gaps
  in the indices cause an array-subscript error; use
  `CREATE LASTCHILD` to avoid worrying about numbering
- For an array of **objects** (not scalars), create the `Item`
  first, then its children:
  `CREATE LASTCHILD OF ... NAME 'Item';` then
  `CREATE LASTCHILD OF ....Item[<] NAME 'key' VALUE 'v'`. The
  `[<]` refers to the just-created last item
- Common mistake: naming the array entries after the data
  (e.g. `order`, `row`) instead of `Item`. The tree accepts
  it, but the JSON serializer emits an object (not an array)
  because the `IDENTITY(JSON.Array)` + `Item` pair is what
  triggers array formatting

### Explanation
The `Item` element is the tell-tale that someone has actually
built JSON arrays in ESQL: the message tree is named so array
entries need a name, but wire JSON arrays are anonymous so ACE
strips the name on output. Once you know the convention,
building arrays is routine; miss it and your output looks like
an object of one key or fails to serialise as an array. Pair
this with `IDENTITY(JSON.Array)` and either `CREATE LASTCHILD`
(clean) or `Item[N]` with contiguous indices (error-prone).

### References
- Blog: Create JSON Arrays in ESQL and Java (matthiasblomme)

---

## 2. `ace-dev-042`, Why is `CREATE FIELD ... IDENTITY(JSON.Array)` necessary when preparing JSON array output in ESQL?

- **Product / Role / Topic:** ACE / Dev / ESQL
- **Difficulty:** easy
- **Tags:** esql, json, identity, array, select, row, the

### Question
What does `IDENTITY(JSON.Array)` do when preparing a JSON array
output in ESQL, and how does it combine with `SELECT`, `ROW`
and `THE`?

### Answer, bullets
- Without `IDENTITY(JSON.Array)` on the parent element, the
  JSON serializer has no way to distinguish "a single object
  with repeated keys" from "a JSON array". It defaults to object
  shape and either emits strange output (one key repeated, or
  the last value winning) or raises a serialisation error
- The `IDENTITY(JSON.Array)` identifier marks the element as an
  array container in the tree, so downstream
  `CREATE LASTCHILD` calls with `NAME 'Item'` or
  `SET ...Item[N] = ...` assignments are formatted as a real
  JSON array on output
- Canonical prep + populate:
  `CREATE FIELD OutputRoot.JSON.Data.emailList IDENTITY(JSON.Array);`
  then either
  `SET OutputRoot.JSON.Data.emailList.Item[] = (SELECT U.address FROM ... AS U);`
  for a plain SELECT, or
  `SET OutputRoot.JSON.Data.emailList = ROW (SELECT U.address FROM ... AS U);`
  for a single structured row
- Pairs naturally with the `SELECT` family: **SELECT** returns
  a tree fragment of matching rows (good for building an
  array), **ROW** wraps a SELECT into a single structured array,
  **THE** pulls out exactly one value (useful when you expect
  zero or one matches)
- Forgetting the `IDENTITY(JSON.Array)` step is a classic
  time-sink: the flow runs, the output "looks almost right",
  and a downstream consumer rejects it because it received an
  object where it expected an array. Easier to catch upfront
  than to debug from a JSON diff
- Same concept in Java via the `JsonArray` parser type (mapping
  nodes, JavaCompute): the tree needs to be typed as array
  before you start appending to it

### Explanation
The ACE message tree does not have a built-in "this element is
an array" marker; you have to opt in with
`IDENTITY(JSON.Array)`. Everything JSON-array-shaped on the
output side (arrays of scalars, arrays of objects, results of
SELECT / ROW expressions) starts with that one-line prep, and
the common bug is skipping it and getting an object-shaped
output that mostly works until one specific downstream call
fails. Candidates who mention `IDENTITY(JSON.Array)` as the
first line they write when building array output are
comfortable with ESQL-to-JSON serialisation.

### References
- Blog: Select The Row (matthiasblomme)
- Blog: Create JSON Arrays in ESQL and Java (matthiasblomme)

---

## 3. `ace-dev-043`, What are Discovery Request and Discovery Input nodes in ACE v13, and how do they differ from traditional transport nodes?

- **Product / Role / Topic:** ACE / Dev / Connectors
- **Difficulty:** easy
- **Tags:** discovery-nodes, discovery-request, discovery-input, connectors, v13, designer, saas

### Question
What are Discovery Request / Input nodes in ACE v13, roughly
how many have been added, and how do they differ from
traditional transport nodes like HTTPRequest or MQInput?

### Answer, bullets
- **Discovery Request nodes** are outbound, connector-style
  nodes that call a SaaS / platform endpoint (Salesforce,
  ServiceNow, Azure Service Bus, Pinecone, Databricks, Apache
  Pulsar, Freshservice, Google Gemini, IBM Aspera, and many
  more, **~80+ added across 13.x modification packs**). They
  wrap connector SDKs that IBM ships with ACE
- **Discovery Input nodes** are the event-driven counterpart:
  they subscribe to a SaaS / platform stream (Azure Event
  Hubs, Amazon Event Bridge, Eventbrite, Apache Pulsar,
  AstraDB, Databricks, Amazon SQS) and emit one message per
  event into the flow
- Difference vs traditional transport nodes (HTTPRequest,
  MQInput, KafkaProducer): transport nodes model the
  **protocol** (send HTTP, put an MQ message) and leave
  payload format, auth and semantics up to you. Discovery
  nodes model the **specific SaaS resource**, handle
  connector-specific auth, pagination, schema, and expose the
  operation set of the target service as node properties. Less
  code, more declarative
- Connector catalogue lands piecemeal per modification pack:
  13.0.1.0 first batch, 13.0.3.0 added vector DBs (Milvus,
  Pinecone), 13.0.4.0 added Azure Service Bus, 13.0.5.0
  added Azure Event Hubs / Google Gemini / IBM Aspera,
  13.0.6.0 added Apache Pulsar / AstraDB / Databricks,
  13.0.7.0 added Freshservice / Azure DevOps / Google
  Analytics and more
- Development model: start with a connector-oriented flow in
  Designer (low-code), optionally move it to the Toolkit for
  advanced logic (ESQL, Java, complex transformations).
  Designer and Toolkit both expose the same catalogue
- Practical consequence for architects: v13 shifts "how do I
  call service X from ACE" from "write an HTTPRequest, handle
  auth, parse response" to "drop the right Discovery node and
  configure it". Where Discovery does not cover your case, you
  fall back to HTTPRequest / RESTRequest with OAuth 2.0 (also
  now native in v13)

### Explanation
Discovery nodes are v13's answer to "ACE is behind on SaaS
connectivity vs cloud iPaaS". The ~80+ connectors let you
talk to modern SaaS, vector DBs and cloud event streams
declaratively, without hand-rolling an HTTP call per service.
The trade-off is that Discovery nodes only cover the
operations IBM has packaged; edge cases still fall back to
HTTPRequest. Candidates who frame this as "low-code connector
catalogue, with HTTPRequest / RESTRequest as the escape
hatch" show they understand the complementary positioning.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=new-whats-app-connect-enterprise

---

## 4. `ace-dev-044`, What does the Kafka Schema Registry policy add in ACE v13, and what serialisation format does it unlock?

- **Product / Role / Topic:** ACE / Dev / Kafka
- **Difficulty:** medium
- **Tags:** kafka, schema-registry, avro, policy, transactional, oauth, v13

### Question
v13 added a Kafka Schema Registry policy. What does it enable,
and what other Kafka improvements land alongside it?

### Answer, bullets
- ACE v13 adds **Avro serialisation with Schema Registry
  integration** for the `KafkaProducer`, `KafkaConsumer`, and
  `KafkaRead` nodes. Before v13 you had to hand-roll Avro
  handling in JavaCompute or pre / post-process in external
  apps
- Configuration is driven by a new **Schema Registry policy**
  that tells the Kafka nodes where the registry lives, how to
  authenticate to it, and which serializer / deserializer to
  use. Reference the policy from the Kafka node properties
- Benefits over custom Avro handling: schema is fetched and
  cached by the runtime; producers register new schema
  versions automatically if configured; consumers validate
  against the registry; schema evolution rules
  (BACKWARD / FORWARD / FULL) are enforced by the registry
  itself
- v13 also adds **transactional support** for `KafkaProducer`
  and `KafkaConsumer` (Kafka-native exactly-once semantics
  within a transaction boundary), and a set of properties to
  configure **parallel consumer scaling** that previously
  required architectural changes
- Kafka authentication in v13 also gained **SASL/OAUTHBEARER**
  support for all three Kafka nodes, via a policy and
  credential type, so OAuth-secured brokers (Confluent Cloud,
  OAuth-fronted on-prem) are now native
- If you implemented custom Avro or external transaction
  coordination in v12, parts of that logic can move into
  native node configuration in v13; consider this during v13
  migrations

### Explanation
The v13 Kafka story is "raise the Kafka nodes to parity with
modern broker features", and the three pieces that matter most
are Schema Registry / Avro, transactions, and OAuth. The
Schema Registry + Avro combo is what shops running Confluent
or Apicurio have been waiting for; before v13 they were stuck
on JSON or on custom Avro code. Candidates who mention all
three (Avro + registry, transactional support, OAuth bearer)
and position them as "less custom code, more declarative
configuration" show they have been tracking the Kafka roadmap.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=nodes-kafkaproducer-node
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=nodes-kafkaconsumer-node

---

## 5. `ace-dev-045`, Which authentication types can the v13 HTTPRequest / RESTRequest nodes use directly, and what does that replace?

- **Product / Role / Topic:** ACE / Dev / Nodes
- **Difficulty:** medium
- **Tags:** httprequest, restrequest, oauth, oauth2, apikey, basic, bearertoken, client, retry, v13

### Question
What auth types does the v13 HTTPRequest node support directly,
what companion features arrived alongside, and what does this
replace in pre-v13 flows?

### Answer, bullets
- The v13 HTTPRequest node supports these auth types
  **directly on the node** (or via an attached HTTP policy),
  no custom preprocessing needed:
  - `apiKey`
  - `basic`
  - `basicApiKey`
  - `bearerToken`
  - `client` (mTLS)
  - `oauth` (OAuth 2.0 client credentials / authorization code)
  - `oauthPassword` (OAuth 2.0 password grant)
- RESTRequest mirrors the list, and the v13 Designer exposes
  the same options in the low-code UI
- For OAuth 2.0, the HTTP policy gains **six additional
  properties** that handle token acquisition: token endpoint,
  client id / secret, scope, grant-type specifics, token
  caching. The node does the token lifecycle for you, no
  scripted token fetch in front of the call
- The `ibmint set credential` CLI now accepts these credential
  types too, which means External Directory Vault workflows
  and Toolkit credential editing align with node-level support
- What it replaces: the pre-v13 pattern of
  `HTTPRequest -> JavaCompute that fetches a token ->
  HTTPRequest`, with all the caching, retry and error handling
  that implied. Now it is one node and a policy reference
- Companion v13 feature: built-in **HTTPRequest retry
  configuration** (`Retry Mechanism: no|short`,
  `Retry Threshold`, `Short Retry Interval`). Covers
  straightforward transient-failure retries without a custom
  wrapper flow

### Explanation
v13 finally turned HTTPRequest / RESTRequest from "HTTP
transport" into "HTTP client that understands modern auth".
The killer is OAuth 2.0 support: Basic / apiKey / bearer were
fine for simple APIs, but every SaaS now expects OAuth, and
before v13 that meant writing a token-fetch helper in
JavaCompute. Candidates who list all seven auth types (or at
least name OAuth 2.0 password and client), mention the HTTP
policy where OAuth lives, and bring up the six OAuth policy
properties have written real outbound integrations against
modern APIs.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=nodes-httprequest-node
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=nodes-restrequest-node

---

## 6. `ace-dev-046`, What is the JSONata Mapping node in ACE v13, and how does it differ from Graphical Data Maps?

- **Product / Role / Topic:** ACE / Dev / Mapping
- **Difficulty:** easy
- **Tags:** jsonata, mapping, data-map, json, transformation, v13

### Question
What is the JSONata Mapping node in v13, when would you reach
for it instead of a Graphical Data Map, and how do they relate
to the new Data Assist / Mapping Assist tooling?

### Answer, bullets
- **JSONata** is a lightweight query and transformation
  language for JSON data, analogous in purpose to XSLT for XML:
  declare what the output shape looks like, and the engine does
  the tree walk
- The v13 **JSONata Mapping node** is a dedicated node that
  takes a JSON input, applies a JSONata expression, and emits
  the transformed JSON as output. Before v13 you could write
  JSONata, but it lived embedded in other processing logic or
  inside mapping expressions
- Compared with **Graphical Data Maps** (`.map`): Graphical
  Data Maps are a visual mapping tool with a schema-based
  source and target, drag-and-drop connections, built-in type
  coercion. JSONata is a **text-based expression language** you
  write by hand, more compact, more expressive on deeply nested
  or computed transforms
- Pick by shape of the problem: visual, schema-heavy, mostly
  linear mappings -> Graphical Data Map. Dynamic output shape,
  heavy filtering / grouping / computed fields, or JSON in /
  JSON out with an already-known JSONata expression -> JSONata
  node
- Both are complementary, not exclusive. Many v13 flows use
  Graphical Data Maps for the bulk of message transformation
  and slot in a JSONata node for the one bit that would be
  ugly as a drag-and-drop diagram
- v13 also adds **Data Assist** and **Mapping Assist** in the
  Toolkit that generate JSONata expressions from natural
  language prompts (watsonx-backed, separate subscription),
  which turns "I do not know JSONata" into less of a blocker

### Explanation
The JSONata node is v13's answer to "JSON transforms are
clumsy in Graphical Data Maps for anything non-trivial".
JSONata is concise, expressive, and designed for JSON; having
it as a first-class node means you can stop embedding
expressions in other nodes or routing through JavaCompute just
to reshape a payload. Candidates who position JSONata and
Graphical Data Maps as complementary tools (JSONata for
dynamic or deeply-nested JSON, maps for visual or
schema-heavy work) rather than competitors show they have
picked between them on real flows.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=nodes-jsonata-mapping-node

---

## 7. `ace-adm-048`, What does `mqsirestart` do, and why is it better than `mqsistop` + `mqsistart`?

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

## 8. `ace-adm-049`, How does `mqsistopmsgflow` differ from `ibmint stop server`?

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

## 9. `ace-dev-047`, What is Project Bob, and where does it fit compared with a generic Copilot for modernising ACE code?

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

## 10. `ace-adm-050`, What is the ACE Agent Preview in the Dashboard, and what are its constraints?

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

## 11. `ace-adm-051`, What is the MCP (Model Context Protocol) feature in ACE v13.0.7.0, and how does it expose REST APIs?

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

## 12. `ace-adm-052`, IIB 10 to ACE v13: how are configurable services migrated, and what practical issue comes with the automation?

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

## 13. `ace-adm-053`, Which command pins an integration server to a specific JRE version in ACE v13?

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

## 14. `ace-adm-054`, Which of these are documented IBM migration styles for moving to ACE v13? (multi-select MCQ)

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

## Already covered

- "How do you process big files in ACE?", covered by `ace-dev-016`
  ("How do you handle very big files in an ACE flow?"). If the existing
  answer feels incomplete, edit it in place rather than adding a
  duplicate.
- Item #66 from `drafts/blog-sourced-candidates.md` (Global Cache
  embedded / Redis), covered by `ace-dev-034` (graduated in the
  most recent commit). If you want the blog-post wording reflected,
  edit `ace-dev-034` rather than adding a duplicate.
