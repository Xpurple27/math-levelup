# LevelUP-Math — User Flows 01–06

## Flow 01 — First Time / Diagnostic
Landing  
→ Register/Login  
→ Short onboarding:
- education level
- target exam
- target score

→ Dashboard  
→ Diagnostic prompt  
→ 15 questions / 30 minutes  
→ Submit  
→ Initial Skill Profile  
→ Strength / Weakness  
→ Recommendation  
→ Learn / Practice

Rules:
- optional/skippable;
- no hints;
- no live feedback;
- no leaderboard;
- no explanation during attempt;
- server-based timer;
- autosubmit on expiry;
- resume supported;
- distinguish correct / incorrect / unanswered;
- result is “Initial Skill Profile”, not absolute truth;
- diagnostic contributes to streak;
- high performers can route to advanced practice/tryout.

## Flow 02 — Learn
Recommendation  
→ Subtopic  
→ Concept  
→ How to Recognize  
→ First Step  
→ Worked Example  
→ Strategy / Shortcut if valid  
→ Guided Practice  
→ Mini Assessment  
→ Mastery Evaluation  
→ Next Recommendation

Module:
- concise theory;
- mandatory “Cara Mengenali Soal”;
- mandatory “Langkah Pertama”;
- worked example;
- Guided Practice = 2 Basic + 2 Medium + 2 HOTS;
- wrong → hint → 1 retry → full explanation → optional similar;
- Mini Assessment = 5 questions:
  - 3 Medium
  - 2 Hard/HOTS
  - no hint
  - no retry
  - no live feedback
- pass >=80%;
- pass != auto-mastered;
- Mastered when mastery >=80% + sufficient evidence;
- no mid-module paywall.

## Flow 03 — Practice
Modes:
- Daily
- Recommended
- Custom

Custom filters:
- exam
- PK/PM/PU/mixed
- topic/subtopic
- Basic/Medium/Hard/Mixed/Adaptive
- count 5/10/15/20

Rules:
- elapsed timer only;
- feedback after answer;
- no retry main question;
- explanation + optional similar question;
- similar question lower mastery weight;
- adaptive may increase difficulty;
- do not auto-drop difficulty after one wrong;
- resume supported;
- practice affects mastery, not UTBK estimate directly;
- no main leaderboard;
- Daily Practice recommended from:
  - weakest topics
  - recent errors
  - spaced review
  - some strengths
- Basic farming cannot produce high mastery.

## Flow 04 — Tryout / Paid Assessment
Tryout Home  
→ Section / Package  
→ Package Detail  
→ Access Check  
→ Free / Purchased / Pro  
→ Timed Test  
→ Submit  
→ Score / Rank / Analysis  
→ Solutions  
→ Skill Update  
→ Recommendation

Rules:
- V1 PK/PM/PU;
- lifetime individual/bundle;
- Pro time-based;
- attempts unlimited;
- leaderboard uses FIRST competitive attempt only;
- retries = noncompetitive;
- save first/best;
- hard server timer;
- resume;
- no feedback/hint/AI during test;
- result tabs:
  - Result
  - Analysis
  - Solutions
  - Leaderboard
- raw score/accuracy;
- estimated UTBK only if calibrated; otherwise call performance index;
- topic/subtopic analysis;
- published package immutable/versioned;
- DRAFT → QA → PUBLISHED → ARCHIVED;
- bundle unlocks package resources;
- entitlement determines access;
- payment success should unlock automatically only after verified payment.

## Flow 05 — Progress
Tabs:
- Overview
- Skills
- Tryout
- Achievements

Math Mastery states:
- 0–39 Foundation
- 40–59 Developing
- 60–79 Proficient
- 80–100 Mastered

Features:
- weekly snapshots;
- evidence_count/confidence;
- player card;
- badge;
- streak;
- achievements;
- tryout history;
- weekly report;
- target score/current estimate/gap;
- improvement leaderboard;
- privacy opt-out.

Streak = active learning day, not login.

Qualifying:
- diagnostic complete
- module complete
- mini assessment complete
- >=5 practice questions
- tryout complete

## Flow 06 — Commerce / Entitlement
Choose Product  
→ Checkout  
→ Method  
→ Create Transaction  
→ Pay  
→ Verification  
→ Fulfillment  
→ Entitlement  
→ Auto Unlock  
→ Admin WhatsApp Notification  
→ Success

Products:
- Individual Package
- Bundle
- Pro

Rules:
- package/bundle lifetime;
- Pro time-based;
- no auto-renew V1;
- early renewal extends expiry;
- QRIS + bank transfer;
- verified payment only;
- payment status separate from fulfillment status;
- entitlement is sole source of access;
- payment events idempotent;
- WhatsApp failure must never rollback purchase;
- user cannot control payment status from frontend.
