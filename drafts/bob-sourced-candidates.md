# Bob-sourced candidate questions

79 question candidates derived from the internal ACE guidelines at
`D:\GIT\bob_modes\ace\review\references\guidelines` (README,
config_guidelines, error_handling_guidelines, esql_guidelines,
flow_guidelines, java_guidelines, performance_monitoring_guidelines,
security_guidelines, ten_ace_message_flow_mistakes).

**How to review:** same pattern as `blog-sourced-candidates.md`, mark
each row `K` (keep), `T` (tweak), `S` (skip) or `M` (merge with existing)
in the Verdict column. A few rows are pre-flagged as "Overlaps with
existing" where the agent believed an existing bank question likely
covers the same ground.

---

## Configuration best practices (config_guidelines.md)

| # | Verdict | Question | Source file | Hook |
|---|---------|----------|-------------|------|
| 1 |         | Why is hardcoding IP addresses in ACE properties files unsafe, and what are the two correct alternatives? | config_guidelines.md § 1.1 | Use hostnames or promoted properties instead of literals |
| 2 |         | What three properties must every application input queue define, and why is BOQNAME critical? | config_guidelines.md § 2.1 | BOQNAME / MAXDEPTH / DEFPSIST; backout queue must exist before the first message |
| 3 |         | If a queue defines BOQNAME but the backout queue does not exist, what happens to messages that reach the retry threshold? | config_guidelines.md § 2.2 | Messages end up on the DLQ without context, silent data-loss risk |
| 4 |         | What's the correct naming convention for promoted properties, and what's wrong with a property named `port=7800`? | config_guidelines.md § 1.2 | `[AppName]#[NodeLabel]/[PropertyName]`, `port=7800` alone collides across flows |
| 5 |         | In ACE v13, which JSON Schema version is supported, and which draft-6/7 keywords are silently ignored? | config_guidelines.md § 4.2 | Draft 4 only, `contains`, `if`/`then`/`else`, `$defs` are silently ignored |
| 6 |         | What's the safest way to store database credentials in an ACE credential policy file? | config_guidelines.md § 3.3 | Never plaintext; reference vault/env via `{env:VAR_NAME}` |
| 7 |         | Name the four severity categories used to classify configuration findings in ACE reviews. | config_guidelines.md § 5 | CF-01 … CF-10 (e.g. CF-01 = hardcoded credentials, CF-05 = TLS not configured) |
| 8 |         | How should environment-specific override files be named, and what command applies them to a BAR file? | config_guidelines.md § 1.3 | `dev/test/uat/prod.properties`; `ibmint apply overrides` |

## Error handling and resilience (error_handling_guidelines.md)

| # | Verdict | Question | Source file | Hook |
|---|---------|----------|-------------|------|
| 9 | (possible overlap) | Describe the three-tier error handling hierarchy in ACE, with an example per tier. | error_handling_guidelines.md § 1 | Flow / application / integration-server, each tier has its own scope |
| 10 |        | What's the danger of `PROPAGATE TO LABEL` without `FINALIZE NONE DELETE NONE` when code follows? | error_handling_guidelines.md § PROPAGATE Finalization | Output trees can be finalized and deleted after propagation, leaving downstream code with stale/empty trees |
| 11 |        | Write ESQL to safely navigate `InputExceptionList` using references instead of subscripts. | error_handling_guidelines.md § Exception List Handling | `REFERENCE TO InputExceptionList.*[1]` + `MOVE exRef NEXTSIBLING` avoids array overhead |
| 12 |        | Which SQLSTATE indicates a DB deadlock, and how should its handling differ from a connection error? | error_handling_guidelines.md § Database Error Handling | SQLSTATE `40001` = deadlock (retry); `08%` = connection (different retry strategy) |
| 13 |        | What does HTTP 408 indicate, and which of 401/403/404/408/5xx should be logged but not retried by default? | error_handling_guidelines.md § HTTP Error Handling | 408 = timeout; 401/403/404 are permanent, log but usually don't retry |
| 14 |        | In a compensation pattern for multi-step ops, why is cleanup done in reverse order? | error_handling_guidelines.md § Compensation and Rollback | Undo in reverse so dependencies unwind correctly |
| 15 |        | Name a resource-limit scenario where exponential backoff helps, and one where it makes things worse. | error_handling_guidelines.md § Retry Logic | Helps: transient DB timeouts. Worsens: rate-limited APIs → thundering herd |
| 16 |        | Name five error scenarios that must be tested beyond the happy path. | error_handling_guidelines.md § Testing Error Scenarios | Invalid input, DB failures, HTTP 4xx/5xx, network, parsing, resource exhaustion, concurrency |

