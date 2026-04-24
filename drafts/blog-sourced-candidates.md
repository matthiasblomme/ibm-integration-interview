# Blog-sourced candidate questions

75 question candidates derived from ACE/MQ posts under
`D:\GIT\blogs\docs\posts`. Numbered within each topic. Each entry links
back to the source post so you can verify the framing before deciding.

**How to review:** mark each `K` (keep), `T` (tweak), `S` (skip), or `M`
(merge with existing) in the `Verdict` column, then approved items get
drafted into `src/data/questions.json` or `drafts/pending-questions.md`.

Posts skipped (out of scope): plex-trakt, running-granite-llm-on-android,
visdeurbel-automated-detection, blog-hosting, storage-days-2026,
archive.md, index.md.

---

## 1. Migration & modernisation (ACE v13, Java 17, TAD)

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 1  |  T       | What does Transformation Advisor (TAD) check, and why scan against the highest fix pack you're willing to target? | ace-migration | TAD rules change between fix packs; same workspace can yield different verdicts |
| 2  |  T       | Name three Java 17 compatibility blockers that will fail on ACE v13 unless updated. | ace-migration | JAXB, DatatypeConverter, JNA version bumps |
| 3  |  K       | When migrating to v13, what does `ibmint extract node` NOT bring along that you must copy manually? | ace-migration | Keystores, shared-classes JARs, ODBC config, env scripts get silently skipped |
| 4  |  T       | What is the difference between Maintained / Manual / Automatic start modes for ACE flows? | keeping-stuff-stopped | Wrong pick breaks CI/CD: Maintained preserves state, Manual never auto-starts |
| 5  | K        | How do you keep a specific server on Java 8 when the rest of v13 runs Java 17? | ace-migration | `ibmint specify jre --version 8` per-server, avoids node-wide downgrade |
| 6  | T        | Why should WS-Security policies be recreated from scratch rather than ported from v12 to v13? | ace-migration | Java 17 removed `com.ibm.websphere.*` callback handlers; must rewrite with ACE-native classnames |
| 7  | K        | What are the three migration styles for ACE v13, and which preserves parallel testing of old and new? | ace-migration | In-place, parallel, extract migration, parallel lets you cutover at your pace |

## 2. Vault & credentials

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 8  |  T       | When `mqsisetdbparms` is replaced by the ACE vault, what's the primary encryption method and key size? | setup-ace-vault | AES-256 with local vault keys; plaintext/obfuscated parms are gone |
| 9  | T        | What are the three vault types in ACE, and which one is NOT managed by the ACE operator in k8s? | setup-ace-vault | Node / server / external, only external needs custom image management |
| 10 | T        | What does the `--vault-key` parameter do when starting an integration server? | setup-ace-vault | Decrypts vault at startup; required for access to stored creds |
| 11 |  T       | How does the ACE vault API let you manage credentials, and what replaces `mqsisetdbparms`? | setup-ace-vault | `mqsicredentials` CLI, vault-backed, AES-256, supports dynamic update |

## 3. Container & Kubernetes deployment

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 12 | T        | In the "bake vs fry" pattern, what's the trade-off between rebuild frequency and artefact size? | containerization-series | Baked = fast startup, rebuild per change; Fried = small image, slower cold-start |
| 13 | T        | Why does the ACE Dashboard need RWX storage, and what fails if you only have RWO? | Ace-Operator-Minikube | Dashboard content is shared; RWO forces scale=1 + manual fsGroup patches |
| 14 | K        | Why is cert-manager required when installing the ACE Operator on plain Kubernetes? | Ace-Operator-Minikube | Operator needs cert-manager CRDs for webhook TLS; missing it fails with "no matches for kind Issuer" |
| 15 | T        | How many modification packs of the ACE Operator can lag the dashboard version before breaking? | Ace-Operator-Minikube | Operator v12.14 + Dashboard v13 works; v12.0 + v13 loses required ConfigMaps |
| 16 | T        | Why is container startup the most resource-intensive part of the ACE lifecycle? | containerization-series | Cold-start deploys + optimizes BARs; measuring cold-start matters for scaling |
| 17 | T        | What three approaches reduce ACE container startup time, and which uses init containers? | containerization-series | Base / prebaked / init-container; init-container balances reuse and speed |

