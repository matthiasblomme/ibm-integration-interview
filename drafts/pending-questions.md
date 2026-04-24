# Pending questions, drafts awaiting review

Questions drafted but NOT yet added to `src/data/questions.json`. Walk through
these, annotate with **keep / tweak / rewrite** and any missing detail, then
they'll be folded into the main bank.

Fields are the same as in `questions.json`, rendered for readability.

---


## 1. `ace-adm-041`, What does `ibmint extract node` NOT bring along during a v13 migration?

- **Product / Role / Topic:** ACE / Admin / Migration
- **Difficulty:** medium
- **Tags:** migration, v13, ibmint, extract, keystore, shared-classes, odbc

### Question
When you use `ibmint extract node` to pull a v11 / v12 integration
node into v13, what does the tool leave behind, and how do you
avoid silent runtime failures because of it?

### Answer, bullets
- `ibmint extract node` pulls a node's configuration into files
  you can version and redeploy into v13. It emits a detailed log
  of what was extracted AND what was skipped, read the **entire**
  output, not just the success line
- Consistently skipped: **keystores and truststores**,
  **shared-classes JARs**, **ODBC configuration** (`odbc.ini`,
  `odbcinst.ini`), and **environment-specific scripts and cron
  jobs**. Copy these over by hand
- Classic failure mode: the v13 server starts, logs look clean,
  dashboard is green, and then the first flow that opens a TLS
  connection or loads a JDBC driver fails at runtime because the
  keystore or shared-classes JAR never followed the config
- Shared-classes JARs are the most common gotcha because nothing
  complains at startup; the problem only surfaces when a
  JavaCompute node tries to resolve a class from them
- Practical pattern: extract, diff the output directory against
  the source node's work path, and then script the copy for the
  omitted categories so it is reproducible on re-runs
- IIB 10 to 13 specific wrinkle: the tool converts configurable
  services to policies, but the generated policies land
  **node-wide**, not scoped to the individual server that needs
  them. Functionally fine, messy in practice; plan time to split
  and relocate them

### Explanation
`ibmint extract node` is the supported path for pulling a v11 /
v12 node into v13, but it skips a handful of critical artefacts
silently in the sense that the skip is logged but not loud. The
interview signal is whether the candidate has actually run a
migration and knows to read the full output and copy the skipped
categories by hand, not assume "extract worked, we are done".