## ESQL performance & correctness (esql_guidelines.md)

| # | Verdict | Question | Source file | Hook |
|---|---------|----------|-------------|------|
| 17 | (possible overlap) | Why is a reference more efficient than repeated subscript access like `InputRoot.XMLNSC.A.B.C[1]`? | esql_guidelines.md § Using References | References = direct pointer; subscript access re-navigates each time |
| 18 |        | What's the performance impact of `CARDINALITY` in a loop condition, and the correct fix? | esql_guidelines.md § Cardinality | Evaluated every iteration; cache it in a local variable before the loop |
| 19 |        | Compare `CARDINALITY` vs `LASTMOVE` for a has-children check, why is LASTMOVE cheaper? | esql_guidelines.md § Cardinality Child Element Checks | LASTMOVE = pointer check; CARDINALITY traverses the subtree |
| 20 |        | Is `IF InputRoot.Field = NULL` correct ESQL? What's the proper syntax and why? | esql_guidelines.md § NULL Handling | No, use `IS NULL`; in SQL `NULL = NULL` is UNKNOWN, not TRUE |
| 21 |        | What risk does a missing `BROKER SCHEMA` at the top of an ESQL file create in multi-app deployments? | esql_guidelines.md § BROKER SCHEMA Declarations | Default schema assignment can cause routing / module-resolution collisions |
| 22 |        | Name three performance issues avoided by combining DECLAREs vs many separate DECLARE statements. | esql_guidelines.md § Declare Statements | Parse overhead, memory usage, initialisation efficiency |
| 23 |        | Why does parameterised PASSTHRU (`'...?...'`, var) avoid extra SQL PREPAREs vs literal PASSTHRU in a loop? | esql_guidelines.md § PASSTHRU Statements | Parameterised queries reuse the prepared statement; literal changes → new PREPARE each time |
| 24 |        | If you need the same string length multiple times in ESQL, what's the performance-safe pattern? | esql_guidelines.md § String Manipulation | `LENGTH` once into a variable; don't call it repeatedly |
| 25 |        | Pick the correct message domain for: XML with namespaces, binary opaque data, fixed-format SWIFT. | esql_guidelines.md § Message Domain Handling | XMLNSC / BLOB / MRM |

## Message flow design (flow_guidelines.md)

