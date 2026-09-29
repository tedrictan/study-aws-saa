/*
  AWS SAA-C03 practice question bank.
  IMPORTANT: These are ORIGINAL practice questions written to match the style, scenario format,
  and difficulty of the real exam, built from the public AWS Certified Solutions Architect –
  Associate (SAA-C03) exam guide. They are NOT real/leaked exam questions (using those is a
  violation of the AWS Certification Agreement). Counts per domain intentionally mirror AWS's
  official exam blueprint weighting: Domain 1 = 30%, Domain 2 = 26%, Domain 3 = 24%, Domain 4 = 20%.
  120 questions total: 100 single-answer (4 options) + 20 multi-response (5 options, "Select
  TWO/THREE", no partial credit), matching the real exam's mix of both question formats.

  Schema:
  id, domain (1-4), domainName, topic, difficulty (easy|medium|hard),
  q (question stem), options[4 or 5],
  type ("multi" if present; omitted/undefined means a standard single-answer question),
  correct (index 0-3 for single-answer; array of indices for type:"multi"),
  explain (why correct is right / others wrong - shown for both right & wrong answers),
  crash (deeper "crash course" concept explanation - emphasized on a wrong answer)
*/

const DOMAIN_NAMES = {
  1: "Design Secure Architectures",
  2: "Design Resilient Architectures",
  3: "Design High-Performing Architectures",
  4: "Design Cost-Optimized Architectures",
};

