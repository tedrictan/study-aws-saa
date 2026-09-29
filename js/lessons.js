/* Structured "read-first" lessons — one chapter per exam domain.
   These teach the concepts BEFORE you're quizzed on them, unlike the reactive
   crash-course explanations in questions.js which appear after you answer.
   Written for someone who has done AWS Cloud Practitioner but no prior AWS exam. */

const LESSONS = [

{ domain: 1, title: "Securing your AWS architecture", estMinutes: 22,
  intro: "Domain 1 is the single biggest chunk of the exam (30%). The exam's security questions almost always boil down to a handful of repeating decisions: who should identify as what, what should be encrypted and with whose key, what should be reachable from where, and what should be watched. Get comfortable with these seven ideas and a large share of Domain 1 questions become pattern-matching.",
  sections: [
    { heading: "1. IAM: the foundation of everything",
      body: `<p>Every security question ultimately routes back to IAM. Three building blocks:</p>
      <ul>
        <li><strong>Users</strong> — a person or app with long-term credentials (password / access key). Avoid long-term keys wherever you can.</li>
        <li><strong>Roles</strong> — no long-term credentials at all. Anything that "assumes" a role (an EC2 instance, a Lambda function, a user in another AWS account) gets short-lived, auto-rotated temporary credentials from AWS STS. <strong>Whenever a question is "how does an AWS service get access", the answer is a role, never a stored access key.</strong></li>
        <li><strong>Policies</strong> — JSON documents that grant or deny permissions. <em>Identity-based</em> policies attach to a user/group/role and say what that identity can do. <em>Resource-based</em> policies attach directly to a resource (an S3 bucket policy, an SQS queue policy, a KMS key policy) and can name principals from <em>any</em> AWS account — which is exactly what makes them the tool for cross-account access.</li>
      </ul>
      <p><strong>Policy evaluation order — memorize this, it's tested constantly:</strong> start with an implicit deny → check every applicable policy (identity, resource, SCP, permissions boundary) → an <em>explicit Deny anywhere</em> always wins, full stop → otherwise, one explicit Allow anywhere means Allow → no Allow anywhere means implicit deny. There is no such thing as an Allow overriding a Deny.</p>
      <p><strong>Cross-account access pattern:</strong> Account A creates a role with a <em>trust policy</em> naming Account B as a trusted principal. A user/role in Account B calls <code>sts:AssumeRole</code> and gets temporary credentials scoped to whatever permissions policy is attached to that role in A. This is the standard alternative to sharing keys or making things public.</p>
      <p><strong>Permissions boundaries</strong> cap the maximum permissions an identity-based policy can ever grant (effective permission = boundary ∩ identity policy) — used so you can let developers create their own IAM roles without risking privilege escalation to admin.</p>`
    },
    { heading: "2. Encrypting data at rest and in transit",
      body: `<p>For S3, there are four ways to encrypt, and the exam expects you to tell them apart by <em>who controls the key</em>:</p>
      <ul>
        <li><strong>SSE-S3</strong> — AWS owns and manages the key entirely. Simplest, zero setup.</li>
        <li><strong>SSE-KMS</strong> — the key lives in AWS KMS. Use a <em>customer managed key (CMK)</em> when you need an audit trail (CloudTrail logs every use) and fine-grained control over who can use it via a <strong>key policy</strong>.</li>
        <li><strong>SSE-C</strong> — you supply the raw encryption key on every request; AWS never stores it.</li>
        <li><strong>Client-side encryption</strong> — you encrypt before the data ever leaves your application; AWS never sees plaintext or key.</li>
      </ul>
      <p><strong>KMS key policies are mandatory, not optional</strong> — this is one of the most commonly tested "gotchas". Unlike most AWS resources, a KMS CMK requires BOTH the key policy AND the IAM policy to allow an action (it's an AND, not an OR). "My IAM policy allows kms:Decrypt but I still get Access Denied" almost always means the key policy is the missing piece.</p>
      <p><strong>KMS automatic rotation</strong> keeps the key ID/alias identical while rotating the backing key material yearly — old ciphertext stays decryptable transparently, nothing needs re-encrypting.</p>
      <p><strong>CloudHSM vs KMS:</strong> KMS is multi-tenant and easiest to integrate. CloudHSM gives you a dedicated, single-tenant, FIPS 140-2 Level 3 hardware module where AWS itself cannot access your keys — reach for it only when a compliance mandate demands that level of isolation.</p>
      <p>For EBS, you can turn on <strong>default encryption</strong> per-region so every new volume/snapshot is encrypted automatically going forward (it does not retroactively encrypt existing volumes). For TLS certificates on CloudFront/ALB/API Gateway, that's <strong>AWS Certificate Manager (ACM)</strong> — free, auto-renewing — not KMS.</p>`
    },
    { heading: "3. Network security: what can reach what",
      body: `<p><strong>Security Groups vs NACLs</strong> is one of the most frequently tested pairs on the whole exam:</p>
      <ul>
        <li><strong>Security Group</strong> = instance-level, <em>stateful</em> (allow inbound → return traffic automatically allowed out), allow-rules only.</li>
        <li><strong>NACL</strong> = subnet-level, <em>stateless</em> (you must explicitly allow both directions, including ephemeral return ports), supports both allow and deny, evaluated in numbered order.</li>
      </ul>
      <p><strong>Public vs private subnet</strong> is not an inherent property — it's purely about the subnet's route table. A subnet is "public" only because it has a route to an Internet Gateway. A well-designed 3-tier app puts the load balancer in a public subnet, the app tier in a private subnet (routes outbound through a NAT Gateway for patching), and the database in a private subnet with no route to the internet at all.</p>
      <p><strong>VPC Endpoints</strong> let private resources reach AWS services without touching the public internet or a NAT Gateway: <em>Gateway endpoints</em> (S3 and DynamoDB only, free, just a route table entry) and <em>Interface endpoints</em> (most other services, an ENI in your subnet via AWS PrivateLink, billed hourly). If a question says "reach S3 without internet" → Gateway endpoint. Any other service → Interface endpoint.</p>`
    },
    { heading: "4. Identity federation and access at scale",
      body: `<p><strong>Cognito User Pools vs Identity Pools</strong> — a very common point of confusion: a User Pool answers "who are you" (sign-up/sign-in, a user directory, issues JWT tokens). An Identity Pool answers "what can you do in AWS" (exchanges a login — from a user pool, Google, SAML, etc. — for temporary IAM credentials via STS). A mobile app that needs users to sign in AND directly upload to S3 typically needs both.</p>
      <p><strong>IAM Identity Center</strong> (formerly AWS SSO) is the answer whenever a question describes workforce single sign-on across many AWS accounts via an external identity provider like Okta or Azure AD — it maps users/groups to "permission sets" per account.</p>
      <p><strong>AWS Directory Service</strong> has three flavors: AWS Managed Microsoft AD (a real AD you manage), Simple AD (lightweight, no trusts), and <strong>AD Connector</strong> (just a proxy to your existing on-premises AD — no data stored in AWS; pick this when the scenario says "don't duplicate/migrate the directory").</p>
      <p><strong>AWS RAM (Resource Access Manager)</strong> shares an actual resource (like a Transit Gateway or a subnet) across accounts without duplicating it — different from a cross-account IAM role, which grants API access rather than sharing the resource itself.</p>`
    },
    { heading: "5. Detecting and investigating threats",
      body: `<p>Five services get confused with each other constantly — learn what question each one answers:</p>
      <ul>
        <li><strong>CloudTrail</strong> — "who called which API, when?" (an audit log of API activity).</li>
        <li><strong>VPC Flow Logs</strong> — "what IP traffic moved across this network interface?" (metadata only, no packet contents — different from CloudTrail, which is API-level, not network-level).</li>
        <li><strong>AWS Config</strong> — "is this resource's configuration compliant with a rule?" (e.g., is this bucket encrypted).</li>
        <li><strong>GuardDuty</strong> — "is this activity malicious or anomalous?" (ML-based threat detection reading CloudTrail/Flow Logs/DNS logs, agentless).</li>
        <li><strong>Inspector</strong> — "does this EC2/container/Lambda have a known software vulnerability?" (vulnerability scanning).</li>
        <li><strong>Macie</strong> — "is there sensitive data (PII, credit cards) sitting in my S3 buckets?" (content-aware classification).</li>
      </ul>
      <p><strong>Security Hub</strong> aggregates findings from all of the above into one dashboard — it doesn't generate its own findings from scratch.</p>`
    },
    { heading: "6. Perimeter defense and account-wide governance",
      body: `<p><strong>WAF vs Shield:</strong> WAF inspects Layer 7 HTTP(S) traffic against rules — SQL injection, XSS, rate limiting — and attaches to CloudFront/ALB/API Gateway. Shield Standard is free and automatic, covering common Layer 3/4 DDoS. Shield Advanced adds Layer 7 protection, cost protection, and a 24/7 response team, usually paired with WAF. "SQL injection" or "HTTP flood" in a question → WAF.</p>
      <p><strong>S3 Block Public Access</strong> is an override that ignores any public ACL or bucket policy — even ones added later by someone else — and is the standard answer whenever a question says "never public, regardless of future changes."</p>
      <p><strong>SCPs (Service Control Policies)</strong>, set via AWS Organizations on an OU or account, cap the maximum permissions available to <em>everyone</em> in that account — including the root user and admins — and cannot be overridden by any IAM policy inside the account. This is the answer whenever a question says "prevent even administrators from doing X across multiple accounts."</p>`
    },
    { heading: "7. Secrets and safe operational access",
      body: `<p><strong>Secrets Manager vs Parameter Store:</strong> Parameter Store (SSM) is free and fine for config values and secrets, but you build your own rotation. Secrets Manager costs money per secret but includes built-in automatic rotation with native Lambda templates for RDS/Redshift/DocumentDB — "automatic rotation" in a question points to Secrets Manager.</p>
      <p><strong>Systems Manager Session Manager</strong> gives admins shell access to an EC2 instance with <em>zero inbound ports open</em> (no SSH, no bastion host) — the instance's SSM Agent calls <em>out</em> to Systems Manager, and access is governed entirely by IAM.</p>
      <p><strong>Pre-signed URLs</strong> grant temporary, scoped access to a single private S3 object to someone who has no AWS credentials at all — the URL embeds a signature and an expiration time.</p>`
    },
  ],
},

{ domain: 2, title: "Building resilient architectures", estMinutes: 20,
  intro: "Domain 2 (26%) is about surviving failure: an instance dies, an AZ goes dark, an entire region disappears. The exam rewards knowing exactly which AWS feature restores service automatically vs. which one requires a manual action, and how to translate a business requirement (\"we can lose 15 minutes of data\") into the right architecture.",
  sections: [
    { heading: "1. The baseline pattern: ASG + ALB across multiple AZs",
      body: `<p>The canonical resilient web tier is an <strong>Auto Scaling Group spanning 2+ Availability Zones, behind an Application Load Balancer</strong>. The ALB health-checks targets and stops routing to unhealthy ones; the ASG replaces unhealthy instances and can scale capacity to match demand.</p>
      <p><strong>Classic exam trap:</strong> putting each tier of a 3-tier app in a different single AZ (web in AZ-A, app in AZ-B, database in AZ-C) sounds resilient but isn't — if AZ-B goes down, the whole app fails even though the other two tiers are fine. Real resilience means <em>every</em> tier independently spans 2+ AZs.</p>
      <p>Also remember: an ASG's default health check type is <strong>EC2</strong> (just checks if the instance is running), which won't catch an app that's technically up but broken. Setting health check type to <strong>ELB</strong> makes the ASG also honor the load balancer's application-level health checks.</p>`
    },
    { heading: "2. Database resilience: Multi-AZ, Read Replicas, and Aurora",
      body: `<p><strong>RDS Multi-AZ vs Read Replica</strong> — arguably the single most-tested pair in Domain 2:</p>
      <ul>
        <li><strong>Multi-AZ</strong> = HA/failover feature. AWS maintains a <em>synchronous</em> standby in another AZ and fails over <em>automatically</em>. The standby is not readable.</li>
        <li><strong>Read Replica</strong> = scaling feature. <em>Asynchronous</em> replication, readable, promoted to standalone <em>manually only</em> — but can be cross-region, which makes it useful as a DR target too.</li>
      </ul>
      <p>"Automatic failover" → Multi-AZ. "Reduce read load on the primary" → Read Replica. You can combine both.</p>
      <p><strong>Aurora</strong> is inherently more resilient than standard RDS engines: its storage layer automatically keeps 6 copies of data across 3 AZs and tolerates losing 2 copies without affecting writes — a fundamentally different (and stronger) guarantee than "one synchronous standby." Aurora also supports up to 15 read replicas (vs 5 for other engines), and <strong>Aurora Global Database</strong> extends this across regions with typically under a second of replication lag.</p>
      <p><strong>DynamoDB Global Tables</strong> give you multi-region, multi-active (not primary/secondary) replication — a write to any region propagates to all others automatically, good for globally distributed apps and regional DR without manual failover logic.</p>`
    },
    { heading: "3. Storage resilience and backup",
      body: `<p><strong>S3 Versioning</strong> protects against accidental overwrite/delete by keeping every version (a "delete" just adds a marker; the old version is still recoverable). It's also a prerequisite for <strong>Cross-Region/Same-Region Replication</strong>, which automatically copies new objects to another bucket (not retroactive by default).</p>
      <p><strong>EFS vs EBS:</strong> EBS attaches to one instance at a time and is AZ-bound. EFS is a managed NFS file system built for concurrent access from many instances across multiple AZs simultaneously — the answer whenever multiple instances need a shared, writable file system.</p>
      <p><strong>AWS Backup</strong> centralizes policy-based backup (schedule, retention, cross-region copy) across EBS, RDS, DynamoDB, EFS, and more, from one place — the answer for "centralized backup governance across multiple services." <strong>Data Lifecycle Manager (DLM)</strong> is the lighter-weight, EBS/AMI-snapshot-specific version of the same idea.</p>`
    },
    { heading: "4. Routing around failure with Route 53",
      body: `<p>Route 53 routing policies each solve a different resilience problem:</p>
      <ul>
        <li><strong>Failover</strong> — active-passive: all traffic to primary while its health check passes, automatic full shift to secondary if it fails.</li>
        <li><strong>Weighted</strong> — split traffic by percentage (A/B testing, gradual rollout).</li>
        <li><strong>Latency-based</strong> — route to whichever healthy region is fastest for the user.</li>
        <li><strong>Geolocation / Geoproximity</strong> — route by the user's location (compliance, localization).</li>
        <li><strong>Multivalue answer</strong> — return several healthy IPs for simple client-side load balancing (not a substitute for a real load balancer).</li>
      </ul>
      <p>Route 53 <strong>health checks</strong> can monitor an endpoint directly (HTTP/HTTPS/TCP) with no load balancer required at all — they're what powers Failover/Multivalue/Weighted routing's ability to avoid sending traffic to something unhealthy.</p>`
    },
    { heading: "5. Disaster recovery: matching cost to RTO/RPO",
      body: `<p>Two terms, easy to mix up: <strong>RPO</strong> (Recovery Point Objective) looks <em>backward</em> — how much data can you afford to lose, driven by backup/replication frequency. <strong>RTO</strong> (Recovery Time Objective) looks <em>forward</em> — how long can you be down, driven by how fast you can stand infrastructure back up.</p>
      <p>Four DR strategies, in order of cost AND speed (low to high):</p>
      <ol>
        <li><strong>Backup & Restore</strong> — cheapest; RTO/RPO in hours; restore from backups only when disaster hits.</li>
        <li><strong>Pilot Light</strong> — only the most critical core (e.g., a replicated database) runs continuously; everything else is provisioned from templates/AMIs at DR time; RTO in tens of minutes.</li>
        <li><strong>Warm Standby</strong> — the <em>entire</em> stack already runs end-to-end, just at reduced capacity; you scale it up (no provisioning from scratch) at DR time; RTO in minutes.</li>
        <li><strong>Multi-Site Active-Active</strong> — full production-scale capacity running in multiple regions simultaneously; near-zero RTO/RPO; highest cost.</li>
      </ol>
      <p>The exam will describe a scenario and expect you to name the tier, or give you a cost/RTO constraint and expect you to pick the matching tier.</p>`
    },
    { heading: "6. Decoupling components so failures don't cascade",
      body: `<p><strong>SQS</strong> buffers work between a fast producer and a slower/less reliable consumer — the producer never blocks on the consumer's pace. Add a <strong>Dead-Letter Queue</strong> so a "poison pill" message that keeps failing doesn't block the whole queue forever.</p>
      <p><strong>SNS fan-out</strong>: publish one message to an SNS topic, and multiple independent subscribers (SQS queues, Lambda, email) each get their own copy in parallel. This differs from having multiple consumers share one SQS queue, where each message goes to only <em>one</em> of them.</p>
      <p><strong>EventBridge</strong> is the right tool when you have many different event <em>types</em> from many different sources (AWS services and SaaS apps) that need content-based rule routing to different targets — more sophisticated than a simple SNS fan-out.</p>
      <p><strong>Step Functions</strong> orchestrates multi-step workflows (a state machine) with built-in retry/error handling and a visual execution history — the answer whenever a question describes chaining several Lambda functions with the need for reliable error handling.</p>
      <p>Because most of these are "at-least-once" delivery systems, design consumers to be <strong>idempotent</strong> — processing the same message twice should produce the same end result, not a duplicate side effect.</p>`
    },
    { heading: "7. Network resilience and infrastructure as code",
      body: `<p><strong>Transit Gateway</strong> is a hub that connects many VPCs and on-premises networks through one attachment point each, with transitive routing — avoiding the unmanageable N² scaling of full-mesh VPC Peering (which is 1:1 and non-transitive).</p>
      <p><strong>CloudFormation</strong> (or other infrastructure-as-code) lets you redeploy an entire, consistent, version-controlled environment quickly — including into a new region for DR — which a single AMI snapshot of one server can't do.</p>
      <p>Finally, keep compute <strong>stateless</strong>: session data belongs in a shared store (ElastiCache or DynamoDB), not on local disk or relying purely on load-balancer sticky sessions — that way any instance can be replaced or scaled without losing user state.</p>`
    },
  ],
},

{ domain: 3, title: "Designing for performance", estMinutes: 20,
  intro: "Domain 3 (24%) tests whether you can match the right compute, storage, database, and caching tool to a workload's actual performance shape — latency-sensitive vs throughput-heavy, read-heavy vs write-heavy, predictable vs bursty. Most questions are really just \"pick the right tool for this job\" in disguise.",
  sections: [
    { heading: "1. Caching layers: CloudFront, ElastiCache, DAX",
      body: `<p><strong>CloudFront</strong> caches content at edge locations worldwide, cutting latency for users and offloading repeat requests from the origin — works with S3, ALB, EC2, and on-prem origins.</p>
      <p><strong>ElastiCache Redis vs Memcached:</strong> choose Memcached only for the simplest possible case — pure multi-threaded key-value caching, no persistence, no replication. Choose Redis for almost everything else: Multi-AZ with automatic failover, persistence, complex data structures (sorted sets, lists), and pub/sub. "Needs replication/failover/persistence" → Redis.</p>
      <p><strong>DAX</strong> is a cache specifically for DynamoDB — API-compatible with the DynamoDB SDK (minimal code change) and brings response times down to microseconds for repeated reads. For caching in front of anything else, use ElastiCache instead.</p>
      <p><strong>API Gateway caching</strong> serves repeated identical requests straight from a per-stage cache without invoking the backend Lambda at all — cuts both latency and invocation cost for rarely-changing data.</p>`
    },
    { heading: "2. Compute choices",
      body: `<p>EC2 instance families by letter: <strong>C</strong> = compute-optimized (batch, HPC). <strong>M</strong> = general purpose/balanced. <strong>R/X</strong> = memory-optimized (in-memory DBs, caches). <strong>I</strong> = storage-optimized/high I/O. <strong>G/P</strong> = GPU (ML, graphics). <strong>T</strong> = burstable/low-cost. Recognizing the letter-to-workload mapping is tested repeatedly.</p>
      <p><strong>Placement groups:</strong> <em>Cluster</em> = lowest latency/highest throughput, single AZ, for tightly-coupled HPC. <em>Spread</em> = max separation across distinct hardware, minimizes correlated failure. <em>Partition</em> = logical partitions with their own rack/power, for distributed systems (Kafka, Cassandra) that self-replicate across partitions.</p>
      <p><strong>Lambda cold starts vs Provisioned Concurrency:</strong> a cold start is the delay to initialize a fresh execution environment. <strong>Provisioned Concurrency</strong> keeps N environments pre-warmed to eliminate that latency (costs more). Don't confuse it with <strong>Reserved Concurrency</strong>, which caps the maximum concurrent executions for throttling/isolation — a completely different lever.</p>
      <p><strong>ECS vs EKS vs Fargate</strong> are two independent choices: ECS/EKS is the <em>orchestrator</em> (ECS = simpler, AWS-proprietary; EKS = managed Kubernetes). Fargate vs EC2 is the <em>launch type</em> (Fargate = no servers to manage at all; EC2 = you manage the instances, more control, can be cheaper at high sustained scale).</p>`
    },
    { heading: "3. Storage performance",
      body: `<p><strong>S3:</strong> use <strong>multipart upload</strong> for large objects (required above 5GB, recommended above 100MB) for parallelism and resilience to interruption. Use <strong>Transfer Acceleration</strong> specifically when the client is geographically far from the bucket's region — it routes through CloudFront edge locations over the AWS backbone.</p>
      <p><strong>EBS volume types:</strong> <strong>gp3</strong> = new default, 3,000 IOPS/125 MB/s baseline independent of size, cheaper than gp2 for the same performance. <strong>io1/io2</strong> = Provisioned IOPS, for the highest and most consistent IOPS needs (mission-critical databases). <strong>st1</strong> = throughput-optimized HDD for big sequential workloads. <strong>sc1</strong> = cheapest cold HDD for infrequent large sequential access. Neither st1 nor sc1 can be a boot volume.</p>
      <p><strong>FSx for Windows File Server</strong> is the answer whenever a question mentions Windows + SMB + Active Directory file permissions. <strong>FSx for Lustre</strong> is for high-performance parallel HPC/ML workloads, often reading directly from S3.</p>`
    },
    { heading: "4. Choosing the right database for the workload",
      body: `<p>This single skill — matching workload type to database type — is tested constantly:</p>
      <ul>
        <li><strong>RDS / Aurora</strong> — OLTP, relational, transactional, ACID (typical app backends, order systems).</li>
        <li><strong>Redshift</strong> — OLAP, data warehousing, columnar storage, complex analytical queries across petabytes (BI/reporting).</li>
        <li><strong>DynamoDB</strong> — NoSQL key-value/document, massive scale, single-digit-millisecond latency, flexible schema (sessions, leaderboards, IoT).</li>
        <li><strong>ElastiCache</strong> — in-memory cache in front of another data store, not a source of truth on its own.</li>
      </ul>
      <p>For read-heavy relational workloads, offload reporting/analytics queries onto a <strong>Read Replica</strong> rather than hitting the primary — remember, Multi-AZ's standby is not readable in classic RDS engines (though Aurora Replicas ARE readable).</p>`
    },
    { heading: "5. Networking for performance",
      body: `<p><strong>Global Accelerator vs CloudFront:</strong> both use the AWS edge network, but CloudFront is an HTTP(S) caching CDN, while Global Accelerator is a network-layer (TCP/UDP) traffic director with two static anycast IPs and fast regional failover — the answer for non-HTTP workloads like gaming/UDP that still need static IPs and multi-region routing.</p>
      <p><strong>VPC Peering/Transit Gateway vs PrivateLink:</strong> Peering/Transit Gateway connect whole <em>networks</em> (need non-overlapping CIDRs, route table changes). PrivateLink exposes a single <em>service</em> privately to many other VPCs/accounts with no CIDR overlap concerns and minimal route changes — the standard SaaS-provider pattern.</p>`
    },
    { heading: "6. Observability: CloudWatch and X-Ray",
      body: `<p><strong>CloudWatch</strong> = metrics (standard + custom via the agent/API), alarms (trigger SNS/scaling actions), logs, and dashboards. Remember: basic EC2 host metrics don't include custom application metrics — you need the CloudWatch agent or direct API calls for those.</p>
      <p><strong>X-Ray</strong> = distributed tracing across a request's full path (e.g., API Gateway → Lambda → DynamoDB), producing a service map with per-hop latency — the tool for pinpointing which service in a microservices/serverless chain is the bottleneck.</p>
      <p><strong>Auto Scaling policy types:</strong> <em>Target tracking</em> (maintain a metric at X%, AWS manages the alarms — usually the best default answer). <em>Step scaling</em> (multiple thresholds, more manual control). <em>Scheduled</em> (predictable time-based changes). <em>Predictive</em> (ML-forecasted scaling ahead of demand).</p>`
    },
  ],
},

{ domain: 4, title: "Optimizing for cost", estMinutes: 18,
  intro: "Domain 4 (20%) rewards recognizing waste and matching a pricing model to a workload's actual usage pattern. A large share of these questions have a \"free lunch\" answer — a configuration change that saves real money with no downside — once you know where AWS hides the costly defaults.",
  sections: [
    { heading: "1. S3 storage classes and lifecycle policies",
      body: `<p>The storage-class ladder, cheapest-to-retrieve to cheapest-to-store: <strong>Standard</strong> → <strong>Standard-IA / One Zone-IA</strong> → <strong>Glacier Instant Retrieval</strong> (still millisecond access, priced for archival) → <strong>Glacier Flexible Retrieval</strong> (minutes to hours) → <strong>Glacier Deep Archive</strong> (12-48 hours, cheapest).</p>
      <p>Use a <strong>Lifecycle policy</strong> to automatically transition objects down this ladder as they age, when you already know the access pattern (e.g., "hot for 30 days, then cold"). Use <strong>S3 Intelligent-Tiering</strong> instead when the access pattern is unknown or changes unpredictably — it monitors actual usage and moves objects automatically, with no retrieval fees (just a small monitoring fee). "Known pattern" vs "unknown/changing pattern" is exactly how the exam distinguishes these two similar-sounding correct answers.</p>`
    },
    { heading: "2. EC2 and commitment-based pricing",
      body: `<p><strong>On-Demand</strong> = no commitment, most expensive per-unit, best for unpredictable/short-term needs. <strong>Reserved Instances/Savings Plans</strong> = 1-3 year commitment for a large discount, best for steady predictable baseline load. <strong>Spot</strong> = up to ~90% off, reclaimable with a 2-minute warning, best for fault-tolerant/interruptible work (batch jobs, CI/CD). <strong>Dedicated Hosts</strong> = about licensing/compliance, not cost savings.</p>
      <p>Among commitment options, flexibility trades off against discount depth: <strong>Compute Savings Plans</strong> (most flexible — any instance family/region/OS, plus Fargate and Lambda, in exchange for a $/hour commitment) → <strong>EC2 Instance Savings Plans</strong> (locked to one family+region, slightly better discount) → <strong>Standard Reserved Instances</strong> (highest discount, least flexible, tied to specific instance attributes) → <strong>Convertible RIs</strong> (can change attributes over the term, somewhat lower discount than Standard).</p>
      <p>Before buying any commitment, <strong>right-size first</strong> — use <strong>AWS Compute Optimizer</strong> (reads your CloudWatch metrics) to find over-provisioned instances. Committing to a discount on an oversized instance just locks in the waste.</p>
      <p>Note: this same "commit for a discount on steady-state usage" pattern also applies to <strong>Redshift Reserved Nodes</strong> and <strong>ElastiCache Reserved Cache Nodes</strong> — not just EC2.</p>`
    },
    { heading: "3. The data-transfer cost trap",
      body: `<p><strong>NAT Gateway bills both an hourly rate AND a per-GB data processing charge for everything that passes through it</strong> — including traffic headed to S3 or DynamoDB, if you haven't set up a VPC endpoint. Adding a free <strong>Gateway VPC Endpoint</strong> for S3/DynamoDB removes that traffic from the NAT Gateway path entirely. This is one of the highest-impact, lowest-effort cost fixes tested on the exam.</p>
      <p>Similarly, serving a global audience through <strong>CloudFront in front of S3</strong> is usually cheaper than serving directly from S3 to the internet — CloudFront's data-transfer-out pricing is generally lower, and cache hits mean the origin sees far less egress traffic overall.</p>`
    },
    { heading: "4. Matching elasticity to unpredictable workloads",
      body: `<p><strong>DynamoDB On-Demand</strong> (pay-per-request, instant scaling) beats Provisioned+Auto Scaling when traffic is spiky/unpredictable — provisioned Auto Scaling reacts over minutes and can still throttle during a sudden burst.</p>
      <p><strong>Aurora Serverless</strong> auto-scales capacity down to near-zero for intermittent workloads (like dev/test) instead of paying for an always-on, peak-sized instance.</p>
      <p><strong>Lambda</strong> is cheapest for sporadic, short-duration, event-driven work — zero cost while idle. But there's a real crossover point: at very high, sustained, predictable volume, well-utilized <strong>Reserved/Savings-Plan-discounted EC2 or Fargate</strong> capacity can end up cheaper per unit of work than Lambda's per-invocation pricing. Recognize both directions of this trade-off.</p>`
    },
    { heading: "5. Bulk migration economics",
      body: `<p>Match the transfer method to data size and urgency: small/moderate data over a decent link → standard internet transfer (optionally with Transfer Acceleration). Large one-time or infrequent bulk transfers where the network itself is the bottleneck → the <strong>Snowball family</strong> (Snowcone for small edge cases, Snowball Edge for tens/hundreds of TB, Snowmobile for exabyte-scale). Ongoing, frequent, high-bandwidth hybrid connectivity → <strong>Direct Connect</strong> (a dedicated line — takes time to provision, meant for continuous use, not a one-off transfer).</p>`
    },
    { heading: "6. Governance: finding and stopping waste",
      body: `<p>The cost-visibility toolkit: <strong>Cost Explorer</strong> (visualize historical/forecasted spend by service/tag/account), <strong>AWS Budgets</strong> (proactive alerts when actual or <em>forecasted</em> spend crosses a threshold), <strong>Cost and Usage Report</strong> (the most granular billing export, for custom BI). <strong>Trusted Advisor</strong> flags common waste — idle/oversized instances, unattached EBS volumes, and unassociated Elastic IPs (remember: an Elastic IP attached to a running instance is free; one sitting idle or attached to a stopped instance accrues hourly charges — a classic "hidden cost" exam question). Most of Trusted Advisor's cost checks require a Business/Enterprise support plan.</p>
      <p><strong>AWS Organizations Consolidated Billing</strong> combines usage across all member accounts under one bill, can unlock volume pricing tiers faster, and — importantly — lets Reserved Instance/Savings Plans discounts purchased in one account automatically be shared across all accounts in the organization by default.</p>
      <p>Zoom out: the <strong>Well-Architected Framework's Cost Optimization pillar</strong> treats all of this as continuous, not a one-time setup — measure, right-size, pick the right pricing model, eliminate waste, repeat. It's one of 6 pillars (with Operational Excellence, Security, Reliability, Performance Efficiency, and Sustainability) — worth knowing by name.</p>`
    },
  ],
},

];