| # | Verdict | Question | Source file | Hook |
|---|---------|----------|-------------|------|
| 26 | (possible overlap) | Explain the difference between Message mode and LocalEnvironment mode on a Compute node. Which trees propagate in each? | flow_guidelines.md § Compute Mode | Message = OutputRoot + InputLocalEnvironment; LocalEnvironment = InputRoot + OutputLocalEnvironment |
| 27 |        | Why is `SET OutputRoot = InputRoot` correct in Message mode but buggy if combined with All mode + only `CopyEntireMessage()`? | flow_guidelines.md § Message Copying in All Mode | All mode discards inputs; CopyEntireMessage() only covers the body, not LocalEnvironment/ExceptionList |
| 28 | (possible overlap) | What's the cost of chaining 3 separate Compute nodes when one would do, in tree copies and transaction time? | flow_guidelines.md § Consecutive Compute Nodes | Each node copies the tree and extends the transaction, CPU, memory and rollback-buffer all multiply |
| 29 |        | When should you use On Demand parsing vs Immediate or Complete parsing? Give an example where On Demand saves CPU. | flow_guidelines.md § Message Parsing | On Demand = parse only what's accessed (best default); Immediate/Complete only when upfront validation is required |
| 30 |        | Describe the FlowOrder pattern for multiple output-terminal connections, and explain why order isn't guaranteed without it. | flow_guidelines.md § FlowOrder for Multiple Output Connections | Without FlowOrder the runtime execution order is non-deterministic |
| 31 | (possible overlap) | What's the default Additional Instances setting on an ACE message flow, and why is that a throughput bottleneck? | flow_guidelines.md § Additional Instances | Default 0 (single thread); high-volume flows need explicit tuning |
| 32 |        | A Compute node uses Message mode but the ESQL only sets `OutputLocalEnvironment`, what happens to the body, and what's the correct mode? | flow_guidelines.md § Mode Too Narrow | Body propagates empty, use `LocalEnvironment` mode instead |
| 33 |        | In an OpenAPI/REST project, why is an explicit `operationId` important, and what fragile fallback happens without it? | flow_guidelines.md § operationId Requirement | ACE derives a default from method+path; regeneration can then rename the operation silently |
| 34 | (possible overlap) | When is leaving a Failure terminal unconnected on a Database node acceptable, and when should it always be flagged? | flow_guidelines.md § Unconnected Terminals | Acceptable only if upstream TryCatch catches it; otherwise exception propagates to the input node |
| 35 |        | Name a scenario where internal format standardisation hurts performance, and one where it helps. | flow_guidelines.md § Data Formats | Hurts: point-to-point with multiple transforms. Helps: multi-consumer pub/sub avoiding per-consumer transforms |
| 36 |        | Why is synchronous communication to a slow external system a throughput problem, and how does async solve it? | flow_guidelines.md § Sync vs Async | Sync pins threads while waiting; async frees threads to keep processing |
| 37 |        | What's the minimum-node rule, and give an example of an unnecessary node combination. | flow_guidelines.md § Number of Nodes | Combine ResetContentDescriptor + Validation; combine chained Computes; avoid redundant transforms |
| 38 | (possible overlap) | Which JSON Schema draft does ACE v13 support, and what happens to draft-7 keywords like `if`/`then`? | flow_guidelines.md § JSON Schema Version Compatibility | Draft 4 only; draft-7 keywords silently ignored → silent validation failures |

## Java compute nodes (java_guidelines.md)

| # | Verdict | Question | Source file | Hook |
|---|---------|----------|-------------|------|
| 39 | (possible overlap) | Why is thread safety critical in JavaCompute nodes, and what architectural constraint forces it? | java_guidelines.md § Single Instance | One instance is shared across all flow instances, node must be thread-safe and re-entrant |
| 40 |        | Instead of flow-specific data in instance variables, what should you use in a JavaCompute node? | java_guidelines.md § Single Instance | Local variables inside methods; avoid instance variables for flow-specific data |
| 41 |        | Rewrite this inefficient Java using StringBuilder: `keyforCache = hostSystem + separator + sourceQueue + separator + smiKey + newElement;` | java_guidelines.md § String Concatenation | `StringBuilder` + `.append()` + `.toString()` to avoid intermediate String objects |
| 42 |        | Why is re-calling `root.getFirstChild().getFirstChild()` slower than storing `MbElement` references? | java_guidelines.md § Tree References | Each call re-traverses from the root; references hold a direct pointer |
| 43 |        | What constructor call creates a safe copy of a message element in JavaCompute, and why is that needed before mutation? | java_guidelines.md § Modifying the Proper Element | `new MbMessage(inAssembly.getMessage())`, mutating the input directly leaks changes downstream |
| 44 |        | What's the cost of spawning a new OS process from a JavaCompute node, and when is it ever justified? | java_guidelines.md § Additional Processes | Expensive; only for legacy-system integration when no other option exists |
| 45 |        | When catching exceptions in JavaCompute, why is catching `MbException` before `Exception`, and what's lost by catching `Exception` alone? | java_guidelines.md § Exception Handling | MbException carries error codes / text / insertion strings; catching Exception swallows ACE-specific structure |
| 46 |        | Name three memory-management risks in custom ACE Java code and how JVM resource stats help identify them. | java_guidelines.md § Memory and GC | GC overhead, unnecessary object creation, large message copies, watch Garbage Collection and Memory Visualiser |
| 47 |        | Name an IBM built-in module that shouldn't be replicated in custom Java, and why custom versions are slower. | java_guidelines.md § Use Built-in Modules | Parsers, message handlers; IBM's are highly optimised (e.g. native paths, stream processing) |
| 48 |        | Describe the correct pattern for BLOB processing in Java using ByteArray streams. | java_guidelines.md § BLOB Processing | `ByteArrayInputStream` to read, `ByteArrayOutputStream` to write, efficient in-memory binary processing |

