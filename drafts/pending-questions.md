# Pending questions, drafts awaiting review

Questions drafted but NOT yet added to `src/data/questions.json`. Walk through
these, annotate with **keep / tweak / rewrite** and any missing detail, then
they'll be folded into the main bank.

Fields are the same as in `questions.json`, rendered for readability.

---





















## 1. `ace-adm-053`, Which command pins an integration server to a specific JRE version in ACE v13?

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

## 2. `ace-adm-054`, Which of these are documented IBM migration styles for moving to ACE v13? (multi-select MCQ)

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

## 3. `ace-dev-048`, How do you do 2-phase commit with Kafka in ACE?

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

## 4. `ace-dev-049`, What is the default read mode (isolation level) for KafkaConsumer in ACE?

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
