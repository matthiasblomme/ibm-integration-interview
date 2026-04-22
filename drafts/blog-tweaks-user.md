# Blog-sourced T items — your half (16 of 32)

Your half of the blog-sourced questions marked `T` (tweak) in
`blog-sourced-candidates.md`. Focus: **Migration, Vault, Containers,
Security**. The other 16 are in `blog-tweaks-helper.md` for handover.

**How to use:**

For each item, fill in the **Your refinement** block with any of:

- Corrected question wording
- Missing bullets
- Things to drop
- Specific references to attach
- "Drop entirely" if you change your mind

Leave the rest of the block alone. Once all entries are filled in
(or marked "as-is"), send the file back and I'll fold the corrections
into `src/data/questions.json` (or into `drafts/pending-questions.md`
if they feel half-baked).

---

## Section 1 — Migration & modernisation

### 1. `ace-migration` · Transformation Advisor fix-pack trap

- **Question:** What does Transformation Advisor (TAD) check, and why scan against the highest fix pack you're willing to target?
- **Hook:** TAD rules change between fix packs; same workspace can yield different verdicts.

**Your refinement:**


---

### 2. `ace-migration` · Java 17 compatibility blockers

- **Question:** Name three Java 17 compatibility blockers that will fail on ACE v13 unless updated.
- **Hook:** JAXB, DatatypeConverter, JNA version bumps.

**Your refinement:**


---

### 3. `keeping-stuff-stopped` · Maintained / Manual / Automatic start modes

- **Question:** What is the difference between Maintained / Manual / Automatic start modes for ACE flows?
- **Hook:** Wrong pick breaks CI/CD: Maintained preserves state, Manual never auto-starts, Automatic always does.

**Your refinement:**


---

### 4. `ace-migration` · WS-Security rewrite under Java 17

- **Question:** Why should WS-Security policies be recreated from scratch rather than ported from v12 to v13?
- **Hook:** Java 17 removed `com.ibm.websphere.*` callback handlers; must rewrite with ACE-native classnames.

**Your refinement:**


---

## Section 2 — Vault & credentials

### 5. `setup-ace-vault` · Vault encryption method & key size

- **Question:** When `mqsisetdbparms` is replaced by the ACE vault, what's the primary encryption method and key size?
- **Hook:** AES-256 with local vault keys; plaintext/obfuscated parms are gone.

**Your refinement:**


---

### 6. `setup-ace-vault` · Three vault types

- **Question:** What are the three vault types in ACE, and which one is NOT managed by the ACE operator in Kubernetes?
- **Hook:** Node / server / external — only external needs custom image management.

**Your refinement:**


---

### 7. `setup-ace-vault` · The `--vault-key` parameter

- **Question:** What does the `--vault-key` parameter do when starting an integration server?
- **Hook:** Decrypts vault at startup; required for access to stored credentials.

**Your refinement:**


---

### 8. `setup-ace-vault` · `mqsicredentials` API

- **Question:** How does the ACE vault API let you manage credentials, and what replaces `mqsisetdbparms`?
- **Hook:** `mqsicredentials` CLI — vault-backed, AES-256, supports dynamic update.

**Your refinement:**


---

## Section 3 — Container & Kubernetes deployment

### 9. `containerization-series` · Bake vs fry trade-off

- **Question:** In the "bake vs fry" pattern, what's the trade-off between rebuild frequency and artefact size?
- **Hook:** Baked = fast startup, rebuild per change; Fried = small image, slower cold-start.

**Your refinement:**


---

### 10. `Ace-Operator-Minikube` · Dashboard RWX storage

- **Question:** Why does the ACE Dashboard need RWX storage, and what fails if you only have RWO?
- **Hook:** Dashboard content is shared; RWO forces scale=1 + manual fsGroup patches.

**Your refinement:**


---

### 11. `Ace-Operator-Minikube` · Operator/dashboard version skew

- **Question:** How many modification packs of the ACE Operator can lag the dashboard version before breaking?
- **Hook:** Operator v12.14 + Dashboard v13 works; v12.0 + v13 loses required ConfigMaps.

**Your refinement:**


---

### 12. `containerization-series` · Container startup resource cost

- **Question:** Why is container startup the most resource-intensive part of the ACE lifecycle?
- **Hook:** Cold-start deploys and optimises BARs; measuring cold-start matters for scaling decisions.

**Your refinement:**


---

### 13. `containerization-series` · Three startup-time reduction approaches

- **Question:** What three approaches reduce ACE container startup time, and which one uses init containers?
- **Hook:** Base / prebaked / init-container; init-container approach balances reuse and speed.

**Your refinement:**


---

## Section 4 — Security & TLS

### 14. `disable-weak-ciphers-ace` · Verifying weak ciphers on Windows

- **Question:** What command verifies that weak TLS ciphers are disabled in ACE on Windows?
- **Hook:** `openssl s_client -cipher -servername` proves negotiation; baseline before, compare after changes.

**Your refinement:**


---

### 15. `disable-weak-ciphers-ace` · Outbound vs inbound TLS config

- **Question:** Which ACE configuration file controls weak cipher suites when ACE acts as an HTTPS client (outbound)?
- **Hook:** `java.security` for outbound vs `server.conf.yaml` for inbound — must configure both for full coverage.

**Your refinement:**


---

### 16. `pgp-node` · PGP vs XML encryption setup

- **Question:** How does PGP in ACE differ from XML-based encryption, and what are the key components needed to set up PGP flows?
- **Hook:** PGP SupportPac requires bouncycastle JARs in shared-classes; key generation, keystore setup, and policy wiring often trip developers.

**Your refinement:**


---