## Performance monitoring & tuning (performance_monitoring_guidelines.md)

| # | Verdict | Question | Source file | Hook |
|---|---------|----------|-------------|------|
| 49 | (possible overlap) | Name five KPIs that should be monitored in production ACE, with typical targets. | performance_monitoring_guidelines.md § KPIs | Throughput, response time < 1s, error rate < 1%, CPU < 70%, memory < 80%, thread pool < 80%, queue depth minimal |
| 50 |        | Which command enables flow statistics collection on a specific message flow, and what does the output reveal? | performance_monitoring_guidelines.md § Performance Monitoring Tools | `mqsichangeflowstats -c active`, per-node throughput and latency |
| 51 |        | Name three common performance bottlenecks in ACE flows and the tool/approach to identify each. | performance_monitoring_guidelines.md § Bottlenecks | DB (slow queries), external services (network), parsing (complex/large messages), stats, logs, profiling |
| 52 |        | When caching via SHARED variables, what's the risk of stale data, and how should invalidation be handled? | performance_monitoring_guidelines.md § Caching Strategies | TTL, event-driven refresh, or explicit clear based on business logic |
| 53 |        | Explain the sync vs async trade-off for slow external systems using resource utilisation as the deciding factor. | performance_monitoring_guidelines.md § Async Processing | Sync blocks threads while waiting (low utilisation); async frees threads → higher throughput |
| 54 |        | What is connection pooling in ACE DB ops, and what config command sets the pool size? | performance_monitoring_guidelines.md § Database Performance | Reuse connections; `mqsichangeproperties` with `jdbcProviderXAPoolSize` |
| 55 |        | For large-message handling, name three strategies beyond plain sync processing that optimise throughput. | performance_monitoring_guidelines.md § Large Message Handling | BLOB domain, streaming, chunking, compression, reference passing |
| 56 |        | What's the danger of over-provisioning thread pools on ACE flows, and how should thread count actually be decided? | performance_monitoring_guidelines.md § Thread Pool Management | More threads ≠ better; tune against I/O-bound vs CPU-bound workload, mind context switching |
| 57 | (possible overlap) | What log levels suit prod / dev / perf-testing, and why is logging in tight loops dangerous? | performance_monitoring_guidelines.md § Logging Best Practices | Prod: ERROR/WARN; Dev: INFO/DEBUG; Perf: minimal. Tight-loop logging adds I/O and skews metrics |
| 58 |        | What's the purpose of load testing in ACE perf tuning, and name two tools suitable for it. | performance_monitoring_guidelines.md § Load Testing | Verify throughput/latency/resources under realistic load; JMeter, SoapUI, MQ Performance Harness |
| 59 |        | Describe the recommended perf-tuning process from baseline to production verification. | performance_monitoring_guidelines.md § Performance Tuning Process | Baseline → identify bottleneck → one change → measure → document → re-test → monitor in prod |
| 60 |        | What's the anti-pattern "no connection pooling", and how is it discovered in perf testing? | performance_monitoring_guidelines.md § Anti-patterns Table | Connection overhead per query, shows up as high latency + resource exhaustion under load |

