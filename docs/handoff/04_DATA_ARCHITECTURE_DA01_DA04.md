# LevelUP-Math — Data Architecture DA-01 to DA-04

# DA-01 — Domain Model

Domains:
1. Identity & User
2. Academic Taxonomy
3. Question Bank
4. Learning
5. Assessment & Attempts
6. Progress & Mastery
7. Commerce & Entitlement
8. Engagement & Admin

## Identity
- auth.users
- profiles
- user_roles

## Academic
- exams
- exam_sections
- exam_subsections
- domains
- topics
- subtopics
- subtopic_prerequisites
- skills

## Question
- questions
- question versions
- options
- explanations
- question families
- question reports
- secondary skills

## Learning
- learning_modules
- learning_objectives
- learning_module_blocks
- learning_module_questions

## Assessment
- assessment_sets
- assessment_questions
- assessment_pool_rules
- assessment_attempts
- assessment_attempt_questions
- assessment_answers

## Practice
- practice_sessions
- practice_session_questions
- practice_answers
- question_exposures

## Intelligence
- user_subtopic_mastery
- mastery_evidence
- user_recommendations

## Progress
- weekly_progress_snapshots
- learning_activity_days
- user_streaks
- achievements
- user_achievements
- user_goals

## Commerce
- products
- product_assessments
- subscription_plans
- transactions
- payment_events
- subscriptions/subscription periods
- entitlements
- notifications

---

# DA-02 — Core Schema Principles

## Conventions
- UUID primary keys;
- stable code/slug;
- timestamptz;
- text + CHECK preferred over overusing enum;
- snake_case;
- price integer/bigint;
- JSONB only flexible/snapshot/provider data;
- archive published content.

## Identity
profiles:
- user_id
- display_name
- avatar_url
- education_level
- grade
- school_name
- target_exam_id
- target_score
- leaderboard_visible
- onboarding_completed

user_roles:
- user_id
- role
- created_by

## Taxonomy
Normalized:
Exam → Section → optional Subsection
Domain → Topic → Subtopic

Subtopic prerequisites many-to-many.

## Important Versioning Rule
Published historical truth must be reproducible.

Therefore implementation should use **real immutable version records**, not only a mutable row with `version` integer.

Recommended:
- questions = logical identity
- question_versions = immutable content version
- question_version_options
- question_version_explanations
- assessment items reference exact question_version_id

Same principle for published assessment revisions.

## Security Rule
Do not expose answer keys to browser.
Answer authority should be protected/private/trusted.

---

# DA-03 — Learning & Assessment Data Flow

Core pipeline:

User Activity  
→ Answers  
→ Scored Evidence  
→ Mastery Evidence  
→ Subtopic Mastery  
→ Derived Topic/Domain  
→ Recommendation  
→ Progress

## Difficulty Weights
- Basic = 1.0
- Medium = 1.5
- Hard = 2.0

## Evidence Score
E = weighted correctness / total difficulty weight * 100

## Difficulty Caps
- Basic-only evidence capped 60
- Medium max capped 80
- Hard included can reach 100

## Source Weights V1
- Guided Practice = 0.10
- Practice = 0.20
- Review = 0.20
- Diagnostic = 0.30
- Mini Assessment = 0.35
- Tryout = 0.35

## Mastery
M_new = (1-alpha) M_old + alpha E_effective

alpha = source_weight × activity_confidence

## First Evidence
Initialize mastery from evidence.
Confidence remains low.

Unknown != mastery 0.

## Mastered
Requires:
- mastery >=80
- sufficient confidence
- Medium/Hard evidence

## Retry
- first try correct = full
- retry correct = partial
- reinforcement lower weight

## Recommendation
Consider:
- low mastery
- low confidence
- prerequisite gap
- recent mistakes
- review due
- target exam relevance

## Important
AI must never determine:
- correctness
- mastery
- leaderboard
- entitlement
- payment state

Scoring must be deterministic and versioned.

---

# DA-04 — Commerce

Core:

Product  
→ Checkout  
→ Transaction  
→ Payment Verification  
→ Fulfillment  
→ Entitlement  
→ Access

## Product
- Package
- Bundle

Subscription separate as subscription plan.

## Transactions
Important fields:
- transaction_code
- user_id
- purchase_type
- product_id / plan_id
- base_amount
- discount_amount
- final_amount
- currency
- payment_method
- payment_status
- fulfillment_status
- provider
- provider_reference
- timestamps

## Payment Status
- pending
- review
- paid
- failed
- expired
- cancelled
- rejected
- payment_mismatch
- refunded

## Fulfillment
- pending
- processing
- completed
- failed
- revoked

Payment != Access.

## Entitlement
Sole source of access.

Types:
- assessment
- plan

Source:
- purchase
- admin_grant
- promotion
- migration

## Bundle
Expand into entitlements per assessment.

## Pro
Time-based plan entitlement.

## Renewal
Extend after current expiry.

## Webhook
Must:
- verify signature
- validate transaction/reference/amount
- dedupe provider event
- trigger fulfillment
- be idempotent

## WhatsApp
Operational notification only.
Failure must not rollback purchase.