## 4. Security & TLS

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 18 | T        | What command verifies that weak TLS ciphers are disabled in ACE on Windows? | disable-weak-ciphers-ace | `openssl s_client -cipher -servername` for negotiation baseline |
| 19 | T        | Which ACE file controlsS weak cipher suites when ACE acts as an HTTPS client (outbound)? | disable-weak-ciphers-ace | `java.security` for outbound vs `server.conf.yaml` for inbound, both matter |
| 20 | T        | How does PGP in ACE differ from XML-based encryption, and what do you need to set it up? | pgp-node | PGP SupportPac + bouncycastle JARs in shared-classes; key gen + keystore + policy |
| 21 | S        | In PGP key setup, why is the CLASSPATH config for `pgpkeytool` critical? | pgp-node | Must include PGPSupportPacImpl.jar + bouncycastle; missing → NoClassDefFoundError |

## 5. Logging, tracing & monitoring

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 22 | T        | What is the Context Tree in ACE v13.0.4.0+, and how does it differ from copying messages into Environment? | flow-order-context-tree | Context Tree is parser-aware + read-only; Environment copies collapse JSON arrays |
| 23 | T        | How do you reference the input node's context tree from inside a subflow in v13? | generic-log-node | `CONTEXTREFERENCE(Context.InvocationDetails.NodeName)` enables generic log subflows |
| 24 | T        | What does the ExceptionList `insert` field contain, and why is it more useful than the full structure? | logging-ace-exceptionlist | Insert has file/line/type; JSONata `[0:2]` captures last 2 errors cleanly |
| 25 | T        | How do you provide a default/fallback for a field that may be missing in a Log node's JSONata expression? | log-nodes-tips-tricks | Sequence-flattening `[field, "FALLBACK"][0]`, missing fields ruin logs otherwise |
| 26 | K        | What is Business Transaction Monitoring (BTM), and which database backends does v13 support? | btm | v12: DB2/Oracle; v13 adds SQL Server + PostgreSQL via ODBC |
| 27 | K        | How do you configure a global transaction correlator in BTM events, and why must the first event set it explicitly? | btm | Correlator is the search key; first event defines it, subsequent inherit |
| 28 | K        | What is the ACE Log Analyzer tool, and what file types can it process? | ace-v13-new-features-overview | Service trace, activity logs, accounting CSV, parser logs → HTML reports |
| 29 | T        | What does EventLogMonitor let you do on Windows, and how do you tail with timestamps first? | eventlogmonitor | `tail -f` for Windows event logs; `-tf` timestamp, `-p N` look-back, `-s` source filter |

## 6. Unit testing & development

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 30 |  K       | How do you run Toolkit unit tests against a custom integration server with policies and shared classes? | toolkit-unit-testing-custom-runtime | "Use existing work directory" in Run Configurations; pre-deploy policies/JARs |
| 31 | K        | What does `ignorePath()` do in ACE unit tests, and why is it essential for UUIDs/timestamps? | unit-test-ignore | Omits specified paths from comparison; dynamic values would fail every run |
| 32 | T        | What does the DFDL Tester tool let you do, and what are its three key setup steps outside the Toolkit? | ibm-dfdl-tester | `setup-ace-jars.ps1` + `validate.ps1`; `-Trace` for diagnostics |
| 33 | T        | How does Palette Customization in the Toolkit help manage node visibility? | customize-ace-palette | Right-click Palette → Customize; hide / reorder drawers; crucial with 80+ new discovery connectors |

## 7. BAR files & build/deploy

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 34 | S        | Why is "Build for mqsipackagebar" a developer responsibility in CI/CD? | create-vs-package-bar | `mqsipackagebar` alone doesn't compile message sets or Java, "Build for" generates the binaries |
| 35 | K        | Compare `mqsicreatebar`, `mqsipackagebar` and `ibmint package`, when do you pick each? | create-vs-package-bar | mqsicreatebar (Toolkit UI), mqsipackagebar (CLI, needs "Build for"), ibmint (modern, compiles at build) |
| 36 | S        | What does `mqsipackagebar -c` do that `-i` does not? | create-vs-package-bar | `-c` compiles XMLNSC/DFDL/Data Maps to binaries; `-i` includes unsupported elements |
| 37 | T        | Why is "deploy stopped, start in groups" the safest migration pattern? | ace-migration | Stopped flows → clean startup; groups isolate failures; external calls last catches TLS issues |
| 38 | S        | What secure-remote-deployment flags does `ibmint deploy` now support in v13? | ace-v13-new-features-overview | `--https`, `--cacert`, `--cacert-password`, `--insecure`, explicit replaces implicit defaults |

