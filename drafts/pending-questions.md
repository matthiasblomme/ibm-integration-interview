# Pending questions, drafts awaiting review

Questions drafted but NOT yet added to `src/data/questions.json`. Walk through
these, annotate with **keep / tweak / rewrite** and any missing detail, then
they'll be folded into the main bank.

Fields are the same as in `questions.json`, rendered for readability.

---





















## 1. `ace-dev-049`, What is the default read mode (isolation level) for KafkaConsumer in ACE?

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
