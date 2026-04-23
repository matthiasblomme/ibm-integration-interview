# Pending questions, drafts awaiting review

Questions drafted but NOT yet added to `src/data/questions.json`. Walk through
these, annotate with **keep / tweak / rewrite** and any missing detail, then
they'll be folded into the main bank.

Fields are the same as in `questions.json`, rendered for readability.

---


## Stubs (author later)

These are placeholders captured during review. No draft content yet:
just a question and a hint about coverage. Expand each into full
bullets + explanation when ready.

### S1. `(tbd)`, What is OpenTelemetry (OTEL) and how does ACE use it?

- **Product / Role / Topic:** ACE / Any / Observability
- **Hint:** OTel is the vendor-neutral observability standard (traces,
  metrics, logs). ACE v13 supports emitting OTel traces and integrates
  with OTel exporters; propagation of security identity via the
  collector and span metadata in the activity log.

### S2. `(tbd)`, What cache options are available in ACE (Global Cache, Redis, etc.)?

- **Product / Role / Topic:** ACE / Admin / Caching
- **Hint:** Embedded Global Cache (same-node JVM-backed sharing),
  external Redis as a Global Cache backend (cross-node, cross-server),
  trade-offs (operational dependency vs scale / visibility), upsert
  access from JavaCompute, when not to use a cache at all.

### S3. `(tbd)`, How do you use App Connect Designer locally?

- **Product / Role / Topic:** ACE / Dev / Designer
- **Hint:** Designer normally runs as SaaS or as a DesignerAuthoring
  resource on the Operator; locally, you can run a Docker-based
  Designer image (IBM ships one) for offline flow authoring, connect
  local connectors, and export artefacts; constraints vs the SaaS
  experience.

---

## Already covered

- "How do you process big files in ACE?" — covered by `ace-dev-016`
  ("How do you handle very big files in an ACE flow?"). If the existing
  answer feels incomplete, edit it in place rather than adding a
  duplicate.