## 8. Flows, ESQL & message handling

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 39 | K        | What is the `Item` element in ACE's JSON-array representation, and why is it needed? | creating-json-arrays | JSON array items are anonymous; ACE tree needs names; serializer strips `Item` on output |
| 40 | S        | When building JSON arrays in ESQL with direct indexing, what error do you get from a gap in numbering? | creating-json-arrays | `Item[1], Item[3]` → array subscript error; CREATE LASTCHILD avoids it |
| 41 | M        | How do you build an array of JSON objects in ESQL, and what role does `[<]` play? | creating-json-arrays | CREATE LASTCHILD of array `Item`, then CREATE LASTCHILD of `Item[<]` |
| 42 | T        | What does SELECT return in ESQL, and how do ROW / THE modify the shape? | select-the-row | SELECT → tree, ROW → single array, THE → one value; choose based on needed output |
| 43 |  K       | Why is `CREATE FIELD ... IDENTITY(JSON.Array)` necessary when preparing JSON array output? | select-the-row | Without IDENTITY, JSON formatting fails or emits strange output |
| 44 | T        | How does a Flow Order node solve "array collapses when I stash a value in Environment"? | flow-order-context-tree | Two sequential branches, top stashes simple values, bottom preserves original message |

## 9. Connectors, nodes & v13 features

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 45 | K        | What are Discovery Request / Input nodes in v13, and how do they differ from traditional nodes? | ace-v13-new-features-overview | Low-code SaaS connectors, ~80+ added in v13; connector-first development |
| 46 | K        | What does the Kafka Schema Registry policy add, and what new serialization format is supported? | ace-v13-new-features-overview | Avro + transactional support + parallel consumer scaling |
| 47 | S        | How does HTTPRequest retry config reduce error-handling boilerplate? | ace-v13-new-features-overview | Built-in retry threshold + interval + conditions, no custom wrapper needed |
| 48 | K        | Which auth types can HTTPRequest / RESTRequest now use directly? | ace-v13-new-features-overview | OAuth 2.0, apiKey, basic, bearerToken, client |
| 49 | S        | What's new about MQTT v5 support in ACE, compared to v3.1.1? | ace-v13-new-features-overview | Policy-driven config aligning with modern brokers |
| 50 | S        | What new behaviour does the Scheduler node gain with State Persistence (v13.0.6.0+)? | ace-v13-new-features-overview | Missed-event modes: do nothing / catch-up once / catch-up+reset / replay all |
| 51 | T        | How do Dynamic Credentials help compared to static credential updates? | ace-v13-new-features-overview | Rotate without server restart; reduces outage windows for credential rotation |
| 52 | S        | What is the Salesforce Input node state-persistence feature in v13, and what are FILE vs REDIS for? | ace-v13-new-features-overview | Tracks SF events, resumes after downtime; FILE local / REDIS distributed |
| 53 | K        | What is the JSONata Mapping node, and how does it differ from Graphical Data Maps? | ace-v13-new-features-overview | Dedicated JSONata node for JSON transforms; complements graphical maps |
| 54 | S        | How does Kafka OAuth Bearer Token support extend auth in ACE v13? | ace-v13-new-features-overview | Consumer/Producer/Read nodes now support SASL/OAUTHBEARER policy-driven |
| 55 | S        | What is the purpose of claim-check support in ACE discovery flows? | ace-v13-new-features-overview | Pass reference to binary data, not full payload; avoids memory bloat on large files |
| 56 | s        | How does Event Resilience Policy differ from in-memory event buffering? | ace-v13-new-features-overview | Kafka-backed persistence across pod restarts; in-memory drops events |

## 10. Operations

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 57 | K        | What does `mqsirestart` do, and why is it better than `mqsistop` + `mqsistart`? | mqsirestart | One command, no gap in-between, avoids the Friday-4:47pm "forgot to start again" risk |
| 58 | K        | How does `mqsistopmsgflow` differ from `ibmint stop server`? | keeping-stuff-stopped | Stops apps/flows inside a running server vs stopping the server itself, no ibmint equivalent for in-place |

