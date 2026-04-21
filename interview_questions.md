# IBM ACE and MQ Interview Questions

Generated from `src/data/questions.json` — edit the JSON and run `npm run gen:md`.

**Total questions:** 90

## Table of contents
- [General (3)](#general)
- [MQ — Admin (27)](#mq-admin)
- [MQ — Dev (11)](#mq-dev)
- [ACE — Admin (18)](#ace-admin)
- [ACE — Dev (26)](#ace-dev)
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
- When and how they escalated (IBM case, colleague, community) — comfortable asking for help at the right moment rather than grinding alone or punting too early
- Documents the issue as they go (tickets, runbooks, internal wiki, PR descriptions) so the next person doesn't have to start from scratch
- Captures what was learned afterwards and turns it into an improvement — updated docs, a tweaked runbook, a small script, a regression test

Looking for three traits in one story: (1) structured troubleshooting rather than flailing, (2) comfort asking for help when needed, and (3) a post-mortem mindset that actually improves something afterwards — notes written, runbooks updated, tooling added. An answer that nails the debugging steps but leaves no trace for the team is only half the job.

### Keeping up

**Q: How do you keep up with new releases and features in ACE and MQ?**

- IBM Community — dedicated subsections per technology (MQ, ACE, CP4I); official announcements, Q&A, 'What's new' posts
- LinkedIn — following IBMers and integration specialists who post regularly (e.g. Ben Thompson on ACE) and reading blogs from fellow integration consultants
- IBM Docs release notes and fix-list pages — the authoritative source for each release
- GitHub repos (ibm-messaging, ot4i) — samples, operators, container images are often updated before the blog posts land
- Running CD releases in a lab or container to actually try the features hands-on

Shows curiosity and a personal learning loop. A good answer pairs authoritative sources (IBM Community, Docs) with people-driven sources (LinkedIn, peer blogs) and hands-on experimentation. Mentioning specific people or blogs they follow is a strong signal — it means they actually read this stuff.

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

- Circular (the default) — a ring of primary (+ optional secondary) log files that are reused; supports restart recovery only; lowest admin overhead and best performance
- Linear — log records kept in a continuous sequence; supports both restart recovery AND media recovery (replay the log to rebuild a damaged queue manager object)
- Linear needs `rcdmqimg` to take media images so older logs can be archived/reaped; without that housekeeping the filesystem fills up
- Linear uses more disk space and carries a small performance cost, but is typically recommended for production where recovery requirements are stricter
- Circular is simpler and lighter — fine when durability comes from replication/HA (RDQM, Native HA, backups) rather than log replay

Both models handle restart recovery after a clean or crash restart — the key differentiator is media recovery, i.e. replaying the log to rebuild a damaged object. Linear enables it at the cost of extra admin work (rcdmqimg + archiving); circular trades that away for simplicity. Production installs usually pick linear for exactly that reason.

_References:_
- <https://www.ibm.com/support/pages/ibm-mq-linear-and-circular-logging>
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=SSFKSJ_9.2.0%2Fcom.ibm.mq.con.doc%2Fq018440_.html>
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=SSFKSJ_9.2.0%2Fcom.ibm.mq.pla.doc%2Fq018445_.html>

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

**Q: How does distributed publish/subscribe work in MQ (clusters and hierarchies)?**

- Two distribution models: **publish/subscribe cluster** (flat, built on a standard MQ cluster) and **publish/subscribe hierarchy** (parent/child relationships between qmgrs)
- Clustered topics — set the CLUSTER property on a TOPIC object; two routing options: DIRECT and TOPICHOST
- DIRECT routing — qmgrs connect peer-to-peer for pub/sub traffic; simplest, fine for small clusters but generates a lot of proxy-subscription traffic at scale
- TOPICHOST routing — publications flow via the qmgr(s) hosting the topic definition; fewer inter-qmgr connections, scales better for larger/busier topologies
- Pub/sub hierarchy — parent/child links between qmgrs; useful to tie separate clusters or qmgr groupings together in a controlled, structured way
- PUBSCOPE and SUBSCOPE topic properties control how far publications and subscriptions propagate (QMGR-only vs ALL) — essential for containing traffic in mixed topologies
- From the ACE side, pub/sub is just the messaging pattern — ACE flows publish/subscribe to the MQ topic space like any other application

Cluster-based pub/sub is the right default when you want scale and auto-discovery across peer qmgrs; hierarchy is the answer when you need controlled, structured links (e.g. connecting otherwise-separate clusters). Knowing PUBSCOPE/SUBSCOPE exists to scope traffic is what separates 'I've used MQ pub/sub' from 'I've designed a pub/sub topology'.

_References:_
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=networks-publishsubscribe-clusters>
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=networks-connecting-queue-manager-publishsubscribe-hierarchy>
- <https://www.ibm.com/docs/en/ibm-mq/9.4.x?topic=explorer-configuring-publishsubscribe-mq-queue-managers>
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=SSFKSJ_9.2.0/com.ibm.mq.con.doc/q017435_.htm>
- <https://www.ibm.com/docs/en/app-connect/11.0.0?topic=applications-publishsubscribe-overview>
- <https://www.mqtechconference.com/sessions_v2014/MQTC_pubsub_networks.pdf>
- <https://mqseries.net/phpBB/viewtopic.php?t=78106&sid=f3b380efc56696085c1231f21d>

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

- A unit of work groups message operations into a single transaction — puts and gets within it commit or roll back together, preserving data integrity across related operations
- Visibility rule: messages put inside a UOW aren't visible to other applications until commit; messages got inside a UOW aren't permanently removed until commit
- Apps opt in via MQGMO_SYNCPOINT / MQPMO_SYNCPOINT on individual get/put calls; control verbs are MQCMIT (commit), MQBACK (roll back), MQBEGIN (start a qmgr-coordinated global UOW)
- Local UOW — only MQ resources, usually one qmgr, coordinated by the qmgr itself with single-phase commit
- Global UOW — MQ plus one or more external resource managers (e.g. a DB); coordinated with two-phase commit, typically by an external TM or by the qmgr when apps use MQBEGIN
- On rollback, MQMD.BackoutCount is incremented on any messages that were got under syncpoint — this is the hook for poison-message handling (compare against BOTHRESH, reroute to BOQNAME)

A UOW is how MQ gives you atomicity across several message operations, and (via XA) across MQ plus other resources like a database. Local vs global is really 'single-phase vs two-phase commit' — mention MQCMIT/MQBACK/MQBEGIN by name and you signal you've actually written transactional MQ code rather than just heard about it.

_References:_
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=SSFKSJ_9.2.0/com.ibm.mq.dev.doc/q026790_.html>
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=SSFKSJ_9.2.0/com.ibm.mq.sce.doc/q023320_.htm>
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=SSFKSJ_9.2.0/com.ibm.mq.ref.dev.doc/q106030_.htm>
- <https://usuaris.tinet.cat/sag/mq_trmgr.htm>
- <https://www.mqtechconference.com/sessions_v2014/Introduction_to_MQ.pdf>

### Persistence

**Q: How are persistent messages implemented and configured in MQ?**

- Persistent — written to the qmgr recovery log so the message can be recovered after a failure or restart; for business data you cannot afford to lose
- Non-persistent — lighter and faster, not intended to survive qmgr failure/restart; for traffic where speed matters more than guaranteed delivery
- Persistence is carried on the message itself in MQMD.Persistence: MQPER_PERSISTENT (1), MQPER_NOT_PERSISTENT (0), MQPER_PERSISTENCE_AS_Q_DEF (2)
- The queue's DEFPSIST attribute is only used when the app puts with AS_Q_DEF — it is a suggestion, not an enforced rule, so persistent and non-persistent messages can coexist on the same queue
- Non-persistent messages normally don't survive qmgr restart; NPMCLASS(HIGH) on the queue tells the qmgr to try to retain them across a normal restart (not supported on z/OS)
- Non-persistent messages sent over a fast channel can be lost if the channel fails, because they aren't logged
- From ACE/IIB flows, persistence + syncpoint is the primary tool for avoiding message loss — IBM recommends deliberate use rather than leaving it to defaults

Persistence trades throughput for durability, and it is ALWAYS set by the putting application in MQMD.Persistence — the queue's DEFPSIST is just a suggestion used when the app opts in with AS_Q_DEF. The two gotchas to mention: NPMCLASS(HIGH) can preserve non-persistent messages across a normal restart, and non-persistent + fast channel means message loss is possible even without a restart.

_References:_
- <https://www.ibm.com/docs/en/ibm-mq/9.3.x?topic=objects-persistence>
- <https://www.ibm.com/docs/en/ibm-mq/9.3.x?topic=properties-mq-queue>
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=descriptor-persistence-mqlong>
- <https://www.ibm.com/docs/en/integration-bus/10.0.0?topic=messages-ensuring-that-are-not-lost>
- <https://www.ibm.com/support/pages/ibm-mq-message-persistence-faqs>
- <https://www.ibm.com/support/pages/node/6576289>
- <https://www.ibm.com/docs/en/ibm-mq/9.4?topic=constants-mqper-persistence-values>
- <https://www.ibm.com/docs/en/ibm-mq/9.4?topic=application-jms-persistent-messages>
- <https://github.com/ibm-messaging/mq-container/issues/376>

**Q: Can a non-persistent message be put on a queue with DEFPSIST(YES), and vice versa?**

- Yes — to both directions. Persistence is set by the putting application in MQMD.Persistence and always wins
- DEFPSIST is the queue's 'default persistence' attribute and is ONLY consulted when the app uses MQPER_PERSISTENCE_AS_Q_DEF
- Result: persistent and non-persistent messages can sit on the same queue at the same time — that is normal and expected
- To verify what is actually on a queue, browse with the amqsbcg sample and inspect MQMD.Persistence (0 = non-persistent, 1 = persistent)
- AS_Q_DEF can surprise you in resolution chains: the value is taken from the FIRST queue definition in the resolution path at put time (alias, local, remote, qmgr alias, xmitq, cluster queue)

A common misunderstanding. DEFPSIST is a suggestion, not an enforced policy, so queues end up mixed whenever different apps use different defaults. When behaviour surprises you with AS_Q_DEF, remember the resolution-path rule: the first object the name resolves to supplies the default, which may not be the queue you think.

_References:_
- <https://www.ibm.com/support/pages/ibm-mq-message-persistence-faqs>
- <https://www.ibm.com/support/pages/node/6576289>
- <https://www.ibm.com/docs/en/ibm-mq/9.4?topic=constants-mqper-persistence-values>

### High availability

**Q: What HA options does IBM MQ offer?**

- **Externally managed (traditional installs)** — OS/cluster-level HA (Pacemaker, VCS, MSCS) plus Multi-Instance QMGR on shared storage (active/standby)
- **MQ-managed on Linux** — RDQM: HA RDQM (three-node, synchronous, single site) and DR RDQM (two-node, asynchronous, cross-site); no shared storage needed
- **MQ Appliance** — paired physical appliances with built-in replication, maintained as a unit
- **MQ Cluster** — horizontal workload distribution across many active qmgrs; not message HA by itself, but enables application continuity when combined with per-qmgr HA
- **Containers / cloud (modern)** — Native HA (3-node quorum, no shared storage) for in-cluster resilience, and Uniform Clusters for elastic app-level rebalance; typically layered together (Uniform Cluster of Native HA qmgrs)
- Typical selection heuristic: legacy on-prem → clusters + MI or HA RDQM; new container / cloud deployment → Native HA + Uniform Cluster; mission-critical hardware appliance → MQ Appliance

Always split 'system HA' (qmgr stays up), 'message HA' (no message loss) and 'application HA' (clients keep working) — a full answer picks a mechanism per layer. The modern direction is clearly Native HA + Uniform Clusters in containers; on traditional installs, HA RDQM has largely replaced MI as the default HA choice on Linux.

_References:_
- <https://www.ibm.com/docs/en/ibm-mq/9.4.x?topic=configuring-high-availability>

**Q: What is Multi-Instance QMGR and what is its biggest weakness?**

- MI = Multi-Instance queue manager: IBM MQ's built-in active/standby model with the SAME queue manager configured on two servers — not two qmgrs kept in sync
- One qmgr, data + logs on shared storage (typically NFSv4 with proper locking). Both servers point at the same data; the first instance to acquire the required read/write locks becomes active, the other stays standby
- Only ONE active + ONE standby at a time — you can't configure one active with two standbys
- Failover triggers: the active instance dies, loses storage, or is detected as unresponsive and shut down; the standby then acquires the locks and becomes active
- Clients need to be reconnectable via CCDT / client reconnect to follow the failover — IBM MQ classes for Java don't support automatic reconnect, worth knowing
- Operationally: stop all MI instances before doing maintenance on the shared storage, and keep backups — MI doesn't protect against storage corruption
- **Biggest weakness:** the storage layer. If the shared filesystem / NFS server goes away or locking misbehaves, both instances are dead — MI protects qmgr availability but inherits storage availability as a single point of failure

MI is an elegant, low-ceremony failover model — one qmgr, two servers, shared storage, automatic failover — but it hard-depends on the shared filesystem behaving correctly. Most real MI incidents come from NFS or locking issues, not from MQ itself, so the honest summary is that MI converts 'server availability' into 'storage availability + locking correctness'.

_References:_
- <https://www.ibm.com/docs/en/ibm-mq/9.3.x?topic=configurations-multi-instance-queue>

**Q: What is RDQM and how does HA RDQM differ from DR RDQM?**

- RDQM = Replicated Data Queue Manager — an IBM MQ availability option on **Linux** (RHEL x86-64 in 9.4) where the qmgr's data is replicated between nodes so another node can take over if the original is lost
- Uses **DRBD** for block-level data replication and **Pacemaker** for cluster/failover behaviour; no shared filesystem required (unlike MI)
- **HA RDQM** — three nodes in an HA group, each holding an instance of the same qmgr. Only one is primary at a time; it synchronously replicates to the two secondaries. Uses a **three-node quorum** to avoid split-brain, automatic failover, optional floating IP so clients see one address
- **DR RDQM** — primary on one node/site, secondary on another. Replication can be **synchronous or asynchronous, async is the default** — meaning some recent updates may not have reached the DR copy at the moment of disaster. Failover is **manual**: you promote the secondary then start the qmgr
- **HA RDQM** is about fast local failover after a node failure (3 nodes, quorum, sync replication, automatic). **DR RDQM** is about site recovery after a bigger outage (2 nodes across sites, sync/async replication, manual promotion)
- The two can be combined — an HA RDQM group at the primary site with a DR RDQM copy at a second site — for both node-level HA and cross-site DR
- Since **MQ 9.4.4** IBM recommends Native HA as the preferred Linux HA option for new deployments; RDQM remains fully supported but is no longer the default recommendation

RDQM solves the 'HA without shared storage' problem that plagued MI on Linux — DRBD replicates the data, Pacemaker handles failover, and a three-node quorum keeps split-brain off the table. Know the two flavours cold: HA RDQM = 3 nodes, sync, automatic, fast local failover; DR RDQM = 2 nodes, sync-or-async (async default), manual promotion, cross-site recovery. Mention that since 9.4.4 Native HA is IBM's recommended direction on Linux — RDQM still works and is supported, but the story for new deployments is increasingly 'Native HA in containers'.

_References:_
- <https://www.ibm.com/docs/en/ibm-mq/9.4.x?topic=configuring-high-availability>
- <https://www.ibm.com/docs/en/ibm-mq/9.4.x?topic=availability-rdqm-high>
- <https://www.ibm.com/docs/en/ibm-mq/9.4.x?topic=availability-rdqm-disaster-recovery>

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

**Q: How does Multi-Instance differ from true HA?**

- MI is active/standby with a single live qmgr at any moment — traffic flows through one instance, the other just waits
- A true HA pool has multiple live instances sharing the workload; loss of one instance is absorbed by the others with minimal or no perceived outage
- MI failover takes time — lock release, storage handoff, channel restart, clients reconnect — so there's a brief outage even on a clean switch
- Because only one instance is live, MI protects against losing the **active server**, not against higher rates of incoming traffic or against storage failure
- In practice this positions MI closer to **DR** (minimise downtime when something breaks) than HA (be continuously available) — a genuine HA story adds something else: MQ Cluster, HA RDQM, Native HA, or Uniform Cluster
- Common real-world pattern: MI (or HA RDQM) for per-qmgr resilience, combined with an MQ Cluster or Uniform Cluster in front so traffic always has a live qmgr to land on

The clearest way to frame this: MI guarantees you'll still HAVE a qmgr after a failure, but not that you'll still be PROCESSING during the failover. True HA (clusters, Native HA, Uniform Cluster) keeps processing. A mature architecture usually combines both — MI/HA RDQM/Native HA to protect each qmgr individually, and clustering in front to keep the overall service live.

_References:_
- <https://www.ibm.com/docs/en/ibm-mq/9.4.x?topic=configuring-high-availability>

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

**Q: A user says 'my messages disappeared after a qmgr restart' — walk me through the diagnosis.**

- First: were they persistent? Non-persistent messages are expected to be discarded on restart unless the queue has NPMCLASS(HIGH)
- Verify persistence by browsing the queue with amqsbcg and checking MQMD.Persistence (0 non-persistent, 1 persistent); if they were NOT_PERSISTENT the 'loss' is by design
- If the app used AS_Q_DEF, resolve where DEFPSIST actually came from — the FIRST queue in the resolution path (alias/remote/qmgr alias/xmitq/cluster), not necessarily the target local queue
- Check whether the path used a fast channel (NONPERSISTENTMSGSPEED(FAST)) — non-persistent messages on a fast channel can be lost if the channel fails, without any restart
- Enable an MQ application trace to confirm what MQMD the put is actually setting, rather than assuming the app puts persistent
- If everything should have been persistent but messages are still gone, use the 'Where's my message?' recovery-log approach to track what the qmgr actually did

'Lost messages after a restart' is almost always one of three things: the messages were never persistent in the first place, DEFPSIST resolved to a different object than the admin expected, or they travelled over a fast channel. Confirm persistence before looking for a bug.

_References:_
- <https://www.ibm.com/support/pages/ibm-mq-message-persistence-faqs>
- <https://www.ibm.com/support/pages/node/507119>
- <https://www.ibm.com/docs/en/ibm-mq/9.4?topic=queues-browsing-sample-program>

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

**Q: What are the three MQPER_* persistence values and what does AS_Q_DEF actually resolve to?**

- MQPER_NOT_PERSISTENT (0) — message won't be logged; won't survive a qmgr restart (unless NPMCLASS(HIGH) is set on the queue for a normal restart)
- MQPER_PERSISTENT (1) — message is logged and survives qmgr failure/restart
- MQPER_PERSISTENCE_AS_Q_DEF (2) — take the default from the queue's DEFPSIST attribute (this is the MQMD default if the app doesn't set anything)
- Resolution gotcha: when AS_Q_DEF is used, the default is taken from the FIRST queue definition in the resolution path at MQPUT/MQPUT1 time — alias, local, remote, qmgr alias, xmitq or cluster queue
- So the DEFPSIST you think you set (e.g. on the target local queue) may not be the one that gets applied if an alias or remote definition sits in front of it

Every MQ developer has to know the three persistence values, but AS_Q_DEF is where the questions come from. Answering that the default is taken from the first queue in the resolution path (not the physical destination) is the signal you've debugged this at least once.

_References:_
- <https://www.ibm.com/support/pages/ibm-mq-message-persistence-faqs>
- <https://www.ibm.com/docs/en/ibm-mq/9.4?topic=constants-mqper-persistence-values>
- <https://www.ibm.com/docs/en/ibm-mq/9.2.x?topic=descriptor-persistence-mqlong>

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

- Pre-history — **MQSI** v1/v2 (1999-2000) → **WBIMQI** v2.1 (2002) → **WBIMB** v5.0/5.1 (2003); same product line, repeated rebrands
- **WebSphere Message Broker (WMB)** — v6/v6.1 (2006), v7 (2009), v8 (2011); mostly out of support now
- **IBM Integration Bus (IIB)** — v9 (2013), v10 (2015); rebrand of WMB, architecturally close to what became ACE v11
- **App Connect Enterprise (ACE) v11** (2018) — first 'ACE' release; introduced the Standalone Integration Server as a first-class model alongside the Integration Node
- **ACE v12** (2021) — the widely-deployed family; shift to ibmint-based tooling and strong container / CP4I story
- **ACE v13** (GA 27 Sep 2024) — current major; continues the CD cadence, deepens the container-native / ibmint direction, new 5+1+3 support policy
- Concepts (flows, ESQL, BAR files, parsers) stay largely consistent across all of them; tooling, deployment model and cloud integration are what change

The product has been around since 1999 under five different names. Most flow and ESQL knowledge carries forward from WMB through ACE v13 — that's why experienced developers rarely need to relearn the fundamentals. The real differences version-to-version are tooling (toolkit → ibmint), Integration Node vs Standalone Integration Server, and the cloud / container story.

**Q: What is the current ACE release cadence, support policy, and product editions?**

- Current major family is ACE v13 — GA 27 September 2024; v12 is still widely deployed and supported
- Support policy is **5 + 1 + 3** (new from v13): 5 years standard support, then 1 year extended support for new defects, then 3 years extended support for usage / known defects only
- For v13 that means end of standard support 2029, end of extended support 2033
- Older cycles for reference: v12 = 5+3, v11 = 5+3 later extended to 6+2, IIB v10 = 5+3 extended to 7+3
- V.R.M.F numbering: a Version or Release change starts a new lifecycle; Modifications add features but keep the original dates; Fix-packs are maintenance
- Continuous Delivery stream — frequent mod-releases (12.0.x, 13.0.x) add new features inside the same lifecycle dates
- Product editions were renamed in v13: Developer → **Evaluation**, Non-Production-Free → **Development**, Non-Production stays, Advanced → **Production-Advanced**, Standard → **Production-Standard**
- Evaluation is unsupported and capped at 1 msg/sec; Development/Non-Production/Production-* are all Unlimited performance; Production-Standard has production rights but not in containers and is limited to 1 integration server per integration node

ACE has both a version lifecycle (V.R changes start a new clock) and mod-releases (M changes add features without moving the clock), layered with fix-packs. The v13 shift to a 5+1+3 support policy is worth knowing — it's the new IBM-wide model. Equally important for licensing conversations: v13 renamed the product editions to make the permitted usage explicit (Evaluation / Development / Non-Production / Production-Advanced / Production-Standard). Note: all of the above is the ON-PREM release model — the ACE Operator (CP4I / OpenShift) has its own release model, channels and lifecycle, covered separately.

_References:_
- <https://www.ibm.com/docs/en/app-connect/13.0?topic=new-whats-app-connect-enterprise>

**Q: What are the major changes between WMB/IIB/ACE versions, and how easy is it to migrate between them?**

- WMB v8 → IIB v10 — primarily a rebrand plus refinements; projects usually migrate with a toolkit import and a rebuild, few code changes
- IIB v10 → ACE v11 — the big architectural shift: Standalone Integration Server introduced as a first-class model next to Integration Node; moderate effort as you decide whether to stay on nodes or move to standalone servers
- ACE v11 → v12 — relatively smooth at the flow level; main work is adopting the new ibmint-based tooling (ibmint package, ibmint deploy, ibmint optimize) and updating CI pipelines that relied on toolkit/mqsi commands
- ACE v12 → v13 — CD-style upgrade; continues the container-native and ibmint direction, some deprecations to review, typically the lightest jump if you're already on modern tooling
- Flow/ESQL code, BAR structure and most node properties tend to survive migration intact — the effort sits in tooling, deployment and policies rather than business logic
- Standard migration checklist: read the 'What's new' / deprecations page, rebuild BARs with the new toolkit or ibmint, run regression tests against a parallel environment, refresh CI and container images

Each jump has a different flavour: WMB→IIB is cosmetic, IIB→ACE v11 is architectural, v11→v12 is tooling-driven, v12→v13 is incremental CD evolution. Most customers don't skip two majors in one go because each step has its own 'What's new' / deprecations page that has to be worked through; the biggest migrations are usually the old IIB→ACE v11 jumps, not the newer ones.

**Q: How does the release model of the ACE Operator (CP4I / OpenShift) differ from on-prem ACE?**

- The ACE Operator packages the ACE certified container and is delivered through IBM's operator channels on OpenShift — separate artefact and lifecycle from the on-prem installer
- Two release streams for the operator: **Continuous Delivery (CD)** channel and an **LTS / Cycle-2** channel — you pick the channel that matches your risk/feature appetite
- **Operator version ≠ operand version.** The operator software has its own version; the integration server image it deploys (the 'operand') has its own ACE version (e.g. 13.0.2.x). The IBM docs publish the supported operand-version-per-channel matrix
- Upgrades are driven by the OpenShift OLM subscription to a channel; switching channel = switching lifecycle, not just updating the operator
- On CP4I, IBM supports the whole stack: operator + container images + Red Hat OpenShift + Common Services, rather than the on-prem 'just the ACE bits' scope
- Extended Update Support (EUS) is available but only for specific combinations — an EUS operator supports only certain operand versions / channels
- In interview terms: describe it as 'two products sharing a runtime' — the operator handles packaging, lifecycle and k8s integration; the operand is the ACE runtime itself

The operator world is stream- and channel-based rather than version-and-fix-pack based. The important mental shift is that you subscribe to a channel in OLM and IBM publishes which operand (ACE container) versions flow through that channel — you don't pin a specific ACE fix-pack the way you would on-prem. Know the words 'operator', 'operand', 'channel', 'CD vs LTS/Cycle-2', and 'EUS' and you're fluent.

_References:_
- <https://www.ibm.com/docs/en/app-connect/13.0.x?topic=release-models-packaging-versions-app-connect-operator>
- <https://www.ibm.com/support/pages/ibm-app-connect-enterprise-certified-container-versions-support-lifecycle>
- <https://www.ibm.com/docs/en/app-connect/13.0.x?topic=release-app-connect-operand-versions-features>

### Topology

**Q: Integration Node vs Standalone Integration Server — what's the difference?**

- **Integration Node** — the classic model: a node process manages one or more Integration Servers; centralised admin, shared queue for commands, single place to deploy and start/stop servers
- **Standalone Integration Server** — a single Integration Server process with no managing node; simpler lifecycle, one process = one deployable artefact
- Historically an Integration Node needed a local MQ install to handle admin; since ACE v12 you can run a node without that hard MQ dependency, though a local MQ still makes day-to-day admin easier
- Standalone does NOT require MQ either — but you can still configure MQ for a standalone server if your flows use MQ nodes, or to back admin/monitoring
- Admin surface is similar for both — Web UI, REST API, ibmint/mqsi commands — just scoped differently (node vs single server)
- Pick **Node** when you want to manage several servers together on the same host and like the classic admin experience; pick **Standalone** for microservice-style deployments, containers, CP4I, or CI-driven pipelines
- IBM's direction of travel is clearly standalone + containers; new deployments (especially k8s / CP4I) should default to standalone

Both models run the same flow engine — the difference is lifecycle and management. Integration Node gives you a 'mini control plane' that can manage multiple servers on a host; standalone gives you one process you can containerise and orchestrate elsewhere. Clarify the MQ question carefully: since v12, neither model has a hard MQ requirement, but MQ remains useful (mandatory for MQ nodes in flows, and historically the admin transport on a node). Most of the shops you'll walk into today either already run standalone or are migrating to it.

### CLI

**Q: How familiar are you with the ACE command line — what tools do you reach for?**

- **Standalone Integration Server** — manage the lifecycle with `mqsicreateworkdir` and the `IntegrationServer` command; `mqsistart` / `mqsistop` do NOT apply here (they're for nodes)
- **Integration Node** — `mqsicreatebroker` / `mqsideletebroker`, `mqsistart NODE` / `mqsistop NODE` to run the node, then `mqsideploy`, `mqsilist`, `mqsichangeproperties -n NODE -e EG` to manage its servers
- **`ibmint` family** — the modern build/deploy tooling: `ibmint package`, `ibmint deploy`, `ibmint optimize server`; works cleanly in CI and with both models
- **Credentials** — `mqsisetdbparms` (pass `-w <workdir>` for standalone, `-n NODE` for node), `mqsivault` for the encrypted vault
- **Server config** — `mqsichangefileauth`, `mqsichangeproperties`, `mqsireportproperties` (with the right `-w` or `-n` target)
- **Diagnostics** — `mqsilist`, `mqsireportbroker`, `mqsireadlog`, `mqsiexplain BIPxxxx`, `mqsichangetrace` for user/service trace
- The full set is far larger — the point is knowing **which tools exist**, **which model each applies to**, and reaching for the docs for the exact flags

The biggest trap is mixing up standalone-only and node-only commands. Most of the historical `mqsi*` surface is geared towards Integration Node; standalone uses `mqsicreateworkdir` plus the `IntegrationServer` command to run the server, and leans on `ibmint` for build/package/deploy. A strong candidate will explicitly call out this split rather than list commands flat.

**Q: Which ACE commands are for a standalone Integration Server versus an Integration Node?**

- **Standalone only** — `mqsicreateworkdir <dir>` to lay out the work directory, and the `IntegrationServer` command (often wrapped by `ace_server_start` / `IntegrationServer --work-dir <dir>`) to run the server in foreground or as a service
- **Node only** — `mqsicreatebroker` / `mqsideletebroker`, `mqsistart NODE` / `mqsistop NODE`, `mqsicreateexecutiongroup`, `mqsideleteexecutiongroup`, `mqsilist NODE`, `mqsideploy -n NODE`, `mqsichangebroker`
- **Shared but target-dependent** — `mqsisetdbparms`, `mqsichangeproperties`, `mqsireportproperties`, `mqsichangefileauth`, `mqsivault`, `mqsichangetrace` — all of these take either `-w <workdir>` for a standalone server or `-n NODE [-e EG]` for a node/integration server
- **Model-agnostic** — `ibmint` (package/deploy/optimize), `mqsiexplain BIPxxxx`, `mqsireadlog`, `mqsireadbar`
- Rule of thumb: if the command name starts with something that implies a node (`mqsistart`, `mqsicreatebroker`, `mqsicreateexecutiongroup`), it only applies to node-managed deployments
- In containers you almost never call `mqsistart` — the container entrypoint invokes `IntegrationServer` directly, which is another reminder that the node/standalone split matters

The command surface is a history layer cake: early commands assumed a broker/node process managed by MQ, later ones (`ibmint`, `IntegrationServer`, `mqsicreateworkdir`) were added for standalone and containers. Someone who can instantly say 'that command only works on a node' or 'use -w for standalone' has almost certainly managed both flavours in production.

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

- Start with the flows: if message order is mandatory for a use case, you can't just scale horizontally — that constrains which HA pattern is viable for which flow
- **Load balancer in front of multiple integration servers** (standalone) or **multiple Integration Nodes** — round-robin, failover or weighted; the workhorse HA pattern for request/response or order-agnostic flows
- **Multi-Instance (MI)** — classic active/standby using a shared filesystem; only one instance runs at a time and failover is triggered when the active dies. Strictly speaking this is closer to **DR** than true HA (failover takes time, there's a brief outage, only one instance serves at a time)
- **Combined MI + LB** — two nodes each with an MI standby on the other host, load-balanced in front; the LB gives true HA, MI gives each node's state a safety net
- **Kubernetes / CP4I** — conceptually the same pattern as a classic LB + multiple servers, just with kube-native mechanics (Service as LB, Deployment with N replicas, rolling updates); the modern default for new deployments
- For stateful work (aggregation, collectors, schedulers) be deliberate about where state lives — MQ queue, database, Redis — not in the memory of one integration server, otherwise no HA pattern will save you
- Licensing caveat: scaling out (extra nodes, replicas, containers) may consume additional entitlements — always check the production edition limits and VPC/container licensing terms before sizing an HA topology

Call out upfront that HA in ACE is a conversation about flow design as much as topology — anything requiring ordered processing or session affinity limits your options. After that, the technology answer is almost always 'LB + multiple instances', whether those instances are standalone servers, Integration Nodes or containers. MI is worth naming specifically as 'more DR than HA' — it protects you against losing a host, but the failover gap means it doesn't give the same 'always available' guarantee as a proper LB-fronted pool.

### Logging

**Q: What ACE logs do you know, and what is a BIP message?**

- **Console log** — integration server stdout/stderr; the main place you see BIP messages at runtime and any custom output from Log/Trace nodes
- **syslog (Linux) / Event Viewer (Windows)** — OS-level logs, particularly important for Integration Node-managed setups
- **User trace** — detailed per-flow tracing at the message level, enabled with `mqsichangetrace`; expensive, turn on only when diagnosing
- **Service trace** — low-level internal trace, normally only enabled under IBM support guidance
- **Activity log** — higher-level, business-friendly log of what a flow did (which backend it called, which file it processed); configurable per flow/node
- **BIP messages** are ACE's structured message codes (e.g. BIP2087, BIP4040). Every BIP has a message, cause and action — look it up with `mqsiexplain <code>` or in the IBM Docs BIP reference
- Never ignore BIP codes in the output; they almost always point at the real underlying problem

ACE exposes several log/trace sources at different granularities: console for day-to-day, user/service trace for deep diagnostics, activity log for business-level visibility, and OS logs for node-scope events. BIP messages are the structured codes that tie it all together — `mqsiexplain BIPxxxx` (or the docs) gives the cause and the action, which is almost always worth reading before you form a theory.

**Q: How do you actually read ACE logs in practice?**

- Most ACE logs are plain text — console output, user trace, service trace, activity log — so `tail -f`, `grep`, any log shipper (Splunk, ELK, Loki) all work fine
- Centralise logs when you run multiple servers / containers — shipping stdout to a central platform is the standard k8s / CP4I pattern
- For user trace files, use `mqsireadtrace` / `mqsiformatlog` to convert the raw trace into readable text
- Use `mqsiexplain BIPxxxx` on the host to expand a BIP code into cause + action without leaving the shell
- **ACE v13 introduces the Log Analyzer** — a built-in tool that parses and structures server/user trace logs, making patterns and errors far easier to spot than eyeballing flat text
- Good hygiene: set sensible log rotation, strip trace/activity-log verbosity in production, and keep BIP codes searchable in whatever central platform you ship to

Reading ACE logs has always been 'it's text, use your usual tools' plus the occasional `mqsireadtrace` for binary user-trace files. The v13 Log Analyzer is a real quality-of-life upgrade for anyone who has spent hours greping user-trace output — mention it if you're talking about a v13 environment.

_References:_
- <https://matthiasblomme.github.io/blogs/posts/ace-v13-new-features-overview/v13-new-features/#log-analyzer>

### Containers

**Q: How can you deploy ACE in containers, and what options do you have for the image, the artefacts and the deployment mechanism?**

- **Three image flavours, from fry to bake:** (1) **Operator-managed** — the ACE Operator on OpenShift/CP4I provides the base image; you only inject your apps, libs, credentials and config. (2) **ACE Certified Containers (ACECC)** — you pick which ACE version/image you want and inject your stuff on top. (3) **Fully custom image** — you build your own Dockerfile and bake everything in (runtime, BARs, config)
- **Artefact injection is a spectrum** — BAR files, `server.conf.yaml`, policies and other config can be baked into the image, injected at deploy time (ConfigMap/Secret, volume mount), or pulled in at startup (from an artifact repo like Nexus/Artifactory, the ACE Dashboard, an NFS share, S3, etc.)
- **Credentials** — usually from Kubernetes Secrets, unlocked via the ACE vault at startup so they never sit in the image
- **Deployment mechanism is orthogonal** — the ACE Operator is one route (declarative IntegrationServer CRD), but you can just as well deploy with a GitOps pipeline (Argo CD, Flux), a CI/CD pipeline (Tekton, Jenkins, GitLab CI), Ansible, Helm charts, or plain `kubectl apply`
- The choice across those three axes (image flavour × artefact injection × deploy mechanism) is driven by your org's standards, how much control you need over the image, and whether you're on CP4I or vanilla Kubernetes/OpenShift
- (Replicas, HA and scaling belong under the HA question — here the focus is the *deployment model* itself)

Three independent choices to reason about: which image you start from (operator-provided, ACECC, or fully custom), how artefacts get into the running container (baked, deploy-time mount, runtime pull), and how the deployment is driven (operator, GitOps, CI, Ansible, …). Candidates who can articulate these three axes separately — and place a real deployment on each — have clearly done this in anger rather than just read a diagram.

_References:_
- <https://www.ibm.com/docs/en/app-connect/13.0.x?topic=release-models-packaging-versions-app-connect-operator>

### Troubleshooting

**Q: Throughput suddenly dropped on an ACE flow in production. Walk me through triage.**

- Check if the drop correlates with a recent deploy, config change or fix pack
- Enable flow/node statistics briefly to find the slow node
- Check backend systems (DB, HTTP target) — most 'ACE is slow' problems are a slow backend
- Check memory / GC logs on the integration server — full GCs every few seconds = undersized heap
- Check the OS: CPU saturation, IO wait, network retransmits

Sudden changes usually have a cause you can pin to a timeline: a change, an external dependency, a resource exhaustion. Stats + backend + OS covers those three lanes.

## ACE — Dev

### Tuning

**Q: How do you tune an ACE flow that is slow?**

- Measure first — turn on flow/node statistics (`mqsichangeflowstats`) and identify the node(s) burning the most elapsed time before changing anything
- **Watch consecutive ESQL / Java / Mapping nodes** — each one parses the logical message tree again; chains of them multiply parsing cost. Merge adjacent ESQL Computes (and adjacent JavaCompute nodes) where the logic allows
- Additional instances on the input node for parallelism — careful with order-sensitive flows where ordering must be preserved
- Pick the cheapest parser you can get away with — BLOB when no parsing is needed, XMLNSC over legacy parsers, avoid re-parsing the same payload repeatedly
- Reduce downstream overhead: batch DB calls, reuse connections, minimise logging and trace in production
- If a single server is saturated, scale horizontally (more servers / replicas) — but only once the per-instance work is tight, otherwise you just multiply the same inefficiency

Flow tuning is mostly a developer concern — the runtime can only do so much if the flow itself is wasteful. The three things that move the needle most are: (1) collapsing consecutive ESQL/Java/Mapping nodes so the message tree isn't re-parsed each time, (2) picking the cheapest parser, and (3) carefully using additional instances where ordering allows. Always measure with stats before and after so you can prove the change worked — optimising blind often makes things worse.

### Node properties

**Q: How can you override node properties at runtime?**

- Use the LocalEnvironment — set `LocalEnvironment.Destination.*` to dynamically set output destinations
- Use BAR overrides at deploy time (`mqsiapplybaroverride` or `ibmint` overrides) to swap static config per environment
- Use policies (MQEndpoint, HTTP, etc.) and reference them from nodes — swap the policy instead of the node property
- Env var references in server.conf.yaml and config-references in modern ACE

For per-message dynamic values use LocalEnvironment; for per-environment static values use BAR overrides or policies. Mixing them up makes flows hard to read and deploy.

### Dynamic routing

**Q: How do you dynamically choose which MQ destination to write to from an ACE flow?**

- **Dynamic queue** — set `OutputLocalEnvironment.Destination.MQ.DestinationData[1].queueName` (optionally `queueManagerName`) in a Compute node before MQOutput, and leave the MQOutput's Queue Name blank so it reads the destination list at runtime
- **Dynamic topic (publish)** — same destination-list pattern, but set the topic string (e.g. `OutputLocalEnvironment.Destination.MQ.DestinationData[1].topicName`) and configure MQOutput (or MQPublication) to publish; the topic string can be fully built from message content at runtime
- Topic publication only actually delivers somewhere useful if a matching subscription exists on MQ — the flow happily publishes to topic strings that nobody is listening to
- Multiple entries in DestinationData fan out — one Compute node can drive sends to several queues or topics in one pass
- Use this when the routing target depends on message content or a lookup, rather than hard-coded per flow

The destination-list pattern is the idiomatic ACE way to drive MQOutput/MQPublication from data: the node reads its target(s) from the LocalEnvironment at runtime, so one flow can send to any queue or topic. Worth flagging explicitly that dynamic topic publishing is valid but only useful if subscriptions exist — nothing in ACE warns you if the topic has no listeners.

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

- **XML** — original XML parser, no namespace support, builds a full message tree; **deprecated**, don't use for new flows
- **XMLNS** — older namespace-aware XML parser; superseded by XMLNSC, avoid for new work
- **XMLNSC** — Compact namespace-aware XML parser and the modern default; lower memory footprint, on-demand (partial) parsing, handles namespaces properly. The 'C' stands for Compact
- **JSON** — JSON parser; on-demand, similar compact model to XMLNSC
- **DFDL** — Data Format Description Language for fixed/variable-length records, CSV, COBOL copybooks, custom binary; replacement for MRM on new work
- **MRM** — legacy message sets, still supported for older projects but functionally replaced by DFDL
- **BLOB** — no parsing, raw bytes; best performance when the flow just routes/passes the payload
- **MIME** — multipart / attachments (email-style bodies)

Match the parser to the payload. The key XML distinction: XML and XMLNS are both deprecated, XMLNSC is the modern default — namespace-aware AND compact, meaning it uses less memory and only parses the bits you actually navigate into. For anything tabular, positional or COBOL-shaped, DFDL is the right modern answer; new projects should avoid MRM unless legacy artefacts force it. And if you don't need to read the body, BLOB always wins on performance.

### Implementation choice

**Q: When do you choose ESQL vs Java vs Mapping node vs XSLT?**

- **ESQL** — native, optimized for message tree work, concise for transforms; best default for most data-shape logic and anything iterative with lookups
- **Mapping node** — graphical, great for sequential schema-to-schema transformations with reusable submaps. Big caveat: it is designed for sequential work, NOT for iterative loops with per-element lookups — those are clumsy and often slow in Mapping; reach for ESQL or Java instead
- **JavaCompute** — when you need Java libraries, existing JAR logic, or standard SDK features (crypto, complex date/time, advanced collections)
- **XSLT** — best for heavy XML-to-XML transformations where you already have XSLT artefacts or strong XSLT skills on the team
- Mix is fine — pick per node, not per flow; a flow can legitimately have an ESQL Compute, a Mapping node and a JavaCompute side by side

There is no single 'right' choice; pick the tool that matches the problem. Teams that default to 'everything in Java' lose ESQL's tree performance; teams that default to 'everything in ESQL' sometimes reinvent the JDK; teams that default to Mapping hit the sequential-only wall the moment they need per-row lookups inside a loop. Knowing each tool's sweet spot (and the Mapping caveat in particular) is the mark of someone who has actually shipped non-trivial flows.

### Transactionality

**Q: Describe the concept of unit of work (Transactionality) inside a message flow.**

- In ACE this concept is better known as **Transactionality** — same idea as MQ's unit of work, scoped to one run of a flow
- **ACE uses MQ as its transaction manager** — the queue manager coordinates commits and rollbacks across the resources touched by the flow (MQ queues, XA-capable DBs, JMS, etc.)
- A UOW brackets all transactional resources touched during that flow run: MQ (under syncpoint), database, JMS — they commit or roll back together
- On successful end-of-flow the UOW commits; on an unhandled exception it rolls back
- Catch / Failure terminals let you decide whether to contain an error inside the UOW or propagate it
- **Escape hatch:** each transactional node (MQOutput, DB nodes, etc.) has a Transaction / Transactionality property. Setting it to **No** makes that operation run OUTSIDE the flow's UOW, so the action is kept even if the flow rolls back
- Legitimate use: writing audit/log messages to MQ or a log queue that must survive a rollback. Don't use it for business data — you lose the all-or-nothing guarantee

In ACE terminology this is Transactionality, but the mental model is the same MQ unit of work: one flow run = one transaction that commits or rolls back everything. The key architectural detail is that ACE leans on MQ as the transaction manager to coordinate commits/rollbacks across resources — which is one of the historical reasons MQ was such a tight dependency. The important nuance most people miss is that individual nodes can opt out via the Transaction property — useful for things like logging to MQ that must survive a rollback, but a footgun if you use it for business writes, because you've quietly broken atomicity.

**Q: How do you make a flow transactional, and what does that actually mean?**

- Set the MQInput node property `Transaction Mode` to `Yes` (or `Automatic` to inherit message persistence)
- For output nodes, `Transaction Mode = Yes` so the put is under syncpoint
- Database nodes — set their Transaction to `Automatic` so they join the UOW
- Result: success commits MQ + DB together; failure rolls both back

Transactionality is a per-node setting that has to be consistent across the flow. One non-transactional node breaks the atomicity guarantee for the whole path.

### Error handling

**Q: For a simple MQ-in / MQ-out flow with no catch or failure terminals attached, what happens when an error occurs toward the end of the flow?**

- The UOW rolls back — the message goes back on the input queue, and no output is written (the MQ put was part of the same rolled-back UOW)
- MQMD.BackoutCount on the rolled-back message is incremented
- If BOTHRESH is configured on the input queue and BackoutCount >= BOTHRESH, the backout handler moves the message to BOQNAME (or to the qmgr's DLQ if no BOQNAME is set)
- **If no backout threshold is configured (BOTHRESH = 0, the default)** — there's no threshold to cross, so the message is rolled back and re-delivered indefinitely. Classic poison-message loop: the flow keeps spinning on the same bad message, never making progress, often flapping downstream connections
- Mitigation for the no-threshold case: configure BOTHRESH + BOQNAME on every input queue as a standard (even BOTHRESH=3 with a named backout queue prevents the infinite loop), or add a Failure terminal that handles the error explicitly

With no error handling attached, the flow relies entirely on the MQ backout mechanism — which is valid only if BOTHRESH is actually configured. The often-missed trap is that BOTHRESH defaults to 0, which means 'no threshold' → the poison message loops forever. A senior answer will call out both the normal case and the no-threshold case, and recommend setting BOTHRESH + BOQNAME as queue standards regardless of flow-level error handling.

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

- Check the integration server log for BIP2322 / BIP2393-style messages (DB connection errors) — use `mqsiexplain` if the cause/action isn't obvious
- `mqsicvp` (Connection Verification Program) — tests the ODBC DSN outside of a flow so you can isolate ACE vs driver vs DB
- Verify credentials are actually stored — if using `mqsisetdbparms`, list them back; if using the ACE vault, use the vault commands to show the stored key so you know the credential is where ACE expects it
- Check ODBC driver version / library paths (`LD_LIBRARY_PATH`, `PATH`, and the `odbc.ini` / `ODBCINI` / `MQSI_ODBC_INI` pointers on Linux)
- Attempt a plain `isql` / `osql` connection with the same DSN and creds to prove the ODBC + credential combination works independently of ACE
- If connection succeeds but queries fail: usually schema/permissions on the DB side — validate against a known-good connection tool

Isolate whether the problem is ACE config, ODBC driver, credentials, or the database itself. The order that saves the most time: (1) check BIP messages, (2) validate the stored credential (mqsisetdbparms list or vault show), (3) `mqsicvp`, (4) plain `isql`. Each step narrows the failure domain, and skipping straight to 'mqsicvp fails, must be the driver' is how afternoons get wasted.

_References:_
- <https://matthiasblomme.github.io/blogs/posts/setup-ace-vault/setup-ace-vault/#validate-a-stored-credential_1>

### Artefacts

**Q: Shared library vs static library — what is the difference, and when do you use which?**

- **Static library** — compiled into every BAR file that uses it; changes require rebuilding and redeploying each consuming application
- **Shared library** — deployed once to the integration server and referenced by multiple applications at runtime; one update flows to every consumer without rebuilding them
- Shared libraries are the right default for anything reused across applications — common subflows, ESQL routines, XSDs, message models
- Static libraries are **functionally deprecated** — they still work, but they don't bring anything to the table over shared libraries anymore; stick to shared (or just put the code inside the application if it's genuinely internal)
- Treat shared libs as a deployment-time contract: a breaking change ripples to every consumer, so version them carefully and test in staging before production

Shared libraries are a reuse mechanism with a lifecycle contract. Static libraries are a legacy approach with no remaining functional advantage — calling them functionally deprecated (not officially deprecated) is the accurate framing and signals you've kept up with modern ACE practice.

**Q: How does the practical definition of a shared library change when you deploy ACE in containers?**

- In a classic Integration Node topology, a shared library lives in the node and is genuinely shared across many integration servers / applications on the same host — one physical copy, many consumers
- In a container, each pod is its own integration server with its own filesystem; a shared library deployed to that container is only 'shared' among the applications *inside* that container
- That scope is typically far narrower than in a node setup — often just the handful of apps packaged into that image — so the reuse benefit shrinks
- Operationally they start behaving like static libraries: updating the shared lib means rebuilding and redeploying the container image anyway
- Lifecycle consequence: treat shared libraries in containers as a code-organisation tool (keep BARs lean, group reusable flows) rather than an independent deployment unit
- If cross-container reuse matters, you solve it at a different layer — shared base images, shared git modules in the build, or callable flows over the network

The word 'shared' means something different in containers. The runtime-level 'update once, all consumers see it' benefit effectively disappears because each pod ships its own copy. Calling this out shows you think about deployment model, not just the ACE feature in isolation — and it's a common source of wasted effort in teams that try to replicate node-era library patterns inside containers.

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

### Logging

**Q: How can you write to logs yourself from within an ACE flow?**

- **Log node** — drag-and-drop node that writes a configurable message + message-tree snapshot to the server log; easiest way to emit structured entries without writing code
- **LOG statement in ESQL** — write directly from a Compute node with severity levels and formatted text; good for conditional logging inside business logic
- **Trace node** — writes the full logical message tree to a destination (user trace, file, console); heavy — useful for diagnostics but not routine logging in production because it forces a full parse
- **JavaCompute** — plain `System.out` / your logging framework from Java also ends up in the integration server console, if you prefer Java-style logging
- Pick **Log node** for lightweight structured events, **LOG statement** for conditional ESQL-driven logging, **Trace node** only for debugging — never as permanent production instrumentation
- Whatever you pick, keep log levels disciplined and make the message self-contained enough to search for later (correlation IDs, business keys)

ACE gives you three idiomatic ways to log from a flow: the Log node (declarative), the LOG ESQL statement (procedural) and the Trace node (heavyweight diagnostic). Mentioning the performance cost of Trace nodes specifically — and that they force a full message parse — signals you've been burned by leaving one on in production at least once.

_References:_
- <https://www.ibm.com/docs/en/app-connect/13.0.x?topic=nodes-log-node>
- <https://www.ibm.com/docs/en/app-connect/13.0.x?topic=statements-log-statement>
- <https://www.ibm.com/docs/en/app-connect/13.0.x?topic=server-using-trace-nodes-integration>

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