const QUESTIONS = [

// ============================= DOMAIN 1: SECURITY (30) =============================
{ id:1, domain:1, topic:"IAM Roles", difficulty:"easy",
  q:"An application running on an EC2 instance needs to read objects from an S3 bucket. What is the MOST secure way to grant this access?",
  options:[
    "Create an IAM user with an access key and secret key, and store the credentials in the application's source code.",
    "Create an IAM role with the required S3 permissions and attach it to the EC2 instance profile.",
    "Make the S3 bucket public so the application can access it without credentials.",
    "Store the AWS account root user's access keys in an environment variable on the instance."
  ], correct:1,
  explain:"IAM roles provide temporary, automatically rotated credentials to an EC2 instance via its instance profile — no long-lived keys to store or leak. Embedding access keys in code, using the root user, or making a bucket public are all serious anti-patterns.",
  crash:"Crash course — IAM Roles vs Users: A user has long-term credentials (password/access keys) meant for a person or an app you can't attach a role to. A role has no long-term credentials at all; anything that assumes it (EC2, Lambda, another account) gets short-lived, auto-rotated temporary credentials via AWS STS. For any AWS compute service (EC2, Lambda, ECS), the exam's correct answer is almost always 'use a role', never 'store an access key on the instance'. Root user credentials should never be used for day-to-day or application access." },

{ id:2, domain:1, topic:"S3 Security", difficulty:"medium",
  q:"A company wants to ensure that an S3 bucket containing financial reports is never made public, even by accident, regardless of any future bucket policy or ACL changes made by developers.",
  options:[
    "Enable S3 Versioning on the bucket.",
    "Enable S3 Block Public Access at the bucket level (or account level).",
    "Enable Server-Side Encryption with KMS (SSE-KMS).",
    "Enable Requester Pays on the bucket."
  ], correct:1,
  explain:"S3 Block Public Access is an override that ignores/blocks any public ACL or bucket policy, even ones added later — exactly the 'never public regardless of future changes' guarantee being asked for. Versioning, encryption, and Requester Pays don't affect public accessibility at all.",
  crash:"Crash course — S3 Block Public Access (BPA): It has 4 independent settings: block public ACLs, ignore existing public ACLs, block public bucket policies, and restrict public buckets. It can be set per-bucket or account-wide, and account-wide BPA overrides any bucket-level setting that tries to loosen it. This is the standard exam answer whenever the scenario says 'prevent public access no matter what' or 'accidental public exposure'." },

{ id:3, domain:1, topic:"Encryption", difficulty:"medium",
  q:"A company must encrypt data stored in S3 using keys that they fully generate, manage, and rotate themselves outside of AWS, while still letting AWS perform the encryption/decryption operations.",
  options:[
    "Use SSE-S3 (S3-managed keys).",
    "Use SSE-KMS with an AWS managed key (aws/s3).",
    "Use SSE-C (server-side encryption with customer-provided keys).",
    "Use client-side encryption with a hardware security module only."
  ], correct:2,
  explain:"SSE-C lets the customer supply their own encryption key with every request; S3 uses it to encrypt/decrypt the object but never stores the key. SSE-S3 and SSE-KMS (AWS managed key) both use AWS-generated/managed keys, not customer-supplied ones.",
  crash:"Crash course — S3 encryption options: SSE-S3 (AWS owns and manages the key, simplest), SSE-KMS (key lives in AWS KMS, gives you audit trail via CloudTrail and key policies — use a Customer Managed Key, CMK, when you need to control rotation/permissions), SSE-C (you supply the raw key on every PUT/GET, AWS never persists it), and Client-Side Encryption (you encrypt before it ever leaves your application, AWS never sees plaintext or key). Exam clue words: 'customer supplies the key each time' → SSE-C; 'need key rotation policy / who can use the key' → SSE-KMS with CMK." },

{ id:4, domain:1, topic:"Security Groups vs NACLs", difficulty:"easy",
  q:"Which statement correctly describes a difference between Security Groups and Network ACLs (NACLs)?",
  options:[
    "Security Groups are stateless and NACLs are stateful.",
    "Security Groups operate at the subnet level and NACLs operate at the instance level.",
    "Security Groups are stateful (return traffic is automatically allowed) while NACLs are stateless (return traffic must be explicitly allowed).",
    "NACLs only support 'allow' rules, while Security Groups support both 'allow' and 'deny' rules."
  ], correct:2,
  explain:"Security groups are stateful: if you allow inbound traffic, the response is automatically allowed out. NACLs are stateless: you must explicitly allow both inbound and the corresponding outbound (ephemeral port) traffic. Security groups attach to ENIs/instances; NACLs attach to subnets.",
  crash:"Crash course — SG vs NACL: Security Group = instance-level firewall, stateful, allow-rules only, evaluates ALL rules (no explicit deny needed). NACL = subnet-level firewall, stateless, supports both allow AND deny rules, evaluated in numbered order (lowest number wins first match). Classic exam pattern: 'traffic works one direction but not the other' on a subnet → check the NACL's outbound ephemeral port range (1024-65535 for many clients)." },

{ id:5, domain:1, topic:"KMS", difficulty:"hard",
  q:"A company wants to control exactly which IAM principals can use a KMS Customer Managed Key (CMK) to encrypt/decrypt data, separate from any IAM policies attached to those principals.",
  options:[
    "This isn't possible; only IAM policies control access to KMS keys.",
    "Attach a key policy to the CMK that explicitly grants the desired principals kms:Decrypt / kms:Encrypt permissions.",
    "Enable automatic key rotation on the CMK.",
    "Move the CMK into a different AWS account."
  ], correct:1,
  explain:"Every KMS CMK has a resource-based key policy that is the primary access control mechanism — without a key policy statement allowing a principal, IAM policies alone cannot grant access (KMS is one of the few services where the resource policy is mandatory, not optional). Key rotation and moving accounts don't address principal-level access control.",
  crash:"Crash course — KMS key policies: Access to a CMK requires BOTH the key policy to allow it AND (if applicable) the IAM policy to allow it — it's an AND, not an OR (unless the key policy delegates to IAM with the 'default' statement enabling IAM policies). This is why 'my IAM policy allows kms:Decrypt but access is still denied' is a classic troubleshooting scenario — the key policy is the missing piece. Exam tip: whenever a question is about controlling who can use a specific KMS key, think key policy first." },

{ id:6, domain:1, topic:"VPC Endpoints", difficulty:"medium",
  q:"An application on a private EC2 instance (no internet access) needs to read/write objects in S3 without traffic ever traversing the public internet or requiring a NAT Gateway.",
  options:[
    "Create a NAT Gateway in a public subnet and route the private subnet's traffic through it.",
    "Create a Gateway VPC Endpoint for S3 and add a route to it in the private subnet's route table.",
    "Attach an Elastic IP to the EC2 instance.",
    "Create an Internet Gateway and attach it directly to the private subnet."
  ], correct:1,
  explain:"A Gateway VPC Endpoint for S3 (or DynamoDB) creates a private route directly to the service within the AWS network — no internet, no NAT Gateway, no data transfer/NAT charges. NAT Gateway would work but still isn't 'no internet traversal' in the truest sense and costs more; it's not the best-fit answer here.",
  crash:"Crash course — VPC Endpoints: Two types. Gateway Endpoints (S3 and DynamoDB only) are free and work via a route table entry. Interface Endpoints (most other services, e.g., SSM, Secrets Manager, SNS, Kinesis) create an ENI with a private IP in your subnet, billed hourly + per GB, and use PrivateLink under the hood. Exam trigger phrase: 'without traversing the internet' + S3 or DynamoDB → Gateway Endpoint; any other AWS service → Interface Endpoint." },

{ id:7, domain:1, topic:"Secrets Manager vs Parameter Store", difficulty:"medium",
  q:"A company needs to store a database password and have it AUTOMATICALLY rotated on a schedule, with native integration to trigger a Lambda function that updates RDS credentials.",
  options:[
    "AWS Systems Manager Parameter Store (Standard tier).",
    "AWS Secrets Manager.",
    "Amazon S3 with SSE-KMS encryption.",
    "AWS CloudHSM."
  ], correct:1,
  explain:"Secrets Manager has built-in automatic rotation with native Lambda rotation templates for RDS, Redshift, and DocumentDB. Parameter Store can store secrets but has no built-in automatic rotation (it needs custom automation). S3 and CloudHSM are not secrets-rotation services.",
  crash:"Crash course — Secrets Manager vs Parameter Store: Parameter Store (SSM) is free (standard tier), great for config values and plain or SecureString secrets, but you build your own rotation. Secrets Manager costs money per secret but includes automatic rotation, native RDS/Redshift/DocumentDB integration, and cross-account sharing via resource policies. Exam clue: 'automatic rotation' or 'rotate database credentials' → Secrets Manager." },

{ id:8, domain:1, topic:"Cognito", difficulty:"medium",
  q:"A mobile app needs to let end users sign up and sign in with a username/password, and then receive temporary AWS credentials to directly upload photos to an S3 bucket.",
  options:[
    "Amazon Cognito User Pools only.",
    "Amazon Cognito Identity Pools only.",
    "Amazon Cognito User Pools for sign-up/sign-in, combined with an Identity Pool to exchange the user pool token for temporary AWS credentials.",
    "IAM Identity Center (AWS SSO)."
  ], correct:2,
  explain:"User Pools handle authentication (sign-up/sign-in, user directory, MFA). Identity Pools handle authorization — exchanging a login token (from a user pool, or Google/Facebook/SAML) for temporary IAM credentials via STS. You typically need both together for this use case.",
  crash:"Crash course — Cognito User Pools vs Identity Pools: User Pool = 'who are you' (a user directory with sign-up/sign-in, hosted UI, MFA, issues JWT tokens). Identity Pool = 'what can you do in AWS' (federates an identity — from a user pool, social login, or SAML — into temporary IAM role credentials via STS). Exam pattern: sign-in only → User Pool; needs direct AWS resource access (S3, DynamoDB) afterward → add an Identity Pool." },

{ id:9, domain:1, topic:"IAM Policies", difficulty:"medium",
  q:"An IAM user has an identity-based policy that ALLOWs s3:GetObject on a bucket, but the bucket's bucket policy explicitly DENYs access to that same user. What is the result?",
  options:[
    "Access is allowed, because identity-based Allow always wins.",
    "Access is denied, because an explicit Deny in any applicable policy always overrides an Allow.",
    "Access is allowed, because bucket policies only apply to anonymous users.",
    "The request fails with an error rather than being allowed or denied."
  ], correct:1,
  explain:"IAM's evaluation logic: an explicit Deny anywhere in the policy set (identity-based, resource-based, SCP, permissions boundary, session policy) always wins, no matter how many Allows exist elsewhere. There is no such thing as an Allow that overrides a Deny.",
  crash:"Crash course — IAM policy evaluation order: 1) Start with implicit Deny (default). 2) Check all applicable policies (identity, resource, SCP, boundary). 3) An explicit Deny anywhere = final Deny, full stop. 4) Otherwise, if at least one explicit Allow exists = Allow. 5) No explicit Allow anywhere = implicit Deny. Memorize: 'explicit deny beats everything' — this is one of the most tested IAM concepts on the SAA exam." },

{ id:10, domain:1, topic:"Cross-Account Access", difficulty:"hard",
  q:"Account A needs to let a specific IAM role in Account B access an S3 bucket in Account A. What is the standard, secure pattern for this?",
  options:[
    "Share the root user credentials of Account A with Account B.",
    "In Account A, create an IAM role with a trust policy allowing Account B's role to assume it (sts:AssumeRole), and attach the needed S3 permissions to that role.",
    "Make the S3 bucket public so anyone, including Account B, can access it.",
    "Copy the IAM role from Account B into Account A manually."
  ], correct:1,
  explain:"Cross-account access uses an IAM role in the resource-owning account (A) with a trust policy naming the other account/role as a trusted principal; the other account's role then calls sts:AssumeRole to get temporary credentials. This avoids sharing long-term credentials or making resources public.",
  crash:"Crash course — Cross-account roles: A role has two policies — a Trust Policy (who can assume it — the 'Principal') and a Permissions Policy (what it can do once assumed). For cross-account access, Account A's role trust policy lists Account B (or a specific role ARN in B) as a trusted principal. Account B's user/role then calls sts:AssumeRole targeting that ARN and gets temporary credentials scoped to A's permissions. This is the AWS-recommended alternative to sharing keys or S3 bucket policies with wildcard principals." },

{ id:11, domain:1, topic:"AWS Organizations / SCP", difficulty:"medium",
  q:"A company wants to prevent ALL accounts in a specific Organizational Unit (OU) from ever disabling AWS CloudTrail, even for account administrators with full IAM permissions.",
  options:[
    "Attach an IAM policy denying cloudtrail:StopLogging to every user in every account.",
    "Attach a Service Control Policy (SCP) to the OU that denies cloudtrail:StopLogging and cloudtrail:DeleteTrail.",
    "Enable MFA Delete on the CloudTrail S3 bucket.",
    "Use AWS Config to detect when CloudTrail is disabled."
  ], correct:1,
  explain:"SCPs set the maximum available permissions for every principal in an account, including the root user and admins — they cannot be overridden by IAM policies within the account. An IAM policy per user wouldn't stop an admin from changing/removing it. MFA Delete protects S3 object deletion, and Config only detects/alerts, it doesn't prevent.",
  crash:"Crash course — SCPs: Applied at the AWS Organizations level (root, OU, or account), SCPs don't grant permissions themselves — they act as a filter/guardrail defining what CAN be allowed, even to the account's own root user. An SCP Deny cannot be overridden by any IAM policy inside the member account. Exam trigger: 'prevent even administrators/root from doing X across multiple accounts' → SCP." },

{ id:12, domain:1, topic:"CloudTrail vs Config vs GuardDuty", difficulty:"medium",
  q:"A security team wants continuous, ML-based threat detection that flags things like anomalous API calls, communication with known malicious IPs, and possible compromised credentials — without deploying any agents.",
  options:[
    "AWS Config",
    "Amazon GuardDuty",
    "AWS CloudTrail",
    "Amazon Inspector"
  ], correct:1,
  explain:"GuardDuty is a managed threat-detection service that analyzes CloudTrail, VPC Flow Logs, and DNS logs using threat intelligence and ML to flag suspicious activity — agentless and continuous. Config tracks resource configuration compliance, CloudTrail is an audit log of API calls, and Inspector scans for software vulnerabilities on EC2/ECR/Lambda.",
  crash:"Crash course — pick the right security service: CloudTrail = 'who did what API call, when' (audit log). Config = 'is my resource configuration compliant with a rule' (e.g., 'is this S3 bucket encrypted'). GuardDuty = 'is this activity malicious/anomalous' (threat detection, ML-based, reads CloudTrail/VPC Flow Logs/DNS logs). Inspector = 'does this EC2/container/Lambda have known vulnerabilities' (vulnerability scanning). Security Hub = aggregates findings from all of the above into one dashboard." },

{ id:13, domain:1, topic:"WAF & Shield", difficulty:"medium",
  q:"A public-facing web application behind an Application Load Balancer is being hit with SQL injection attempts and a Layer 7 (HTTP flood) DDoS attack. Which service should be deployed to filter these malicious requests?",
  options:[
    "AWS Shield Standard",
    "AWS WAF (Web Application Firewall) with rules for SQL injection and rate limiting",
    "Network ACLs only",
    "Amazon GuardDuty"
  ], correct:1,
  explain:"WAF operates at Layer 7, inspecting HTTP(S) requests, and can block SQLi/XSS patterns and rate-limit IPs to mitigate HTTP floods. Shield Standard (automatically included, free) protects mainly against common network/transport layer (L3/L4) DDoS, not L7 content inspection. NACLs can't inspect HTTP payloads, and GuardDuty only detects/alerts, it doesn't block traffic.",
  crash:"Crash course — WAF vs Shield: AWS Shield Standard is free and automatic for all customers, protecting against common L3/L4 DDoS (SYN floods, UDP reflection). AWS Shield Advanced is a paid service adding L3/L4/L7 DDoS protection, cost protection, and a 24/7 DDoS Response Team, typically paired with WAF. AWS WAF inspects Layer 7 HTTP/S traffic against rules (SQLi, XSS, rate-based rules, geo-blocking) and attaches to CloudFront, ALB, API Gateway, or AppSync. For 'SQL injection' or 'HTTP flood' scenarios, the answer is WAF." },

{ id:14, domain:1, topic:"Data Encryption in Transit", difficulty:"easy",
  q:"Which AWS service is used to provision and manage free public SSL/TLS certificates for use with a CloudFront distribution or Application Load Balancer?",
  options:[
    "AWS KMS",
    "AWS Certificate Manager (ACM)",
    "AWS Secrets Manager",
    "AWS CloudHSM"
  ], correct:1,
  explain:"ACM issues and manages public/private SSL/TLS certificates, integrates natively with CloudFront, ALB, API Gateway, and handles automatic renewal. KMS manages encryption keys (not TLS certs directly), Secrets Manager stores secrets, and CloudHSM provides dedicated hardware for cryptographic operations.",
  crash:"Crash course: ACM certificates used with CloudFront must be requested in us-east-1 regardless of where your distribution's origin is, while certificates for a regional ALB must be in the same region as the ALB. ACM-issued public certs auto-renew for free as long as they remain in use and DNS/email validation stays valid — a very common exam distractor is choosing KMS or Secrets Manager for 'TLS certificates', but those services don't manage certificates." },

{ id:15, domain:1, topic:"Permissions Boundaries", difficulty:"hard",
  q:"A company wants to let developers create their own IAM roles for their applications, but must guarantee that no role a developer creates can ever exceed a fixed maximum set of permissions.",
  options:[
    "Use an SCP on the developer's account only.",
    "Set a Permissions Boundary on the IAM roles developers are allowed to create, capping their maximum effective permissions.",
    "Give developers the AdministratorAccess managed policy.",
    "Use a resource-based policy on every resource."
  ], correct:1,
  explain:"A permissions boundary is an advanced IAM feature that sets the maximum permissions an identity-based policy can grant to a user or role — effective permissions become the intersection of the boundary and the identity policy. This lets developers create roles freely within a capped ceiling. SCPs apply at the org/account level (all principals), not scoped to roles developers create.",
  crash:"Crash course — Permissions Boundaries: Think of it as a second policy that must ALSO allow an action for it to actually be permitted (effective permission = boundary ∩ identity policy). It's commonly used to let a 'power user'/developer create IAM roles/users without risking privilege escalation to admin — you attach the boundary policy when they create the role, capping what that new role can ever do, even if its identity policy is broader. Different from SCPs, which apply org-wide to everyone in an account, not per-role." },

{ id:16, domain:1, topic:"S3 Access Control", difficulty:"medium",
  q:"A company needs to grant a partner company (a different AWS account) temporary, time-limited access to download a single specific object from a private S3 bucket, without creating any IAM users or roles for the partner.",
  options:[
    "Make the object public.",
    "Generate a pre-signed URL for the object with an expiration time.",
    "Add the partner's AWS account as a bucket owner.",
    "Enable Transfer Acceleration."
  ], correct:1,
  explain:"A pre-signed URL grants temporary access to a specific S3 object using the permissions of the URL creator, without requiring the recipient to have any AWS identity at all, and it expires automatically. Making it public has no expiration/scoping, and account ownership changes are not how S3 sharing works.",
  crash:"Crash course — Pre-signed URLs: Generated using the SDK/CLI with the credentials of a principal that already has access to the object; the URL embeds a signature and expiration (max 7 days when signed with IAM role/user temp credentials via SigV4, or per the signer's session). Anyone with the URL can perform that one action (e.g., GET) until it expires — no AWS account needed on the recipient's side. Classic exam scenario: 'temporary access to a private object for someone without AWS credentials' → pre-signed URL." },

{ id:17, domain:1, topic:"VPC Flow Logs", difficulty:"easy",
  q:"A security team suspects unusual network traffic patterns to/from EC2 instances in a VPC and wants to capture metadata about IP traffic going to and from network interfaces for analysis.",
  options:[
    "Enable VPC Flow Logs on the VPC, subnet, or ENI.",
    "Enable AWS CloudTrail data events.",
    "Enable S3 server access logging.",
    "Enable Amazon Inspector."
  ], correct:0,
  explain:"VPC Flow Logs capture metadata (source/destination IP, port, protocol, bytes, ACCEPT/REJECT) about IP traffic to/from network interfaces, and can be sent to CloudWatch Logs or S3 for analysis. CloudTrail logs API calls (not raw network traffic), S3 access logging is for S3 requests, and Inspector scans for vulnerabilities.",
  crash:"Crash course — VPC Flow Logs: Can be enabled at the VPC, subnet, or individual ENI level; captures ACCEPTed and REJECTed traffic (great for debugging 'why is my security group/NACL blocking this'). It does NOT capture packet contents/payload — only metadata (5-tuple + bytes/packets). This is different from CloudTrail (API-level audit) — remember: Flow Logs = network traffic, CloudTrail = API activity." },

{ id:18, domain:1, topic:"MFA & Root Account", difficulty:"easy",
  q:"According to AWS best practices, what should be done with the AWS account root user immediately after account creation?",
  options:[
    "Use the root user for all daily administrative tasks for convenience.",
    "Enable MFA on the root user, and then avoid using it for everyday tasks — create IAM users/roles instead.",
    "Delete the root user account entirely.",
    "Share the root credentials with all administrators for backup access."
  ], correct:1,
  explain:"AWS best practice: enable MFA on the root user, secure/rotate its credentials, and then use IAM users/roles (ideally via IAM Identity Center) for daily work — the root user should be reserved for a small set of account-level tasks that require it. The root user account cannot be deleted, only the AWS account itself can be closed.",
  crash:"Crash course: A handful of tasks still require the root user (e.g., changing account settings, closing the account, some billing tasks, restoring full IAM permissions if locked out). Everything else should go through IAM users/roles with least privilege. This is a frequently tested best-practice question on the exam — the 'always use root, it's simpler' option is always wrong." },

{ id:19, domain:1, topic:"KMS Key Rotation", difficulty:"medium",
  q:"A company enables automatic annual key rotation on an AWS KMS Customer Managed Key (CMK). What happens to data previously encrypted with the old key material after rotation?",
  options:[
    "The old data becomes permanently unreadable and must be re-encrypted immediately.",
    "KMS keeps all previous key material under the same key ID, so data encrypted with older versions can still be decrypted transparently.",
    "AWS automatically re-encrypts all previously encrypted objects with the new key material.",
    "Rotation deletes the key entirely and a brand-new key ID must be used for all future encryption."
  ], correct:1,
  explain:"KMS automatic rotation keeps the key ID/ARN the same and retains all prior backing key material internally, so previously encrypted data remains decryptable without any re-encryption — new encryption requests use the newest key material. Nothing is deleted or becomes unreadable, and AWS does not proactively re-encrypt existing ciphertext.",
  crash:"Crash course — KMS rotation: For AWS-managed keys, rotation is automatic yearly and not configurable. For customer-managed CMKs, you can enable automatic annual rotation (or do manual rotation by creating a new CMK and updating aliases). Rotation is transparent to applications because the key ID/alias never changes — KMS tracks old key material internally to decrypt old ciphertext. This is different from IAM access key rotation, which is a manual, distinct process." },

{ id:20, domain:1, topic:"S3 Bucket Policy", difficulty:"medium",
  q:"A company wants to require that all objects uploaded to an S3 bucket are encrypted using SSE-KMS, rejecting any PUT request that doesn't specify KMS encryption.",
  options:[
    "Enable S3 Versioning.",
    "Add a bucket policy statement that denies s3:PutObject unless the request includes the s3:x-amz-server-side-encryption condition set to aws:kms.",
    "Enable Transfer Acceleration.",
    "Enable MFA Delete."
  ], correct:1,
  explain:"A bucket policy with a Deny statement and a condition checking the encryption header (s3:x-amz-server-side-encryption != aws:kms) will reject any upload that doesn't specify KMS encryption. Versioning, Transfer Acceleration, and MFA Delete are unrelated to enforcing encryption on upload.",
  crash:"Crash course — enforcing encryption via bucket policy: This is a common 'Deny if NOT' pattern in S3 bucket policies using condition keys like s3:x-amz-server-side-encryption. It's enforced at write-time (PUT) — S3 rejects any upload that doesn't include the required header, regardless of who's uploading, unlike default bucket encryption (which auto-encrypts but doesn't reject a request specifying a different method)." },

{ id:21, domain:1, topic:"AWS RAM", difficulty:"hard",
  q:"A company wants to share a Transit Gateway (and its routes) created in a central network account with several other AWS accounts in the same AWS Organization, without duplicating the resource.",
  options:[
    "AWS Resource Access Manager (RAM)",
    "AWS Organizations SCPs",
    "Cross-account IAM roles",
    "VPC Peering"
  ], correct:0,
  explain:"AWS RAM lets you share supported resources (Transit Gateway, subnets, License Manager configurations, Route 53 Resolver rules, etc.) directly with other accounts or an entire Organization, so those accounts can use the actual resource rather than a duplicate. SCPs are permission guardrails, not resource sharing; IAM roles grant access to APIs, not native resource sharing; VPC Peering connects VPCs but doesn't 'share' a Transit Gateway resource itself.",
  crash:"Crash course — AWS RAM: Designed specifically to avoid duplicating and separately managing the same resource (like a Transit Gateway or a shared VPC subnet) across accounts. Once shared, the resource shows up in the consumer account as usable, but it's still owned/billed in the origin account for most resource types. Exam trigger: 'share a [Transit Gateway/subnet/etc.] across multiple accounts' → RAM." },

{ id:22, domain:1, topic:"Least Privilege", difficulty:"easy",
  q:"Which approach best reflects the AWS security principle of 'least privilege'?",
  options:[
    "Grant AdministratorAccess to all users so they never hit permission errors.",
    "Grant users and roles only the specific permissions required to perform their tasks, and expand access only as needed.",
    "Grant broad permissions initially and rely on manual audits to catch overly permissive access later.",
    "Use only resource-based policies and never identity-based policies."
  ], correct:1,
  explain:"Least privilege means starting with minimal permissions and adding only what's proven necessary, minimizing blast radius if credentials are compromised. Granting broad access 'to avoid errors' or 'auditing later' is the opposite of least privilege.",
  crash:"Crash course: Least privilege is a foundational AWS Well-Architected security pillar concept. Practical tools to implement it: fine-grained IAM policies scoped to specific actions/resources/conditions, permissions boundaries, SCPs, IAM Access Analyzer (identifies unused permissions/overly permissive policies), and regularly reviewing access with tools like IAM Access Advisor." },

{ id:23, domain:1, topic:"Directory Service", difficulty:"medium",
  q:"A company needs to let its on-premises Active Directory users authenticate to AWS workloads (like EC2 Windows instances and RDS SQL Server) without duplicating or migrating the existing AD to the cloud.",
  options:[
    "AWS IAM Identity Center only.",
    "AWS Directory Service for Microsoft Active Directory (AD Connector), which proxies authentication requests to the existing on-premises AD.",
    "Create brand-new IAM users matching every AD username.",
    "Amazon Cognito User Pools."
  ], correct:1,
  explain:"AD Connector is a proxy that redirects directory requests to an existing on-premises Active Directory without storing user data in AWS — ideal when you want to keep using the existing AD as the source of truth. IAM Identity Center is for workforce SSO into AWS accounts/apps (can integrate with AD, but the direct proxy answer here is AD Connector), Cognito is for customer-facing app authentication, and manually duplicating users defeats the purpose.",
  crash:"Crash course — AWS Directory Service flavors: AWS Managed Microsoft AD (a real, AWS-hosted AD you manage, supports trusts). Simple AD (a lightweight, AD-compatible directory, no trusts). AD Connector (just a proxy/redirector to your existing on-prem AD, no data stored in AWS — best when 'don't duplicate/migrate the directory' is in the scenario)." },

{ id:24, domain:1, topic:"EBS Encryption", difficulty:"easy",
  q:"A company wants all newly created EBS volumes and snapshots in an AWS account/region to be encrypted automatically by default, without relying on developers to check a box each time.",
  options:[
    "This isn't possible; encryption must be manually enabled at every volume creation.",
    "Enable the 'Always encrypt new EBS volumes' account-level setting for that region.",
    "Enable S3 default encryption.",
    "Attach an SCP that blocks EC2 launches."
  ], correct:1,
  explain:"EC2 has a per-region account setting to enable default EBS encryption, so every new volume and snapshot is encrypted automatically going forward, using either the AWS managed key or a specified CMK. S3 default encryption is unrelated to EBS, and blocking EC2 launches doesn't achieve the goal.",
  crash:"Crash course: Once default EBS encryption is on for a region, it applies to new volumes created via any method (console, API, Auto Scaling launch templates) in that region — but it does NOT retroactively encrypt existing unencrypted volumes/snapshots (those must be copied/re-created to become encrypted). This is a region-scoped setting, so it must be enabled per region if used in multiple regions." },

{ id:25, domain:1, topic:"IAM Identity Center", difficulty:"medium",
  q:"A company with dozens of AWS accounts wants to give employees single sign-on (SSO) access to multiple AWS accounts using their existing corporate identity provider (e.g., Okta or Azure AD), rather than managing separate IAM users per account.",
  options:[
    "Create IAM users manually in every account.",
    "AWS IAM Identity Center (successor to AWS SSO), integrated with the external IdP via SAML.",
    "Amazon Cognito Identity Pools.",
    "AWS Directory Service Simple AD only."
  ], correct:1,
  explain:"IAM Identity Center is purpose-built for centralized workforce SSO across multiple AWS accounts (and even business apps), integrating with external identity providers via SAML 2.0 and mapping users/groups to permission sets per account. Cognito is meant for customer-facing application identity, not multi-account workforce SSO.",
  crash:"Crash course — IAM Identity Center: Works hand-in-hand with AWS Organizations; you define 'Permission Sets' (collections of IAM policies) and assign them to users/groups per account, and Identity Center handles provisioning the underlying IAM roles in each account. This is the modern, recommended replacement for managing per-account IAM users at scale, and the standard exam answer for 'SSO across multiple AWS accounts'." },

{ id:26, domain:1, topic:"Amazon Macie", difficulty:"medium",
  q:"A company stores large volumes of data in S3 and wants to automatically discover and alert on sensitive data (like PII, credit card numbers) stored in those buckets.",
  options:[
    "Amazon Macie",
    "AWS Config",
    "Amazon Inspector",
    "AWS Trusted Advisor"
  ], correct:0,
  explain:"Macie uses machine learning and pattern matching specifically to discover, classify, and alert on sensitive data (PII, financial data, credentials) stored in S3. Config checks resource configuration compliance, Inspector scans for software vulnerabilities, and Trusted Advisor gives general best-practice checks — none scan S3 object content for sensitive data.",
  crash:"Crash course: Macie's core value is content-aware S3 data classification at scale — it doesn't just check bucket settings (that's more Config's/Security Hub's job) but actually samples and inspects object contents for sensitive data patterns, generating findings you can route to Security Hub or EventBridge for automated response." },

{ id:27, domain:1, topic:"Systems Manager Session Manager", difficulty:"medium",
  q:"A company wants to let administrators securely connect to EC2 instances for shell access WITHOUT opening inbound SSH port 22 in any security group and without managing SSH key pairs.",
  options:[
    "Open port 22 to 0.0.0.0/0 and use key pairs as usual.",
    "Use AWS Systems Manager Session Manager, which requires the SSM Agent and an IAM role on the instance, but no inbound ports.",
    "Use a bastion host with port 22 open only to the office IP.",
    "Use VPC Peering."
  ], correct:1,
  explain:"Session Manager establishes a secure, auditable session over the SSM Agent's outbound connection to the Systems Manager service — no inbound ports need to be opened at all, and no SSH keys are needed (access is governed by IAM). A bastion host still requires an open inbound port (even if restricted), which is less ideal than zero inbound ports.",
  crash:"Crash course — Session Manager: Requires the instance to have the SSM Agent (pre-installed on most AMIs) and an IAM instance role with the AmazonSSMManagedInstanceCore policy — the instance calls OUT to Systems Manager, so no inbound security group rule is needed at all. Bonus: sessions can be logged to S3/CloudWatch Logs for auditing. Exam trigger: 'without opening SSH/RDP ports' or 'no bastion host' → Session Manager." },

{ id:28, domain:1, topic:"Data Perimeter / VPC Design", difficulty:"medium",
  q:"A three-tier web application should place its database tier where it can NEVER be reached directly from the internet, while still being reachable by the application tier.",
  options:[
    "Place the database in a public subnet with a restrictive security group.",
    "Place the database in a private subnet with no route to an Internet Gateway, allowing inbound only from the application tier's security group.",
    "Place the database in the same public subnet as the web tier for simplicity.",
    "Disable the security group on the database instance entirely."
  ], correct:1,
  explain:"A private subnet (no route to an Internet Gateway) combined with a security group that only allows inbound traffic from the app tier's security group ensures the database is unreachable from the internet by design, not just by firewall rule. A public subnet is reachable via the IGW route regardless of security group unless blocked at every layer, so it's a weaker design.",
  crash:"Crash course — public vs private subnet: A subnet is 'public' only because its route table has a route to an Internet Gateway (0.0.0.0/0 → igw-xxxx); it's not an inherent property. 'Private' subnets typically route 0.0.0.0/0 to a NAT Gateway (for outbound-only internet, e.g., patching) or nowhere at all. The standard 3-tier design: public subnet for load balancer/bastion, private subnet for app servers, private (often isolated, no NAT) subnet for databases — defense in depth using subnet routing + security groups together, not just one or the other." },

{ id:29, domain:1, topic:"Resource-based vs Identity-based Policies", difficulty:"hard",
  q:"Which statement correctly distinguishes identity-based policies from resource-based policies in IAM?",
  options:[
    "Identity-based policies are attached to users/groups/roles and define what that identity can do; resource-based policies are attached to a resource (like an S3 bucket or SQS queue) and define who can access that resource, including principals from other accounts.",
    "Resource-based policies can only be used with EC2 instances.",
    "Identity-based policies can grant cross-account access without any resource policy needed.",
    "There is no functional difference between the two policy types."
  ], correct:0,
  explain:"Identity-based policies attach to IAM identities (control what that identity can do across resources it has permission for). Resource-based policies attach directly to a resource (S3 bucket policy, SQS queue policy, KMS key policy, Lambda resource policy) and can name principals from ANY account, which is what makes them the tool for granting cross-account access without the other account needing to modify their own IAM roles.",
  crash:"Crash course: For a same-account resource access, an identity-based policy alone is enough. For cross-account access, you generally need a resource-based policy on the resource (naming the external account/role as Principal) OR a role with a trust policy the external account can assume — identity-based policies in Account A cannot, by themselves, grant Account B's users access to Account A's resources." },

{ id:30, domain:1, topic:"CloudHSM", difficulty:"hard",
  q:"A financial services company must use FIPS 140-2 Level 3 validated hardware security modules where they retain sole control of key material, dedicated to their tenancy only (not shared/multi-tenant like KMS).",
  options:[
    "AWS KMS with AWS-owned keys.",
    "AWS CloudHSM.",
    "AWS Secrets Manager.",
    "Amazon S3 SSE-S3."
  ], correct:1,
  explain:"CloudHSM provides single-tenant, dedicated FIPS 140-2 Level 3 validated hardware security modules where the customer has exclusive administrative control over the key material — the strictest key control/compliance option. KMS (except with a custom key store backed by CloudHSM) is a multi-tenant managed service where AWS operates the underlying HSMs.",
  crash:"Crash course — KMS vs CloudHSM: KMS is easier, integrates natively with most AWS services, and is Level 2 validated (with Level 3 validated endpoints for some operations) — great for the vast majority of use cases. CloudHSM gives you a dedicated, single-tenant HSM cluster you fully control (AWS can't access your keys at all), needed for strict compliance mandates or when an application requires direct HSM (PKCS#11, JCE, CNG) access. You can also use a KMS 'custom key store' backed by CloudHSM to get KMS convenience with CloudHSM-level key control." },

// ============================= DOMAIN 2: RESILIENT ARCHITECTURES (26) =============================
{ id:31, domain:2, topic:"RDS Multi-AZ vs Read Replica", difficulty:"medium",
  q:"A production RDS database needs automatic failover to a standby in case the primary instance or its AZ fails, with minimal application changes. Read scaling is NOT the goal.",
  options:[
    "Create RDS Read Replicas in multiple AZs.",
    "Enable RDS Multi-AZ deployment, which maintains a synchronously replicated standby in a different AZ with automatic failover.",
    "Take manual snapshots every hour.",
    "Use DynamoDB Global Tables instead."
  ], correct:1,
  explain:"RDS Multi-AZ is specifically for high availability/failover: AWS automatically manages a synchronous standby in another AZ and fails over automatically (updating the DNS CNAME) if the primary fails — no read traffic is served from the standby. Read Replicas are asynchronous and intended for scaling reads, not automatic HA failover (though a replica can be manually promoted).",
  crash:"Crash course — Multi-AZ vs Read Replica: Multi-AZ = HA/DR feature, synchronous replication, automatic failover, standby not readable, same region. Read Replica = scalability feature, asynchronous replication, manual promotion only, replica IS readable, can be cross-region. You can combine both: a Multi-AZ primary with cross-region read replicas for both HA and global read scaling. Exam clue: 'automatic failover' → Multi-AZ; 'reduce read load on primary' → Read Replica." },

{ id:32, domain:2, topic:"Auto Scaling", difficulty:"easy",
  q:"A web application's traffic fluctuates significantly throughout the day. Which combination BEST provides resilience and elasticity for the EC2 fleet serving this traffic?",
  options:[
    "A single large EC2 instance sized for peak traffic, running 24/7.",
    "An Auto Scaling Group spanning multiple AZs behind an Application Load Balancer, scaling based on demand (e.g., target tracking on CPU).",
    "Multiple EC2 instances in a single AZ, manually resized by an engineer during peak hours.",
    "A single EC2 instance with a larger EBS volume attached."
  ], correct:1,
  explain:"An Auto Scaling Group spread across multiple AZs behind a load balancer provides both elasticity (scale in/out with demand) and resilience (surviving an AZ failure, with the ALB distributing traffic and health-checking instances). A single instance, regardless of size, is a single point of failure and doesn't elastically respond to demand changes.",
  crash:"Crash course — ASG + ALB pattern: This is the canonical resilient/elastic web-tier pattern on the exam. The ASG maintains desired capacity across multiple AZs (so losing one AZ doesn't take down the app), and scaling policies (target tracking, step scaling, scheduled scaling, predictive scaling) adjust capacity to match load. The ALB performs health checks and stops routing to unhealthy instances, while the ASG replaces them automatically." },

{ id:33, domain:2, topic:"Route 53 Routing Policies", difficulty:"medium",
  q:"A company runs its application in two regions and wants Route 53 to send all traffic to the primary region's endpoint, and automatically redirect all traffic to the secondary region ONLY if the primary endpoint's health check fails.",
  options:[
    "Weighted routing policy",
    "Latency-based routing policy",
    "Failover routing policy",
    "Geolocation routing policy"
  ], correct:2,
  explain:"Failover routing policy is specifically designed for active-passive setups: it routes to the primary record when its associated health check passes, and automatically shifts all traffic to the secondary record when the primary health check fails. Weighted splits traffic by percentage regardless of health in a simple sense, latency routes to the lowest-latency healthy region, and geolocation routes by the user's geographic location — none match 'primary unless it fails, then all to secondary.'",
  crash:"Crash course — Route 53 routing policies: Simple (one record, no health check logic), Weighted (split traffic by assigned weight — good for A/B testing or gradual rollouts), Latency-based (route to the region with lowest latency for the user), Failover (active-passive DR pattern), Geolocation (route by user's location, e.g., compliance/content localization), Geoproximity (route by geographic distance with a bias, needs Route 53 traffic flow), Multivalue answer (return multiple healthy IPs, simple client-side load balancing with health checks, not a substitute for a real load balancer)." },

{ id:34, domain:2, topic:"Disaster Recovery Strategies", difficulty:"hard",
  q:"A company needs a disaster recovery strategy with the LOWEST cost, accepting a Recovery Time Objective (RTO) and Recovery Point Objective (RPO) of several hours. They only need backups stored and a process to restore infrastructure when a disaster occurs.",
  options:[
    "Multi-site active-active",
    "Warm standby",
    "Pilot light",
    "Backup and restore"
  ], correct:3,
  explain:"Backup and restore is the lowest-cost DR strategy: back up data (e.g., to S3, AWS Backup) and store infrastructure-as-code templates, but stand up the environment only when disaster strikes — resulting in the highest RTO/RPO but lowest ongoing cost, matching 'several hours RTO/RPO, lowest cost' exactly.",
  crash:"Crash course — the 4 DR strategies (in order of cost AND speed, low to high): 1) Backup & Restore (cheapest, RTO/RPO in hours, restore from backups on demand). 2) Pilot Light (core infra like a small/scaled-down DB replica always running, rest is provisioned/scaled up at DR time, RTO in tens of minutes). 3) Warm Standby (a scaled-down but fully functional full copy of the environment always running, scaled up at DR time, RTO in minutes). 4) Multi-Site Active-Active (full production-scale environment running in multiple regions simultaneously, near-zero RTO/RPO, highest cost). Exam always trades off cost vs RTO/RPO — match the described RTO/RPO or cost constraint to the right tier." },

{ id:35, domain:2, topic:"S3 Durability & Replication", difficulty:"medium",
  q:"A company must retain a copy of every object in an S3 bucket in a second AWS Region for compliance, automatically, as soon as new objects are written.",
  options:[
    "Enable S3 Cross-Region Replication (CRR) with versioning enabled on both buckets.",
    "Manually copy objects with a nightly cron job.",
    "Enable S3 Transfer Acceleration.",
    "Enable S3 Intelligent-Tiering."
  ], correct:0,
  explain:"Cross-Region Replication automatically and asynchronously copies new objects (and optionally existing ones, or deletes) to a bucket in another region, and requires versioning enabled on both source and destination buckets. Transfer Acceleration speeds up uploads over long distances via CloudFront edge locations, and Intelligent-Tiering is a storage class for cost optimization, not replication.",
  crash:"Crash course — S3 Replication: CRR (Cross-Region) and SRR (Same-Region Replication) both require versioning ON for source and destination. Replication is NOT retroactive by default (existing objects aren't copied unless you use S3 Batch Replication or enable it at bucket creation for pre-existing objects), and it's one-directional unless you configure bi-directional replication. Common uses: CRR for DR/compliance/latency, SRR for log aggregation or maintaining separate permission sets." },

{ id:36, domain:2, topic:"SQS Decoupling", difficulty:"easy",
  q:"An order-processing application's web front-end sometimes overwhelms its backend processing service during traffic spikes, causing failures. What is the best way to decouple these components for resilience?",
  options:[
    "Increase the backend's instance size to handle any load.",
    "Insert an Amazon SQS queue between the front-end and backend so requests buffer during spikes and are processed at the backend's own pace.",
    "Have the front-end call the backend synchronously with retries only.",
    "Merge the front-end and backend into a single monolithic application."
  ], correct:1,
  explain:"SQS decouples producers and consumers: the front-end pushes messages to the queue instantly (fast, resilient to backend slowness) and the backend polls and processes at a sustainable rate, buffering spikes instead of dropping/failing requests. Just resizing doesn't handle unpredictable spikes elastically or provide the buffering/retry durability a queue gives.",
  crash:"Crash course — Queue-based decoupling: SQS Standard queues offer at-least-once delivery, nearly unlimited throughput, and best-effort ordering. SQS FIFO queues guarantee exact-once processing and strict ordering but with lower throughput (unless using high-throughput mode). Combine with a Dead-Letter Queue (DLQ) to capture messages that fail processing repeatedly (redrive policy), preventing 'poison pill' messages from blocking the queue. This pattern is fundamental to resilient, loosely-coupled architectures — expect it heavily on the exam." },

{ id:37, domain:2, topic:"Aurora", difficulty:"medium",
  q:"A company wants a relational database with storage that automatically grows up to 128 TB, replicates data across 3 AZs (6 copies) by default, and can recover quickly from an AZ failure, MORE resilient than standard RDS Multi-AZ.",
  options:[
    "Amazon RDS for MySQL with Multi-AZ.",
    "Amazon Aurora, which stores 6 copies of data across 3 AZs and can tolerate the loss of up to 2 copies without affecting writes.",
    "Amazon DynamoDB.",
    "Amazon Redshift."
  ], correct:1,
  explain:"Aurora's storage layer is inherently distributed: it automatically replicates 6 copies of data across 3 AZs, can lose up to 2 copies without impacting write availability and up to 3 without impacting read availability, and storage auto-scales up to 128 TB. Standard RDS Multi-AZ just maintains one synchronous standby copy, not 6 distributed copies.",
  crash:"Crash course — Aurora resilience: Storage is decoupled from compute and is a distributed, self-healing, multi-AZ system by default — this is fundamentally more resilient than 'classic' RDS engines' Multi-AZ (single standby). Aurora also supports up to 15 low-latency Aurora Replicas (vs 5 for other RDS engines) that share the same underlying storage, and Aurora Global Database extends this across regions with typically <1 second replication lag for cross-region DR/read scaling." },

{ id:38, domain:2, topic:"DynamoDB Global Tables", difficulty:"medium",
  q:"A globally distributed application needs a DynamoDB table that is automatically replicated across multiple AWS regions with multi-region, multi-active reads and writes, and eventual consistency between regions.",
  options:[
    "DynamoDB with a single table and cross-region VPC peering.",
    "DynamoDB Global Tables.",
    "DynamoDB with manual daily export/import between regions.",
    "DynamoDB Accelerator (DAX) across regions."
  ], correct:1,
  explain:"DynamoDB Global Tables provide built-in multi-region, multi-active replication — writes to any region's replica propagate to all other regions automatically (typically within a second), enabling low-latency local reads/writes globally with eventual cross-region consistency. DAX is an in-memory cache for a single table/region, not a cross-region replication feature.",
  crash:"Crash course — Global Tables: Uses DynamoDB Streams under the hood to replicate changes across regional replica tables. It's 'multi-active' (not primary/secondary) — an application can write to its nearest region and that write propagates everywhere, useful for globally distributed low-latency apps and regional DR without manual failover logic. Conflict resolution uses 'last writer wins' based on timestamps." },

{ id:39, domain:2, topic:"Elastic Load Balancer Health Checks", difficulty:"easy",
  q:"An Application Load Balancer is configured with a target group of EC2 instances. One instance starts failing its configured health check. What happens?",
  options:[
    "The ALB continues sending it an equal share of traffic regardless.",
    "The ALB stops routing new requests to that instance until it passes health checks again, while an Auto Scaling Group (if attached) may terminate and replace it.",
    "The entire load balancer stops serving traffic.",
    "The instance is immediately terminated by the ALB itself."
  ], correct:1,
  explain:"The ALB marks a failing instance as 'unhealthy' and stops routing new traffic to it, continuing to check periodically; if the target group is tied to an Auto Scaling Group with health check type ELB, the ASG can terminate and replace the unhealthy instance. The ALB itself does not terminate instances — that's the ASG's job.",
  crash:"Crash course: By default, an ASG's health check type is EC2 (only checks instance status), which won't catch an app-level failure that still leaves the OS running. Setting the ASG's health check type to ELB makes it honor the load balancer's (application-level) health check results too, so it will replace instances that are technically 'running' but failing app health checks — a commonly tested exam gotcha." },

{ id:40, domain:2, topic:"EFS vs EBS", difficulty:"medium",
  q:"An application running on multiple EC2 instances across 3 AZs needs a SHARED file system that all instances can read/write to concurrently.",
  options:[
    "Attach the same EBS volume to all instances simultaneously.",
    "Use Amazon EFS, which supports concurrent access from multiple instances across multiple AZs via NFS.",
    "Use instance store volumes on each instance.",
    "Copy files manually between instances using SCP."
  ], correct:1,
  explain:"EFS is a managed NFS file system designed for concurrent, shared access from many EC2 instances across multiple AZs simultaneously. Standard EBS volumes can only attach to a single EC2 instance at a time (except io1/io2 Multi-Attach, which is limited to instances in the same AZ and same Nitro-based cluster, still not the general 'shared across many' solution), and instance store is ephemeral, non-shared local storage.",
  crash:"Crash course — EFS vs EBS vs Instance Store: EBS = block storage, one instance at a time (mostly), persists independent of instance lifecycle, AZ-bound (must be in the same AZ as the attached instance). EFS = network file storage (NFS), multi-AZ, multi-instance concurrent access, scales automatically, priced per GB used. Instance Store = physically attached to the host, extremely fast, but ephemeral (data lost on stop/termination) — never use for data you can't afford to lose." },

{ id:41, domain:2, topic:"Backup Strategy", difficulty:"medium",
  q:"A company wants to centrally manage automated, policy-based backups across EBS volumes, RDS databases, DynamoDB tables, and EFS file systems, with retention rules and cross-region copy for DR.",
  options:[
    "Manually script snapshots for each service separately using the CLI.",
    "AWS Backup, using backup plans with defined schedules, retention, and cross-region copy rules.",
    "S3 Cross-Region Replication for all data.",
    "AWS CloudFormation."
  ], correct:1,
  explain:"AWS Backup is a centralized, policy-driven backup service that manages backups across many AWS services (EBS, RDS, DynamoDB, EFS, FSx, Storage Gateway, etc.) from one place, including retention lifecycle and cross-region/cross-account copy — exactly matching this scenario. Scripting separately per-service duplicates effort and is harder to govern centrally.",
  crash:"Crash course — AWS Backup: Define a 'backup plan' (schedule + lifecycle/retention + destination vaults, including cross-region copy) and assign resources via tags or explicit resource IDs. It also supports backup vault lock (WORM-style immutability for compliance) and centralized monitoring of backup/restore jobs — useful whenever a scenario says 'centralized backup policy across multiple services'." },

{ id:42, domain:2, topic:"Step Functions", difficulty:"medium",
  q:"A company has a multi-step order fulfillment workflow (validate payment → check inventory → ship → notify customer) using several Lambda functions, and needs built-in retry logic, error handling, and visual tracking of workflow state, without writing custom orchestration code.",
  options:[
    "Chain the Lambda functions by having each one directly invoke the next.",
    "AWS Step Functions to orchestrate the Lambda functions as a state machine with built-in retries, error handling, and visual execution history.",
    "Use an SQS queue between every pair of functions with custom polling logic.",
    "Combine all logic into a single large Lambda function."
  ], correct:1,
  explain:"Step Functions is purpose-built for orchestrating multi-step workflows (state machines) across Lambda and other services, offering built-in retry/catch error handling, parallel/branching execution, and a visual console for tracking execution — exactly what's needed here without custom glue code. Directly chaining Lambdas or combining into a monolith Lambda makes error handling and observability much harder.",
  crash:"Crash course — Step Functions: Defined using Amazon States Language (JSON), supports Task, Choice, Parallel, Wait, Map, and error-handling (Retry/Catch) states. Two workflow types: Standard (long-running, up to 1 year, exactly-once, good for auditable business workflows) and Express (high-volume, short-duration, at-least-once, good for streaming/IoT data processing). Exam trigger: 'orchestrate multiple Lambda/services with retry and visual workflow' → Step Functions." },

{ id:43, domain:2, topic:"RTO vs RPO", difficulty:"easy",
  q:"A company states it can tolerate losing at most 15 minutes of transaction data, but the application must be back online within 4 hours of a disaster. Which terms correctly describe these two requirements, respectively?",
  options:[
    "RTO = 15 minutes, RPO = 4 hours",
    "RPO = 15 minutes, RTO = 4 hours",
    "Both are RTO.",
    "Both are RPO."
  ], correct:1,
  explain:"RPO (Recovery Point Objective) is about acceptable DATA LOSS measured in time — 'how much data can we afford to lose' (15 minutes of transactions). RTO (Recovery Time Objective) is about acceptable DOWNTIME — 'how long can the app be unavailable' (4 hours).",
  crash:"Crash course — RTO vs RPO, the easy mnemonic: RPO looks BACKWARD in time from the disaster (how much data between the last backup and the disaster can you lose?) — driven by backup/replication FREQUENCY. RTO looks FORWARD from the disaster (how long until service is restored?) — driven by how fast you can provision/restore infrastructure. Every DR strategy (backup & restore, pilot light, warm standby, multi-site) is essentially a cost/RTO/RPO tradeoff — smaller RTO/RPO = more always-on infrastructure = higher cost." },

{ id:44, domain:2, topic:"SNS Fan-out", difficulty:"medium",
  q:"An e-commerce order event needs to simultaneously trigger: an inventory update (via SQS), an email confirmation (via Lambda), and an analytics pipeline (via another SQS queue) — all independently and in parallel.",
  options:[
    "Have the order service call each of the three targets directly and sequentially.",
    "Publish the order event to a single SNS topic, with the SQS queues and Lambda function subscribed to it (fan-out pattern).",
    "Write the event only to a single SQS queue and have all three services poll the same queue.",
    "Store the event in S3 and have each service poll S3 every second."
  ], correct:1,
  explain:"The SNS fan-out pattern publishes one message to an SNS topic, which then pushes copies to all subscribers (SQS queues, Lambda, HTTP endpoints, email) in parallel — decoupled, independently scalable, and resilient to any one subscriber being slow. Having all consumers share a single SQS queue means each message is consumed by only ONE of them (competing consumers), not all three.",
  crash:"Crash course — SNS + SQS fan-out: This is one of the most iconic AWS decoupling patterns. SNS pushes (doesn't wait to be polled), and fanning out to SQS queues (rather than directly to Lambda/HTTP) adds a durable buffer per-consumer, so if a consumer is down, messages aren't lost. Whenever a question says 'multiple independent systems need to react to the same event', think SNS fan-out." },

{ id:45, domain:2, topic:"Elastic Beanstalk", difficulty:"easy",
  q:"A small team wants to deploy a web application quickly without manually configuring EC2, load balancers, or Auto Scaling Groups, while still being able to access and tweak those underlying resources later.",
  options:[
    "AWS Elastic Beanstalk, which provisions and manages the underlying EC2, ELB, and Auto Scaling resources automatically.",
    "Manually configure each resource in the EC2 console.",
    "AWS Lambda only.",
    "Amazon EKS with self-managed nodes."
  ], correct:0,
  explain:"Elastic Beanstalk is a PaaS-style orchestration service: you upload code, and it automatically provisions and manages EC2 instances, load balancing, Auto Scaling, and health monitoring, while still exposing the underlying resources for customization if needed. Manual configuration or setting up EKS is significantly more operational overhead than this scenario calls for.",
  crash:"Crash course — Elastic Beanstalk: 'Platform as a Service' layer over EC2/ELB/ASG/RDS — fast to get started, still gives you access to the underlying resources (unlike pure serverless), and is a common exam answer for 'quickly deploy without managing infrastructure manually' when the workload isn't described as serverless-first. Contrast with CloudFormation (pure infrastructure-as-code, no opinionated app deployment model) and Lambda (no servers at all, event-driven, for discrete functions not full multi-tier web apps)." },

{ id:46, domain:2, topic:"Multi-AZ Architecture", difficulty:"medium",
  q:"Which architecture provides the HIGHEST availability for a three-tier web application, protecting against a single Availability Zone failure?",
  options:[
    "Web, app, and database tiers all in a single AZ, with hourly snapshots.",
    "Web and app tiers spread across 2+ AZs via ASGs/ALB, and the database using Multi-AZ RDS or Aurora replicated across AZs.",
    "Web tier in AZ-A, app tier in AZ-B, database tier in AZ-C, without any redundancy in each tier.",
    "All tiers duplicated in a single AZ for redundancy."
  ], correct:1,
  explain:"True AZ-failure resilience requires redundancy of EVERY tier ACROSS multiple AZs — an ASG/ALB spanning multiple AZs for compute tiers, and Multi-AZ RDS/Aurora for the database tier. Spreading different tiers into different single AZs (option C) still leaves each tier as a single point of failure if its one AZ goes down.",
  crash:"Crash course: A very common exam trap is 'putting each tier in a different AZ' — that sounds resilient but it's not: if AZ-B (the app tier's only AZ) fails, the whole app fails, even though web and DB tiers are fine. Real resilience means EACH tier independently spans 2+ AZs. Also remember every properly designed VPC for production should span at least 2 AZs for exactly this reason." },

{ id:47, domain:2, topic:"Snapshot Lifecycle", difficulty:"medium",
  q:"A company wants automated, scheduled EBS snapshots of its volumes with an automatic retention/expiration policy, without writing custom Lambda/cron scripts.",
  options:[
    "Amazon Data Lifecycle Manager (DLM) for EBS snapshots.",
    "Manually take snapshots via the console each day.",
    "Enable S3 lifecycle policies on the volume.",
    "Enable EBS encryption."
  ], correct:0,
  explain:"Amazon Data Lifecycle Manager (DLM) automates the creation, retention, and deletion of EBS snapshots (and AMIs) on a defined schedule, exactly matching the requirement without custom scripting. S3 lifecycle policies apply to S3 objects, not EBS volumes, and manual snapshotting isn't automated.",
  crash:"Crash course: DLM policies target resources via tags, define a schedule (e.g., daily at 3 AM), and a retention count or time period, automatically pruning old snapshots. This is distinct from AWS Backup, which is a broader, more full-featured centralized backup service across many services — DLM is more lightweight and EBS/AMI-snapshot-specific. Both can be correct depending on scenario scope (single-service scheduling → DLM; centralized multi-service backup governance → AWS Backup)." },

{ id:48, domain:2, topic:"Idempotency & Retries", difficulty:"hard",
  q:"A distributed order-processing system uses SQS Standard queues. Occasionally, the same message is delivered and processed more than once, causing duplicate orders. What should be implemented to fix this?",
  options:[
    "Switch to SNS instead of SQS.",
    "Design the message consumer to be idempotent (e.g., using an order ID to detect and ignore duplicates), or switch to an SQS FIFO queue with deduplication.",
    "Reduce the SQS visibility timeout to 0.",
    "Increase the number of consumers polling the queue."
  ], correct:1,
  explain:"SQS Standard queues guarantee at-least-once delivery, meaning duplicates ARE possible by design — the fix is either idempotent processing (safely handle a duplicate without a bad effect, e.g., checking a unique order ID before creating) or moving to a FIFO queue with content-based or message-group deduplication. Reducing visibility timeout to 0 would make duplicates dramatically worse, not better.",
  crash:"Crash course — idempotency: An idempotent operation produces the same end result no matter how many times it's applied (e.g., 'set balance to $50' vs 'add $10 to balance' — the former is idempotent, the latter isn't). Because most distributed/queue-based systems on AWS (SQS Standard, at-least-once delivery, retries after Lambda errors) can redeliver a message, building idempotent consumers (dedupe by a unique key, conditional writes in DynamoDB, etc.) is considered a best practice baked into the Well-Architected Framework, not just an SQS-specific fix." },

{ id:49, domain:2, topic:"Transit Gateway", difficulty:"medium",
  q:"A company has 12 VPCs across several AWS accounts that all need to communicate with each other and with an on-premises data center via a single VPN/Direct Connect connection, without creating dozens of individual VPC peering connections.",
  options:[
    "Create full-mesh VPC Peering between all 12 VPCs.",
    "Use AWS Transit Gateway as a central hub connecting all VPCs and the on-premises network.",
    "Use Route 53 Resolver only.",
    "Use individual NAT Gateways in each VPC."
  ], correct:1,
  explain:"Transit Gateway acts as a central hub-and-spoke router connecting many VPCs and on-premises networks through a single attachment point each, avoiding the N²-scaling complexity of full-mesh VPC peering. Full mesh peering for 12 VPCs would require 66 individual peering connections and doesn't natively extend to on-premises VPN/DX in a hub-like way.",
  crash:"Crash course — Transit Gateway vs VPC Peering: VPC Peering is 1:1, non-transitive (if A peers with B and B peers with C, A cannot reach C through B), and becomes unmanageable at scale (N*(N-1)/2 connections for full mesh). Transit Gateway is a regional hub that supports transitive routing among all attached VPCs/VPNs/Direct Connect gateways through route tables, dramatically simplifying large multi-VPC, multi-account, hybrid network designs. Exam trigger: 'many VPCs need to talk to each other and on-prem' → Transit Gateway." },

{ id:50, domain:2, topic:"Read Replica Promotion", difficulty:"medium",
  q:"An RDS MySQL Read Replica's source (primary) database becomes permanently unavailable due to a regional disaster. What can be done to recover write capability quickly?",
  options:[
    "Nothing; a Read Replica can never become a primary.",
    "Promote the Read Replica to become a standalone, writable primary database instance.",
    "Wait for AWS to automatically fail over, as with Multi-AZ.",
    "Delete the replica and restore from the last manual snapshot only."
  ], correct:1,
  explain:"An RDS Read Replica can be manually promoted to a standalone instance, which breaks replication and makes it writable — a common cross-region DR pattern (especially useful when the primary region itself is down, since a cross-region replica survives a regional disaster). Unlike Multi-AZ, promotion is a manual action, not automatic.",
  crash:"Crash course: Cross-region read replicas serve double duty — scaling reads closer to users in another region during normal operation, AND acting as a DR target that can be promoted if the primary region fails. This is different from Multi-AZ standby promotion, which IS automatic. Remember: Multi-AZ standby = automatic failover, same region. Read replica promotion = manual, can be cross-region, breaks replication permanently once promoted." },

{ id:51, domain:2, topic:"CloudFormation & IaC", difficulty:"easy",
  q:"A company wants to be able to consistently and repeatably recreate an entire application's infrastructure (VPC, EC2, RDS, IAM roles) in a new region within minutes, in a documented, version-controlled way.",
  options:[
    "Manually document steps in a wiki page for engineers to follow.",
    "Define the infrastructure using AWS CloudFormation (or another Infrastructure-as-Code tool), and deploy/redeploy the template as a stack.",
    "Take an AMI of just the EC2 instance.",
    "Use CloudTrail to log what was previously created."
  ], correct:1,
  explain:"CloudFormation lets you define infrastructure as version-controlled, declarative templates (YAML/JSON) that can be deployed repeatedly and consistently to create/update/delete a full 'stack' of resources — exactly matching the repeatable, documented, fast-recreation requirement. An AMI only captures a single EC2 instance's disk state, not the full multi-service architecture, and manual wiki docs are error-prone and slow.",
  crash:"Crash course — Infrastructure as Code (IaC): CloudFormation templates describe desired resources declaratively; AWS handles dependency ordering and rollback if creation fails partway through. This supports disaster recovery (redeploy a whole environment in a new region quickly), consistent multi-environment deployments (dev/staging/prod from the same template), and eliminates configuration drift from manual console changes. This is a foundational resilience AND operational-excellence concept tested across the exam." },

{ id:52, domain:2, topic:"ElastiCache Session State", difficulty:"medium",
  q:"A web application's EC2 instances behind a load balancer currently store user session data locally on each instance, causing users to be logged out when their request is routed to a different instance or when an instance is replaced.",
  options:[
    "Enable sticky sessions on the load balancer and consider this sufficient long-term.",
    "Externalize session state to a shared store like Amazon ElastiCache (Redis) or DynamoDB, making application instances stateless.",
    "Increase the number of instances so fewer users are affected.",
    "Store session data on the instance's instance store volume for faster access."
  ], correct:1,
  explain:"Making application servers stateless by externalizing session data to a shared, fast store (ElastiCache/Redis or DynamoDB) means any instance can serve any user's request and instances can be freely replaced/scaled without losing sessions. Sticky sessions can help short-term, but they don't solve the resilience problem (a user is still logged out if 'their' instance fails) and can cause uneven load distribution.",
  crash:"Crash course — stateless architecture: A core Well-Architected/resilience principle: application/compute layers should be disposable and interchangeable. Anything that must persist (sessions, uploaded files, application state) belongs in a shared, durable store (ElastiCache, DynamoDB, RDS, S3, EFS) — not on local/instance-store disk or 'pinned' via sticky sessions. This enables safe Auto Scaling, easy instance replacement, and better fault tolerance." },

{ id:53, domain:2, topic:"Health Checks & Route 53", difficulty:"medium",
  q:"A company wants Route 53 to automatically stop directing traffic to an application endpoint if it becomes unresponsive, and resume once it recovers, WITHOUT needing a load balancer in front of that endpoint.",
  options:[
    "This requires an Application Load Balancer; Route 53 cannot health check without one.",
    "Configure a Route 53 health check directly against the endpoint (HTTP/HTTPS/TCP) and associate it with the DNS record.",
    "Manually monitor and update DNS records by hand.",
    "Use VPC Flow Logs to detect endpoint failures."
  ], correct:1,
  explain:"Route 53 health checks can directly monitor an endpoint (by IP or domain, via HTTP/HTTPS/TCP, or based on CloudWatch alarms) independent of any load balancer, and automatically mark the associated DNS record unhealthy, removing it from responses (or triggering failover routing) until it recovers.",
  crash:"Crash course — Route 53 Health Checks: Can check an endpoint directly, check the status of other health checks (calculated health checks), or check a CloudWatch alarm's state. They're what powers Failover, Multivalue, and Weighted routing's ability to avoid unhealthy resources. This is DNS-level health awareness, independent of and complementary to (not dependent on) a load balancer's own health checking of its targets." },

{ id:54, domain:2, topic:"Warm Standby DR", difficulty:"hard",
  q:"A company runs its primary environment in us-east-1. For DR, they maintain a SCALED-DOWN but fully functional copy of the entire stack running continuously in us-west-2, which they scale up to full capacity and redirect traffic to only when us-east-1 fails.",
  options:[
    "This describes the Pilot Light strategy.",
    "This describes the Warm Standby strategy.",
    "This describes Backup and Restore.",
    "This describes Multi-Site Active-Active."
  ], correct:1,
  explain:"Warm Standby means a fully functional, scaled-down version of the complete environment is already running (all tiers active, just smaller capacity) and gets scaled up on failover — faster RTO than Pilot Light (which keeps only core/critical components like a database running, and needs to actually provision the rest of the stack at failover time).",
  crash:"Crash course — telling Pilot Light and Warm Standby apart (a frequent exam confusion point): Pilot Light = only the most critical core (e.g., a replicated database) is always on; everything else (app servers, etc.) must be provisioned/started from AMIs/templates at DR time. Warm Standby = the ENTIRE stack is already running end-to-end, just at reduced/minimal capacity, and you just scale it UP (no provisioning-from-scratch needed) at DR time — hence faster RTO than pilot light, but higher standing cost." },

{ id:55, domain:2, topic:"EventBridge", difficulty:"medium",
  q:"A company wants to build an event-driven architecture where different microservices react to events (like 'OrderPlaced' or 'PaymentFailed') from many different AWS services and SaaS sources, with rule-based routing to different targets.",
  options:[
    "Amazon EventBridge, using event buses and rules to route events from various sources to targets like Lambda, SQS, or Step Functions.",
    "A single Lambda function polling every source every second.",
    "Amazon S3 event notifications only.",
    "AWS CloudTrail."
  ], correct:0,
  explain:"EventBridge is the purpose-built AWS event bus service for building event-driven architectures, supporting many AWS service sources, custom application events, and SaaS partner sources, with content-based rule matching to route events to multiple targets. S3 event notifications only cover S3 bucket events (a narrower use case), and polling in a Lambda function is inefficient and not event-driven.",
  crash:"Crash course — EventBridge vs SNS vs SQS: EventBridge is best for complex EVENT ROUTING based on content/pattern matching from many different sources (including 100+ AWS services and SaaS apps), with schema registry support. SNS is best for simple pub/sub FAN-OUT of a single message type to multiple subscribers. SQS is a point-to-point durable BUFFER/QUEUE between producer and consumer(s). For 'many event types, many sources, rule-based routing' scenarios, EventBridge is usually the intended answer." },

{ id:56, domain:2, topic:"S3 Versioning", difficulty:"easy",
  q:"A company wants to protect against accidental overwrites or deletions of objects in an important S3 bucket, allowing recovery of previous versions of any object.",
  options:[
    "Enable S3 Versioning on the bucket.",
    "Enable S3 Transfer Acceleration.",
    "Enable S3 Requester Pays.",
    "Increase the bucket's storage class to S3 Standard."
  ], correct:0,
  explain:"S3 Versioning keeps every version of an object when it's overwritten or 'deleted' (a delete just adds a delete marker, and the old version remains recoverable) — directly solving accidental overwrite/deletion protection. The other options relate to transfer speed, billing, and storage cost/performance tier, not data protection.",
  crash:"Crash course — S3 Versioning: Once enabled, it cannot be fully disabled, only suspended. Combine with MFA Delete to require MFA authentication for permanently deleting a version or changing versioning state (extra protection against malicious/accidental permanent deletion). Also a prerequisite for Cross-Region/Same-Region Replication. Lifecycle policies can be used to expire old noncurrent versions automatically to control storage cost." },

// ============================= DOMAIN 3: HIGH-PERFORMING ARCHITECTURES (24) =============================
{ id:57, domain:3, topic:"CloudFront Caching", difficulty:"easy",
  q:"A media company serves video and image content globally and wants to reduce latency for users worldwide while offloading repeated requests from the origin server.",
  options:[
    "Deploy origin servers manually in every AWS region.",
    "Use Amazon CloudFront to cache content at edge locations close to users worldwide.",
    "Increase the origin EC2 instance size.",
    "Use a single NAT Gateway to route all global traffic."
  ], correct:1,
  explain:"CloudFront is AWS's CDN, caching content at edge locations around the world so users get low-latency responses from a nearby edge instead of the distant origin, while also reducing load on the origin for cache hits. Manually deploying origins everywhere is far more complex/costly, and a NAT Gateway has nothing to do with content delivery.",
  crash:"Crash course — CloudFront: Works with many origin types (S3, ALB, EC2, on-prem/custom HTTP origins, MediaStore/MediaPackage for video). Key performance levers: cache behaviors/TTLs per path pattern, Origin Shield (an extra caching layer to further reduce origin load), and compression. It also provides security benefits (integrates with WAF and Shield, supports HTTPS/TLS termination at the edge) — so it appears in both performance AND security exam questions." },

{ id:58, domain:3, topic:"ElastiCache Redis vs Memcached", difficulty:"medium",
  q:"An application needs an in-memory cache that supports complex data structures (sorted sets, lists), Multi-AZ replication with automatic failover, and persistence for durability.",
  options:[
    "Amazon ElastiCache for Memcached",
    "Amazon ElastiCache for Redis",
    "Amazon RDS in-memory option",
    "Amazon S3 with Transfer Acceleration"
  ], correct:1,
  explain:"Redis supports rich data structures (sorted sets, lists, hashes, streams), Multi-AZ with automatic failover, replication, and optional persistence (snapshots/AOF) — none of which Memcached offers (Memcached is simpler: multi-threaded, no persistence, no replication, no complex data types, and data is purely ephemeral).",
  crash:"Crash course — Redis vs Memcached: Choose Memcached for the simplest possible use case — pure, multi-threaded, horizontally scalable key-value caching with no need for persistence, replication, or advanced data structures. Choose Redis for almost everything else: persistence, replication/HA (Multi-AZ with auto-failover), pub/sub messaging, complex data types, and Redis Cluster for sharding. On the exam, 'needs replication/failover/persistence/complex data structures' → Redis; 'simplest possible cache, multi-threaded' → Memcached." },

{ id:59, domain:3, topic:"DynamoDB DAX", difficulty:"medium",
  q:"A DynamoDB-backed application has a read-heavy workload and needs microsecond response times for repeated reads of the same items, without changing the application's DynamoDB API calls.",
  options:[
    "Amazon DynamoDB Accelerator (DAX), an in-memory cache that sits in front of DynamoDB and is API-compatible with the DynamoDB SDK.",
    "Amazon ElastiCache for Memcached, requiring a full application rewrite.",
    "Increase DynamoDB's provisioned read capacity units drastically.",
    "Enable DynamoDB Streams."
  ], correct:0,
  explain:"DAX is a purpose-built, DynamoDB-API-compatible in-memory cache that requires minimal code changes (just point the DAX client at the cluster) and reduces response times from milliseconds to microseconds for cached reads. Increasing RCUs improves throughput/cost handling but doesn't achieve microsecond caching, and using generic ElastiCache would require significant application logic changes to manage cache population/invalidation manually.",
  crash:"Crash course — DAX: A write-through cache specific to DynamoDB, sitting between your app and the table, caching both individual item ('GetItem') and query/scan results with configurable TTL. Because it's API-compatible with the DynamoDB SDK, integration is minimal-code. Use DAX specifically when the question emphasizes 'microsecond latency' + 'DynamoDB' + 'minimal application changes' — for general-purpose caching in front of other databases, ElastiCache is the answer instead." },

{ id:60, domain:3, topic:"EC2 Placement Groups", difficulty:"hard",
  q:"A high-performance computing (HPC) workload requires the lowest possible network latency and highest throughput between a tightly-coupled cluster of EC2 instances performing distributed calculations.",
  options:[
    "Spread placement group",
    "Cluster placement group",
    "Partition placement group",
    "No placement group; use default instance placement."
  ], correct:1,
  explain:"A cluster placement group packs instances close together within a single Availability Zone on the same low-latency, high-throughput network fabric — ideal for tightly-coupled HPC/MPI-style workloads that need the fastest possible inter-instance networking. Spread placement groups instead maximize separation (each instance on distinct underlying hardware) to minimize correlated failure, which is the opposite goal.",
  crash:"Crash course — Placement Groups: Cluster = low-latency/high-throughput, single AZ, best for HPC/tightly-coupled apps (trade-off: higher correlated failure risk since instances share hardware locality). Spread = each instance on distinct hardware racks, up to 7 instances per AZ, minimizes simultaneous failure — good for small numbers of critical individual instances. Partition = groups of instances spread across logical partitions (each with its own rack/power/network), used by distributed systems like HDFS/Cassandra/Kafka that handle their own replication across partitions." },

{ id:61, domain:3, topic:"S3 Performance", difficulty:"medium",
  q:"An application uploads very large files (several GB each) to S3 from an on-premises data center located far from the target AWS region, and uploads are slow.",
  options:[
    "Enable S3 Transfer Acceleration, which routes uploads through CloudFront edge locations over optimized AWS backbone network paths.",
    "Reduce the file size before uploading.",
    "Switch the bucket's storage class to Glacier.",
    "Disable multipart upload."
  ], correct:0,
  explain:"S3 Transfer Acceleration uses CloudFront's global edge network as an entry point, routing uploads over AWS's optimized backbone rather than the public internet for the majority of the trip — significantly speeding up long-distance transfers. Changing storage class doesn't affect upload speed, and disabling multipart upload (which should actually be used FOR large files) would hurt, not help, performance.",
  crash:"Crash course — S3 upload performance levers: Multipart Upload (split large objects into parts uploaded in parallel — recommended for objects >100MB, required above 5GB) improves throughput and resilience to network interruption. Transfer Acceleration specifically helps when the client is geographically far from the bucket's region. For high request-rate workloads, S3 automatically scales performance across a bucket (older 'random hex prefix' advice is largely obsolete for request rate, though even distribution still helps at extreme scale)." },

{ id:62, domain:3, topic:"Lambda Concurrency", difficulty:"hard",
  q:"A Lambda function experiences noticeable cold-start latency spikes when invoked, which is unacceptable for a latency-sensitive customer-facing API. What can be configured to keep functions initialized and ready to respond instantly?",
  options:[
    "Increase the Lambda function's timeout setting.",
    "Configure Provisioned Concurrency, which keeps a specified number of execution environments pre-initialized and ready to respond.",
    "Reduce the memory allocated to the function.",
    "Switch the function's trigger from API Gateway to S3 events."
  ], correct:1,
  explain:"Provisioned Concurrency pre-initializes a set number of execution environments so they're 'warm' and ready to serve requests immediately, eliminating cold-start latency for that pool of concurrency. Increasing timeout only affects how long a function is ALLOWED to run, not startup latency, and reducing memory actually tends to increase execution time.",
  crash:"Crash course — Lambda cold starts: A 'cold start' happens when Lambda must initialize a new execution environment (download code, start the runtime, run init code) before handling a request — noticeable especially for languages with heavier runtime startup (Java, .NET) or functions with large dependencies. Provisioned Concurrency solves this by keeping N environments always warm (costs more, billed even when idle). Reserved Concurrency is a DIFFERENT feature — it caps/reserves a MAXIMUM number of concurrent executions for a function (used for throttling/isolation, not warming) — don't confuse the two on the exam." },

{ id:63, domain:3, topic:"Global Accelerator", difficulty:"medium",
  q:"A gaming company wants to improve the performance and availability of a UDP-based application deployed behind Network Load Balancers in two regions, using static IP addresses that don't need to change during regional failover.",
  options:[
    "Amazon CloudFront (HTTP/HTTPS caching only).",
    "AWS Global Accelerator, which provides static anycast IPs and routes traffic over the AWS global network to the optimal healthy regional endpoint.",
    "Route 53 Weighted routing only.",
    "A single regional ALB."
  ], correct:1,
  explain:"Global Accelerator provides 2 static anycast IP addresses that never change, and intelligently routes TCP/UDP traffic over AWS's private backbone network to the closest healthy endpoint across regions, with fast failover — and unlike CloudFront, it supports non-HTTP protocols like UDP, making it fit for a gaming/UDP workload. CloudFront is HTTP(S)-focused and caching-oriented, not suited to arbitrary TCP/UDP traffic.",
  crash:"Crash course — Global Accelerator vs CloudFront: Both use AWS edge locations and the AWS global network backbone, but CloudFront is a caching CDN for HTTP(S) content (static/dynamic web content, video), while Global Accelerator is a network-layer (TCP/UDP) traffic director offering static IPs, fast regional failover, and improved performance for non-cacheable or non-HTTP traffic (gaming, VoIP, IoT). Exam trigger: 'static IP addresses' + 'TCP/UDP' + 'multi-region failover' → Global Accelerator." },

{ id:64, domain:3, topic:"RDS Read Scaling", difficulty:"medium",
  q:"A reporting dashboard runs heavy read-only analytical queries against a production RDS database, and these queries are slowing down the primary database used for the live application.",
  options:[
    "Increase the primary instance's storage size.",
    "Create one or more RDS Read Replicas and point the reporting dashboard's queries at a replica instead of the primary.",
    "Enable Multi-AZ, and query the standby directly.",
    "Delete unused indexes on the primary database."
  ], correct:1,
  explain:"Read Replicas offload read traffic from the primary onto asynchronously replicated copies, ideal for isolating heavy reporting/analytics query load from the transactional workload on the primary. Multi-AZ's standby is not accessible for read queries (it's failover-only, not read-scaling), and increasing storage size doesn't address read query contention.",
  crash:"Crash course: This is the classic 'reporting/analytics queries slowing down production' exam scenario — the answer is almost always Read Replicas (for read scaling) as opposed to Multi-AZ (which is for HA/failover and its standby cannot serve read traffic in classic RDS engines — note Aurora's replicas, by contrast, ARE readable and also participate in HA)." },

{ id:65, domain:3, topic:"Containers: ECS vs EKS vs Fargate", difficulty:"medium",
  q:"A company wants to run containerized workloads without managing any underlying EC2 servers or a container orchestration control plane themselves, while still using standard Docker container images.",
  options:[
    "Amazon ECS or EKS with EC2 launch type, managing your own EC2 fleet.",
    "AWS Fargate (as the launch/compute type for ECS or EKS), a serverless compute engine for containers.",
    "Run Docker directly on a single EC2 instance.",
    "AWS Lambda with a custom runtime only."
  ], correct:1,
  explain:"Fargate is a serverless compute engine for containers — you define the container image/task, and AWS manages all the underlying server infrastructure automatically (no EC2 instances or clusters to patch/manage), usable with either ECS or EKS as the orchestrator. The EC2 launch type still requires you to provision/manage/patch the underlying EC2 instances yourself.",
  crash:"Crash course — ECS vs EKS, Fargate vs EC2: ECS vs EKS = the ORCHESTRATOR choice (ECS is AWS-proprietary and simpler; EKS is managed Kubernetes, use it if you need Kubernetes-specific APIs/portability). Fargate vs EC2 = the LAUNCH TYPE / compute choice (Fargate = no server management, pay per task resource; EC2 = you manage the underlying instances, can be cheaper at high sustained scale and allows more control, e.g., GPU instances, custom AMIs). These are two independent choices that get combined (e.g., 'ECS on Fargate' or 'EKS on EC2')." },

{ id:66, domain:3, topic:"API Gateway Caching", difficulty:"medium",
  q:"A REST API built on API Gateway + Lambda experiences high load with many identical GET requests for the same, rarely-changing data, causing unnecessary Lambda invocations and cost.",
  options:[
    "Enable API Gateway response caching for the relevant methods/stage, serving cached responses without invoking the backend Lambda.",
    "Increase the Lambda function's reserved concurrency.",
    "Switch to a WebSocket API.",
    "Enable AWS X-Ray tracing."
  ], correct:0,
  explain:"API Gateway has a built-in caching feature (TTL-configurable, per method/stage) that serves repeated identical requests directly from the cache without invoking the backend Lambda at all — directly reducing invocation count/cost for repeated reads of rarely-changing data. Increasing concurrency addresses scaling of invocations, not reducing unnecessary ones, and X-Ray is for tracing/debugging, not performance caching.",
  crash:"Crash course — API Gateway caching: Cache is provisioned per stage (with a cache capacity you choose, affecting cost), keyed by request parameters, with a configurable TTL (default 300s, max 3600s). You can also encrypt the cache and require specific cache-invalidation permissions. This is the go-to answer whenever a REST-API-behind-API-Gateway scenario has repeated identical reads causing excess backend load/cost." },

{ id:67, domain:3, topic:"Instance Types", difficulty:"easy",
  q:"A company runs an in-memory database workload that requires a very high ratio of RAM to vCPU. Which EC2 instance family is BEST suited?",
  options:[
    "C-family (Compute optimized)",
    "R-family (Memory optimized)",
    "T-family (Burstable, general purpose)",
    "D-family (Dense storage)"
  ], correct:1,
  explain:"R-family instances are memory-optimized, offering a high RAM-to-vCPU ratio, ideal for in-memory databases, caches, and real-time big-data analytics. C-family is optimized for compute-intensive workloads (high CPU:RAM ratio), T-family is low-cost burstable general purpose, and D-family focuses on dense HDD storage.",
  crash:"Crash course — EC2 instance family cheat sheet: C = Compute optimized (batch processing, gaming servers, HPC). M = general purpose, balanced (most common default). R/X = Memory optimized (in-memory DBs, caches like Redis, SAP HANA). I = Storage optimized, high I/O (NoSQL DBs, data warehousing). G/P = GPU-accelerated (ML training/inference, graphics). T = burstable, low-cost, good for variable/low average CPU usage (dev/test, small web apps). Recognizing the letter-to-workload mapping is tested repeatedly." },

{ id:68, domain:3, topic:"FSx", difficulty:"medium",
  q:"A company is migrating a Windows-based application that requires a native Windows file system with support for the SMB protocol and Active Directory integration for file-level permissions.",
  options:[
    "Amazon EFS",
    "Amazon FSx for Windows File Server",
    "Amazon S3",
    "Amazon EBS"
  ], correct:1,
  explain:"FSx for Windows File Server provides a fully managed native Windows file system (SMB protocol, NTFS permissions, Active Directory integration) — exactly what a Windows-based application expects. EFS is Linux-focused (NFS protocol), S3 is object storage (not a POSIX/SMB file system), and EBS is block storage attached to a single instance, not a shared network file system.",
  crash:"Crash course — FSx family: FSx for Windows File Server (SMB, AD integration, for Windows workloads). FSx for Lustre (high-performance parallel file system for HPC/ML workloads needing very high throughput, can integrate directly with S3 as a data repository). FSx for NetApp ONTAP and FSx for OpenZFS (for migrating existing NetApp/ZFS-based workloads with feature parity). Exam trigger: 'Windows', 'SMB', 'Active Directory file permissions' → FSx for Windows File Server." },

{ id:69, domain:3, topic:"Monitoring", difficulty:"easy",
  q:"A team wants to visualize custom application-level metrics (e.g., 'orders processed per minute') alongside standard EC2 metrics, and set up automated alarms when thresholds are breached.",
  options:[
    "Amazon CloudWatch, using custom metrics (via the CloudWatch agent/API) plus CloudWatch Alarms.",
    "AWS CloudTrail.",
    "AWS Config.",
    "Amazon Inspector."
  ], correct:0,
  explain:"CloudWatch collects both standard AWS service metrics and custom application-published metrics, supports dashboards to visualize them together, and CloudWatch Alarms trigger notifications/actions on threshold breaches. CloudTrail logs API activity (not metrics/dashboards), Config tracks resource configuration compliance, and Inspector scans for vulnerabilities.",
  crash:"Crash course — CloudWatch components: Metrics (time-series data, standard + custom via PutMetricData or the CloudWatch agent), Alarms (trigger SNS notifications, Auto Scaling actions, or other automation on threshold breach), Logs (centralized log storage/analysis, with Logs Insights for querying), Dashboards (visualizations), and Events/EventBridge (now a separate but related service for event-driven automation). For 'custom app metrics' specifically, remember you need the CloudWatch agent (for OS/custom metrics from EC2) or direct API calls from the app — basic EC2 host metrics alone don't include app-level custom metrics." },

{ id:70, domain:3, topic:"X-Ray", difficulty:"medium",
  q:"A microservices application spanning API Gateway, Lambda, and DynamoDB experiences intermittent latency, and the team needs to trace a request end-to-end to pinpoint which service call is the bottleneck.",
  options:[
    "AWS X-Ray, which provides distributed tracing across services to visualize request flow and latency at each hop.",
    "Amazon CloudWatch Logs alone, reading through raw logs from each service.",
    "AWS Trusted Advisor.",
    "VPC Flow Logs."
  ], correct:0,
  explain:"X-Ray is purpose-built for distributed tracing — it follows a single request across multiple services (API Gateway → Lambda → DynamoDB, etc.) and produces a service map with per-segment latency, making it easy to pinpoint exactly where time is being spent. Manually correlating raw logs across services is slow and error-prone by comparison, and Trusted Advisor/Flow Logs don't provide request-level tracing.",
  crash:"Crash course — X-Ray: Requires minimal instrumentation (the X-Ray SDK, or automatic integration for many AWS services like Lambda/API Gateway with 'Active Tracing' enabled) and produces trace 'segments'/'subsegments' with timing, annotated with metadata, viewable as a service map showing average latency and error rates per node. This is the standard answer for any 'trace/debug latency across a distributed/microservices/serverless application' scenario." },

{ id:71, domain:3, topic:"S3 Storage Class Performance", difficulty:"medium",
  q:"An application needs millisecond first-byte latency for infrequently accessed archival data that still must be retrievable instantly when needed (not after a restore delay).",
  options:[
    "S3 Glacier Flexible Retrieval (formerly S3 Glacier), with retrieval times of minutes to hours.",
    "S3 Glacier Deep Archive, with retrieval times of up to 12+ hours.",
    "S3 Glacier Instant Retrieval, offering millisecond access like S3 Standard-IA but at lower cost for rarely accessed data.",
    "S3 One Zone-IA, which has the same retrieval delay as Glacier."
  ], correct:2,
  explain:"S3 Glacier Instant Retrieval is specifically designed for archive data that's rarely accessed but needs millisecond retrieval (unlike Flexible Retrieval or Deep Archive, which have minutes-to-hours retrieval delays) — it costs more per-GB than the other Glacier tiers but far less than Standard-IA for this access pattern. The other two Glacier tiers explicitly trade off instant access for lower storage cost via delayed retrieval.",
  crash:"Crash course — S3 storage class retrieval speed cheat sheet: Standard / Standard-IA / One Zone-IA / Intelligent-Tiering = milliseconds (all immediately accessible, differ mainly in resiliency/AZ count and cost based on access frequency). Glacier Instant Retrieval = milliseconds, but priced for archival infrequent access. Glacier Flexible Retrieval = minutes (expedited) to hours (standard/bulk). Glacier Deep Archive = 12-48 hours, the cheapest, for long-term compliance archives rarely if ever accessed." },

{ id:72, domain:3, topic:"VPC Peering vs PrivateLink", difficulty:"hard",
  q:"A SaaS provider wants to expose a specific service running in their VPC to many customer VPCs (in different AWS accounts), WITHOUT allowing full network-level access between the VPCs (i.e., only the specific service endpoint should be reachable, no overlapping CIDR concerns, and no route table changes required by the customer).",
  options:[
    "VPC Peering with each customer's VPC.",
    "AWS PrivateLink (VPC Interface Endpoint backed by a Network Load Balancer), exposing just the specific service privately.",
    "Public internet access with IP allow-listing.",
    "Transit Gateway connecting all customer VPCs together."
  ], correct:1,
  explain:"PrivateLink exposes a specific application/service as an interface endpoint (ENI) in the consumer's VPC, backed by an NLB in the provider's VPC — it provides granular, one-service-only private connectivity without exposing the whole network, doesn't require non-overlapping CIDRs (unlike peering), and needs no route table changes on the consumer side. VPC Peering (or Transit Gateway) grants broader network-level reachability and requires non-overlapping IP ranges plus route table updates — overkill and less secure for 'just expose one service' scenarios.",
  crash:"Crash course — PrivateLink vs Peering: Peering/Transit Gateway = connect whole NETWORKS together (need non-overlapping CIDRs, route table entries, broader reachability — good for internal multi-VPC architectures you control). PrivateLink = expose a single SERVICE privately to other VPCs/accounts (no CIDR overlap concerns since it's just an ENI/endpoint, minimal route changes, tightly scoped access) — the standard pattern for SaaS vendors or shared internal services consumed by many, unrelated VPCs. Exam trigger: 'expose only a specific service, not the whole network, to many other VPCs/accounts' → PrivateLink." },

{ id:73, domain:3, topic:"Aurora Serverless", difficulty:"medium",
  q:"A development/test database has very unpredictable, intermittent usage (sometimes idle for hours), and the company wants to avoid paying for a continuously running database instance.",
  options:[
    "A large, continuously running provisioned RDS instance sized for peak load.",
    "Amazon Aurora Serverless, which automatically scales capacity up/down (or to zero, with v2 scaling to near-zero) based on actual demand.",
    "A Multi-AZ RDS deployment.",
    "DynamoDB Accelerator (DAX)."
  ], correct:1,
  explain:"Aurora Serverless automatically adjusts database capacity based on load, and can scale down significantly (v1 could pause entirely to zero capacity; v2 scales down to a very low ACU baseline) during idle periods — ideal for unpredictable/intermittent workloads like dev/test, avoiding the cost of an always-on, peak-sized instance. A large continuously-running instance is the exact opposite of cost-efficient here.",
  crash:"Crash course — Aurora Serverless: Billed by Aurora Capacity Units (ACUs) consumed, auto-scaling compute/memory based on actual load in near real time. Great fit for variable/unpredictable/intermittent workloads (dev/test, infrequently used apps, new applications with unknown load patterns) where a fixed provisioned instance would mean either overpaying for idle capacity or being under-provisioned during spikes." },

{ id:74, domain:3, topic:"SQS Throughput / Batching", difficulty:"medium",
  q:"A high-throughput application needs to send and receive very large volumes of small messages via SQS as efficiently and cost-effectively as possible.",
  options:[
    "Send and receive one message at a time via individual API calls.",
    "Use SQS batch operations (SendMessageBatch/ReceiveMessage with multiple messages, DeleteMessageBatch) to reduce the number of API calls.",
    "Switch to a FIFO queue for higher raw throughput than Standard.",
    "Use S3 instead of SQS entirely."
  ], correct:1,
  explain:"Batching API calls (sending/deleting up to 10 messages per API call) significantly reduces the number of requests needed (and thus cost and overhead) compared to one-at-a-time calls, which is the standard SQS performance optimization technique. FIFO queues actually have LOWER default throughput than Standard queues (though high-throughput mode narrows the gap) — the opposite of a throughput upgrade in this context.",
  crash:"Crash course — SQS performance: Standard queues offer nearly unlimited throughput; FIFO queues are throughput-capped (300 msg/sec by default, or up to 3,000/sec with batching, or much higher using high-throughput mode with more message group IDs) in exchange for ordering + exactly-once guarantees. For raw throughput without ordering needs, Standard is naturally faster. Regardless of queue type, batching API calls (up to 10 messages per batch request) is a core cost/performance best practice worth remembering." },

{ id:75, domain:3, topic:"EBS Volume Types", difficulty:"medium",
  q:"A transactional database workload requires consistent, high IOPS (e.g., 20,000+ IOPS) with low latency, sustained over time.",
  options:[
    "gp2 (General Purpose SSD)",
    "st1 (Throughput Optimized HDD)",
    "io2 / io2 Block Express (Provisioned IOPS SSD)",
    "sc1 (Cold HDD)"
  ], correct:2,
  explain:"io2 (and io2 Block Express) is designed for the highest, most consistent IOPS/latency requirements — supporting up to 256,000 provisioned IOPS per volume with Block Express, independent of volume size, with very high durability. gp2/gp3 can serve moderate IOPS but cap lower and tie IOPS more directly to volume size (gp2) or a smaller provisioned max (gp3 relative to io2), while st1/sc1 are HDD-based, throughput-oriented (not IOPS-oriented) and unsuitable for transactional low-latency workloads.",
  crash:"Crash course — EBS volume type cheat sheet: gp3 (general purpose SSD, baseline 3,000 IOPS/125 MB/s independent of size, provision more as needed — the new default, cheaper than gp2 for the same performance). gp2 (older general purpose, IOPS tied to volume size via a burst-credit model). io1/io2 (Provisioned IOPS SSD, for mission-critical low-latency/high-IOPS databases; io2 Block Express pushes IOPS/throughput even higher). st1 (Throughput Optimized HDD, big sequential workloads like big data/log processing, cannot be a boot volume). sc1 (Cold HDD, cheapest, infrequently accessed large sequential data, cannot be a boot volume)." },

{ id:76, domain:3, topic:"Enhanced Networking", difficulty:"hard",
  q:"An application on EC2 needs the highest possible network throughput and the lowest latency/jitter for inter-instance communication in an HPC use case.",
  options:[
    "Standard networking with a T-family instance.",
    "Use a current-generation instance type supporting Elastic Fabric Adapter (EFA) for OS-bypass, low-latency, high-bandwidth inter-node communication.",
    "Increase the EBS volume's provisioned IOPS.",
    "Use S3 Transfer Acceleration between instances."
  ], correct:1,
  explain:"EFA is a network interface for EC2 instances designed for HPC and tightly-coupled distributed computing, providing OS-bypass capabilities (using libfabric) that dramatically reduce inter-instance communication latency and jitter compared to traditional TCP/IP networking — the correct tool for this specific HPC networking requirement. EBS IOPS affects storage performance, not network performance, and S3 Transfer Acceleration is for internet-based uploads to S3, unrelated to EC2-to-EC2 communication.",
  crash:"Crash course: EFA is commonly paired with a Cluster Placement Group (physical proximity) for HPC/ML distributed training workloads (e.g., using MPI). It's a specialized, advanced exam topic — the key recognition pattern is 'HPC', 'tightly-coupled', 'low-latency inter-node communication', 'OS-bypass' → EFA. This differs from standard/'enhanced networking' (SR-IOV, used broadly for better baseline network performance on most current instance types), which is a much more commonly applicable, simpler concept." },

{ id:77, domain:3, topic:"Database Choice", difficulty:"medium",
  q:"An application needs a fully managed data warehouse to run complex analytical (OLAP) queries across petabytes of structured data, with columnar storage for fast aggregation queries.",
  options:[
    "Amazon RDS for PostgreSQL",
    "Amazon Redshift",
    "Amazon DynamoDB",
    "Amazon ElastiCache"
  ], correct:1,
  explain:"Redshift is AWS's petabyte-scale, columnar-storage data warehouse purpose-built for complex analytical (OLAP) queries and aggregations across massive datasets, with MPP (massively parallel processing) architecture. RDS is designed for OLTP (transactional) workloads, DynamoDB is a NoSQL key-value/document store (not optimized for complex multi-table analytical joins/aggregations at this scale), and ElastiCache is an in-memory cache, not a data warehouse.",
  crash:"Crash course — choosing the right database (OLTP vs OLAP vs NoSQL vs cache): RDS/Aurora = OLTP, relational, transactional, ACID (order systems, typical web app backends). Redshift = OLAP, data warehousing, columnar storage, BI/analytics/reporting at scale. DynamoDB = NoSQL, key-value/document, massive scale, single-digit millisecond latency, flexible schema (session stores, gaming leaderboards, IoT). ElastiCache = in-memory cache layer in front of another data store, not a source of truth. Matching the workload TYPE (transactional vs analytical vs key-value vs cache) to the right service is one of the most heavily tested skills on the SAA exam." },

{ id:78, domain:3, topic:"Auto Scaling Policies", difficulty:"medium",
  q:"A company wants its Auto Scaling Group to maintain average CPU utilization at approximately 50% across the fleet, automatically adding or removing instances as needed to hit that target.",
  options:[
    "Scheduled scaling",
    "Simple/step scaling based on a CloudWatch alarm threshold.",
    "Target tracking scaling policy set to 50% average CPU utilization.",
    "Manual scaling only."
  ], correct:2,
  explain:"Target tracking scaling is designed exactly for this — you specify a target value for a metric (like 50% average CPU utilization) and AWS automatically creates and manages the necessary CloudWatch alarms and adjusts capacity to maintain that target, similar to a thermostat. Step/simple scaling requires you to manually define alarm thresholds and scaling adjustments (more manual, less 'maintain this target' oriented), and scheduled scaling is for predictable, time-based capacity changes, not dynamic target maintenance.",
  crash:"Crash course — ASG scaling policy types: Target Tracking (simplest, 'maintain metric at X value', AWS manages the alarms) — usually the best default answer for 'maintain around X%'. Step Scaling (define multiple alarm thresholds with different scaling magnitude responses, more control for complex scaling curves). Simple Scaling (older, one alarm → one scaling action, with a cooldown period). Scheduled Scaling (set capacity changes at specific times/dates — good for predictable daily/weekly patterns). Predictive Scaling (uses ML to forecast traffic and scale ahead of time)." },

{ id:79, domain:3, topic:"Serverless Architecture", difficulty:"easy",
  q:"A company wants to build a REST API backend that automatically scales with request volume (including down to zero when idle) and requires NO server management at all.",
  options:[
    "EC2 instances in an Auto Scaling Group with minimum size of 1.",
    "Amazon API Gateway + AWS Lambda, a fully serverless combination that scales automatically and has no idle cost when not in use.",
    "A single large EC2 instance.",
    "Amazon EKS with self-managed worker nodes."
  ], correct:1,
  explain:"API Gateway (managing the REST API, throttling, auth) combined with Lambda (executing business logic on-demand, billed per invocation/duration, scaling automatically including to zero when idle) is the canonical fully-serverless backend pattern with zero idle cost and no servers to manage. EC2-based or EKS-with-self-managed-nodes options all involve managing/paying for always-on infrastructure.",
  crash:"Crash course — serverless building blocks: API Gateway (managed API front door: REST/HTTP/WebSocket APIs, auth via Cognito/IAM/Lambda authorizers, throttling, caching), Lambda (event-driven compute, pay-per-use, scales automatically), DynamoDB (serverless NoSQL database, on-demand capacity mode scales with load), S3 (serverless object storage). Recognize 'no server management' + 'scales to zero' + 'pay only for what you use' as strong signals pointing to a serverless (API Gateway + Lambda + DynamoDB/S3) architecture on the exam." },

{ id:80, domain:3, topic:"CloudFront Origin Failover", difficulty:"hard",
  q:"A company wants a CloudFront distribution to automatically serve content from a secondary (backup) S3 origin if the primary origin becomes unavailable or returns errors.",
  options:[
    "This isn't possible with CloudFront; you'd need Route 53 failover instead.",
    "Configure a CloudFront Origin Group with a primary and secondary origin, and failover criteria (e.g., specific HTTP status codes).",
    "Enable S3 Cross-Region Replication only, with no CloudFront changes needed.",
    "Create two completely separate CloudFront distributions and hope users pick the right one."
  ], correct:1,
  explain:"CloudFront natively supports Origin Groups: you define a primary and secondary origin plus a list of status codes (e.g., 500, 502, 503, 504) that trigger automatic failover to the secondary origin within the same distribution — directly matching this requirement. Route 53 failover works at the DNS level for entirely separate endpoints, but CloudFront's own Origin Group feature is the more direct, purpose-built answer here.",
  crash:"Crash course — CloudFront Origin Groups: A single distribution can have an origin group of exactly 2 origins (primary + secondary); CloudFront tries the primary first and automatically retries the secondary if the primary times out or returns one of the configured failover status codes. This is often combined with S3 Cross-Region Replication (to keep the secondary bucket's content in sync) for a resilient static content delivery architecture." },

// ============================= DOMAIN 4: COST-OPTIMIZED ARCHITECTURES (20) =============================
{ id:81, domain:4, topic:"S3 Storage Classes", difficulty:"easy",
  q:"A company has log files that are accessed frequently for the first 30 days, rarely accessed for the next 60 days, and almost never accessed after that but must be retained for 7 years for compliance. What is the MOST cost-effective storage strategy?",
  options:[
    "Keep everything in S3 Standard for the full 7 years.",
    "Use an S3 Lifecycle policy: Standard for 30 days → Standard-IA (or Intelligent-Tiering) for the next 60 days → Glacier Deep Archive for the remainder.",
    "Store everything in Glacier Deep Archive from day one.",
    "Delete the logs after 30 days to save cost."
  ], correct:1,
  explain:"A tiered lifecycle policy matches storage cost to actual access patterns over time — frequent access (Standard) initially, infrequent access (Standard-IA) next, and archival (Deep Archive) for long-term rarely-accessed compliance retention — minimizing cost at each phase. Keeping everything in Standard wastes money on rarely-accessed data, Deep Archive from day one would make the frequently-accessed early period painfully slow/impractical, and deleting after 30 days violates the compliance retention requirement.",
  crash:"Crash course — S3 Lifecycle Policies: Automate transitioning objects between storage classes (and eventual expiration/deletion) based on object age, without any application changes. This 'hot → warm → cold' tiering pattern (Standard → IA → Glacier tiers) is one of the most frequently tested cost-optimization patterns on the exam. S3 Intelligent-Tiering can also automate this even without knowing the access pattern in advance, by monitoring actual access and moving objects between tiers automatically (with a small monitoring fee, no retrieval fees)." },

{ id:82, domain:4, topic:"EC2 Pricing Models", difficulty:"medium",
  q:"A company runs a fault-tolerant batch processing job that can be interrupted and resumed at any time, and wants to minimize compute cost as much as possible.",
  options:[
    "On-Demand Instances",
    "Reserved Instances (1 or 3-year term)",
    "Spot Instances, which offer the deepest discounts (up to ~90% off On-Demand) but can be interrupted with a 2-minute warning.",
    "Dedicated Hosts"
  ], correct:2,
  explain:"Spot Instances offer the largest possible discount (up to ~90% off On-Demand pricing) by using AWS's spare capacity, at the cost of possible interruption with a 2-minute warning — a perfect fit for fault-tolerant, flexible, interruptible workloads like batch processing, which is exactly the described scenario. Reserved Instances save money for steady-state, predictable, always-on workloads (not the deepest possible discount for interruptible work), and Dedicated Hosts are about licensing/compliance, not cost minimization.",
  crash:"Crash course — EC2 pricing models: On-Demand (pay per second/hour, no commitment, most expensive per unit, best for unpredictable/short-term/new workloads). Reserved Instances / Savings Plans (1 or 3-year commitment for a significant discount — 40-70%+ — best for steady, predictable, always-on baseline usage). Spot Instances (biggest discount, up to ~90% off, but can be reclaimed with 2 minutes' notice — best for fault-tolerant, flexible, interruptible workloads: batch jobs, CI/CD, big data processing, stateless web tiers with a mixed-instance ASG). Dedicated Hosts/Instances (physical server dedicated to you, for licensing or compliance needs, NOT a cost-saving mechanism)." },

{ id:83, domain:4, topic:"Savings Plans vs Reserved Instances", difficulty:"hard",
  q:"A company has variable EC2 usage across multiple instance families and regions, and also uses some Fargate and Lambda, but wants a discount commitment more FLEXIBLE than traditional Reserved Instances (which lock in a specific instance family/region).",
  options:[
    "Standard Reserved Instances only.",
    "Compute Savings Plans, which apply automatically across any instance family, region, OS, tenancy, AND across EC2/Fargate/Lambda, in exchange for a $/hour commitment.",
    "Convertible Reserved Instances tied to one region.",
    "Spot Instances exclusively."
  ], correct:1,
  explain:"Compute Savings Plans offer the most flexibility: the commitment is a dollar-per-hour spend commitment (not tied to instance family/region/OS), automatically applying the discount to ANY EC2 usage plus Fargate and Lambda usage, regardless of instance family or region changes — matching the 'variable usage, multiple families/regions, plus Fargate/Lambda' requirement. Reserved Instances (even Convertible) are more restrictive, generally scoped to EC2 (Convertible can change instance family within EC2 but doesn't cover Fargate/Lambda the way Compute Savings Plans do).",
  crash:"Crash course — Savings Plans flavors: Compute Savings Plans (most flexible: any instance family, region, OS, tenancy, plus Fargate and Lambda — biggest flexibility, slightly lower max discount than EC2 Instance SP). EC2 Instance Savings Plans (locked to a specific instance family + region, but flexible across instance size/OS/tenancy within that family — higher discount than Compute SP, less flexible). Reserved Instances (Standard = highest discount but least flexible, tied to instance attributes, can be sold on the RI Marketplace; Convertible = can change instance attributes over the term, in exchange for a somewhat lower discount than Standard RIs). Exam trigger: 'varies across instance families/regions and services (EC2+Fargate+Lambda)' → Compute Savings Plans." },

{ id:84, domain:4, topic:"Trusted Advisor", difficulty:"easy",
  q:"A company wants automated recommendations across their account for cost optimization (like idle/underutilized resources), security gaps, and service limit warnings, without building custom tooling.",
  options:[
    "AWS Trusted Advisor",
    "AWS CloudTrail",
    "Amazon Inspector",
    "AWS Config"
  ], correct:0,
  explain:"Trusted Advisor inspects an account across 5 categories — cost optimization, performance, security, fault tolerance, and service limits — and gives actionable recommendations (e.g., 'this EC2 instance has very low utilization, consider downsizing or terminating') automatically, without custom tooling. CloudTrail is an API audit log, Inspector scans for vulnerabilities, and Config tracks configuration compliance — none give the same breadth of built-in best-practice recommendations across categories.",
  crash:"Crash course — Trusted Advisor: The free tier of Trusted Advisor includes a limited set of core checks (like S3 bucket permissions, some security checks); the FULL set of checks, including most cost optimization checks (like idle load balancers, low utilization EC2, unassociated Elastic IPs, RI/Savings Plans recommendations), requires a Business or Enterprise Support plan. This support-plan-tier distinction is a specific, testable detail." },

{ id:85, domain:4, topic:"Data Transfer Costs", difficulty:"hard",
  q:"An application running on EC2 in a VPC frequently calls DynamoDB and S3 APIs, and the company notices unnecessary data transfer charges for this traffic leaving the VPC toward these AWS services over the internet/NAT Gateway.",
  options:[
    "Increase the NAT Gateway's bandwidth.",
    "Create Gateway VPC Endpoints for S3 and DynamoDB, eliminating NAT Gateway data processing charges and internet routing for this traffic.",
    "Move the EC2 instance to a public subnet.",
    "Enable S3 Transfer Acceleration."
  ], correct:1,
  explain:"Gateway VPC Endpoints for S3/DynamoDB route this traffic privately within the AWS network at no additional charge (Gateway endpoints themselves are free), completely avoiding NAT Gateway data processing charges (which bill per-GB processed) and any internet data transfer for this traffic. Increasing NAT Gateway bandwidth doesn't reduce its per-GB cost, and moving to a public subnet doesn't reduce cost and reduces security posture.",
  crash:"Crash course — NAT Gateway cost trap: NAT Gateway charges both an hourly rate AND a per-GB data processing charge for ALL traffic passing through it, including traffic destined for S3/DynamoDB if no VPC endpoint exists. Since Gateway Endpoints for S3 and DynamoDB are free and remove this traffic from the NAT Gateway path entirely, adding them is one of the most common, high-impact, low-effort cost optimizations tested on the exam whenever NAT Gateway costs and S3/DynamoDB access appear together." },

{ id:86, domain:4, topic:"Right-Sizing", difficulty:"medium",
  q:"A company has several EC2 instances that CloudWatch metrics show are consistently running at 5-10% CPU utilization. What is the recommended cost-optimization action?",
  options:[
    "Leave them as-is since low utilization causes no direct cost.",
    "Right-size the instances to a smaller instance type (or use AWS Compute Optimizer's recommendation) that matches actual usage.",
    "Convert them all to Dedicated Hosts.",
    "Enable Enhanced Networking."
  ], correct:1,
  explain:"Right-sizing — downsizing over-provisioned instances to match actual observed utilization — directly reduces cost without impacting performance, and AWS Compute Optimizer analyzes CloudWatch metrics to automatically recommend better-fitting instance types/sizes. Leaving them as-is wastes money (you pay for the provisioned instance size regardless of utilization), and Dedicated Hosts/Enhanced Networking don't address the over-provisioning cost issue at all.",
  crash:"Crash course — Right-sizing & Compute Optimizer: AWS Compute Optimizer uses ML on your CloudWatch metrics (CPU, memory if the agent is installed, network, EBS) to recommend optimal instance types/sizes for EC2, and also for Auto Scaling Groups, EBS volumes, and Lambda functions. Right-sizing is often the very FIRST cost optimization step recommended (before buying Reserved Instances/Savings Plans) — because committing to a Savings Plan for an oversized instance just locks in the waste at a discount." },

{ id:87, domain:4, topic:"DynamoDB Cost Model", difficulty:"medium",
  q:"A new DynamoDB table will have highly unpredictable and spiky traffic patterns that are difficult to forecast, and the company wants to avoid both throttling AND paying for unused provisioned capacity.",
  options:[
    "DynamoDB Provisioned Capacity mode with a fixed, high RCU/WCU setting.",
    "DynamoDB On-Demand Capacity mode, which charges per request and automatically scales with traffic, with no capacity planning needed.",
    "DynamoDB Provisioned Capacity mode with Auto Scaling configured very conservatively.",
    "Migrate to Amazon RDS instead."
  ], correct:1,
  explain:"On-Demand capacity mode automatically scales to handle traffic instantly and bills per request, with no need to forecast or provision capacity — ideal for unpredictable/spiky workloads, directly avoiding both throttling and paying for idle provisioned capacity. Provisioned mode (even with Auto Scaling) reacts to sustained changes over minutes, not instant spikes, and can still throttle during a sudden burst before scaling catches up.",
  crash:"Crash course — DynamoDB On-Demand vs Provisioned: On-Demand = pay-per-request, instantly handles spiky/unknown traffic, generally costs more per-request than well-utilized provisioned capacity — best for new tables, unpredictable/spiky traffic, or unknown usage patterns. Provisioned (+ optional Auto Scaling) = you set RCU/WCU (or a scaling range), cheaper for steady, predictable traffic, but Auto Scaling reacts over minutes (not instant), so sudden unplanned spikes can still throttle briefly. Exam trigger: 'unpredictable/spiky traffic, avoid throttling and avoid over-provisioning' → On-Demand." },

{ id:88, domain:4, topic:"S3 Intelligent-Tiering", difficulty:"medium",
  q:"A company has an S3 bucket with objects whose access patterns are unknown and unpredictable — some objects are accessed daily, others not for months, and this varies over time in ways that are hard to predict in advance.",
  options:[
    "Manually create and maintain a custom lifecycle policy based on guesses about access patterns.",
    "Use S3 Intelligent-Tiering, which automatically moves objects between access tiers based on actual observed usage patterns, without performance impact or retrieval fees.",
    "Store everything in S3 Glacier Deep Archive for maximum savings regardless of access.",
    "Store everything in S3 Standard permanently."
  ], correct:1,
  explain:"S3 Intelligent-Tiering is specifically designed for unknown or changing access patterns: it automatically monitors each object's access frequency and moves it between frequent-access and infrequent-access (and optionally archive) tiers with no retrieval fees and no performance impact, for a small monthly monitoring fee per object. Manual lifecycle policies require you to already know/predict the access pattern, which the scenario says is not possible here, and always-Standard or always-Deep-Archive both fail to optimize cost for a genuinely mixed and unpredictable pattern.",
  crash:"Crash course — Intelligent-Tiering vs manual lifecycle policies: Use manual Lifecycle policies (Standard → IA → Glacier tiers) when you KNOW the access pattern in advance (e.g., 'logs are hot for 30 days, then cold'). Use Intelligent-Tiering when you DON'T know or the pattern is unpredictable/changing — it costs a small monitoring fee per object but has no retrieval fees, automatically optimizing without you having to guess. This 'known pattern vs unknown pattern' distinction is a frequent exam discriminator between these two very similar-sounding correct answers." },

{ id:89, domain:4, topic:"Reserved Capacity for Other Services", difficulty:"medium",
  q:"A company runs a steady-state, predictable analytics workload on Amazon Redshift and ElastiCache for Redis 24/7, year-round, and wants to reduce costs for this stable baseline usage.",
  options:[
    "Use only On-Demand pricing since it's simplest.",
    "Purchase Reserved Nodes for Redshift and Reserved Cache Nodes for ElastiCache, matching the steady-state usage with a 1 or 3-year commitment for a significant discount.",
    "Migrate everything to Spot Instances.",
    "Use S3 Intelligent-Tiering for the databases."
  ], correct:1,
  explain:"Just like EC2 and RDS, several other AWS services (Redshift, ElastiCache, OpenSearch) offer Reserved instance/node pricing for steady-state, predictable, long-running workloads, providing a substantial discount (similar structure to RDS/EC2 Reserved Instances) in exchange for a 1 or 3-year commitment. On-Demand is more expensive for guaranteed long-term usage, Spot Instances don't apply to these managed database/cache services, and S3 Intelligent-Tiering is irrelevant to compute/cache node pricing.",
  crash:"Crash course: The Reserved/commitment discount MODEL (commit to steady usage for 1-3 years, get a significant discount) is a recurring pattern across many AWS services, not just EC2: RDS Reserved Instances, Redshift Reserved Nodes, ElastiCache Reserved Cache Nodes, and OpenSearch Reserved Instances all follow this same logic. The exam tests whether you recognize 'steady-state, predictable, long-term workload' as the signal for ANY applicable reserved/commitment pricing option, not just EC2 specifically." },

{ id:90, domain:4, topic:"Snowball vs Direct Connect vs Internet", difficulty:"medium",
  q:"A company needs to migrate 200 TB of on-premises data into S3 ONE TIME, and their internet connection would take several weeks to transfer this volume of data.",
  options:[
    "Upload over the standard internet connection despite the multi-week duration.",
    "Use AWS Snowball (a physical device shipped to you, loaded with data, then shipped back to AWS and ingested into S3) to physically transport the data offline.",
    "Set up a new AWS Direct Connect connection just for this one-time transfer.",
    "Use S3 Transfer Acceleration alone to compensate for the slow link."
  ], correct:1,
  explain:"For very large one-time (or infrequent) data transfers where the network link is too slow, AWS Snowball physically ships a rugged storage device to load data locally and ship back to AWS for ingestion — often dramatically faster and cheaper than a slow link for hundreds of TB. Setting up Direct Connect (which takes weeks to provision and is meant for ongoing, not one-time, connectivity) is overkill and slow to establish for a single transfer, and Transfer Acceleration only helps somewhat, not enough to fix a fundamentally too-slow/too-small link for this volume.",
  crash:"Crash course — choosing a migration method by data size/urgency/frequency: Small/moderate data, decent bandwidth → standard internet transfer (optionally with Transfer Acceleration). Large one-time or infrequent bulk transfers where the network is the bottleneck → Snowball family (Snowcone for small edge/rugged cases ~8-24TB, Snowball Edge for tens/hundreds of TB, Snowmobile for truly massive exabyte-scale migrations). Ongoing, frequent, high-bandwidth hybrid connectivity → AWS Direct Connect (a dedicated network link, better latency/consistency than internet VPN, but takes time to provision and is for ongoing use, not one-off transfers)." },

{ id:91, domain:4, topic:"Lambda Cost Model", difficulty:"easy",
  q:"A company runs a lightweight task that executes for only a few seconds, a few times per day, with unpredictable timing. Which compute option is MOST cost-effective?",
  options:[
    "A dedicated EC2 instance running 24/7 waiting for the task to trigger.",
    "AWS Lambda, which charges only for actual execution time/requests, with zero cost when not running.",
    "A Reserved Instance sized for peak load.",
    "An Auto Scaling Group with a minimum of 2 instances always running."
  ], correct:1,
  explain:"Lambda's pricing model (pay per request + per GB-second of actual execution duration, effectively rounded to the millisecond) means a task running a few seconds, a few times a day, costs a tiny fraction of a cent — with literally zero charge during the vast majority of the day when it's not running. Any always-on EC2-based option (On-Demand, Reserved, or an ASG with a minimum size) charges continuously regardless of how rarely the workload actually executes, wasting money on idle time.",
  crash:"Crash course — when Lambda wins on cost: For infrequent, short-duration, event-driven workloads, Lambda is almost always cheaper than any always-on compute option, because you pay only for the milliseconds of actual execution. This flips for very high-volume, constantly-running compute-intensive workloads, where a well-utilized EC2 Reserved Instance/Savings Plan or container can become cheaper per unit of work than Lambda's per-invocation pricing — recognizing this crossover point (sporadic/event-driven → Lambda; constant/high-volume/long-running → EC2/containers with RI/Savings Plans) is a key cost-architecture skill tested on the exam." },

{ id:92, domain:4, topic:"Cost Explorer & Budgets", difficulty:"easy",
  q:"A company wants to receive an automated alert when their monthly AWS spend is forecasted to exceed a specific dollar amount, and also wants to analyze historical spending trends by service.",
  options:[
    "AWS Budgets (for alerts on forecasted/actual spend thresholds) combined with AWS Cost Explorer (for historical spend analysis and visualization).",
    "AWS Trusted Advisor only.",
    "Amazon CloudWatch Billing Alarms only, with no other tools.",
    "AWS Config Rules."
  ], correct:0,
  explain:"AWS Budgets lets you set cost/usage thresholds (including forecasted spend) and get proactive alerts (via SNS/email) before or when you exceed them; Cost Explorer provides visualization and filtering of historical cost/usage data by service, tag, account, etc. Together they cover both 'alert me before/when I overspend' and 'let me analyze past trends' — CloudWatch Billing Alarms can alert on estimated charges but lack the forecasting and richer budget-scoping features of AWS Budgets, and Trusted Advisor/Config don't provide this kind of cost trend analysis.",
  crash:"Crash course — AWS cost management tools: Cost Explorer = analyze/visualize past and forecasted cost & usage data (by service, linked account, tag, etc.), great for understanding trends and reports. AWS Budgets = set custom cost/usage/RI-utilization/Savings-Plans-utilization budgets with alerts when actual OR forecasted spend crosses a threshold — proactive, not just reactive. Cost and Usage Report (CUR) = the most granular, detailed billing data export (to S3), used for deep custom analysis/BI tooling. These three are commonly tested together as the 'cost visibility and control' toolkit." },

{ id:93, domain:4, topic:"Elastic IP Cost", difficulty:"easy",
  q:"A company notices unexpected charges on their bill related to Elastic IP addresses. What is the MOST likely cause?",
  options:[
    "Elastic IPs are always free regardless of usage.",
    "An Elastic IP address is allocated but NOT associated with a running instance (AWS charges for unused/idle Elastic IPs to encourage efficient use of the limited IPv4 address pool).",
    "The EC2 instance associated with the Elastic IP is running normally.",
    "Elastic IPs only cost money when attached to a Lambda function."
  ], correct:1,
  explain:"AWS charges a small hourly fee for an Elastic IP address that is allocated to your account but NOT actively associated with a running instance (or associated with a stopped instance) — this discourages hoarding scarce IPv4 addresses. An EIP attached to a running instance is typically free (one EIP per running instance); Lambda doesn't use Elastic IPs at all.",
  crash:"Crash course: This is a classic 'hidden/gotcha cost' exam question. Key rule: 1 Elastic IP attached to 1 running instance = no extra charge. An EIP sitting unattached, or attached to a STOPPED instance, starts accumulating hourly charges. Trusted Advisor's cost-optimization checks specifically flag 'unassociated Elastic IP addresses' as a common cost leak to clean up." },

{ id:94, domain:4, topic:"CloudFront vs Direct S3", difficulty:"medium",
  q:"A static website hosted in S3 serves a global audience, and the company wants to reduce data transfer costs while improving performance, compared to serving directly from S3 over the internet to every user worldwide.",
  options:[
    "Increase the S3 bucket's provisioned throughput.",
    "Put a CloudFront distribution in front of the S3 bucket; CloudFront's data transfer OUT pricing is generally cheaper than S3's direct data transfer OUT, plus it improves performance via edge caching.",
    "Enable S3 Versioning.",
    "Move the bucket to a different storage class."
  ], correct:1,
  explain:"CloudFront both improves latency (edge caching close to users) and typically reduces data transfer costs compared to S3 serving data directly to the internet from a single region, because CloudFront's data transfer OUT to the internet pricing is generally lower than S3's, and CloudFront absorbs repeat requests via cache hits so the origin (S3) sees far less egress traffic overall. S3 doesn't have 'provisioned throughput' to increase, and Versioning/storage class changes don't affect data transfer cost/performance for global end users.",
  crash:"Crash course: This combines a performance AND cost optimization into one classic exam pattern — 'S3 + CloudFront' for a globally distributed static (or semi-dynamic) website is one of the most iconic reference architectures on the SAA exam, appearing in both the performance and cost-optimization domains. Remember: data transfer FROM AWS services TO CloudFront edge locations is free; it's CloudFront-to-internet-user pricing that then applies, and it's usually cheaper than direct-from-S3-to-internet at any real scale." },

{ id:95, domain:4, topic:"Unused Resources", difficulty:"easy",
  q:"A cost audit reveals many unattached EBS volumes (from previously terminated instances) and old, unused snapshots accumulating storage charges. What should be done?",
  options:[
    "Leave them in case they're needed someday, regardless of cost.",
    "Review and delete EBS volumes/snapshots that are no longer needed, and use tools like Trusted Advisor/Cost Explorer/AWS Config to detect and prevent this from recurring.",
    "Convert all EBS volumes to a more expensive volume type.",
    "Enable EBS encryption to fix the cost issue."
  ], correct:1,
  explain:"Unattached EBS volumes and stale, no-longer-needed snapshots are one of the most common sources of avoidable AWS waste — the answer is to audit and clean them up, and use ongoing tools (Trusted Advisor flags unattached volumes, AWS Config rules can detect them automatically, tagging strategies help track resource ownership) to prevent recurrence. Encryption or changing volume type does not address the underlying issue of paying for genuinely unneeded storage.",
  crash:"Crash course — combating 'cost creep': Common sources of AWS waste tested on the exam: unattached EBS volumes, old/forgotten snapshots, unassociated Elastic IPs, idle/oversized EC2 or RDS instances, idle Load Balancers with no healthy targets, and forgotten dev/test environments left running. Governance tools to prevent/detect this: Trusted Advisor (cost checks), AWS Config (custom compliance rules, e.g., 'flag any EBS volume unattached for >7 days'), consistent resource tagging (to track ownership/purpose), and AWS Budgets alerts." },

{ id:96, domain:4, topic:"Compute for Batch Cost", difficulty:"medium",
  q:"A company runs nightly batch ETL jobs that must complete by morning but can tolerate occasional interruption/restart, and wants the lowest possible compute cost using a managed service that handles job scheduling and retries.",
  options:[
    "AWS Batch configured to use Spot Instances for compute, with automatic retry of interrupted jobs.",
    "A single large On-Demand EC2 instance kept running 24/7.",
    "AWS Lambda only, regardless of job runtime limits.",
    "Reserved Instances sized for year-round peak capacity."
  ], correct:0,
  explain:"AWS Batch is a managed service for running batch computing jobs that handles provisioning, scheduling, and can be configured to use Spot Instances (for deep cost savings on interruption-tolerant workloads) with automatic job retry — precisely matching a cost-sensitive, interruption-tolerant nightly ETL scenario. An always-on On-Demand instance or year-round Reserved Instance wastes money on idle time outside the nightly window, and Lambda has execution duration limits (15 minutes max) that may not fit longer-running ETL jobs.",
  crash:"Crash course — AWS Batch: Dynamically provisions the optimal compute (EC2 or Fargate) based on the volume/resource requirements of submitted jobs, supports job queues, dependencies, and retry strategies, and can use Spot Instances for cost savings when jobs can tolerate interruption/retry. This is the standard exam answer for 'run batch/ETL jobs at the lowest cost with retry handling', distinguishing it from Lambda (best for short-duration event-driven tasks) and manually-managed EC2 (no built-in job scheduling/queueing)." },

{ id:97, domain:4, topic:"RDS Storage Cost", difficulty:"medium",
  q:"A company's RDS database storage has General Purpose SSD (gp2) storage significantly larger than needed, driving unnecessary cost, and IOPS requirements are modest and well within gp3's baseline.",
  options:[
    "Switch to Provisioned IOPS (io1) storage for lower cost.",
    "Right-size the allocated storage and consider migrating to gp3 storage, which is generally cheaper than gp2 for the same baseline performance and allows independent scaling of IOPS/throughput.",
    "Switch to magnetic (standard) storage for all workloads regardless of performance needs.",
    "Enable Multi-AZ to reduce storage cost."
  ], correct:1,
  explain:"gp3 storage is generally cheaper than gp2 for equivalent baseline performance (3,000 IOPS/125 MB/s included, scalable independently of volume size), and right-sizing the allocated storage (RDS storage generally can't be reduced later without a migration, so 'right-sizing' here means choosing the correct provisioned amount and type going forward, e.g., via snapshot/restore or modifying) reduces waste. Provisioned IOPS (io1) is MORE expensive and meant for higher-IOPS-demand workloads, not a cost-cutting measure for modest IOPS needs, and Multi-AZ is an availability feature that actually increases cost (roughly doubling storage/instance cost), not a way to reduce it.",
  crash:"Crash course — gp2 vs gp3 for RDS/EBS: gp3 decouples IOPS and throughput from volume size (you get a baseline of 3,000 IOPS and 125 MB/s free, and can provision more independently) and is priced lower per-GB than gp2 for that same baseline — AWS generally recommends migrating gp2 volumes to gp3 for a straightforward cost reduction with equal or better performance for typical workloads. Note also: RDS storage can be scaled UP online, but you cannot shrink allocated RDS storage directly — reducing over-provisioned storage typically requires creating a new, smaller instance and migrating data." },

{ id:98, domain:4, topic:"Organizations Consolidated Billing", difficulty:"medium",
  q:"A company with 15 separate AWS accounts (one per team) wants to combine usage across all accounts to qualify for volume-based pricing discounts (like Reserved Instance/Savings Plans sharing) and get one single bill.",
  options:[
    "Manually total up each account's bill in a spreadsheet every month.",
    "Use AWS Organizations with Consolidated Billing, which combines usage across all member accounts for volume discounts and RI/Savings Plans sharing, under one payer account.",
    "Merge all 15 accounts into a single AWS account.",
    "Purchase separate Reserved Instances in each of the 15 accounts independently."
  ], correct:1,
  explain:"AWS Organizations' Consolidated Billing feature combines usage from all linked/member accounts under a single management/payer account, which can unlock volume pricing tiers and allows Reserved Instances and Savings Plans purchased in one account to automatically share their discount benefit across all accounts in the organization (by default) — directly achieving the stated goal without merging accounts or manual tracking. Purchasing RIs separately per account misses out on the org-wide sharing/pooling benefit that maximizes utilization and discount value.",
  crash:"Crash course — Consolidated Billing benefits: 1) One bill across all accounts. 2) Combined usage can reach volume pricing tiers (e.g., some services have tiered discounts at higher usage) faster than any single account alone. 3) Reserved Instance and Savings Plans discounts are shared across all accounts in the organization by default, maximizing utilization (e.g., if one account under-uses its purchased RI, another account's matching usage can consume the leftover discount). This is a foundational AWS Organizations cost-benefit, frequently tested alongside SCPs (which is more about governance/security than billing)." },

{ id:99, domain:4, topic:"Serverless vs Provisioned Cost Tradeoff", difficulty:"hard",
  q:"A company's API currently runs on Lambda + API Gateway and has grown to consistently handle a very high, steady volume of requests 24/7. The finance team notices Lambda costs are now higher than an equivalent always-on container-based solution would cost. What should the architect consider?",
  options:[
    "Nothing; serverless is always the cheapest option regardless of scale.",
    "Evaluate migrating the steady, high-volume, predictable workload to a provisioned compute model (e.g., ECS/Fargate or EC2 with Reserved Instances/Savings Plans), since serverless's per-invocation pricing can become less cost-efficient than well-utilized reserved/provisioned capacity at sustained high scale.",
    "Add Provisioned Concurrency to Lambda to reduce cost further.",
    "Switch to a larger Lambda memory setting to reduce cost."
  ], correct:1,
  explain:"While Lambda is extremely cost-efficient for sporadic/spiky/low-average-utilization workloads, at sustained very high and predictable volume, a well-utilized provisioned option (containers on Fargate/EC2, or EC2 with Reserved Instances/Savings Plans) can become cheaper per-unit-of-work than Lambda's per-invocation/duration billing — this crossover point is a real architectural cost consideration. Provisioned Concurrency actually ADDS cost (you pay for the pre-warmed capacity continuously) rather than reducing it, and increasing Lambda memory increases cost per invocation (though it may reduce duration in some cases, it's not a general cost-reduction lever here).",
  crash:"Crash course — the serverless cost crossover point: This is a nuanced, higher-difficulty exam concept: serverless (Lambda) shines for variable, unpredictable, or low-to-moderate average utilization workloads because you pay only for actual usage with zero idle cost. But at very high, sustained, predictable volume, the PER-UNIT cost of Lambda can exceed that of well-utilized Reserved/Savings-Plan-discounted EC2 or Fargate capacity, because those options let you pay a flat discounted rate for guaranteed usage instead of a premium per-invocation rate. The Well-Architected Framework's cost pillar expects you to periodically re-evaluate architecture choices as usage patterns and scale evolve, rather than assuming one compute model is always best." },

{ id:100, domain:4, topic:"Cost-Optimized Architecture Review", difficulty:"medium",
  q:"Which of the following represents the BEST overall approach to continuously optimizing AWS costs over time, according to AWS's Well-Architected Framework cost optimization pillar?",
  options:[
    "Set up cost controls once at launch and never revisit them again.",
    "Continuously monitor usage/cost (Cost Explorer, Budgets, Trusted Advisor, Compute Optimizer), right-size resources, choose appropriate pricing models (Spot/Reserved/Savings Plans/On-Demand) matched to workload patterns, and eliminate waste on an ongoing basis.",
    "Always choose the cheapest possible instance type regardless of performance requirements.",
    "Avoid all AWS cost management tools to keep the architecture simple."
  ], correct:1,
  explain:"The Well-Architected cost optimization pillar frames cost management as an ongoing, iterative practice: continuously measure actual usage, right-size and select appropriate purchasing options for each workload's actual pattern, and proactively eliminate waste — not a one-time setup task. Always picking the cheapest instance type ignores actual performance/reliability requirements (which can cause outages or degraded UX, often costing more in the long run), and avoiding cost tools removes the visibility needed to optimize at all.",
  crash:"Crash course — Well-Architected Cost Optimization Pillar (summary): Key design principles: (1) Implement cloud financial management (ownership/culture around cost). (2) Adopt a consumption model (pay for what you use, scale with demand). (3) Measure overall efficiency (are you getting business value per dollar spent). (4) Stop spending money on undifferentiated heavy lifting (let AWS manage infrastructure so your team focuses on differentiating work). (5) Analyze and attribute expenditure (tagging, accounts, cost allocation). This pillar, together with Operational Excellence, Security, Reliability, Performance Efficiency, and Sustainability, forms the 6 pillars of the AWS Well-Architected Framework — worth knowing by name for the exam." },

// ============================= MULTI-RESPONSE ("Select TWO/THREE") QUESTIONS (20) =============================
// The real exam mixes standard 4-option single-answer questions with 5-option multi-response
// questions that require selecting an exact set (no partial credit). These carry type:"multi"
// and correct as an array of indices instead of a single number.

// ---- Domain 1: Security (6) ----
{ id:101, domain:1, topic:"S3 Deletion Protection", difficulty:"medium", type:"multi",
  q:"A company wants to ensure that data stored in an S3 bucket is protected against accidental deletion or overwrite, and that any deleted or overwritten object can be recovered. Which TWO actions should a solutions architect take? (Select TWO.)",
  options:[
    "Enable S3 Versioning on the bucket.",
    "Enable S3 Transfer Acceleration on the bucket.",
    "Configure a bucket policy that denies s3:DeleteObject to all principals at all times.",
    "Enable MFA Delete on the bucket to require multi-factor authentication to permanently delete object versions.",
    "Enable S3 Intelligent-Tiering on the bucket."
  ], correct:[0,3],
  explain:"Versioning preserves every prior version of an object, so an overwrite or delete is recoverable rather than destructive. MFA Delete adds a required second factor before a version can be permanently removed or before versioning itself can be disabled, protecting against accidental or malicious permanent loss. A blanket deny on s3:DeleteObject would break all legitimate deletes too (not just accidental ones), and Transfer Acceleration/Intelligent-Tiering address transfer speed and storage cost, not deletion protection.",
  crash:"Crash course: on multi-response questions, watch for options that solve a DIFFERENT problem than the one asked (Transfer Acceleration and Intelligent-Tiering here) — they're real, valid features, just not relevant to this requirement. That's the main way the exam pads a 5-option list: 2 correct, 1 tempting-but-wrong absolute rule, 2 real-but-irrelevant features." },

{ id:102, domain:1, topic:"Cross-Account Access", difficulty:"hard", type:"multi",
  q:"A Lambda function in Account A needs to read objects from an S3 bucket in Account B, without creating an IAM user or sharing long-term credentials. Which TWO steps accomplish this? (Select TWO.)",
  options:[
    "In Account B, create an IAM role with a trust policy that allows Account A's Lambda execution role to assume it, and attach an S3 read permissions policy to that role.",
    "Configure Account A's Lambda execution role (or the Lambda function's code) to call sts:AssumeRole targeting the role created in Account B.",
    "Make the S3 bucket in Account B public so the Lambda function in Account A can reach it without authenticating.",
    "Create an IAM user in Account B and store its access key in the Lambda function's environment variables in Account A.",
    "Enable S3 Cross-Region Replication from Account B's bucket to a new bucket inside Account A."
  ], correct:[0,1],
  explain:"This is the standard cross-account role pattern: Account B creates a role that trusts Account A's principal, and Account A's Lambda role assumes it via STS to get temporary, scoped credentials. Making the bucket public or handing out a long-lived access key both violate least privilege and the 'no long-term credentials' requirement, and replicating the bucket into Account A doesn't grant access — it copies the data and still needs its own permissions.",
  crash:"Crash course: whenever a scenario says 'without long-term credentials' or 'without an IAM user', the exam is pointing you at the trust-policy + sts:AssumeRole pattern. Both halves are required — a trust policy on its own does nothing until something on the other side actually calls AssumeRole." },

{ id:103, domain:1, topic:"S3 Encryption Options", difficulty:"easy", type:"multi",
  q:"Which THREE of the following are valid methods for encrypting an Amazon S3 object at rest? (Select THREE.)",
  options:[
    "SSE-S3 (Amazon S3-managed keys)",
    "SSE-KMS (AWS KMS-managed keys)",
    "SSE-C (customer-provided keys)",
    "Security group encryption",
    "VPC Flow Log encryption"
  ], correct:[0,1,2],
  explain:"SSE-S3, SSE-KMS, and SSE-C are the three server-side encryption options S3 natively supports (client-side encryption is a fourth, application-side option). 'Security group encryption' isn't a real feature — security groups are stateful firewalls, not an encryption mechanism — and VPC Flow Logs are a network-traffic logging feature, not a way to encrypt an S3 object.",
  crash:"Crash course: a 'select THREE from five' question is often just testing whether you can spot invented-sounding distractors. If an option combines two unrelated real AWS terms into a feature that doesn't exist (like 'security group encryption'), that's a strong signal it's a distractor." },

{ id:104, domain:1, topic:"IAM Credential Hygiene", difficulty:"easy", type:"multi",
  q:"A company wants to reduce the risk of compromised long-lived IAM user access keys being used to access its AWS resources. Which TWO actions should it take? (Select TWO.)",
  options:[
    "Replace long-lived IAM user credentials with IAM roles for applications, using temporary credentials via STS wherever possible.",
    "Require multi-factor authentication (MFA) for IAM users, especially those with elevated permissions.",
    "Grant AdministratorAccess to every IAM user so they never need to request additional permissions.",
    "Disable AWS CloudTrail to reduce the account's logging footprint.",
    "Store access keys directly in application source code for convenient access."
  ], correct:[0,1],
  explain:"Replacing long-lived keys with roles/temporary credentials removes the risk of a leaked static key entirely for that workload, and MFA adds a second factor even if a password or key is compromised. Granting blanket admin access, disabling CloudTrail, and hardcoding keys in source all directly increase risk rather than reduce it.",
  crash:"Crash course: this style of question — 3 of 5 options being obviously bad security practice — is common on the real exam as a confidence-builder mixed among harder ones. Don't overthink it when the wrong options are actively unsafe rather than just 'less good'." },

{ id:105, domain:1, topic:"Organizations Guardrails", difficulty:"hard", type:"multi",
  q:"An organization using AWS Organizations wants to guarantee that no member account — including its own administrators — can ever disable GuardDuty or leave the organization. Which TWO approaches help achieve this? (Select TWO.)",
  options:[
    "Apply a Service Control Policy (SCP) at the OU level that denies guardduty:DisassociateFromMasterAccount, guardduty:DeleteDetector, and organizations:LeaveOrganization.",
    "Enable GuardDuty as a delegated administrator with organization-wide auto-enrollment for existing and new accounts.",
    "Send an email asking each account's administrators to keep GuardDuty enabled.",
    "Grant every account administrator full IAM permissions to modify GuardDuty settings so they can respond quickly.",
    "Disable AWS Organizations entirely to simplify account management."
  ], correct:[0,1],
  explain:"An SCP is the only mechanism that can technically prevent an action even for that account's own administrators, since it caps maximum permissions org-wide. Enabling GuardDuty as a delegated administrator with auto-enrollment ensures every current and future account is covered centrally rather than relying on each account to opt in. An email policy is not a technical control, granting broad IAM permissions works against the goal, and disabling Organizations removes the very mechanism needed to enforce this centrally.",
  crash:"Crash course: 'even administrators can't override this' is one of the strongest exam signals pointing to SCPs — no IAM policy inside a member account can ever beat an SCP Deny, which is what makes it different from every other guardrail on AWS." },

{ id:106, domain:1, topic:"KMS Key Policies", difficulty:"medium", type:"multi",
  q:"Which TWO statements about AWS KMS key policies are correct? (Select TWO.)",
  options:[
    "A customer managed key's key policy is the primary access control mechanism, and it can deny access even if an IAM policy would otherwise allow it.",
    "IAM policies alone are always sufficient to grant access to a KMS customer managed key, regardless of the key policy.",
    "A key policy can grant permissions to principals in other AWS accounts, enabling cross-account use of the key.",
    "KMS keys cannot have resource-based policies; only IAM identity-based policies apply to them.",
    "Once a KMS key policy is set at creation, it can never be modified afterward."
  ], correct:[0,2],
  explain:"KMS key policies are mandatory resource-based policies and are the primary gate on key usage — access requires the key policy to allow it (an IAM Allow alone is not sufficient unless the key policy delegates to IAM). Key policies can explicitly name principals in other accounts, which is exactly how cross-account KMS access is granted. Key policies absolutely exist as resource-based policies and can be updated after creation by anyone with kms:PutKeyPolicy permission.",
  crash:"Crash course: this is the single most tested KMS nuance on the SAA exam — access to a customer managed key needs the key policy AND (if the key policy delegates to IAM) the IAM policy to both allow it. Never assume an IAM Allow is enough on its own for KMS." },

// ---- Domain 2: Resilience (5) ----
{ id:107, domain:2, topic:"Multi-AZ Web Tier", difficulty:"easy", type:"multi",
  q:"A company wants its web application tier to keep serving traffic with no manual intervention even if an entire Availability Zone fails. Which TWO design choices support this? (Select TWO.)",
  options:[
    "Deploy EC2 instances in an Auto Scaling Group spanning at least two Availability Zones.",
    "Place all EC2 instances in a single Availability Zone to simplify networking.",
    "Use an Application Load Balancer with registered targets in multiple Availability Zones.",
    "Store all application session state exclusively on each instance's local instance store volume.",
    "Have an engineer manually restart instances in a healthy AZ whenever a failure is detected."
  ], correct:[0,2],
  explain:"An Auto Scaling Group spanning multiple AZs, fronted by an ALB with targets in those same AZs, is what lets traffic keep flowing automatically if one AZ fails. A single-AZ deployment is a single point of failure, instance-store session state is lost if an instance is replaced, and manual restarts contradict the 'no manual intervention' requirement.",
  crash:"Crash course: 'no manual intervention' is a strong exam signal ruling out any answer involving a human taking an action after the failure — the whole point of the ASG+ALB pattern is that AWS handles it automatically." },

{ id:108, domain:2, topic:"Near-Zero RPO Disaster Recovery", difficulty:"hard", type:"multi",
  q:"A company needs a disaster recovery design for critical data with a Recovery Point Objective (RPO) near zero and the ability to fail over to another AWS Region within minutes. Which TWO approaches support this? (Select TWO.)",
  options:[
    "Use Amazon Aurora Global Database with a secondary-region replica that can be promoted during a regional outage.",
    "Take a manual RDS snapshot once a week and store it in the same region as the primary database.",
    "Use DynamoDB Global Tables for data that fits a key-value/document model requiring multi-region active-active replication.",
    "Rely solely on daily AMI backups of an EC2-hosted database with no ongoing replication.",
    "Use a Single-AZ RDS instance to minimize cost."
  ], correct:[0,2],
  explain:"Aurora Global Database replicates to a secondary region with typically sub-second lag and supports fast promotion, and DynamoDB Global Tables replicate writes to all regions within about a second — both give near-zero RPO and fast cross-region recovery. Weekly same-region snapshots and daily AMI backups both imply RPOs measured in hours to days, and a Single-AZ instance doesn't provide cross-region recovery at all.",
  crash:"Crash course: 'RPO near-zero' + 'cross-region' together rule out anything based on periodic backups/snapshots — only continuous or near-continuous replication (Aurora Global Database, DynamoDB Global Tables, or similar) can hit that bar." },

{ id:109, domain:2, topic:"Route 53 Routing Policies", difficulty:"easy", type:"multi",
  q:"Which THREE of the following are valid Amazon Route 53 routing policies? (Select THREE.)",
  options:[
    "Weighted",
    "Failover",
    "Latency-based",
    "Alphabetical",
    "Round-robin-only (no health checks, no other policy type)"
  ], correct:[0,1,2],
  explain:"Weighted, Failover, and Latency-based are three of Route 53's real routing policies (alongside Simple, Geolocation, Geoproximity, and Multivalue Answer). 'Alphabetical' routing and a policy literally named 'round-robin-only' are not real Route 53 policy names.",
  crash:"Crash course: know the real list — Simple, Weighted, Latency-based, Failover, Geolocation, Geoproximity, and Multivalue Answer. Anything outside that list on the exam is a distractor, no matter how plausible-sounding." },

{ id:110, domain:2, topic:"SQS Poison Messages", difficulty:"medium", type:"multi",
  q:"An application uses Amazon SQS to decouple a producer from a consumer. A malformed message causes the consumer to fail every time it's processed, blocking further progress on the queue. Which TWO changes resolve this? (Select TWO.)",
  options:[
    "Configure a redrive policy that sends messages exceeding a maximum receive count to a Dead-Letter Queue (DLQ).",
    "Reduce the SQS visibility timeout to 0 seconds so failed messages are retried continuously and immediately.",
    "Set an appropriate maxReceiveCount on the source queue's redrive policy so a repeatedly failing message is moved out automatically.",
    "Delete the SQS queue and have the producer call the consumer directly and synchronously instead.",
    "Add more consumers without changing how the malformed message is handled."
  ], correct:[0,2],
  explain:"A DLQ paired with a sensible maxReceiveCount is the standard fix: after N failed processing attempts, the message is automatically moved out of the main queue so it stops blocking progress, and it's preserved for investigation. Reducing visibility timeout to 0 would make the poison message retry even faster and more disruptively, removing the queue defeats the decoupling the architecture was built for, and more consumers doesn't fix a message that fails deterministically every time.",
  crash:"Crash course: a DLQ + maxReceiveCount is effectively 'quarantine, don't discard' — the message isn't lost, it's set aside so the rest of the queue can keep flowing while someone investigates why it kept failing." },

{ id:111, domain:2, topic:"AWS Backup Capabilities", difficulty:"medium", type:"multi",
  q:"A company wants centralized, policy-based backup management across EBS, RDS, and DynamoDB with defined retention and the ability to copy backups to a second AWS Region. Which TWO statements about AWS Backup are correct? (Select TWO.)",
  options:[
    "AWS Backup lets you define a backup plan with a schedule and lifecycle/retention rules, applied to resources selected by tags or resource ID.",
    "AWS Backup supports copying completed backups to a backup vault in a different AWS Region as part of the same backup plan.",
    "AWS Backup can only be used with Amazon EC2 and no other AWS service.",
    "Each resource type must be backed up with a completely separate, unrelated tool — there is no centralized management option.",
    "AWS Backup plans cannot use resource tags to determine which resources to include."
  ], correct:[0,1],
  explain:"AWS Backup plans define schedule and retention centrally and can target resources by tag or explicit ID across many services (EBS, RDS, DynamoDB, EFS, and more), and cross-region copy is a built-in part of a backup plan — exactly matching the requirement. It is not EC2-only, it doesn't require separate unrelated tools per service, and tag-based resource selection is one of its core features.",
  crash:"Crash course: the whole value proposition of AWS Backup is centralizing what used to require separate per-service snapshot tools — recognize any option describing 'separate tools per service' as the opposite of what AWS Backup does." },

// ---- Domain 3: Performance (5) ----
{ id:112, domain:3, topic:"DynamoDB Read Latency", difficulty:"medium", type:"multi",
  q:"A read-heavy workload repeatedly reads the same popular items from a DynamoDB table, and the team wants to reduce read latency. Which TWO solutions would help? (Select TWO.)",
  options:[
    "Add Amazon DynamoDB Accelerator (DAX) in front of the table to cache frequently accessed items.",
    "Enable DynamoDB Streams to capture every write made to the table.",
    "Cache frequently accessed items at the application layer with an appropriate TTL, either via DAX or another in-memory cache.",
    "Switch the table's billing mode to Provisioned without configuring Auto Scaling.",
    "Delete the table's secondary indexes to reduce storage cost."
  ], correct:[0,2],
  explain:"DAX and application-layer caching both directly address repeated reads of the same hot items by serving them from memory instead of hitting DynamoDB every time. DynamoDB Streams is a change-data-capture feature unrelated to read latency, switching to unmanaged Provisioned capacity doesn't address a hot-key read pattern, and removing secondary indexes affects query flexibility and cost, not the latency of reading the same items repeatedly.",
  crash:"Crash course: 'the same popular items read repeatedly' is the textbook signal for a caching layer (DAX for DynamoDB specifically) — it's a hot-key access pattern, not a general throughput problem." },

{ id:113, domain:3, topic:"NoSQL and Key-Value Stores", difficulty:"easy", type:"multi",
  q:"Which TWO AWS services are examples of NoSQL or in-memory key-value data stores suited for single-digit-millisecond latency at massive scale? (Select TWO.)",
  options:[
    "Amazon DynamoDB",
    "Amazon Redshift",
    "Amazon ElastiCache (Redis)",
    "Amazon RDS for PostgreSQL",
    "AWS Glue"
  ], correct:[0,2],
  explain:"DynamoDB (NoSQL key-value/document) and ElastiCache for Redis (in-memory key-value) are both built for single-digit-millisecond latency at large scale. Redshift is a columnar OLAP data warehouse, RDS for PostgreSQL is a relational OLTP database, and Glue is a serverless ETL/data-catalog service — none are key-value stores.",
  crash:"Crash course: this is a pure workload-to-service matching question — the kind the exam uses constantly. Recognize the category (relational vs NoSQL vs cache vs warehouse vs ETL) before looking at the specific service name." },

{ id:114, domain:3, topic:"EC2 Pricing Options", difficulty:"easy", type:"multi",
  q:"Which THREE of the following are valid Amazon EC2 pricing/purchase options? (Select THREE.)",
  options:[
    "On-Demand Instances",
    "Spot Instances",
    "Reserved Instances",
    "Fixed-Rate Instances",
    "Discounted Trial Instances"
  ], correct:[0,1,2],
  explain:"On-Demand, Spot, and Reserved Instances are three of EC2's real purchasing options (alongside Savings Plans and Dedicated Hosts/Instances). 'Fixed-Rate Instances' and 'Discounted Trial Instances' are not real AWS pricing models.",
  crash:"Crash course: EC2's real pricing menu is On-Demand, Reserved Instances, Savings Plans, Spot Instances, and Dedicated Hosts/Instances — five names worth memorizing exactly, since invented-sounding variations are a common distractor pattern." },

{ id:115, domain:3, topic:"Fargate vs EC2 Launch Type", difficulty:"medium", type:"multi",
  q:"A company runs a containerized application and wants to eliminate the operational overhead of provisioning and patching the underlying compute that hosts its containers. Which TWO statements are correct? (Select TWO.)",
  options:[
    "AWS Fargate can be used as the launch type for both Amazon ECS and Amazon EKS, removing the need to manage EC2 instances.",
    "The EC2 launch type for ECS/EKS also removes all EC2 management responsibility from the customer.",
    "With Fargate, AWS manages the underlying compute infrastructure, and the customer only defines the task or pod's resource requirements.",
    "Amazon ECS can only run on self-managed EC2 instances; Fargate is not a supported launch type for ECS.",
    "Fargate requires the customer to choose, patch, and manage the underlying EC2 AMI themselves."
  ], correct:[0,2],
  explain:"Fargate works as a launch type for both ECS and EKS, and its entire value proposition is that AWS manages the compute layer while the customer just declares CPU/memory requirements for tasks or pods. The EC2 launch type is the opposite — the customer explicitly manages those instances. ECS fully supports Fargate, and Fargate specifically removes any need for the customer to touch an AMI at all.",
  crash:"Crash course: keep the two axes separate — ECS-vs-EKS is the orchestrator choice, Fargate-vs-EC2 is the compute/launch-type choice. A question can mix them, like this one does, precisely to see if you conflate them." },

{ id:116, domain:3, topic:"Global Accelerator for Gaming", difficulty:"hard", type:"multi",
  q:"A latency-sensitive global gaming application communicates over UDP and needs consistent low-latency routing to the nearest healthy regional endpoint, along with static IP addresses that don't change during failover. Which TWO AWS features support this? (Select TWO.)",
  options:[
    "AWS Global Accelerator, which provides static anycast IP addresses and routes traffic over the AWS global network.",
    "Amazon CloudFront, which is designed exclusively for HTTP/HTTPS content caching.",
    "Network Load Balancers as regional endpoints behind Global Accelerator, since NLBs support both TCP and UDP.",
    "Amazon S3 Transfer Acceleration, designed for accelerating large object uploads to S3.",
    "AWS Direct Connect, which requires a dedicated physical network connection from an on-premises data center."
  ], correct:[0,2],
  explain:"Global Accelerator provides the static anycast IPs and global-network routing this scenario needs, and pairing it with NLBs (which support UDP, unlike ALBs) as regional endpoints completes the design. CloudFront is HTTP(S)-only and can't carry raw UDP traffic, Transfer Acceleration is specific to S3 uploads, and Direct Connect solves a completely different problem (dedicated on-premises connectivity, not global client-to-endpoint routing).",
  crash:"Crash course: UDP support is the key filter here — it immediately rules out CloudFront and ALBs, leaving Global Accelerator + NLB as the only combination in the list that can actually carry UDP traffic globally." },

// ---- Domain 4: Cost (4) ----
{ id:117, domain:4, topic:"Batch Workload Cost Optimization", difficulty:"medium", type:"multi",
  q:"A company wants to minimize cost for a fault-tolerant batch data processing workload that can restart cleanly if interrupted. Which TWO choices minimize cost? (Select TWO.)",
  options:[
    "Use Spot Instances for the batch compute fleet.",
    "Use AWS Batch to manage job queuing, scheduling, and automatic retry of interrupted jobs.",
    "Use Reserved Instances with a 3-year all-upfront commitment for this intermittent workload.",
    "Run the workload continuously on On-Demand instances sized for peak capacity at all times.",
    "Avoid using any managed orchestration service to reduce architectural complexity."
  ], correct:[0,1],
  explain:"Spot Instances offer the deepest discount for exactly this kind of interruption-tolerant workload, and AWS Batch adds the scheduling and automatic retry needed to make interruption a non-issue operationally. A 3-year Reserved Instance commitment is a poor fit for an intermittent workload (you'd pay for capacity even when there's no batch job running), and always-on peak-sized On-Demand capacity is the most expensive option here by far.",
  crash:"Crash course: 'fault-tolerant' and 'can restart if interrupted' are the exam's signal phrases for Spot Instances — they exist specifically to reward architectures designed to tolerate interruption." },

{ id:118, domain:4, topic:"NAT Gateway Cost Reduction", difficulty:"medium", type:"multi",
  q:"Which TWO actions would help reduce unnecessary data-transfer costs for a VPC-based application that frequently calls Amazon S3 and DynamoDB APIs? (Select TWO.)",
  options:[
    "Create Gateway VPC Endpoints for S3 and DynamoDB so this traffic bypasses the NAT Gateway entirely.",
    "Right-size or remove NAT Gateways in subnets where private instances no longer need general internet access.",
    "Increase the NAT Gateway's bandwidth allocation.",
    "Route all traffic through an Internet Gateway directly, even from private subnets, for simplicity.",
    "Use S3 Transfer Acceleration for calls that stay within the same AWS Region."
  ], correct:[0,1],
  explain:"Gateway VPC Endpoints remove S3/DynamoDB traffic from the NAT Gateway's billed data-processing path entirely (and the endpoints themselves are free), and eliminating NAT Gateways that are no longer needed removes both their hourly and per-GB charges. Increasing bandwidth doesn't reduce per-GB cost, routing private subnets directly through an Internet Gateway undermines the private-subnet security design, and Transfer Acceleration is meant for long-distance uploads, not in-region calls.",
  crash:"Crash course: NAT Gateway bills both an hourly rate AND a per-GB processing charge for everything that passes through it — Gateway Endpoints for S3/DynamoDB are one of the highest-value, lowest-effort cost fixes on the whole exam." },

{ id:119, domain:4, topic:"Savings Plans and Reserved Instances", difficulty:"medium", type:"multi",
  q:"Which THREE of the following are valid EC2 Savings Plans or Reserved Instance types offered by AWS? (Select THREE.)",
  options:[
    "Compute Savings Plans",
    "EC2 Instance Savings Plans",
    "Standard Reserved Instances",
    "Spot Savings Plans",
    "Guaranteed Instances"
  ], correct:[0,1,2],
  explain:"Compute Savings Plans, EC2 Instance Savings Plans, and Standard Reserved Instances (alongside Convertible Reserved Instances) are all real AWS commitment-discount options. 'Spot Savings Plans' and 'Guaranteed Instances' are not real AWS offerings — Spot already has its own discount mechanism and doesn't use a Savings Plan.",
  crash:"Crash course: the full real list is Compute Savings Plans, EC2 Instance Savings Plans, Standard Reserved Instances, and Convertible Reserved Instances — four names, each with a different flexibility/discount trade-off worth knowing precisely." },

{ id:120, domain:4, topic:"Cost Visibility Tools", difficulty:"easy", type:"multi",
  q:"A company wants visibility into its AWS spending and proactive alerts before exceeding a monthly budget. Which TWO AWS tools should be used together? (Select TWO.)",
  options:[
    "AWS Budgets, to set cost/usage thresholds and receive alerts on actual or forecasted spend.",
    "AWS Cost Explorer, to visualize and analyze historical and forecasted cost and usage data.",
    "Amazon Inspector, to scan EC2 instances for software vulnerabilities.",
    "AWS Config, to evaluate resource configuration compliance.",
    "Amazon GuardDuty, to detect malicious activity in the account."
  ], correct:[0,1],
  explain:"AWS Budgets and Cost Explorer are the two purpose-built cost-visibility and alerting tools — Budgets for proactive threshold alerts (including forecasted spend), Cost Explorer for historical/forecasted analysis and visualization. Inspector, Config, and GuardDuty are all real, valuable tools, just for vulnerability scanning, configuration compliance, and threat detection respectively — none address cost visibility.",
  crash:"Crash course: a recurring exam trick is listing genuinely useful AWS services that simply answer a different question than the one asked. Always re-check what the question is actually asking for before picking a familiar-sounding service." },

];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { QUESTIONS, DOMAIN_NAMES };
}
