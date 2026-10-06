# LevelUP-Math — Content Architecture CA-01 to CA-04

# CA-01 — Taxonomy

## Academic Structure
Domain → Topic → Subtopic

## Exam Structure
Exam → Section → optional Subsection

For UTBK V1:
- PK
- PM
- PU

PU includes:
- Penalaran Induktif
- Penalaran Deduktif
- Penalaran Kuantitatif

## Academic Domains
1. Bilangan & Aritmetika
2. Aljabar
3. Geometri & Pengukuran
4. Statistika & Analisis Data
5. Peluang & Kombinatorika
6. Logika, Penalaran & Pemodelan

## Skills
Initial cognitive skills:
- Conceptual Understanding
- Calculation
- Problem Translation
- Strategy Selection
- Multi-step Reasoning
- Interpretation & Evaluation
- Logical Reasoning
- Quantitative Reasoning

One primary skill, multiple secondary skills.

## Rules
- mastery smallest unit = Subtopic;
- Learn is subtopic-based;
- prerequisites many-to-many;
- stable code/slug;
- content and product decoupled.

---

# CA-02 — Master Question Bank

Single Master Question Bank for:
- Diagnostic
- Learn
- Practice
- Mini Assessment
- Tryout

## Question Identity
- id
- readable code
- version

## Content
- question_type
- stem
- instruction/stimulus optional
- media
- options

## Metadata
- exam context
- section/subsection
- subtopic
- primary skill
- secondary skills
- difficulty

## Difficulty
- Basic
- Medium
- Hard

## Structured Explanation
- Problem Understanding
- Known Information
- Asked Information
- Concept
- First Step
- Solution Steps
- Shortcut optional
- Common Mistake optional
- Final Answer

## Source
- ORIGINAL
- PAST_EXAM
- ADAPTED
- AI_ASSISTED

Ownership:
- LEVELUP
- PUBLIC_REFERENCE
- LICENSED
- ADAPTED

## QA Lifecycle
DRAFT  
→ CONTENT_REVIEW  
→ MATH_QA  
→ QA_PASSED  
→ PUBLISHED  
→ ARCHIVED

## Question Types
V1:
- SINGLE_CHOICE

Future:
- MULTIPLE_CHOICE
- MULTIPLE_SELECT
- NUMERIC
- TRUE_FALSE_GROUP
- QUANTITATIVE_COMPARISON
- DATA_SUFFICIENCY

## Rules
- no duplicated banks per feature;
- no is_diagnostic/is_tryout booleans;
- use assignments;
- question family groups variants;
- AI draft never auto-publish;
- IRT-ready fields later, but do not guess values;
- archive, do not hard-delete;
- published package pins exact question version.

---

# CA-03 — Learning Module

Unit = Subtopic.

A Subtopic can have 1+ modules.

## Module Structure
- Concept
- How to Recognize
- Worked Example
- First Step
- Strategy / Shortcut
- Common Mistakes
- Visuals
- Guided Practice
- Mini Assessment
- Quick Review

## Required Signatures
- Cara Mengenali Soal
- Langkah Pertama

## Worked Example Structure
Question  
→ What Asked  
→ Known Info  
→ Concept  
→ First Step  
→ Solution  
→ Conclusion

## Guided Practice
- 2 Basic
- 2 Medium
- 2 HOTS

## Mini Assessment
- 5 questions
- 3 Medium
- 2 Hard/HOTS
- no hint
- no retry
- no live feedback

## Pass
>=80%.

Pass != auto Mastered.

## Module Levels
- FOUNDATION
- STANDARD
- ADVANCED

Separate from question difficulty.

## Duration
Target 10–25 minutes.

---

# CA-04 — Assessment & Package

Generic parent: ASSESSMENT SET

Types:
- Diagnostic
- Mini Assessment
- Tryout

Practice is dynamic and not an Assessment Set.

## Diagnostic
- 15 questions
- 30 minutes
- optional
- no leaderboard
- initial skill profile
- versioned

## Mini Assessment
- linked to Learning Module
- 5 questions
- 3 Medium + 2 Hard/HOTS
- pooled where possible

## Tryout
- fixed competitive question set
- published as package/resource
- immutable when published
- first competitive attempt only for leaderboard
- retries noncompetitive

## Attempt Snapshot
Must freeze actual question versions selected.

## Evidence
Diagnostic/Mini/Tryout contribute evidence with different strengths.

## Access
FREE / PAID / PRO_ELIGIBLE conceptually.

Commerce remains separate.

## Exposure
Protected tryout questions should not appear in practice before exposure rules allow.

## Bundle
Bundle = collection of packages.
No own questions.