### References
- Blog: Migrating ACE to v13 (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=migrating-app-connect-enterprise-130

---

## 2. `ace-adm-042`, How do you keep one integration server on Java 8 when the rest of v13 runs Java 17?

- **Product / Role / Topic:** ACE / Admin / Migration
- **Difficulty:** medium
- **Tags:** migration, java-17, java-8, ibmint, specify-jre, v13

### Question
In an ACE v13 estate where Java 17 is the default, how do you
keep a specific server on Java 8 without downgrading the whole
node, and what should you watch out for?

### Answer, bullets
- v13 ships both a Java 17 and a Java 8 runtime. Java 17 is the
  default; some workloads still need Java 8 (WS-Security with
  Kerberos, LTPA or SAML; libraries with native dependencies you
  cannot modernise yet) and you can pin those per-server without
  downgrading the whole node
- Command for a node-managed server:
  `ibmint specify jre --version 8 --integration-node <nodeName>
  --integration-server <serverName>`. For an independent server:
  `ibmint specify jre --version 8 --work-directory <dir>`
- It writes a **`server.java.yaml`** next to the server config
  with contents like `javaVersion: 8` and `aceVersion: 13.0.6.0`.
  The change takes effect on the **next server start**, not
  immediately
- To revert to the shipped default, run the same command with
  `--default`
- Watch-out: TAD flags `SSL_*` cipher prefixes as Java 8
  blockers. The JSSE provider maps `SSL_*` to `TLS_*` on the
  same underlying suites, so that is cosmetic, not a real Java 8
  pin. Rename to `TLS_*` when you are in the file anyway, but do
  not pin a server to Java 8 over it
- Java 8 is a holding position, not an endpoint. Every server
  pinned to Java 8 needs a named owner and a retirement date;
  document which server runs which JVM or you will forget

### Explanation
An estate rarely moves to v13 at 100% Java 17 on day one.
`ibmint specify jre` lets you keep the handful of servers that
still need Java 8 (typically WS-Security with non-UsernameToken
or non-X509 tokens, or native-library dependencies) while the
rest of the node moves forward. Good candidates mention the
`server.java.yaml` file, the need to restart the server for it
to take effect, and the SSL_*-vs-TLS_* non-issue that TAD
over-flags.

### References
- Blog: Migrating ACE to v13 (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=migrating-app-connect-enterprise-130

---

## 3. `ace-adm-043`, What are the three migration styles for moving to ACE v13, and which one preserves parallel testing?

- **Product / Role / Topic:** ACE / Admin / Migration
- **Difficulty:** medium
- **Tags:** migration, v13, in-place, parallel, extract, ibmint

### Question
IBM documents three migration styles for moving an existing
estate to ACE v13. What are they, how do they differ, and which
one lets you test old and new side by side?

### Answer, bullets
- **In-place migration:** migrate the integration node on the
  same machine, keeping the same name. Run `ibmint extract node
  --overwrite-existing` and the old node is replaced by a v13
  node in the same spot. Clients do not need reconfiguring.
  Downside: the node is down during the switch and your rollback
  story is "restore from backup"
- **Parallel migration:** stand up a new v13 integration node
  beside the old one and move application logic across at your
  own pace. Both run side by side until you are happy to cut
  over. This is the style that **preserves parallel testing** of
  old and new. Costs: extra hardware / VM, and two nodes to
  manage during the transition
- **Extract migration:** use `ibmint extract node` or
  `ibmint extract server` to pull configuration and resources
  out as files, then redeploy them into a fresh v13 environment,
  usually as independent integration servers. The flexible
  option, the same command works for in-place swap, parallel, or
  splitting a node-owned setup into independent servers
- Framing: in-place and parallel answer "where does the new one
  live", extract answers "how do I get the config out in a form
  I can work with". Extract is the path of choice when you want
  to version or review configuration before it lands in v13
- Pick by source version too: ACE 12 to 13 is the easy one
  (same artefact model, `ibmint extract` works directly). IIB 10
  adds the configurable-services-to-policies delta. IIB 8 or 9
  to 13 is not really a migration, it is a rebuild (v8 direct
  migration is unsupported; v9 is painful enough that standing
  up fresh v13 and moving services across one by one is usually
  faster)

### Explanation
The three official styles all land on v13, but they differ in
where the target lives, how long old and new coexist, and how
much flexibility you have to review and version configuration
on the way in. Parallel is the one that lets you test old-and-
new side by side. Extract is the one that gives you
config-as-files. In-place is the fastest and most brittle.
Candidates who talk about parallel testing should mention the
parallel style explicitly; candidates who frame the decision
around source version (v12 easy, IIB v8 / v9 basically a
rebuild) are showing real experience.

### References
- Blog: Migrating ACE to v13 (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=migrating-app-connect-enterprise-130

---

## 4. `ace-adm-044`, Why is cert-manager required when installing the ACE Operator on plain Kubernetes, and what fails without it?

- **Product / Role / Topic:** ACE / Admin / Operator
- **Difficulty:** medium
- **Tags:** operator, cert-manager, webhook, kubernetes, minikube, tls, prerequisites

### Question
Why does the ACE Operator need cert-manager on a vanilla
Kubernetes cluster (Minikube, kind, DIY), what error do you see
without it, and where does the requirement come from?

### Answer, bullets
- The ACE Operator uses Kubernetes **webhooks** (mutating and
  validating admission webhooks) to validate and mutate its CRDs
  (`IntegrationRuntime`, `IntegrationServer`, etc.) at admission
  time. Webhooks must be served over TLS, and their certificates
  have to be provisioned and rotated
- cert-manager provides the `Issuer` / `ClusterIssuer` CRDs that
  the Operator's packaging expects. Without cert-manager
  installed first, the Operator pod fails to start with
  `no matches for kind "Issuer" in version "cert-manager.io/v1"`
- OpenShift and CP4I typically have cert-manager (or the
  OpenShift cert-manager operator) preinstalled, which is why
  this only bites on "plain" Kubernetes like Minikube, kind, or
  DIY clusters
- Install cert-manager before the ACE Operator:
  `kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.17.2/cert-manager.yaml`
  (or the current release). Wait for the `cert-manager`,
  `cert-manager-cainjector`, and `cert-manager-webhook` pods to
  become `Running`
- Verify CRDs are in place before installing ACE:
  `kubectl get crd issuers.cert-manager.io clusterissuers.cert-manager.io certificates.cert-manager.io`.
  If those three exist, you are good
- Once cert-manager is up, you can also use it to issue TLS
  certs for Dashboard ingress, the `DesignerAuthoring` web UI,
  and anything else that needs a cluster-signed cert, via
  `Certificate` resources and a `selfsigned-issuer` or a real
  CA-backed `ClusterIssuer`

### Explanation
The Operator is a Kubernetes controller that extends the API
with CRDs and validates CR changes via webhooks, which must be
served over TLS. It outsources the cert lifecycle to
cert-manager rather than rolling its own. On OpenShift / CP4I
this is invisible because cert-manager is preinstalled. On
plain Kubernetes (Minikube, kind, vanilla), installing the ACE
Operator without cert-manager first is the classic day-one
mistake, and the `no matches for kind "Issuer"` error is the
tell-tale.

### References
- Blog: ACE Operator on Minikube (matthiasblomme)
- https://cert-manager.io/docs/installation/
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=operator-installing-app-connect

---

## 5. `ace-adm-045`, What is Business Transaction Monitoring (BTM), and which databases does v13 support for the event store?

- **Product / Role / Topic:** ACE / Admin / Monitoring
- **Difficulty:** medium
- **Tags:** btm, monitoring, db2, oracle, sqlserver, postgresql, odbc, v13

### Question
What is BTM in ACE, what does it track, and which relational
backends does v13 support for the event store?

### Answer, bullets
- BTM (Business Transaction Monitoring), re-introduced in ACE
  12.0.2.0, correlates monitoring events emitted by message
  flows so you can track one business transaction (e.g. a single
  order) across multiple flows, applications, and integration
  servers
- Four moving parts: **monitoring events** emitted from flow
  nodes, **an event store** (relational DB), a **transaction
  definition** that maps events to stages
  (start / progress / end / failure), and **traffic** to
  visualise
- In v12, the only supported event-store backends were
  **IBM Db2** and **Oracle**. v13 adds **Microsoft SQL Server**
  and **PostgreSQL** via ODBC, broadening deployability in
  estates that do not run Db2 or Oracle
- Events reach the store via a dedicated integration server
  (often called `record`) whose `server.conf.yaml` is configured
  with `dataSource`, `schema`, `storeMode`, and the
  record / backout queues (`SYSTEM.BROKER.DC.RECORD`,
  `SYSTEM.BROKER.DC.BACKOUT`)
- Schema creation scripts ship with ACE under
  `<install>/server/ddl/<db>/`, for example
  `DataCaptureSchema_v2.sql` for MonitoringEventV2, or
  `DataCaptureSchema.sql` for the older WMB format, plus
  `BusinessCaptureSchema.sql`. Pick the one that matches the
  `eventFormat` in `node.conf.yaml`
- Node-level prereqs in `node.conf.yaml`: enable
  `OperationEvents`, `BusinessEvents`, and
  `Monitoring publicationOn`; pick `eventFormat` (the modern one
  is `MonitoringEventV2`)

### Explanation
BTM is "distributed tracing for message flows" that predates
OpenTelemetry in ACE: monitoring events with a shared
correlator, an ODBC-backed store, and a web dashboard. The v13
relevance is simple: the event-store backends doubled from two
(Db2, Oracle) to four (adding SQL Server and PostgreSQL), which
matters for shops that do not run Db2. Candidates who list all
four backends, know the `<install>/server/ddl` scripts, and can
describe the record / backout queue pair are showing real setup
experience.

### References
- Blog: Business Transaction Monitoring (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=management-monitoring-business-transactions

---

## 6. `ace-adm-046`, What is the global transaction correlator in BTM, and why must the first event set it explicitly?

- **Product / Role / Topic:** ACE / Admin / Monitoring
- **Difficulty:** medium
- **Tags:** btm, correlator, monitoring-event, transaction-definition

### Question
In BTM, what is the role of the global transaction correlator,
and why does the first event in a flow have to set it
explicitly?

### Answer, bullets
- The **global transaction correlator** is the field BTM uses
  to tie individual monitoring events together into a single
  business transaction. Every event in a transaction carries
  the same correlator value; without it, you have unrelated
  events, not a tracked flow
- Configure it on each monitoring event under **Global
  transaction correlator**. Point it at a stable value from the
  message (business identifier like order number, customer ref,
  request id), never a random runtime field
- The **first event** of a flow has to set the correlator
  **explicitly**, because there is no prior event to inherit
  from. Later events in the same flow can be set to
  automatically select the correlator, which means "use the one
  from the most recent event", that works only if something
  upstream has already set it
- Uniqueness matters: within a transaction definition the
  correlator must be unique, because BTM uses it both to group
  events and to deduplicate. A correlator that is not unique
  will split one transaction into several, or merge unrelated
  ones
- In the BTM Dashboard, the correlator is the **only value you
  can search on** to find a transaction's events, so make it
  something a human can type and recognise. No UUIDs if you can
  help it
- Practical pattern: pick a business-meaningful identifier
  (payment ref, order id), validate it exists on the first
  event, configure later events in the same flow to auto-pick.
  If flows are chained, propagate the identifier in the message
  or headers so the next flow's first event can set it from
  real message data

### Explanation
BTM is driven entirely off one field, the global transaction
correlator, and it is also the only thing you can search on in
the dashboard. The subtle rule is that the very first event in
a flow has no predecessor, so "auto-pick the most recent
correlator" does not work for it; you must pick the source
field explicitly. Candidates who pick the correlator from the
message payload (business id) rather than a generated UUID or
random runtime field, and who explain why the first event is
special, have actually used the product.

### References
- Blog: Business Transaction Monitoring (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=management-monitoring-business-transactions

---

## 7. `ace-adm-047`, What is the ACE Log Analyzer, and what file types does it process?

- **Product / Role / Topic:** ACE / Admin / Troubleshooting
- **Difficulty:** easy
- **Tags:** log-analyzer, troubleshooting, service-trace, activity-log, accounting-statistics, v13

### Question
What problem does the v13 Log Analyzer solve, how do you run it,
and which file types can it consume?

### Answer, bullets
- The **Log Analyzer** (new in v13) is a troubleshooting tool
  that consolidates parsing and interpretation of ACE
  diagnostic artefacts into a single static HTML report,
  instead of hand-reading raw files
- Supported inputs:
  - **Service trace** or **User trace** files
  - **Activity Log** files in CSV
  - **Message Flow Accounting and Statistics** files in CSV
  - **Parser Manager Logs**
- Launch from an ACE Command Console (the tool ships with the
  server install):
  `java -Xmx2000m -jar ./server/tools/aceloganalyser.jar`. The
  `-Xmx2000m` matters when the input files are large
- Output is a static HTML report you can keep alongside an
  incident ticket, send to IBM Support, or diff against a
  baseline from a healthy run
- Before v13 the same investigation was a mix of
  `mqsiservice` / `mqsireadlog` invocations, Excel-ing stat
  CSVs, and reading raw trace in a text editor. The v13 tool
  does not replace any of that, it just produces a
  human-navigable view over the same inputs
- Intended for problem determination rather than steady-state
  observability; for live monitoring you still want OTel
  (traces), activity log (per-node events), and flow / resource
  stats

### Explanation
The Log Analyzer is the consolidation of trace, activity log,
accounting stats, and parser log reading into one tool with
static HTML output, which speeds up incident review noticeably.
It does not do anything the underlying files did not already
contain; it just makes them readable as a report. The interview
signal is knowing it exists, knowing the four input types, and
knowing it is a problem-determination tool rather than a
monitoring dashboard.

### References
- Blog: ACE v13 new features overview (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=new-whats-app-connect-enterprise

---

## 8. `ace-dev-036`, How do you run Toolkit unit tests against a custom integration server with policies and shared classes?

- **Product / Role / Topic:** ACE / Dev / Testing
- **Difficulty:** medium
- **Tags:** unit-test, toolkit, policies, shared-classes, run-configurations

### Question
Toolkit unit tests fail when the flow needs a policy, a
user-defined node, or a shared-classes JAR. How do you point the
test at a custom integration server that has those things set
up, and what are the prerequisites?

### Answer, bullets
- By default, the Toolkit spins up a fresh default integration
  server for each test run. That works for flows with no
  external dependencies, and breaks the moment a flow needs a
  **policy**, a **user-defined node / plug-in**, or a
  **shared-classes JAR**. Typical symptom: test fails with a
  missing-policy or `ClassNotFoundException` before any
  assertion runs
- The fix is to point the test at an **existing work
  directory** that already has what the flow needs. You prepare
  a custom integration server once (policies deployed,
  shared-classes directory populated, UDNs available,
  credentials loaded), then reuse its work directory for tests
- In the Toolkit: Run Configurations, open your test
  configuration, go to the **Integration Server Settings** tab,
  select **Use an existing work directory**, and browse to the
  custom server's work directory (e.g.
  `C:\Users\<you>\IBM\ACET13\workspace\UnitTest\TEST_SERVER`).
  Apply and run
- Prerequisite: the target integration server must be
  **stopped** when the test starts; the test process takes
  ownership of the work directory, and a running server holding
  the same directory gives a lock / in-use error
- For shared-classes JARs: create a `shared-classes/` directory
  directly under the server's work directory and drop the JARs
  there (same pattern as standalone integration servers and
  containers). Policies live under the standard policy-project
  structure in the same work directory
- Per-test-config setup: each new test configuration starts
  from defaults, so you will reset the "Use an existing work
  directory" choice for every new test. Factor this into your
  test-config template if you maintain many tests

### Explanation
This is the setup that turns "my flow works when I deploy it,
why does my test fail" into a useful test run. The key insight
is that the Toolkit's default test runner ignores the custom
server you built and uses a fresh one, so you have to redirect
each test config to your work directory. Candidates who know
this pattern have shipped testable flows with policies or
shared classes; candidates who do not will typically claim ACE
tests are unreliable.

### References
- Blog: Toolkit unit testing with a custom runtime (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=dit-developing-integration-tests-by-using-app-connect-enterprise-toolkit

---

## 9. `ace-dev-037`, What does `ignorePath()` do in ACE unit tests, and why is it essential?

- **Product / Role / Topic:** ACE / Dev / Testing
- **Difficulty:** easy
- **Tags:** unit-test, ignorepath, ignoretimestamps, ignoredatetime, assertion, toolkit

### Question
In ACE unit tests, what does `ignorePath()` do, which
companions does it have for common cases, and why is it
essential?

### Answer, bullets
- `ignorePath()` is a method on the Integration Test framework's
  `equalsMessage(...)` assertion that excludes a specific tree
  path from the expected-vs-actual comparison. Signature:
  `.ignorePath(String path, boolean ignoreSubpaths)`
- Used as a chain:
  `assertThat(actualMessageAssembly.equalsMessage(expectedMessageAssembly)
  .ignorePath("/Message/JSON/Data/requestSession", false));`.
  The boolean controls whether descendants of the path are
  ignored too
- Essential for fields whose value changes on every run:
  **UUIDs**, generated IDs, **timestamps**, session tokens,
  signatures, anything keyed off `CURRENT_TIMESTAMP` or a random
  source. Without it, a passing test becomes a failing test the
  moment it runs again with a fresh runtime-generated value
- Two convenience methods for the common cases:
  **`.ignoreTimeStamps()`** covers all TIMESTAMP-typed fields in
  one call, **`.ignoreDateTime()`** covers DATE and TIME fields.
  Chain them with `ignorePath` for targeted exclusions
- Apply selectively: `ignorePath("/Message", true)` makes every
  assertion pass, which defeats the purpose. Pick the tightest
  path that covers the volatile field, and set
  `ignoreSubpaths: false` unless the whole subtree is
  legitimately volatile
- PGP, encrypted payloads, and signed bodies are another
  classic case: the encrypted / signed bytes change every run
  even for identical input. Ignore the encrypted subtree, assert
  on the plaintext surround, or test the round-trip (encrypt
  then decrypt) rather than the encrypted wire value

### Explanation
The test framework compares the actual message tree against a
recorded expected tree, field by field. Any field with a
non-deterministic value makes every run a failure even when the
flow is correct. `ignorePath` (plus the two convenience methods
for timestamp and datetime) is the surgical tool for excluding
those fields. Candidates who name the three methods, describe
when to use which, or mention testing the encrypt-decrypt
round-trip instead of ignoring ciphertext, have actually written
passing tests for real flows.

### References
- Blog: Ignoring fields in ACE integration testing (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=dit-developing-integration-tests-by-using-app-connect-enterprise-toolkit

---

## 10. `ace-dev-038`, Compare `mqsicreatebar`, `mqsipackagebar`, and `ibmint package`. When do you pick each?

- **Product / Role / Topic:** ACE / Dev / Build
- **Difficulty:** medium
- **Tags:** bar, mqsipackagebar, mqsicreatebar, ibmint, cicd, compile

### Question
ACE ships three ways to produce a BAR: `mqsicreatebar`,
`mqsipackagebar`, and `ibmint package`. What are the strengths,
weaknesses, and the right pick for CI / CD?

### Answer, bullets
- **`mqsipackagebar`**: lightweight, ships with the runtime (no
  Toolkit install needed). Packages **already-compiled**
  deployable objects; does **not** compile Java or message sets.
  Good when something upstream (Toolkit "Build for
  mqsipackagebar", or a CI compile step) has already produced
  the binaries. Flags `-c` (compile XMLNSC / DFDL / data maps to
  binaries) and `-i` (include unsupported element types)
  partially bridge the gap
- **`mqsicreatebar`**: ships with the Toolkit install. Starts a
  headless Eclipse and a runtime, validates, compiles Java and
  message sets, writes the BAR. Single command, fully
  self-contained, but you need a Toolkit on the build machine
  and it is the slowest / most resource-hungry option. On Linux
  CI you need a display: `xvfb-run mqsicreatebar -data ...` is
  the standard wrapper
- **`ibmint package`** (and its cousin `ibmint deploy`): the
  modern, recommended option from ACE 12.0.1.0 onwards. Ships
  with the runtime, no Toolkit needed, much faster than
  `mqsicreatebar` because there is no headless Eclipse to
  start. Compiles Java automatically; for MRM message sets you
  have to run `ibmint compile msgset` first (or use
  `ibmint deploy` which chains compile + package)
- Decision tree: greenfield CI / CD -> **`ibmint`** (fast,
  toolkit-free, modern). Need a BAR from pre-built binaries ->
  **`mqsipackagebar`**. Stuck with a Toolkit-based build box
  and want one-shot build -> **`mqsicreatebar`**
- "Build for mqsipackagebar" as a developer step is an
  anti-pattern: you either end up committing generated binaries,
  or the binaries drift when the developer forgets to re-run it
  after changing Java / msgset. Shift that compile step to
  `mqsicreatebar` with `CompileOnly`, or to `ibmint`, both
  avoid the problem
- Workspace hygiene applies to `mqsicreatebar` and `ibmint`
  alike: a clean, small workspace with only the projects you
  are packaging. Unrelated errors elsewhere in the workspace
  can block an otherwise fine build

### Explanation
The three commands solve the same problem (produce a BAR) with
very different trade-offs on speed, compile capability, and
dependencies. `mqsipackagebar` is the oldest and most limited,
`mqsicreatebar` is the "big hammer" that also needs a Toolkit,
`ibmint` is the modern toolkit-free pipeline-friendly choice.
Candidates who recommend `ibmint` by default, know
`mqsipackagebar`'s "no compile" limitation, and can explain why
the headless Eclipse of `mqsicreatebar` hurts CI throughput are
comfortable with real build pipelines.

### References
- Blog: Bar Build Commands, Unraveling the Differences (matthiasblomme)
- https://www.ibm.com/docs/en/app-connect/13.0.x?topic=commands-ibmint-command
- https://www.ibm.com/docs/en/app-connect/11.0.0?topic=commands-mqsipackagebar-command
- https://www.ibm.com/docs/en/app-connect/11.0.0?topic=commands-mqsicreatebar-command

---

## 11. `ace-dev-039`, What is the `Item` element in ACE's JSON-array representation, and why is it needed?

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

## 12. `ace-dev-040`, Why is `CREATE FIELD ... IDENTITY(JSON.Array)` necessary when preparing JSON array output in ESQL?

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

## 13. `ace-dev-041`, What are Discovery Request and Discovery Input nodes in ACE v13, and how do they differ from traditional transport nodes?

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

## 14. `ace-dev-042`, What does the Kafka Schema Registry policy add in ACE v13, and what serialisation format does it unlock?

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

## 15. `ace-dev-043`, Which authentication types can the v13 HTTPRequest / RESTRequest nodes use directly, and what does that replace?

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

## 16. `ace-dev-044`, What is the JSONata Mapping node in ACE v13, and how does it differ from Graphical Data Maps?

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

## 17. `ace-adm-048`, What does `mqsirestart` do, and why is it better than `mqsistop` + `mqsistart`?

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

## 18. `ace-adm-049`, How does `mqsistopmsgflow` differ from `ibmint stop server`?

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

## 19. `ace-dev-045`, What is Project Bob, and where does it fit compared with a generic Copilot for modernising ACE code?

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

## 20. `ace-adm-050`, What is the ACE Agent Preview in the Dashboard, and what are its constraints?

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

## 21. `ace-adm-051`, What is the MCP (Model Context Protocol) feature in ACE v13.0.7.0, and how does it expose REST APIs?

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

## Already covered

- "How do you process big files in ACE?", covered by `ace-dev-016`
  ("How do you handle very big files in an ACE flow?"). If the existing
  answer feels incomplete, edit it in place rather than adding a
  duplicate.
- Item #66 from `drafts/blog-sourced-candidates.md` (Global Cache
  embedded / Redis), covered by `ace-dev-034` (graduated in the
  most recent commit). If you want the blog-post wording reflected,
  edit `ace-dev-034` rather than adding a duplicate.