## Security (security_guidelines.md)

| # | Verdict | Question | Source file | Hook |
|---|---------|----------|-------------|------|
| 61 | (possible overlap) | Name three secure credential storage approaches in ACE, and explain why hardcoding is never acceptable. | security_guidelines.md § Secure Credential Storage | `mqsisetdbparms`, Policy Projects, vault, env vars, hardcoding leaks if BAR is compromised |
| 62 |        | When logging sensitive data in ESQL, what's the masking pattern, and why is "redact downstream" insufficient? | security_guidelines.md § Sensitive Data Handling | Mask early: `'Password: ********'`; downstream redaction leaves an exposure window |
| 63 |        | Write a vulnerable ESQL query susceptible to SQL injection, then rewrite it with parameterised PASSTHRU. | security_guidelines.md § SQL Injection Prevention | Bad: `PASSTHRU('SELECT * FROM Users WHERE UserId = ''' \|\| userId \|\| '''')`. Good: `PASSTHRU('SELECT * FROM Users WHERE UserId = ?', userId)` |
| 64 |        | What is an XXE attack, and name two configuration approaches to prevent it in ACE XML parsing? | security_guidelines.md § XXE Prevention | Attacker smuggles external entity refs; disable DTD processing, validate against known schemas |
| 65 |        | Why should error messages never expose internal detail, and what should replace SQLSTATE/SQLERRORTEXT in client responses? | security_guidelines.md § Error Handling and Information Disclosure | Generic codes like `ERR_500`; log detail server-side only |
| 66 |        | Recommended TLS version for ACE channels / HTTP, and what cipher strength is appropriate? | security_guidelines.md § Secure Communication | TLS 1.2+; AES-256 or equivalent; never TLS 1.0/1.1 or weak ciphers |
| 67 |        | What's the purpose of the `CHLAUTH` MQSC command, and why is blocking anonymous connections required? | security_guidelines.md § Channel Security | Controls which users can use which channels; blocking anonymous stops unauthorised apps connecting |
| 68 |        | List five categories of sensitive data that must never be logged in plain text. | security_guidelines.md § Sensitive Data Handling | Passwords, API keys, tokens, credit card / SSN / passport / health / bank info |
| 69 | (possible overlap) | Describe a comprehensive input-validation checklist for external messages in ACE. | security_guidelines.md § Input Validation | Type/format, range, special-char sanitisation, SQL-injection patterns, structure verification |
| 70 |        | In a containerised ACE deployment, name four security practices that differ from on-prem. | security_guidelines.md § Container Security | Minimal base image, non-root user, vulnerability scanning, secrets mgmt (K8s secrets), network policies |

## Top 10 common mistakes (ten_ace_message_flow_mistakes.md)

