# IBM ACE and MQ Interview Questions

Generated from `src/data/questions.json` — edit the JSON and run `npm run gen:md`.

**Total questions:** 80

## Table of contents
- [General (3)](#general)
- [MQ — Admin (24)](#mq-admin)
- [MQ — Dev (10)](#mq-dev)
- [ACE — Admin (15)](#ace-admin)
- [ACE — Dev (23)](#ace-dev)
- [Cloud (5)](#cloud)

## General

### Experience

**Q: What are your experiences with ACE and MQ, and how do you rate your own knowledge?**

- Self-assessment — honest level (beginner / practitioner / expert) per product and per discipline (Dev vs Admin)
- Years of hands-on time, sizes of environments, versions used (IIB, ACE v11/v12, MQ v8-v9.x)
- Notable project examples: migrations, HA setup, production incidents solved
- Gaps the candidate is openly aware of

Open-ended opener. The point is less the exact rating and more whether the person calibrates honestly and can back claims with concrete examples. Listen for over-confidence or vague statements.

### Problem solving

**Q: Have you ever hit a problem with ACE or MQ you could not solve? How did you handle it?**

- Describes the problem in concrete terms (symptoms, scope, impact)
- Own troubleshooting steps: logs, traces, reproduction, isolation
- When and how they escalated (IBM case, colleague, community)
- What was learned and what documentation/tooling improved afterwards

Looking for someone who asks for help at the right moment rather than grinding alone or punting too early. Bonus for a post-mortem mindset (what changed after).

### Keeping up

**Q: How do you keep up with new releases and features in ACE and MQ?**

- IBM Docs release notes (What's new) and fix-list pages
- IBM MQ / ACE developer blogs, LinkedIn, community forums
- GitHub repos (ibm-messaging, ot4i) and sample releases
- Running CD releases in a lab / container to try features hands-on

Shows curiosity and a personal learning loop. A good answer pairs a passive source (docs, blogs) with an active one (lab, container sandbox).

## MQ — Admin

### Connectivity

**Q: How do you securely connect two queue managers?**

- Define a sender channel on QMGR-A and a receiver channel on QMGR-B with matching name
- Remote queue on QMGR-A pointing at the transmission queue and the remote qmgr name
- Transmission queue on QMGR-A with USAGE(XMITQ) and set as TRANSMIT for the sender channel
- TLS on the channel: certificates, CIPHERSPEC, SSLCAUTH, key repository per qmgr
- CHLAUTH records so only the right remote can use that channel (ADDRESSMAP / SSLPEERMAP)

The core is the sender/receiver + remote/xmit quartet, but today the interesting bit is how the channel is authenticated. Listen for TLS and CHLAUTH, not just DEFINE CHANNEL.

### Administration tools

**Q: What tools can you use to manage a queue manager, and when do you pick which?**

- runmqsc — scriptable, universal, works on any platform including containers
- MQ Console (web UI) — quick inspection, good for ops people without shell access
- MQ Administrative REST API — automation from CI/CD, remote admin, dashboards
- MQ Explorer — rich GUI, discontinued direction but still useful on desktop
- PCF messages — programmatic admin from applications (same underlying API as REST)

runmqsc is the common denominator and what scripts use; REST is the modern automation path. Mentioning both plus web console shows someone who works with modern MQ, not just the classic desktop.

### runmqsc

**Q: Walk me through common runmqsc commands you use every day.**

- Create a queue: `DEFINE QL(APP.IN) MAXDEPTH(5000)`
- Query a queue: `DIS QL(APP.IN) ALL`
- Display depth: `DIS QL(APP.IN) CURDEPTH`
- All queues with pending messages: `DIS QL(*) WHERE(CURDEPTH GT 0)`
- Alter a channel: `ALTER CHANNEL(TO.APP) CHLTYPE(SDR) MAXMSGL(104857600)`
- Refresh security: `REFRESH SECURITY TYPE(CONNAUTH)` / `TYPE(SSL)`

runmqsc is the bread and butter. Beyond DEFINE/DIS, a strong admin reaches for WHERE clauses, DIS QSTATUS (open handles) and REFRESH SECURITY routinely.

### Installation

**Q: What is a key thing to get right when you first create a queue manager?**

- Log configuration: LogPrimaryFiles, LogSecondaryFiles, LogFilePages
- LogFilePages is FIXED at creation — only the number of log files can change later
- Choose linear vs circular logging up front (also locked in afterwards without recreate)
- Filesystem layout: separate volumes for logs and data for IO and safety
- QMGR default character set / CCSID if you are dealing with non-ASCII messages

The log file size is a classic trap — people find out too late that they cannot grow individual log file size without rebuilding the qmgr. Linear vs circular is a similar one-way door.

### Logging

**Q: Explain the difference between linear and circular logging.**

- Circular — a fixed ring of primary (+ optional secondary) logs that are reused; lowest admin overhead but no media recovery
- Linear — logs accumulate forever until a media image is taken and they are archived/reaped; enables media recovery of a damaged object
- Linear requires record images (rcdmqimg) to free logs; without it the filesystem fills up
- Choose linear when you need point-in-time recovery of damaged queues; circular for classic messaging with replicated HA

The trade-off is recoverability vs operational cost. Linear gives you rcdmqimg-based media recovery but requires disciplined housekeeping; circular just keeps going.

### Security

**Q: Walk me through how you secure channel access with TLS and CHLAUTH.**

- Create a key repository per qmgr and exchange signer certificates
- Set SSLCIPH on the channel (e.g. ANY_TLS12_OR_HIGHER), SSLCAUTH(REQUIRED) for mutual TLS
- Lock down who can use the channel via CHLAUTH: default BLOCKUSER for mqm/privileged ids, ADDRESSMAP for IP restrictions, SSLPEERMAP or USERMAP to bind a certificate DN to a chosen MCAUSER
- REFRESH SECURITY TYPE(SSL) after key repository changes

TLS encrypts and optionally authenticates; CHLAUTH decides which identities are allowed to use the channel and what OS user they act as (MCAUSER). Both are needed — one without the other is incomplete.

**Q: How do you configure MQ to authenticate admins against LDAP?**

- Import the LDAP server certificate into the qmgr key repository and start ssl
- DEFINE AUTHINFO of type IDPWLDAP with the LDAP URL, base DN, bind DN and password
- ALTER QMGR CONNAUTH(<name>) and set CHCKCLNT / CHCKLOCL to REQUIRED/OPTIONAL
- REFRESH SECURITY TYPE(CONNAUTH) to activate
- Optionally map LDAP groups to MQ authorizations with SET AUTHREC

CONNAUTH handles authentication (who are you) while SET AUTHREC / setmqaut handles authorization (what can you do). LDAP typically covers the first; groups and authority records cover the second.

**Q: A developer cannot put messages on APP.IN — how do you give them access?**

- Check AMQERR01.LOG for MQRC 2035 / 2059 and note the user id and resource
- Grant authority: `SET AUTHREC PROFILE('APP.IN') OBJTYPE(QUEUE) PRINCIPAL('alice') AUTHADD(PUT,INQ,BROWSE)`
- If going via a client channel: ensure CHLAUTH USERMAP gives that user a valid MCAUSER — e.g. `SET CHLAUTH('APP.SVRCONN') TYPE(USERMAP) CLNTUSER('alice') USERSRC(MAP) MCAUSER('appuser')`
- REFRESH SECURITY TYPE(CONNAUTH) — changes take effect

The symptom is usually 2035; the fix is a combination of queue-level AUTHREC plus channel-level CHLAUTH. Many people forget the channel side when the client connects remotely.

### Pub/Sub

**Q: Describe how pub/sub works in MQ.**

- Publisher MQPUTs to a TOPIC object (or topic string); MQ routes to every matching subscription
- Subscribers register (durable or non-durable) against a topic string, possibly with wildcards (# multi-level, + single-level)
- Durable subscriptions survive application restart and typically use a named subscriber queue; non-durable are cleaned up on disconnect
- No queue pre-allocation is required by publishers — they target topics, not queues

The key mental model is topic trees and subscriptions. Publishers don't know subscribers; subscriptions define the mapping to a delivery queue.

**Q: How does pub/sub work across an MQ cluster?**

- Add cluster name to a TOPIC object to make it a clustered topic
- Two routing models: direct routing (all qmgrs know all subscriptions, default) and topic host routing (subscriptions live on designated host qmgrs)
- Direct routing — simple, great for small clusters; a lot of subscription traffic between qmgrs at scale
- Topic host routing — scales better, subscriptions are concentrated on host qmgrs, publishers are decoupled from all subscribers

The choice between direct and topic-host routing is about scale vs simplicity. For large meshes, topic-host routing drastically reduces background proxy-subscription traffic.

### Clustering

**Q: How do MQ clusters work?**

- A cluster is a set of qmgrs that share a namespace for cluster queues and topics via a cluster transmission queue
- Two (ideally) full repositories hold the cluster directory; partial repositories learn about objects on demand
- Applications can PUT to a queue known to any cluster member; the workload exit picks a target instance
- Enables horizontal scale and availability for non-persistent-style workloads; persistent messages still tie to a single qmgr

Clustering solves naming and workload distribution; it is not in itself message HA for persistent messages. You still need a mechanism (RDQM, Native HA, MI) for the individual qmgrs.

### Backout

**Q: Describe the MQ backout mechanism.**

- Each queue has BOTHRESH (threshold) and BOQNAME (requeue target, typically a backout queue)
- When an application rolls back, BackoutCount increases on the message
- Once BackoutCount >= BOTHRESH, the next well-behaved consumer moves the message to BOQNAME (or DLQ if none)
- Prevents a poison message from looping forever and blocking a queue

Backout handling is a cooperation between the queue settings and the consumer — the qmgr only increments the counter; moving the message is done by a consumer that inspects it (or by MQ built-in handlers in JMS/ACE).

### Message structure

**Q: Describe the structure of an MQ message.**

- MQMD — message descriptor: format, persistence, priority, expiry, reply-to, correl/msg ids, put dates
- Optional headers: MQRFH2 (properties, pub/sub), MQDLH (dead letter), MQXQH (transmission queue), MQCIH (CICS bridge), etc.
- User payload — bytes, XML, JSON, binary — interpretation is up to the application
- Message properties live in MQRFH2 or API-style properties depending on how the app uses them

MQ carries structured metadata plus an opaque body. Headers compose — an MQMD may be followed by an MQRFH2 and then the payload. Knowing this matters when building bridges or parsing raw messages.

### Transactions

**Q: Describe MQ unit of work.**

- A unit of work brackets puts and gets so they commit or roll back together (MQGMO_SYNCPOINT / MQPMO_SYNCPOINT)
- Local UOW — only MQ is involved, coordinated by the qmgr
- Global UOW — MQ participates in an external XA transaction alongside a DB or TM
- Rollback increments BackoutCount on consumed messages and un-puts uncommitted messages

MQ is transactional at the message level and can play nicely with an XA coordinator when you need multi-resource atomicity. The syncpoint flags at put/get time are how apps opt in.

### Persistence

**Q: How are persistent messages implemented and configured?**

- Persistence is set per-message (MQMD.Persistence) or derived from the queue default (DEFPSIST)
- Persistent messages are written to the qmgr log before the put returns; they survive qmgr restart
- Non-persistent messages live in memory (and may be swapped to disk on pressure) — fast but lost on restart
- Choose per queue by business need: financial / audit = persistent, telemetry / heartbeats = non-persistent

Persistence trades throughput for durability. Often a single app has a mix — command messages persistent, notifications non-persistent — and that is a legitimate design choice.

### High availability

**Q: Give an overview of MQ HA options.**

- Externally managed: system-level HA (clustered storage + failover — VCS, MSCS, Pacemaker), Multi-Instance QMGR (shared filesystem, active/standby)
- MQ-managed on Linux: Replicated Data Qmgr (RDQM) for HA and DR (cross-site)
- MQ Appliance — pairs of appliances with built-in replication
- Containers / cloud: Native HA (3-node quorum, no shared storage), Uniform Clusters for app-level rebalance
- MQ Cluster — not message HA, but enables app continuity across instances

Always split 'system HA' (qmgr stays up) from 'message HA' (no message loss) and 'application HA' (clients keep working). A full answer picks the mechanism per layer.

**Q: What is Multi-Instance QMGR and what is its biggest weakness?**

- Active / standby qmgr pair sharing the qmgr data and logs on a shared filesystem (NFSv4 with proper locking)
- Only one instance has the qmgr started at a time; the other waits for a file lock
- Failover is automatic when the active dies; clients reconnect via CCDT or client reconnect
- Biggest weakness: the storage layer — if the NFS server or shared disk fails, both instances go down

MI is elegant and cheap but it only covers compute failure, not storage. You still need a reliable and correctly configured shared filesystem.

**Q: What is RDQM and how does HA RDQM differ from DR RDQM?**

- RDQM = Replicated Data Queue Manager on Linux using DRBD block replication and Pacemaker
- HA RDQM — three-node cluster in a single site, synchronous replication, automatic failover, designed for high availability
- DR RDQM — two-node, usually across sites, asynchronous replication, manual failover, designed for disaster recovery
- Both avoid the shared filesystem dependency of MI

HA RDQM is the replacement for the old MI pattern on Linux with no NFS. DR RDQM adds a cross-site copy; the two can even be combined for HA+DR.

**Q: What is Native HA and where does it fit?**

- Three-instance qmgr with an active and two replicas; data is replicated over the network, no shared storage
- Designed for containers / Kubernetes — pod anti-affinity + persistent volume per pod
- Automatic leader election and failover; one node failure is transparent
- The 'cloud-native' HA option; prefer over MI in Kubernetes

Native HA is quorum-based and self-contained, which is exactly what you want in Kubernetes where shared storage is a liability. It's the default choice for new container deployments.

**Q: What is a Uniform Cluster?**

- A small MQ cluster (typically 3-6 qmgrs) where every member is configured identically — same queues, same topics, same applications
- Applications use a reconnectable JMS/MQI client with CCDT and are automatically balanced across members
- Enables rolling restarts and elastic scale without app reconfiguration
- Often combined with Native HA qmgrs underneath for both node and cluster resilience

Think of it as an app-aware, workload-balanced cluster — the cluster itself distributes connections, not just messages. It addresses the 'clients all glued to one qmgr' problem classic clusters still have.

### Monitoring

**Q: Where do you look first when troubleshooting MQ issues?**

- Qmgr error logs: `AMQERR01.LOG` under `<mqmdata>/qmgrs/<QMGR>/errors` (and under `<mqmdata>/errors` for top-level)
- FDC files (`*.FDC`) — first-failure data capture, indicates a real qmgr problem
- `dspmq` and `dspmq -x` — qmgr status and MI state
- `DIS CHSTATUS`, `DIS QSTATUS` — channel and queue runtime state
- Event messages via amqsevt (performance, authority, channel events)

Start with the error log and any FDCs, then runtime status. Events are invaluable for pinpointing authority failures or deep queues before they become outages.

### Upgrades

**Q: What is the difference between LTS and CD MQ releases, and how do fix packs fit in?**

- LTS (Long Term Support) — major version released every ~2 years, supported for 5 years, fix packs only
- CD (Continuous Delivery) — quarterly releases with new features, supported until the next CD or next LTS
- Fix Packs apply to LTS; CSUs (Cumulative Security Updates) are security-only updates between fix packs
- Plan upgrades: CD for teams that want features sooner, LTS for teams that want stability

Picking a release stream is a product decision: feature velocity vs patch cadence. Many enterprises stay on LTS in prod and use CD in dev/labs to evaluate what is coming.

### Troubleshooting

**Q: A queue in a cluster is receiving no messages even though producers are active. How do you diagnose?**

- Verify the queue is actually cluster-defined: `DIS QL(*) CLUSTER WHERE(QUEUE EQ 'APP.IN')` — check CLWLUSEQ, CLWLPRTY
- Check cluster channel state on full repositories: `DIS CLUSQMGR(*)` — is the host qmgr known, not suspended?
- Check on the consumer qmgr that the cluster queue is open locally and not suspended: `DIS CLUSQMGR` on the producer
- Look at SYSTEM.CLUSTER.TRANSMIT.QUEUE depth — if deep, channel issue; if empty, routing decision issue
- REFRESH CLUSTER on full repos as a last resort to re-sync directory

Cluster issues nearly always boil down to either a channel problem (messages are queued on the xmit queue) or a routing decision (messages never picked the queue). Checking both sides narrows it down quickly.

**Q: A queue manager runs out of log space. What do you do?**

- Identify the oldest in-flight transaction: `DIS CONN(*) WHERE(UOWSTATE EQ ACTIVE) ALL` — find long-running / stuck UOWs
- If linear logging, check `rcdmqimg` is running; missing media images prevent log reuse
- Resolve or rollback hung XA transactions: `DIS CONN` + `RESOLVE CHANNEL` / `RSLVINDB`
- Increase LogPrimary/Secondary Files as an emergency measure if disk allows
- Post-incident: review monitoring thresholds and application commit patterns

Log-full is usually a symptom of a stuck transaction or missing media-image housekeeping, not genuinely too many messages. Root-cause the holder before just expanding logs.

## MQ — Dev

### Connectivity

**Q: What's the difference between a client (MQI) connection and a bindings (local) connection?**

- Bindings — app is on the same host as the qmgr, uses shared memory, lowest latency and no network
- Client — app connects over TCP/IP to a SVRCONN channel, can be remote, needs channel + possibly TLS
- Bindings cannot cross hosts; client is mandatory for containers, microservices, or remote apps
- MQCONNX lets you pass MQCNO options to control the mode (local/client/reconnectable)

Bindings is the fastest path but locks you to the host. Modern deployments (containers, separate app/qmgr pods) almost always use client mode, with reconnection enabled.

**Q: What is a CCDT and how do you use it?**

- Client Channel Definition Table — a JSON (from v9) or binary file listing SVRCONN channel definitions the app can use
- App points at the CCDT via MQCHLLIB / MQCHLTAB env vars or a JMS property
- Supports multiple channels per connection name (failover, load balancing with CLNTWGHT/AFFINITY)
- Central place to manage qmgr hostnames, ports and TLS settings without touching the app

A CCDT keeps connection knowledge out of the application and enables failover/balancing. The JSON format from v9 is also human-editable, which is a huge improvement over the old binary AMQCLCHL.TAB.

**Q: How do you make an MQ client application resilient to qmgr failures?**

- Use reconnectable clients: MQCNO_RECONNECT (or JMS autoReconnect) — the client library reconnects transparently
- CCDT with multiple entries per connection name to failover to another qmgr
- Keep the app idempotent / stateless so a reconnect mid-operation is safe
- Handle MQRC_RECONNECTING and MQRC_RECONNECTED events for visibility

MQ already does the reconnect heavy lifting once you opt in. The app's job is to stay idempotent and react to reconnection events rather than crash on temporary failures.

### Messages

**Q: How do you set a message as persistent from the application?**

- Set MQMD.Persistence = MQPER_PERSISTENT when putting the message
- Or rely on DEFPSIST on the queue and set MQMD.Persistence = MQPER_PERSISTENCE_AS_Q_DEF
- In JMS set message.setJMSDeliveryMode(DeliveryMode.PERSISTENT)
- Make sure you also put under syncpoint if you need the all-or-nothing guarantee

Persistence is per message, but most shops configure a sensible default on the queue and leave the app on AS_Q_DEF. Persistence + syncpoint is the recipe for once-and-only-once semantics.

**Q: What are MQ message properties and how do they relate to MQRFH2?**

- Properties are key/value metadata on a message, settable via MQSETMP / JMS setStringProperty
- Under the hood they are stored in an MQRFH2 header or in a private qmgr-managed store depending on PROPCTL
- PROPCTL on the queue controls exposure: ALL, COMPAT, NONE, RFH2, V6COMPAT
- Use properties for routing, filtering (selectors) and correlation metadata without touching the body

Properties decouple the API from the wire format. The PROPCTL setting decides whether downstream consumers see an MQRFH2 header or get the properties via the API only — mismatches here are a common integration bug.

### Pub/Sub

**Q: How does an application subscribe to a topic and how do durable subscriptions differ?**

- MQSUB specifying a topic string (or TOPIC object) and sub options (MQSO_CREATE, MQSO_DURABLE, ...)
- Non-durable — tied to the subscriber's connection; messages flow only while connected
- Durable — identified by a subscription name; survives disconnect and app restart; messages are held in a named subscriber queue
- Subscription selectors and wildcards (+, #) let a subscriber pick a slice of the topic tree

Durability choice mirrors the use case: event streams that are fine to miss while offline → non-durable; commands/audit events that must be kept → durable with a managed subscriber queue.

### Transactions

**Q: When would you use an XA transaction with MQ?**

- When you need atomic commit across MQ and another XA resource (usually a database)
- A transaction manager (app server, Narayana, Tuxedo) coordinates both participants via prepare/commit
- Classic use case: read message → update DB → commit both, no duplicates on failure
- Costs: XA overhead is significant; avoid when a local transaction + idempotent write is possible

XA gives you true 2PC across resources but at real performance cost. Many modern designs prefer an outbox pattern or idempotent consumer over XA to keep things simple.

### Error handling

**Q: How does an application handle poison messages?**

- On each rollback MQ increments MQMD.BackoutCount for the message
- App checks BackoutCount >= BOTHRESH on the queue; if reached, move the message to BOQNAME (or DLQ)
- Frameworks (JMS, ACE, Spring) usually do this automatically via built-in backout handlers
- Alert / log when a message is quarantined so the cause can be investigated

Poison message handling is about not being stuck on one bad record. The consumer (or the framework around it) is responsible for actually requeueing; the qmgr just increments the counter.

### APIs

**Q: MQI vs JMS — when do you pick which?**

- MQI — native MQ API (C, Java, .NET, Go); full feature set, best control, slightly lower-level
- JMS — standard Java API over MQ; portable across brokers, higher-level, integrates with Java EE / Spring
- MQI gives you direct access to MQMD fields, custom headers, admin calls; JMS gives you portability and framework integration
- In practice: Java app in a Java stack → JMS; bridge, custom broker, non-Java, or advanced MQ features → MQI

JMS is the ergonomic, portable choice for Java; MQI is the escape hatch when you need something JMS doesn't expose or when you're outside Java altogether.

### MQGET

**Q: What are the important MQGET options you use in practice?**

- MQGMO_WAIT + MQGMO_WaitInterval — block until a message arrives, the standard consumer pattern
- MQGMO_SYNCPOINT — get under transaction, paired with backout handling
- MQGMO_BROWSE_FIRST / BROWSE_NEXT — inspect without removing; useful for admin apps and selectors
- MQGMO_CONVERT — apply data conversion based on MQMD.Format and CCSID
- Match criteria via MQMD.MsgId / CorrelId for request/reply correlation

The MQGET call is highly configurable via MQGMO flags and match options; most real apps only use a handful but should know them — browse and correl id matching in particular come up often.

## ACE — Admin

### Versions

**Q: What versions of WMB/IIB/ACE have you used and how do they relate?**

- WebSphere Message Broker (WMB) up to v8 — legacy
- IBM Integration Bus (IIB) v9 and v10 — rebrand, architecturally close to ACE v11
- App Connect Enterprise (ACE) v11 — first 'ACE' release, removed Integration Node by default on some features
- ACE v12 — current LTS/CD family; CD releases quarterly, LTS every couple of years
- Lots of concepts (flows, ESQL, BAR files) are unchanged across them

Most of the flow and ESQL knowledge carries over from WMB through ACE; what changes across versions is tooling (toolkit, ibmint), Integration Server model and cloud/container story.

**Q: What is the current ACE release cadence and how are releases named?**

- Major family is v12 (v11 still supported in legacy environments)
- Continuous Delivery (CD) — roughly quarterly mod-releases (12.0.x) with new features
- LTS (Long Term Support) — periodically designated release with 5-year support
- Fix packs / iFixes layer on top of LTS for bug and security fixes

Like MQ, ACE has a CD + LTS model. In enterprises you typically run LTS in production and use CD in labs to preview upcoming features.

### Topology

**Q: Integration Node vs Standalone Integration Server — what's the difference?**

- Integration Node — historical 'broker' process that manages one or more Integration Servers; uses MQ for admin
- Standalone Integration Server — a single Integration Server process, no node, no MQ dependency for admin
- Standalone is the modern default — simpler, cloud-native, one process = one artefact
- Integration Node is still available but IBM is guiding users to standalone + container deployments

Integration Node gave you multi-server management and an MQ-backed admin channel; standalone trades that for simplicity and plays much better with containers and IaC.

### CLI

**Q: How familiar are you with the ACE command line — what tools do you reach for?**

- `mqsicreateworkdir`, `mqsistart`/`mqsistop` for standalone servers
- `ibmint` — modern replacement for many tasks: `ibmint package`, `ibmint deploy`, `ibmint optimize server`
- `mqsideploy` / `mqsilist` / `mqsireadbar` for legacy BAR ops
- `mqsisetdbparms` / `mqsivault` for credentials
- `mqsichangefileauth`, `mqsichangeproperties` for server config
- `mqsireportbroker`, `mqsireadlog` for diagnostics

A modern ACE admin mixes `ibmint` for build/package/deploy with the older `mqsi*` for config, security and diagnostics. Don't be surprised if both are needed on the same host.

### Security

**Q: How do you enable admin security for ACE?**

- Enable admin security in `server.conf.yaml` (standalone) / via `mqsichangeauthmode` (node)
- Pick identity source: file-based (local users/groups files) or LDAP
- Configure authorization via `authorizationMode` and role files/mappings
- Restart the integration server and test with curl/Web UI

Authentication decides 'who', authorization decides 'what can they do'. ACE splits them clearly via the two configs, and a typical enterprise setup uses LDAP auth + group-based role mapping.

**Q: What are the two main ways to securely store credentials in ACE?**

- `mqsisetdbparms` — credentials stored in the server configuration, referenced from nodes/flows by alias
- ACE Vault (`mqsivault`) — encrypted vault file per server, unlocked with a master key at start
- Vault integrates cleanly with containers (key from env/secret) and replaces manual `mqsisetdbparms`
- Both avoid putting credentials in BAR files or flows

The vault is the direction of travel, especially for containerized deployments where the master key comes from a Kubernetes secret. `mqsisetdbparms` is still valid for traditional installs.

### Monitoring

**Q: What do you know about ACE monitoring events and how do you configure them?**

- Flows emit monitoring events on configured terminals (input, output, catch) as MQ/JSON messages
- Configure via the Toolkit monitoring tab, via a policy, or by setting properties in server.conf.yaml
- Events are published to a topic on MQ or emitted via Kafka/HTTP in newer versions
- Used by APM/SIEM tooling, transaction tracking and business-level audit

Monitoring events are non-intrusive — they don't change the flow — and give you structured insight at key points. Beware of volume: enabling them on every node in production will flood the consumer.

### Policies

**Q: What types of policies exist in ACE and what is the dynamic vs non-dynamic difference?**

- Dynamic policies — changes are picked up by a running flow without restart (e.g. MQ endpoint policies with reloadable properties, monitoring policy, activity log policy)
- Non-dynamic policies — changes require the flow to be re-initialised (some security / specific connection policies)
- Workaround for non-dynamic: restart the flow/server, or redeploy with `--restart-all-applications`, or manually drag the policy into the `overrides` directory and restart
- Always check the policy type in the IBM docs before relying on dynamic reload in production

Most day-to-day policies are dynamic. The few that aren't can trip you up when you do a quick config change and nothing changes until the app restarts.

### Build & deploy

**Q: What are the ways to build a BAR file?**

- Toolkit — right-click on the project and build BAR via the UI
- `mqsipackagebar` — command line wrapper around toolkit build
- `mqsicreatebar` — headless toolkit build from projects on disk
- `ibmint package` — modern, no-toolkit, no-Eclipse build; used in CI
- Maven / Gradle plugins wrapping any of the above for pipelines

`ibmint package` is what you want in CI because it has no Eclipse dependency and is faster. The older commands still exist and may be required for legacy project types.

**Q: Explain `mqsiapplybaroverride`, `mqsireload` and `ibmint optimize`.**

- `mqsiapplybaroverride` — takes an existing BAR and applies a properties file that overrides node properties per environment
- `mqsireload` — reloads deployed applications on an integration server (broadly equivalent to a soft restart of the apps)
- `ibmint optimize server` — strips unused components from the server runtime, producing a minimal image (especially useful in containers)
- `ibmint package` vs `ibmint deploy` — package produces a work directory / artefact; deploy applies it to a running server

These three are the bread and butter of environment-aware deployment: override properties at promote time, optimize away unused components for lean images, and reload without a full restart.

### High availability

**Q: How do you achieve HA for ACE?**

- Stateless integration servers behind a load balancer — horizontal scale-out, any server can handle any request
- Multi-Instance (with MQ-backed Integration Node on a shared filesystem) — classic active/standby
- Kubernetes / CP4I — multiple replicas per integration server deployment, rolling updates
- For stateful work (aggregation, collectors) be deliberate about where state lives — MQ queue, database, Redis

ACE itself is mostly stateless request/response; the usual answer is horizontal scale + a load balancer. The hard part is making sure state stays in backing stores (MQ, DB) and not in memory of one server.

### Tuning

**Q: How do you tune an ACE flow that is slow?**

- Turn on flow/node statistics (`mqsichangeflowstats`) and identify the slow node
- Increase additional instances on the input node for parallelism (careful with order-sensitive flows)
- Choose the right parser (BLOB if no parse needed, XMLNSC over legacy parsers)
- Reduce downstream overhead: batch DB calls, reuse connections, minimise logging
- Scale horizontally (more servers / replicas) when a single server is saturated

Start with measurement — stats tell you exactly which node burns time. Parallelism, parser choice and downstream efficiency are the three levers that usually move the needle.

### Logging

**Q: How do you read ACE logs and what is a BIP message?**

- Console log — integration server stdout/stderr, contains BIP messages and application `printf`-like output
- `syslog` (Linux) / Event Viewer (Windows) — OS-level logs, especially for integration nodes
- User trace — detailed tracing of a flow at the message level, turned on with `mqsichangetrace`
- Service trace — low-level IBM support trace
- BIP messages are the ACE message codes (BIPxxxx) — each has a message, cause and action in `mqsiexplain <code>` or the docs

`mqsiexplain` is a lifesaver — every BIP code has structured help. Never ignore BIP codes; they almost always point at the real problem.

### Containers

**Q: How is ACE deployed in containers / on Cloud Pak for Integration?**

- Base image from IBM (or build with `ibmint optimize server`) — contains a minimal ACE runtime
- BAR files + server.conf.yaml layered in via the image or mounted from a volume
- On OpenShift/CP4I: deploy via the IntegrationServer CRD using the ACE operator
- HA via replicas + readiness probes; credentials from K8s secrets unlocked in the ACE vault

The container story is about shipping a minimal runtime plus artefacts, managed by the ACE operator on CP4I. The vault + K8s secret combination keeps credentials off disk and out of images.

### Troubleshooting

**Q: Throughput suddenly dropped on an ACE flow in production. Walk me through triage.**

- Check if the drop correlates with a recent deploy, config change or fix pack
- Enable flow/node statistics briefly to find the slow node
- Check backend systems (DB, HTTP target) — most 'ACE is slow' problems are a slow backend
- Check memory / GC logs on the integration server — full GCs every few seconds = undersized heap
- Check the OS: CPU saturation, IO wait, network retransmits

Sudden changes usually have a cause you can pin to a timeline: a change, an external dependency, a resource exhaustion. Stats + backend + OS covers those three lanes.

## ACE — Dev

### Node properties

**Q: How can you override node properties at runtime?**

- Use the LocalEnvironment — set `LocalEnvironment.Destination.*` to dynamically set output destinations
- Use BAR overrides at deploy time (`mqsiapplybaroverride` or `ibmint` overrides) to swap static config per environment
- Use policies (MQEndpoint, HTTP, etc.) and reference them from nodes — swap the policy instead of the node property
- Env var references in server.conf.yaml and config-references in modern ACE

For per-message dynamic values use LocalEnvironment; for per-environment static values use BAR overrides or policies. Mixing them up makes flows hard to read and deploy.

### Dynamic routing

**Q: How do you dynamically choose which MQ queue to write to?**

- Set `OutputLocalEnvironment.Destination.MQ.DestinationData[1].queueName` in a Compute node before MQOutput
- Leave the MQOutput's Queue Name blank / set to use destination list
- Similarly for HTTPRequest: `LocalEnvironment.Destination.HTTP.RequestURL`
- Handy for routing based on message content or a lookup

The destination list pattern is the idiomatic ACE way — the node reads its target from the LocalEnvironment at runtime, so one flow can fan out to any queue.

### Java

**Q: How do you use Java in ACE, and what is the difference with the CMP?**

- JavaCompute node — Java code executed in the flow; access the logical message tree via the IBM JavaCompute APIs
- Plain Java projects referenced from ESQL or JavaCompute for utilities / business logic
- CMP (Configuration Manager Proxy / IntegrationAPI) — Java API to manage the runtime (deploy, start/stop, query); not for in-flow logic
- Rule of thumb: JavaCompute = flow, IntegrationAPI/CMP = admin

JavaCompute is in-flight message processing; the IntegrationAPI / CMP is for automating administration. People new to ACE sometimes confuse them.

### Parsers

**Q: A flow handles XML messages but does not need to transform or read the content. Which parser do you use, and why?**

- BLOB — treats the payload as opaque bytes
- No parsing cost, best performance
- No impact when the schema changes — you don't parse it, you just pass it through
- Ideal for pass-through routing, file staging, or encrypted payloads

Parsing is expensive in CPU and memory; if you don't need to read the body, don't parse it. BLOB keeps the original bytes intact and maximizes throughput.

**Q: Give a quick overview of ACE parsers and when to pick each.**

- XMLNSC — namespace-aware XML parser, the default for XML, fast and on-demand
- JSON — JSON parser, similarly on-demand
- DFDL — data format description language, for fixed/variable-length records, CSV, custom binary — replaces MRM for new work
- MRM — legacy message sets, still used but being replaced by DFDL
- BLOB — no parsing, raw bytes
- MIME — multipart / attachments

Match the parser to the payload. For anything tabular or positional, DFDL is the right modern answer; new projects should avoid MRM unless legacy artefacts force it.

### Implementation choice

**Q: When do you choose ESQL vs Java vs Mapping node vs XSLT?**

- ESQL — native, optimized for message tree work, concise for transforms; best for most data-shape logic
- Mapping node — graphical mapping, good for complex schema-to-schema with reusable submaps
- JavaCompute — when you need Java libraries, existing JAR logic, or standard SDK features (crypto, complex date maths)
- XSLT — best for heavy XML-to-XML transformations where you already have XSLT artefacts
- Mix is fine — pick per node, not per flow

There is no single 'right' choice; pick the tool that matches the problem. Teams that default to 'everything in Java' tend to lose ESQL's tree performance; teams that default to 'everything in ESQL' sometimes reinvent the JDK.

### Unit of work

**Q: Describe the concept of unit of work inside a message flow.**

- A UOW brackets all transactional resources touched during the flow: MQ, database, JMS
- On successful end-of-flow, the UOW commits; on an unhandled exception, it rolls back
- MQ gets under syncpoint, DB writes in the same transaction, all commit together
- Catch / failure terminals let you choose to contain errors inside the UOW or propagate them

The flow is the UOW boundary unless you explicitly force commits. This is what makes ACE suitable for reliable integration — you either complete the whole job or nothing sticks.

### Error handling

**Q: For a simple MQ-in / MQ-out flow with no catch or failure terminals attached, what happens when an error occurs toward the end of the flow?**

- The UOW rolls back — the message goes back on the input queue
- BackoutCount is incremented
- Once BackoutCount >= BOTHRESH on the input queue, the backout handler moves it to the backout queue (or DLQ)
- No output is written because the MQ put was part of the same rolled-back UOW

With no error handling attached, the flow relies entirely on the MQ backout mechanism. That is valid but leaves you with no diagnostic context — adding a Failure terminal that logs is a cheap win.

### Transactionality

**Q: How do you make a flow transactional, and what does that actually mean?**

- Set the MQInput node property `Transaction Mode` to `Yes` (or `Automatic` to inherit message persistence)
- For output nodes, `Transaction Mode = Yes` so the put is under syncpoint
- Database nodes — set their Transaction to `Automatic` so they join the UOW
- Result: success commits MQ + DB together; failure rolls both back

Transactionality is a per-node setting that has to be consistent across the flow. One non-transactional node breaks the atomicity guarantee for the whole path.

### HTTPS

**Q: What do you need to deploy an HTTPS flow?**

- Set the HTTP Input/Reply or HTTPRequest node to use HTTPS
- Configure server keystore (for server-side) and/or truststore (for client-side) via policies or server.conf.yaml
- Populate the stores with the right certificates (server cert + chain for inbound, trusted CAs for outbound)
- Decide on mutual TLS (client cert required) and add the client CA to the truststore if so

HTTPS in ACE is configured at the server level (keystores/truststores) and referenced via policies — flows don't carry cert files themselves. Mutual TLS is a separate toggle you often forget to enable until security pushes back.

### Callable flows

**Q: What are callable flows, how do they work, and what is the key security point?**

- Callable Flow Invoke + Callable Input pair — a synchronous call between two flows that can be in different integration servers, on-prem and cloud
- Uses the Switch Server (a cloud-hosted IBM service) to relay the call; endpoints open an outbound connection to the switch
- Security: the connection is always initiated from the internal side outwards — no inbound firewall rule on the on-prem side
- Auth is handled by registering endpoints with credentials against the Switch Server

Callable flows solve the classic hybrid problem of calling on-prem from cloud without opening inbound firewalls. The Switch Server is the rendezvous point and both sides dial out to it.

### Tracing

**Q: Would you use Trace nodes in production? Why or why not?**

- Generally no — Trace nodes force a full parse of the message to render it, which kills throughput
- But in a diagnostic crunch they are easier to enable than service/user trace and have less overhead than full debugging
- Compromise: leave Trace nodes disabled, enable them temporarily to root-cause, then turn off
- Prefer logs/events/activity log for steady-state observability

Trace nodes are a debugging tool, not a monitoring one. The main cost is the forced parse — the thing you took care to avoid with BLOB is defeated by a Trace node down the line.

### Performance

**Q: A message flow is performing badly — how do you find the slow node?**

- Enable flow and node statistics: `mqsichangeflowstats -s ... -c active -t basic`
- Collect stats over a representative interval; read the CPU and elapsed time per node
- Look for the node with the highest elapsed time — that's usually the bottleneck
- Cross-check with backend timings (DB, HTTP) via their own monitoring

Stats give you a ground-truth breakdown per node; you don't guess, you measure. After that, the fix depends on whether the bottleneck is parsing, downstream, or code.

### Throughput

**Q: How do you increase throughput of a flow handling many small messages?**

- Increase additional instances on the input node so multiple threads process in parallel
- Commit count / batch settings on MQInput (`Commit Count`) — process several messages per commit to reduce transaction overhead
- Choose the cheapest parser you can get away with (BLOB if no parse needed)
- Scale horizontally: additional integration servers behind a cluster / LB

Small-message flows are usually bound by overhead per message. Parallelism and batched commits reduce that overhead by amortising it.

**Q: How do you increase throughput of a flow handling large messages?**

- Deploy the flow in a separate integration server (historically 'execution group') — isolate memory pressure
- Avoid parsing when possible; stream the payload (File Input record detection, FTP node) rather than loading it all
- Reduce message copies — minimise the number of nodes that mutate the tree
- Tune JVM heap and GC if JavaCompute is involved

Large messages stress memory and GC more than CPU. Isolation (own server) and streaming are the main tools; raw parallelism often hurts because you multiply memory pressure.

### Files

**Q: How do you handle very big files in an ACE flow?**

- Use the Large Messaging / file pattern: FileInput with record detection, process chunks, emit records to MQ
- Configure record detection by delimiter / fixed length to avoid loading the whole file
- Keep parser cheap inside the record loop (BLOB if downstream does not need to read)
- If you must load whole file: ensure enough heap + disk and run the flow in its own server

The trick is to avoid materialising the whole file in memory. Record-based streaming plus a lean inner flow is the proven pattern for GB-scale files.

### Database

**Q: How do you set up a database connection from ACE on Windows / Linux?**

- Install and configure the ODBC driver for the DB (DataDirect drivers ship with ACE for common DBs)
- Windows — create a System DSN in ODBC Data Source Administrator (64-bit)
- Linux — define the DSN in `odbc.ini` and point `ODBCINI` / `MQSI_ODBC_INI` to it
- Supply credentials with `mqsisetdbparms` (or via the ACE vault), reference the DSN from the Database/Compute node

The pattern is the same on both OSes: ODBC DSN + credentials stored separately + node references the DSN. The main difference is GUI vs config file.

**Q: How do you debug database connection issues in ACE?**

- Check integration server log for BIP2322/BIP2393-style messages (DB connection errors)
- `mqsicvp` (Connection Verification Program) — tests the ODBC DSN outside of a flow
- Verify `mqsisetdbparms` or vault entries are present for the DSN
- Check ODBC driver version / library paths (LD_LIBRARY_PATH, PATH)
- Attempt a plain `isql`/`osql` connection with the same DSN and creds to isolate ACE vs driver

Isolate whether the problem is ACE config, ODBC driver, credentials, or the database itself. `mqsicvp` plus a plain ODBC client test narrow it down quickly.

### Artefacts

**Q: Shared library vs static library — what is the difference?**

- Static library — compiled into every BAR file that uses it; changes require redeploying the consuming apps
- Shared library — deployed once to the integration server and referenced by multiple applications at runtime
- Shared library can be updated without rebuilding all consumers; great for common subflows, ESQL routines, XSDs
- Use shared for truly shared artefacts; static for app-internal modules

Shared libraries are a deployment-time contract, not just a code reuse tool. Treat them with care — a breaking change in a shared lib ripples to every consumer.

### REST

**Q: How do you build a REST API in ACE?**

- Use the REST API project type in the Toolkit, describe the API with an OpenAPI (Swagger) document
- Each operation maps to a subflow; inputs and outputs go through HTTP Input/Reply nodes with JSON parser
- Deploy as an application; the server exposes the API at a configured base path
- Secure with a Security Profile (basic, LDAP, OAuth) + HTTPS policy
- Document at runtime via the built-in Swagger UI / OpenAPI endpoint

ACE's REST API projects are OpenAPI-first — you design the contract then implement each operation. This keeps the API surface explicit and makes the runtime self-documenting.

### DFDL

**Q: When do you use DFDL and how does it compare to MRM?**

- DFDL — Data Format Description Language, open standard for describing fixed/variable/delimited binary and text formats
- Use cases: CSV, COBOL copybooks, SWIFT, fixed-length records, custom binary protocols
- Modelled in the Toolkit, preview with sample data, versioned in Git as XSDs/schemas
- Replacement direction for MRM; MRM is legacy but still supported

DFDL is the modern, industry-standard way to describe non-XML/non-JSON formats. New projects should default to DFDL; MRM stays for legacy artefacts you can't easily convert.

### Routing

**Q: What routing options do you have in ACE — Filter, Route, Label?**

- Filter node — single ESQL boolean expression, true/false terminals
- Route node — match XPath-like expressions, multiple terminals, first-match
- RouteToLabel + Label nodes — compute a label name at runtime, then branch dynamically
- Pick Route for simple static fan-out, RouteToLabel for dynamic content-based routing

Route is declarative and readable for a handful of cases; RouteToLabel is for runtime-decided routing or when the set of destinations is larger or dynamic.

### Troubleshooting

**Q: Every deploy your ACE application starts but does not respond. How do you diagnose?**

- Check the integration server log for BIP messages at deploy time — especially any BIP21xx (config/property) or BIP22xx (DB/MQ connect)
- `mqsilist -r` for resources — is the app deployed, started, and do nodes show ready?
- Verify policies and BAR overrides actually applied: inspect `overrides/` and use `mqsireportproperties`
- Hit the health endpoint and check JMX/metrics for node status
- If MQ-triggered: check backend connectivity (channel, queue authorizations)

Starting without responding almost always means 'app loaded, but an input node couldn't open its resource'. BIP messages in the server log tell you which resource and why.

## Cloud

### Platforms

**Q: What cloud platforms are you familiar with?**

- Azure — AKS, ARO (Azure Red Hat OpenShift), Service Bus
- AWS — EKS, ROSA (Red Hat OpenShift on AWS), SQS, MSK
- GCP — GKE, Pub/Sub
- IBM Cloud — ROKS (Red Hat OpenShift on IBM Cloud), CP4I
- On-prem — OpenShift, vanilla Kubernetes

Listen for which clouds the candidate actually deployed to vs read about. For integration work, container platform (AKS/EKS/ROSA/ARO) matters more than the cloud brand.

### Kubernetes

**Q: What is the difference between AKS and EKS?**

- AKS — Azure Kubernetes Service; control plane managed by Azure, worker nodes are Azure VMs
- EKS — Amazon Elastic Kubernetes Service; control plane managed by AWS, workers are EC2 or Fargate
- Integration — AKS ties deeply to Azure AD, ACR, Monitor; EKS to IAM, ECR, CloudWatch
- Both are vanilla Kubernetes under the hood; workloads are largely portable between them

The underlying Kubernetes is the same; the differences are identity, registry, networking and logging integrations. Skilled candidates call out which of those matter for the platform they want to use.

### OpenShift

**Q: What is managed OpenShift called on Azure and on AWS?**

- Azure — ARO (Azure Red Hat OpenShift), jointly managed by Microsoft and Red Hat
- AWS — ROSA (Red Hat OpenShift Service on AWS), jointly managed by AWS and Red Hat
- Both give you a full OpenShift cluster with SLAs and integrated billing
- IBM Cloud equivalent: ROKS (Red Hat OpenShift on IBM Cloud)

ARO and ROSA let you run OpenShift with a managed control plane on the hyperscaler of your choice — important for CP4I deployments that expect OpenShift.

### CP4I

**Q: What is Cloud Pak for Integration (CP4I) and what does it give you?**

- IBM's integration product suite on OpenShift: ACE, MQ, API Connect, Event Streams, DataPower, Aspera
- Operators for each product (IntegrationServer, QueueManager, ...) expose them as Kubernetes CRDs
- Shared foundational services: Platform Navigator, keycloak-based auth, automation assets
- One subscription / entitlement covers the whole suite

CP4I is how IBM packages its integration portfolio for containers. The big benefit is operator-driven lifecycle — create an IntegrationServer or QueueManager by applying a YAML and the operator does the rest.

### Containers

**Q: What are the container patterns for MQ and ACE in Kubernetes?**

- MQ — StatefulSet per qmgr for stable network identity and persistent volumes; Native HA uses 3 replicas
- ACE — Deployment (stateless) with multiple replicas behind a Service; state lives in MQ/DB
- Config via ConfigMap / Secret; ACE vault unlocked with a K8s secret
- Readiness and liveness probes — ACE /health endpoint; MQ uses built-in operator probes

The split is simple: MQ is stateful, ACE is (should be) stateless. Getting that split right in Kubernetes saves a lot of pain later.

## Resources

### MQ

- [IBM MQ Documentation (Knowledge Center)](https://www.ibm.com/docs/en/ibm-mq) _(docs)_ — Canonical reference. Start here for any MQ concept or command.
- [IBM MQ Developer](https://developer.ibm.com/components/ibm-mq/) _(docs)_ — Tutorials, container images, downloads, community pieces.
- [ibm-messaging on GitHub](https://github.com/ibm-messaging) _(github)_ — Official samples, container images, MQ operator, performance reports.
- [MQ Performance Reports (Tim Zielke et al.)](https://github.com/ibm-messaging/mqperf) _(github)_ — Detailed performance numbers per platform and version.
- [IBM MQ Community (Support forum)](https://community.ibm.com/community/user/integration/communities/community-home?CommunityKey=183ec850-4947-49c8-9a2e-8e7c7fc46c64) _(community)_
- [MQ High Availability (MQTC 2018)](https://www.ibm.com/support/pages/system/files/inline-files/MQTC_v2018_High_Availability.pdf) _(pdf)_ — Solid deep dive into MI, RDQM and cluster HA. Also stashed locally at Docs/MQTC_v2018_High_Availability.pdf in the original repo.

### ACE

- [IBM ACE Documentation (v12)](https://www.ibm.com/docs/en/app-connect/12.0) _(docs)_
- [App Connect on IBM Developer](https://developer.ibm.com/components/app-connect/) _(docs)_
- [ot4i on GitHub](https://github.com/ot4i) _(github)_ — ACE container samples, patterns, toolkit extensions.
- [BIP message reference](https://www.ibm.com/docs/en/app-connect/12.0?topic=messages-bip) _(docs)_ — Look up any BIPxxxx code. Equivalent to running `mqsiexplain <code>`.
- [IBM Integration Community](https://community.ibm.com/community/user/integration/home) _(community)_
- [DFDL spec (OGF)](https://www.ogf.org/documents/GFD.240.pdf) _(pdf)_ — Formal DFDL specification. Overkill for daily work but the reference.

### Cloud

- [IBM Cloud Pak for Integration docs](https://www.ibm.com/docs/en/cloud-paks/cp-integration) _(docs)_
- [Red Hat OpenShift documentation](https://docs.openshift.com/) _(docs)_
- [IBM Operator Catalog](https://www.ibm.com/docs/en/cloud-paks/cp-integration/operators) _(docs)_

### All

- [IBM Integration blog](https://community.ibm.com/community/user/integration/blogs/matthias-jung1) _(blog)_
- [IBM Redbooks — integration](https://www.redbooks.ibm.com/) _(book)_ — Search for 'IBM MQ', 'App Connect Enterprise', 'Cloud Pak for Integration'.