## 11. AI, productivity & toolkit ecosystem

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 59 | K        | How does Project Bob help modernise ACE code, and where does it beat a generic Copilot? | techxchange-2025 | IBM's AI-first IDE targets refactor/test/docs, integrated with ACE tooling |
| 60 | S        | Why is Watsonx Code Assistant embedded in the Toolkit, and what code-gen tasks does it cover? | ace-v13-new-features-overview | Embedded chat; generate ESQL/Java from NL, explain code, test-data from schema |
| 61 | K        | What's the purpose of the ACE Agent Preview in the Dashboard, and its limitations? | ace-v13-new-features-overview | Container-only, preview-status, watsonx.ai-backed chat over ACE env |
| 62 | T        | When do you reach for Designer instead of the Toolkit? | ace-v13-new-features-overview | Designer for template/connector/pattern flows; Toolkit for Compute/ESQL/custom logic |

## 12. Installation & Windows specifics

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 63 | T        | What three install options does ACE 13 on Windows offer, and what flags control each? | ace-v13-new-features-overview | `-installToolkit`, `-installElectronApp`, `-installCloudConnectors` for granular runtime / dev builds |
| 64 | S        | What's the Windows service-name change from ACE 12 to 13, and why does it matter for automation? | ace-v13-new-features-overview | `...MasterService12.0.12.18` → `...ParentService13.0.7.0`, scripts must account for it |
| 65 | S        | What new silent-install syntax does ACE 13.0.7.0 use? | ace-v13-new-features-overview | Dash-style (`-quiet`, `-licenseAccept yes`) replaces legacy options |

## 13. Performance, observability & advanced v13

| #  | Verdict | Question | Source | Hook |
|----|---------|----------|--------|------|
| 66 | K        | What does Global Cache (embedded / Redis) enable in ACE, and when do you pick which? | ace-v13-new-features-overview | Embedded = same-node sharing; Redis = cross-node / cross-app; upsert from JavaCompute |
| 67 | S        | How does OpenTelemetry basic auth propagate security identity in ACE traces? | ace-v13-new-features-overview | Header-based propagation + Activity Log includes span metadata |
| 68 | K        | What is the MCP (Model Context Protocol) feature in v13.0.7.0, and how does it expose REST APIs? | ace-v13-new-features-overview | Dashboard wizard turns REST APIs into MCP servers for AI tools |
| 69 | S        | How does v13 improve TCPIP node timeout precision? | ace-v13-new-features-overview | Fractional seconds (0.100+) vs whole-second rounding in older versions |
| 70 | S        | How do you configure IPv6 listeners in HTTPConnector, and what is the default? | ace-v13-new-features-overview | `ListenerAddress: '::'` or `'ipv6:::'`; default 0.0.0.0 (IPv4 only) |
| 71 | S        | What callable-flow validation improvements arrived in v13? | ace-v13-new-features-overview | CallableInput/CallableReply enforce message domain/model at node level |

## 14. Likely overlaps with existing bank (review before drafting)

| #  | Verdict | Question | Existing overlap | Suggestion |
|----|---------|----------|------------------|------------|
| 72 | M        | What 3 BAR-build commands exist and when do you use each? | Existing: `ace-adm-009` (4 ways to build a BAR) | Merge, the new post adds detail on "Build for" being a CI concern |
| 73 | T        | Designer vs Toolkit, which is for which kind of integration? | Existing: `ace-adm-020` pending draft (App Connect runtimes) | Merge into the runtimes question |
| 74 | T        | What are the vault types in ACE? | Existing: `ace-adm-006` (DBparms vs vault) | Add as a follow-up to the existing vault question |
| 75 | T        | What is the App Connect Operator? | Existing: `ace-adm-016` (operator release model), draft `ace-adm-021` (operator intro) | Skip, already covered |

---

## Totals

- **75 candidates** (71 new + 4 overlap/merge suggestions)
- **Dev-ish:** ~45 · **Admin-ish:** ~30
- **Difficulty:** mix of easy (install flags, rename-facts) → hard (Context Tree, BTM correlator, Java 17 migration traps)

All questions are specific to concrete points in the posts, not generic
ACE/MQ knowledge, so each has a real answer and a source to point at
for follow-up.