| # | Verdict | Question | Source file | Hook |
|---|---------|----------|-------------|------|
| 71 | (possible overlap) | Name the two conditions under which message-tree copying in a Compute node is wasteful, and the correct fix for each. | ten_ace_message_flow_mistakes.md § Message Tree Copying | (1) no updates: skip copy via correct mode; (2) only some fields change: targeted copy |
| 72 |        | Default ESQL skeleton calls `CopyEntireMessage()`, if only LocalEnvironment is modified, what mode avoids the wasteful body copy? | ten_ace_message_flow_mistakes.md § Default Behaviours | `LocalEnvironment` mode, leaves InputRoot untouched |
| 73 | (possible overlap) | What is a message-flow loop, what wiring causes it, and what is the catastrophic system impact? | ten_ace_message_flow_mistakes.md § Message Flow Loops | Cyclic wiring (e.g. out1 back to HTTP input) → infinite processing → OOM / crash |
| 74 | (possible overlap) | The bad example sets `OutputRoot.XMLNSC.Message.CustomerDetail.Address.Locality = InputRoot.XMLNSC.UpdateMessage.HomeAddress.Locality` three times, why is this inefficient, and what's the fix? | ten_ace_message_flow_mistakes.md § Long Tree Paths | Each access re-navigates; declare references to input and output parents, then assign via the references |
| 75 | (possible overlap) | What's the default parsing mode the guidelines recommend for most scenarios, and what's the performance benefit? | ten_ace_message_flow_mistakes.md § Message Parsing | On Demand parses only up to the last element accessed, less parsing overhead than Immediate/Complete |
| 76 | (possible overlap) | A Compute node's ESQL only sets `OutputLocalEnvironment` but the mode is set to `Message`, what happens to the LocalEnvironment changes? | ten_ace_message_flow_mistakes.md § Static Message Tree Updates | They're discarded, Message mode propagates InputLocalEnvironment unchanged |
| 77 | (possible overlap) | Name the danger of unconnected output terminals, and why testing often misses the data-loss bug this creates. | ten_ace_message_flow_mistakes.md § Unconnected Output Terminals | Terminals can silently drop messages on edge cases; happy-path tests won't hit them |
| 78 |        | What must you add to guarantee order of execution when a terminal has multiple output connections? | ten_ace_message_flow_mistakes.md § Multiple Output Connections | FlowOrder node, without it, order is non-deterministic |
| 79 | (possible overlap) | `CARDINALITY` in a loop condition, explain the degradation with large arrays and the correct fix. | ten_ace_message_flow_mistakes.md § Cardinality in Loops | Evaluated every iteration → O(n²) for large arrays; cache in a variable before the loop |

---

## Likely overlaps with existing bank (verify before drafting)

The agent flagged the following candidates as probable duplicates. Marked in the Verdict cell above as "(possible overlap)", double-check before deciding K/T/S/M.

- 9 (error-handling hierarchy) → existing error-handling coverage
- 17 (ESQL references) → existing `ace-dev-024` (consecutive ESQL/Java/Mapping nodes) partial overlap
- 26, 31, 38 (Compute modes, additional instances, JSON schema draft) → scattered existing ACE Dev/tuning coverage
- 34, 77 (unconnected Failure/output terminals) → existing `ace-dev-008` (flow with no catch/fail)
- 39 (JavaCompute single-instance) → existing ACE Dev Java question
- 49, 57 (KPIs, log levels in prod) → existing tuning / logging Qs
- 61 (credential storage) → existing `ace-adm-006` (DBparms vs vault)
- 69 (input validation checklist) → existing security question
- 71, 74, 75, 76, 79 (tree copying, long paths, parsing mode, mode mismatch, CARDINALITY) → existing `ace-dev-024` + `ace-dev-008` + parsers and tuning questions

## Summary

| Topic | Count | Dev | Admin |
|-------|-------|-----|-------|
| Configuration | 8 | 6 | 2 |
| Error handling | 8 | 8 | 0 |
| ESQL perf & correctness | 9 | 9 | 0 |
| Flow design | 13 | 10 | 3 |
| Java compute | 10 | 10 | 0 |
| Performance monitoring | 12 | 6 | 6 |
| Security | 10 | 8 | 2 |
| Top 10 mistakes | 9 | 9 | 0 |
| **Total** | **79** | **66** | **13** |

**Unique strengths vs typical blog content:** concrete production rules
from IBM Expert Labs (top-10 mistakes), the three-value promoted-property
mental model, the `PROPAGATE TO LABEL` finalisation gotcha, a precise
Compute-mode decision matrix, and the JSON Schema draft-4-only trap in
v13. These rarely appear in public blogs, they're the high-value
non-overlapping candidates.
