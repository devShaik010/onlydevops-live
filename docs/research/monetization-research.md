# OnlyDevOps Paid Product Strategy

## Recommendation

**Build OnlyDevOps Practice: a focused subscription that connects the existing DevOps checklist to troubleshooting exercises, project evidence, and interview explanations. Test $7 per month as the initial international price.** Keep the present roadmap, accounts, and saved checklist progress free. The paid value should be the structured practice and feedback that help someone use those skills.

Start with early-career engineers and developers moving into DevOps who already know some Linux, Git, or Docker. A complete beginner may need a course before this product becomes useful. An experienced SRE will expect deeper systems problems and stronger lab infrastructure. Serving both immediately would dilute the first release.

The strongest first feature is a **DevOps troubleshooting and pull-request practice library**. Learners investigate a broken deployment, examine realistic logs and configuration, submit a fix, and explain why it works. Link the result back to the exact skills on their sheet. Add a small project portfolio and targeted revision before adding large course libraries or hosted cloud labs.

The $7 price is a hypothesis to validate. Existing competitors already sell substantial practice at nearby prices, and public evidence cannot establish that OnlyDevOps users will pay or remain subscribed. Launch a small paid offer, measure actual use and renewal, and expand the subscription only when there is enough content and a sustainable publishing cadence.

## 1. Scope and evidence

This report treats OnlyDevOps as a product moving into production. The local directory still uses the historical name `onlydevops-poc`; that name does not define the recommended product scope. The current implementation has React, FastAPI, PostgreSQL, 452 tracked items across 11 topics, guest-to-account progress import, cross-device account progress, filters, and resume behavior. The reviewed files contain no payment or entitlement implementation. Password recovery, verified email, versioned migrations, and a documented backup system remain gaps in the current product documentation. These are observations of the local code and README, not a production infrastructure audit.

The working commercial assumptions are an India-based business selling to Indian and international learners, a small delivery team, and a desired entry price near US$7. Business registration, customer geography, staffing, traffic, budget, and existing payment approvals have not been established. Payment recommendations are conditional on these facts.

Prices and provider policies were checked on **11 September 2026**. Vendor pages are evidence of advertised offers, not audited revenue or proof of demand. Dynamic prices, promotions, taxes, and country-specific offers require confirmation before a buying or implementation decision. All OnlyDevOps package quantities, scores, cost assumptions, prices, and success thresholds below are proposals rather than existing capabilities or market benchmarks.

## 2. Market evidence and competitive pressure

The Linux Foundation's 2026 talent research draws on 400 global respondents surveyed in February 2026 and discusses gaps in security and operational readiness. It supports investigating practical cross-skill training. It does **not** measure Indian students' willingness to pay $7, and it was produced within an ecosystem that includes training providers. Use it as directional employer evidence, not a market-size estimate. [Linux Foundation research summary](https://training.linuxfoundation.org/blog/just-released-2026-state-of-tech-talent-report/) · [Report overview](https://www.linuxfoundation.org/research/open-source-jobs-report-2026?hsLang=en)

| Product | Verified offer or price signal | Implication for OnlyDevOps |
|---|---|---|
| SadServers | Pro: **$9/month or $72/year**. Pro+: **$11/month or $88/year**. Troubleshooting scenarios, solutions, and progressively stronger access features. | $7/month is close to a mature direct competitor; $72/year is only $6/month equivalent. A lower sticker price is insufficient differentiation. [Pricing](https://sadservers.com/pricing) |
| iximiuz Labs | Pricing page lists regular **$20/month or $120/year**, alongside a temporary Fair Pricing offer. Retrieved versions differed on the discount: do not treat a promotional minimum as stable. | A small specialist can compete through content quality and technical depth. Annual equivalents and discounts make price-only positioning fragile. [Pricing](https://labs.iximiuz.com/pricing?open=plans) |
| KodeKloud | Standard, Pro, and AI plans combine courses and hands-on practice; higher plans add playgrounds, projects, and guidance. Exact regional prices were not reliably exposed in the retrieved page. | Competing on catalogue size or a general AI tutor would be expensive. Its support page confirms regional and promotional price variation. [Plans](https://kodekloud.com/pricing) · [Pricing explanation](https://support.kodekloud.com/how-can-i-check-the-latest-kodekloud-pricing-and-available-discounts) |
| roadmap.sh | Pro markets AI courses, quizzes, roadmaps, and coaching, with a $10/month marketing reference. The dynamic individual checkout amount was not reliably exposed; Teams explicitly shows **$10/seat/month billed annually**, minimum three seats. | A tracker plus generic AI chat already has close substitutes. Do not assume the individual marketing reference means $10 charged monthly. [Premium](https://roadmap.sh/premium) |
| killer.sh | CKA, CKS, or CKAD: **$39.99 for two simulator sessions** per exam. Other simulators have different prices. | Specific, time-bounded assessment can support a one-time purchase. This is not comparable to an unlimited monthly subscription. [FAQ](https://killer.sh/faq) |
| Killercoda | Free use of non-course scenarios, with paid features for longer sessions and additional capabilities. Its FAQ says external platforms cannot require a separate purchase to make a public scenario solvable. Current paid price was not verified. | Free practice is substantial competition. It cannot simply become the hidden free backend of OnlyDevOps's paid exercises. [FAQ](https://killercoda.com/faq) |
| Free project and interview resources | The Cloud Resume Challenge's core steps are free. The DevOps Exercises repository contains public questions and exercises across many tools. | Charge for an integrated practice experience, maintained assessment, and useful feedback—not merely a list of links or repackaged questions. [Cloud Resume Challenge](https://cloudresumechallenge.dev/docs/faq/) · [DevOps Exercises](https://github.com/bregman-arie/devops-exercises) |

**Commercial interpretation:** the opportunity is narrower than “affordable DevOps education.” OnlyDevOps could make the journey from a checked skill to a working change and a clear explanation unusually convenient. None of the reviewed evidence establishes that this combination is unique. Its advantage must be demonstrated through product quality and learner results.

A promising acquisition audience is a developer or support engineer saying: “I have watched the tutorials, but I cannot debug confidently or explain a project in an interview.” A secondary audience is a junior DevOps engineer practicing the problems encountered at work. College-wide training and employer assessments are later markets with different buying and support requirements.

## 3. Ranked feature opportunities

Scores are analytical judgments. Each dimension uses 1–5, where 5 is favorable. The priority score is 30% strength of the learner problem, 25% fit with the existing platform, 25% feasibility at $7, and 20% reason to return. It is not a forecast of conversion. “Feasibility” includes engineering, content maintenance, infrastructure, and support—not just coding time.

| Rank | Feature | Problem / Fit / Feasibility / Return | Score / 5 | Charging model and decision |
|---|---|---|---|---|
| 1 | Troubleshooting and broken-PR challenges | 5 / 5 / 4 / 5 | 4.75 | Main $7 Practice feature. Start with supplied logs/configuration and constrained answer checks. |
| 2 | Guided projects with evidence and explicit checks | 5 / 5 / 3 / 4 | 4.30 | Include a small library; deeper project packs can later be $9–15 each. |
| 3 | Interview practice based on completed work | 5 / 4 / 4 / 4 | 4.30 | Bundle structured text sessions. Human interviews are separately priced. |
| 4 | Revision queue based on mistakes | 3 / 5 / 5 / 4 | 4.20 | Subscription retention feature; weak reason to buy alone. |
| 5 | Learning plan tied to a job description | 4 / 5 / 4 / 3 | 4.05 | Later bundle feature. Start with an editable skill mapping and explicit gaps. |
| 6 | Weekly incident series | 4 / 4 / 3 / 5 | 3.95 | Publish inside the subscription once the editorial cadence is proven. |
| 7 | Project evidence profile and export | 4 / 5 / 4 / 2 | 3.85 | Bundle feature. Basic access to earned records should survive cancellation. |
| 8 | Certification readiness practice packs | 4 / 4 / 3 / 3 | 3.55 | Optional $9–19 packs later; original questions and a clear version policy. |
| 9 | DevOps configuration review assistant | 4 / 4 / 2 / 4 | 3.50 | Metered automation after rule-based checks are reliable. |
| 10 | Budgeted browser Linux/Docker labs | 5 / 4 / 1 / 3 | 3.35 | Separate usage-limited add-on after measuring session cost and support. |
| 11 | Team or college assignments and progress | 4 / 3 / 2 / 4 | 3.25 | Sell a bounded institutional pilot before building team administration. |
| 12 | Focused downloadable practice packs | 3 / 3 / 5 / 1 | 3.10 | $7 one-time purchase is a useful alternative if subscription retention is weak. |
| 13 | Human project review | 5 / 3 / 1 / 2 | 2.90 | $25–49 starting price hypothesis; capacity-limited service, not included at $7. |
| 14 | Human mock interview | 5 / 2 / 1 / 2 | 2.65 | $29–59 starting hypothesis, depending on reviewer cost and duration. |
| 15 | Architecture design and review workspace | 3 / 2 / 2 / 3 | 2.50 | Revisit after demand is established; the older designer is a separate codebase. |

### Troubleshooting and broken-PR challenges

Give the learner a short incident brief, selected logs, a small repository diff, and a concrete acceptance condition. Examples include an Nginx upstream failure, a Docker service listening on the wrong interface, a workflow with excessive token permissions, a Kubernetes readiness problem, and a Git recovery task. Have the learner identify relevant evidence, propose a change, verify it, and explain the trade-off.

For the first release, use authored evidence bundles and a constrained patch or configuration editor. Do not imply that a static command-output exercise is a live terminal. Avoid arbitrary server-side code execution in the initial challenge engine. Deeper runnable exercises can be supplied as clearly documented local projects, with hosted execution developed separately.

Each exercise should map to existing item IDs and record first attempt, hints used, independent completion, and later revision. Self-checking an item stays a separate signal from passing an assessment. That distinction makes the tracker more informative without claiming formal certification.

### Projects with evidence

Offer three coherent projects for the first full subscription: containerize and deploy an application; build and repair a CI pipeline; operate a local Kubernetes application with health checks and rollback. Each needs a brief, starter files, milestones, an acceptance rubric, common failures, and a reference explanation.

In the first version, local tests produce a report the learner can attach alongside a commit link. Label this **self-submitted evidence**, since the learner controls the local environment. “Platform-checked” results require a trusted execution path; “human-reviewed” requires actual review. Showing these distinctions protects the usefulness of the portfolio.

### Interview practice that uses the learner's work

Ask the learner to explain a fix they actually made: why a readiness probe differs from liveness, what signal justified rollback, or what would change under higher load. Score coverage against a maintained rubric: diagnosis, evidence, remediation, verification, and prevention. Offer a strong example answer after submission.

Begin with text and authored feedback. AI can later personalize follow-ups using the approved scenario context, with visible usage limits and a fallback when generation fails. Do not market this as a hiring probability, an accredited assessment, or access to real employer interview questions.

### Revision and job alignment

The revision queue should resurface missed concepts and variations of previously failed tasks. It should distinguish “never attempted,” “passed with hints,” and “passed independently.” The existing Continue learning action can eventually offer the next skill or the next useful practice task.

A job-description feature could map a pasted role to the syllabus, explain why each skill is relevant, and propose a weekly plan. It must visibly flag unmapped requirements such as networking, observability, IAM, a specific cloud, or incident communication. A numerical match is a syllabus match, not a prediction of employment. Keep this secondary until users repeatedly ask for it.

### Services and later products

Human feedback is attractive when bounded: one repository, a checklist-based review, a short recorded explanation, one follow-up, and a clear turnaround. A $7 group clinic can work only with enough paid seats; for example, ten seats gross $70 before fees and preparation. It also creates scheduling, attendance, and refund work. It should not become an unlimited support promise.

Team features could include assignments, cohort progress, a manager view, and billing for a defined seat count. Test one $49–99/month small-team pilot as a separate pricing experiment before adding SSO, recruiting workflows, or a marketplace. Employer assessment is a different product from personal learning and needs stronger identity, privacy, and assessment validity.

## 4. The recommended first paid offer

**Target public offer: OnlyDevOps Practice, $7/month, cancel renewal at any time.** The following is a release specification, not a description of features already built.

| Area | Free | $7/month Practice |
|---|---|---|
| Current product | All existing syllabus topics, checklist tracking, accounts, sync, and resume | Included |
| Try practice | Three complete sample challenges and one project preview | At least 30 reviewed challenges across Linux, Git, Docker, CI/CD, and Kubernetes |
| Projects | Preview the requirements and expected outputs | Three complete project tracks with local test instructions and evidence records |
| Feedback | Full feedback on the sample challenges | Authored explanations and rule-based feedback throughout |
| Revision | Basic topic progress | Mistake history and a recommended revision queue |
| Interview practice | One sample rubric | Four guided text sessions per billing period; AI is optional and separately bounded |
| New material | Occasional public examples | Target four reviewed challenges each month, only once production capacity supports it |
| Results | Access to existing checklist data | Exportable attempt and project records; earned history remains readable after expiry |
| Computing and people | No bundled cloud account | No promise of unlimited hosted computing or individual mentorship |

For a smaller first commercial release, sell a clearly described **$7 non-renewing 30-day Practice Pass** containing ten finished challenges and one project. This establishes real purchase behavior without promising a catalogue or recurring delivery that does not yet exist. Publish the access period and included content before checkout. Do not silently convert pass buyers into subscribers.

After repeat engagement and renewal evidence, introduce the full monthly plan. Consider **$70/year** later: ten monthly payments for twelve months of access, a 16.7% discount from $84. Annual cash helps funding, but it also commits the business to a year of delivery. Avoid lifetime hosting offers during an uncertain cost stage.

For India, test **₹499 versus ₹599 per month** as separate regional price hypotheses, not currency conversions. Prefer a clear tax-inclusive consumer price where the business can support it. Confirm the applicable product tax treatment before publishing the amount. Do not launch many plans or coupons before one offer works.

### A concrete sample experience

The learner reaches Docker networking on the sheet and selects “Practice this skill.” The incident says a service returns 502 after a release. They receive the reverse-proxy configuration, Compose service definitions, a change diff, and selected logs. They identify an upstream port mismatch, submit the relevant configuration fix, and state how they would confirm recovery.

The exercise validates the supported configuration change and compares the explanation with an explicit rubric. It then presents alternative diagnoses and why the supplied evidence makes them less likely. The result links back to the skill sheet and schedules a later variation. A related project milestone asks the learner to make their own application pass a health check and document a rollback.

This creates a coherent reason to pay: a maintained sequence from learning to application to explanation. Whether learners value it more than competing practice products remains the central experiment.

## 5. Payment-provider decision

### India-first sales

**Shortlist Razorpay first if the business is registered in India and Indian learners are the initial audience.** Its published standard pricing is generally 2% plus GST on the provider fee. Its February 2026 pricing explanation also lists an additional 0.99% subscription fee over the underlying payment-method fee. International card pricing is listed separately at 3% plus GST; other international methods can differ. Obtain the actual recurring-payment quote rather than budgeting only 2%. [Standard pricing](https://razorpay.com/pricing/) · [Detailed fee explanation](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/)

Verify account activation, UPI AutoPay, target card types, recurring international payments, settlements, refund costs, and the export documentation applicable to this business. Ordinary international payment support is not evidence that every international subscription method is approved. Razorpay documents additional-method activation and international product support. [Payment methods](https://razorpay.com/docs/payments/payment-methods/?preferred-country=IN) · [International payments](https://razorpay.com/docs/payments/international-payments/?preferred-country=IN)

### International-first software subscription

**Evaluate Paddle if most customers will be outside India and the approved product is software.** Its advertised fee is 5% + $0.50, including merchant-of-record billing and sales-tax services. Paddle specifically asks businesses selling below $10 to contact it for custom pricing. India is not on the listed unsupported supplier-country list, but geography does not guarantee approval, acceptable product classification, or a particular payout arrangement. [Pricing](https://www.paddle.com/pricing) · [Country policy](https://www.paddle.com/help/legal/sanctions/which-countries-are-supported-by-paddle)

Paddle focuses on software and restricts unrelated human services. Treat standalone mentoring or interview services as a separate approval and payment question. A software subscription cannot be assumed to authorize every future service. [Acceptable-use explanation](https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle)

### Alternatives and limitations

Lemon Squeezy advertises 5% + $0.50; its fee documentation adds 0.5% for subscriptions, 1.5% for non-US transactions, and 1.5% for PayPal payments when applicable. Bank and PayPal payouts can also incur fees. Indian merchants without Stripe pre-approval may have to use PayPal payouts. Evaluate the actual settlement route before relying on it. [Pricing](https://www.lemonsqueezy.com/pricing) · [Fees](https://docs.lemonsqueezy.com/help/getting-started/fees) · [Supported countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries)

Lemon Squeezy's prohibited-products policy includes services, job boards, advertising, and marketplaces. It may suit an approved SaaS or digital product, but it is not a universal checkout for the service ideas in this report. [Product policy](https://docs.lemonsqueezy.com/help/getting-started/prohibited-products)

Stripe states that new Indian accounts remain invite-only. Use an already approved account if it suits the business; do not make launch dependent on receiving a new invitation. If the business is based elsewhere, reconsider Stripe against that country's actual account eligibility, Billing fees, and local payment methods. [India account policy](https://support.stripe.com/questions/stripe-accounts-are-invite-only-in-india?locale=en-GB)

A merchant of record can handle the customer transaction's covered indirect-tax obligations. It does not remove the business's own income-tax, accounting, or local reporting responsibilities. Exact obligations depend on the seller and buyer jurisdictions and product classification. [Merchant-of-record tax explanation](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat)

**Decision sequence:** establish seller country and first customer market; obtain product and payout approval; confirm full fees; then implement one provider. Start with Razorpay for a primarily Indian launch or evaluate Paddle for a primarily global software launch. Add a second provider only if measured checkout failures or market expansion justify the extra reconciliation work.

## 6. Can $7 work economically?

Yes, it can be viable for a product dominated by maintained content, deterministic checks, and limited automation. It is much harder when the same fee includes significant computing time or personal review. The following calculations are planning scenarios, not vendor quotes for infrastructure or forecasts of OnlyDevOps profit.

### Payment deductions

| Case | Calculation | Result before other costs |
|---|---|---|
| $7 payment at 5% + $0.50 | $7 − $0.35 − $0.50 | **$6.15**; fees consume 12.14% of price |
| $7 non-US card subscription under the listed Lemon Squeezy percentages | $7 − (7% × $7) − $0.50 | **$6.01**, before payout fees; assumes no buyer tax or other extras |
| $70 annual payment at 5% + $0.50 | ($70 − $3.50 − $0.50) ÷ 12 | **$5.50/month equivalent** before service costs |
| ₹599 domestic recurring payment using 2% + 0.99%, with 18% GST on those fees | ₹599 − [₹599 × 2.99% × 1.18] | **₹577.87**, before the product's own taxes and other costs |

These use the published schedules above for illustration. A sub-$10 Paddle quote may differ. Provider fee taxes and tax charged on the subscription itself are different amounts. For merchants of record, fee calculation on the tax-inclusive order total can reduce proceeds further. [Paddle schedule](https://www.paddle.com/pricing) · [Lemon Squeezy calculation basis](https://docs.lemonsqueezy.com/help/getting-started/fees) · [Razorpay subscription schedule](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/)

### Contribution per monthly subscriber

Assume the $7 is revenue before customer sales tax, payment cost is $0.85, variable application/feedback cost is $0.35, a support-cost reserve is $0.40, and a refund/fraud reserve is $0.21. The latter three figures are internal budget allowances that must be measured. They do not imply a verified infrastructure or AI price.

| Service model | Extra assumed cost | Contribution before fixed costs, content production, acquisition, and tax |
|---|---|---|
| Content and constrained assessment | None beyond the allowances above | **$5.19/month**, about 74% of $7 |
| Same product plus 20 hosted lab hours at $0.10/hour | $2.00 | **$3.19/month** |
| Same product plus 20 hosted lab hours at $0.50/hour | $10.00 | **−$4.81/month** |
| Same product plus one 20-minute human review at $15/hour | $5.00 | **$0.19/month** |

The lab rates and review rate are sensitivity assumptions, not claimed market rates. Lab budgets must include idle capacity, memory, storage, networking, provisioning failures, abuse, and teardown—not just nominal CPU hours. Measure active users and heavy users separately; an average can hide unprofitable unlimited usage.

At the base $5.19 contribution, 100 monthly subscribers provide $519 before fixed costs. If fixed tools and infrastructure cost $200/month, $319 remains before ongoing content work, owner pay, customer acquisition, and taxes. Adding 20 hours of monthly content work valued at $20/hour raises the assumed recurring fixed requirement to $600; approximately **116 monthly subscribers** would cover that amount. This does not repay initial development or catalogue creation.

At $70/year, the same $0.96 monthly variable allowances leave $4.54/month equivalent contribution. Annual billing reduces transaction frequency, but the discount still reduces revenue per service month. Do not present prepaid annual cash as monthly recurring revenue or immediately available profit.

A $7 tax-inclusive price also needs a sensitivity check. If an illustrative 20% consumption tax applied, pre-tax revenue would be $5.83. With an $0.85 fee on the $7 total and $0.96 other variable allowances, contribution would be about $4.02. This is a tax-rate scenario, not a conclusion about the tax rate applicable to OnlyDevOps.

**Budget rule:** keep the first paid product free of unlimited lab or human-service commitments. Add optional AI only after measuring cost per accepted answer, retry frequency, quality, and usage distribution. Set customer-visible quotas and server-side enforcement; choose the model through an evaluation on actual exercises rather than assuming one model will remain economical.

## 7. Production architecture and release requirements

The existing React/FastAPI/PostgreSQL stack can support the first paid release. No evidence here justifies a rewrite into microservices or deploying Kubernetes merely to sell subscriptions. Extend the application with explicit billing, access control, content versioning, and assessment records. These are proposed implementation requirements, not claims that the current stack already meets them.

### Accounts and learner records

Add a verified recovery contact or another reliable recovery method before charging for persistent access. Existing username accounts need a migration path that requires an authenticated user to link the recovery identity; never infer ownership from a matching username. Password reset must revoke or rotate relevant sessions and avoid exposing account existence. Preserve existing learner IDs and completed-item IDs.

Keep checklist completion separate from assessment attempts and project evidence. Record challenge version, submission, result, rubric version, hint usage, timestamps, and verification method. Public profiles should be opt-in, with a way to remove shared records. Cancellation should stop future paid access while preserving access to the learner's existing progress and earned records under a published retention policy.

### Billing and access

Use a hosted checkout so the application does not collect card numbers. Create checkout sessions on the server using an allowed price ID and the authenticated account ID. Never accept a client-supplied amount or grant paid access simply because a success page loaded.

Store provider customer and subscription identifiers, current period end, cancellation state, product access, payment-event IDs, and audit entries. Model access as a server-side entitlement with an expiry, rather than a browser flag or permanent `is_pro` boolean. Paid APIs and content downloads need the same checks as the UI.

Validate webhook signatures over the raw request body, store the event durably, process it once, and handle delayed or out-of-order delivery. Razorpay explicitly documents duplicates and unordered delivery; Paddle likewise advises using event occurrence time. Run reconciliation against provider state so a missed event does not permanently lose access or grant it indefinitely. [Razorpay webhook validation](https://razorpay.com/docs/webhooks/validate-test/?preferred-country=US) · [Paddle delivery behavior](https://developer.paddle.com/webhooks/about/how-webhooks-work/)

Define behavior for successful payment, renewal failure, grace period, cancellation at period end, immediate cancellation, refund, dispute, and expired access. A cancellation request and an expired paid period are different states. Provide receipts, renewal dates, payment-method management where supported, and easy cancellation. [Paddle access-state guidance](https://developer.paddle.com/build/subscriptions/provision-access-webhooks/)

### Assessment execution

For the first release, validate supported configuration structures and authored answers without running arbitrary learner code. A future project checker or hosted lab must run in disposable, isolated infrastructure separated from the application, payment secrets, and database. Avoid shared privileged runners, host Docker sockets, or access to cloud metadata. Apply time, resource, networking, and spending limits.

GitHub warns that self-hosted runners can be persistently compromised by untrusted workflow code. That directly matters if project checking evolves into executing public submissions. A container alone is not a complete design for hostile multi-tenant workloads. [GitHub security guidance](https://docs.github.com/en/actions/reference/security/secure-use?learn=getting_started&learnProduct=actions)

### Operations and launch gate

Before accepting real payments, complete a production-specific review of HTTPS and cookies, secret storage, database migrations, backups and a restore drill, monitoring, deployment rollback, account recovery, and paid-access isolation. Add payment failure and webhook-replay tests to the existing suite. Existing local tests are useful evidence of current behavior; they do not certify production billing readiness.

Publish the actual catalogue, price, tax treatment, renewal terms, cancellation/refund policy, support contact, and expected response time. Test a complete authorized live purchase-to-access-to-cancellation path before public promotion, with the business owner controlling the payment instrument. Remove historical POC labels from product UI and documentation as part of the production release, while accurately identifying features still in development.

## 8. Content quality and defensibility

The principal long-term asset should be a maintained library of original tasks, feedback, and learning evidence. A generic AI wrapper is easily substituted. A carefully designed exercise that accepts valid alternative solutions, explains a failure, and stays current is harder to maintain and potentially more valuable.

Every paid task needs an owner, supported tool version, acceptance rubric, reference result, difficulty estimate, review date, and an issue-reporting route. Test more than the author's preferred answer. Separate a factual wrong answer from a valid alternative and give learners a way to challenge grading. Run periodic checks when tools or APIs change.

Use documentation and open resources as references with appropriate licensing and attribution. Write original tasks; do not copy paid competitor scenarios or exam content. Record the license of any starter repository, logo, or redistributed file. Link to external practice where useful, but do not promise uptime, private content, or paid integration rights without an agreement.

Estimate the content workload before setting a release date. For example, 30 tasks at three hours each, three project tracks at twelve hours each, and forty additional QA hours total **166 hours**. These are planning assumptions; genuinely complex runnable exercises may take much longer. Subscription publishing consumes founder time even when serving another user costs almost nothing.

Extend the syllabus where the exercises expose omissions. Networking/DNS/HTTP/TLS, observability, IAM/secrets, incident communication, and basic cloud operations are sensible candidates. Validate the target role before expanding into every cloud provider. The first paid experience can be narrow and clearly labeled without pretending the current 11-topic checklist is exhaustive.

## 9. Validation and launch sequence

An initial eight-to-twelve-week planning window is reasonable only as a small-team hypothesis, with provider onboarding and content review as dependencies. Milestone completion should control launch timing. A shorter focused release is preferable to billing for unfinished functionality.

| Stage | Deliverable | Decision evidence |
|---|---|---|
| Weeks 1–2: customer and content test | Interview 10–15 target learners; observe five attempting three prototype challenges; define the first offer and apply for the relevant payment account. | Do they have the same recurring problem? Where do they get stuck? What have they already paid for? |
| Weeks 3–4: commercial foundations | Recovery identity, migrations, hosted checkout, access records, cancellation/refund handling, observability, and a restored backup. | Sandbox billing scenarios pass; account and paid-access isolation are demonstrated. |
| Weeks 4–6: bounded paid release | Ten reviewed challenges, one project, clear feedback, and the $7 non-renewing pass. | Real payments, completed exercises, support load, and explicit reasons for purchase/refund. |
| Weeks 7–9: retention and content expansion | Fix grading issues, add revision, grow the catalogue, and follow the first cohort. | Users return to practice and ask for further material; the second payment is possible to measure. |
| Weeks 10–12: full subscription decision | Release the 30-challenge/three-project package only if it exists and can be maintained. | Repeat use, acceptable support cost, and monthly delivery capacity justify recurring billing. |

Ask about recent behavior rather than hypothetical enthusiasm. Useful questions include: “Show me the last deployment issue you could not solve”; “What did you use next?”; “Which learning product did you most recently pay for, and why?”; and “Would this exercise replace something you already use?” Include learners who choose a competitor or decline to pay.

Use a small set of **internal decision thresholds**, not claims about industry averages: seek at least 10 genuine buyers among the first 50 qualified learners who see the finished offer; at least half of those buyers should complete three exercises within seven days; and at least four of the first ten should make a second purchase or renewal when eligible. These small counts are directional and highly uncertain. Report numerator, denominator, recruitment source, price, and refund status; do not extrapolate them into a large market forecast.

Track preview completion, checkout start, paid activation, first challenge completion, repeat weekly practice, project milestone completion, renewal eligibility, successful renewal, cancellations, refunds, and support minutes per payer. A screenshot of “100 accounts” says little about whether a paid product works. Cohort renewal counts should exclude people whose renewal date has not arrived.

For acquisition, publish a small number of excellent free incident exercises, share useful original technical explanations in relevant communities under their rules, and make optional project evidence easy to share. Test college clubs and developer communities manually. Do not begin with broad paid advertising: at the illustrative $5.19 monthly contribution, a $20 acquisition cost requires about four paid months just to recover, before fixed costs and content work.

If people buy a pack but do not return, prefer discrete project or interview-sprint products. If they repeatedly request live environments, measure willingness to pay for a capped lab add-on. If they mostly want a human reviewer, validate a higher-priced service with a small queue. These are legitimate outcomes of the research, not reasons to force a subscription.

## 10. Ideas to defer

**A large video-course library:** high production and maintenance burden with little advantage over established catalogues. Use concise explanations attached to exercises first.

**Unlimited AI chat or generated roadmaps as the headline:** competing products already offer these, while usage costs and incorrect technical answers still require control. Add AI where it improves a specific measured interaction.

**Unlimited Kubernetes or cloud accounts for $7:** cost, isolation, provisioning, and support must be proven first. Low-cost competitors are not evidence that OnlyDevOps will have the same economics.

**Certificates for checking boxes:** these would overstate what the product has assessed. Provide transparent completion and evidence records instead of implying recognized certification.

**Paid job listings, placement guarantees, or a mentor marketplace:** these require employer supply, trust, operations, and sometimes different payment eligibility. They do not follow automatically from having learner accounts.

**Charging for basic account recovery, saved progress, or exporting a learner's existing records:** these are part of operating a trustworthy production service. Monetize additional practice and value.

**Reintegrating the architecture designer immediately:** it is an interesting later path, especially for design reviews, but it adds a second product surface before the first paid need is validated.

## 11. Decision and remaining uncertainties

Approve the product direction as **free learning tracker plus paid DevOps practice**. Build the troubleshooting engine, connect it to skills, and add one meaningful project before widening the catalogue. The first commercial experiment should cost around $7 and have a concrete, finished deliverable. Recurring billing should follow recurring value.

The unresolved commercial questions are who will buy first, whether they prefer a pass or subscription, why they would choose OnlyDevOps over existing practice platforms, and whether they will return. The unresolved delivery questions are content-authoring capacity, grading reliability, and measured support costs. The unresolved payment questions are seller jurisdiction, provider approval, target recurring methods, full fees, and settlement route.

No payment accounts have been created, customers contacted, or subscriptions enabled as part of this report. The implementation remains to be planned and built. The recommendations provide a production-oriented decision framework and a testable paid offer; they do not establish product-market fit.

## Sources

All web sources below were accessed on 11 September 2026. Publication dates are included where reliably exposed; otherwise the source is an undated live page. Inline links identify the specific claims supported. Repeated appearances of a source refer to the same page.

1. Linux Foundation Education. [Just Released: 2026 State of Tech Talent Report](https://training.linuxfoundation.org/blog/just-released-2026-state-of-tech-talent-report/). 2026. Survey timing and population; directional skills evidence.
2. Marco Gerosa, Adrienn Lawson, and Anna Hermansen, Linux Foundation Research. [2026 State of Tech Talent Report overview](https://www.linuxfoundation.org/research/open-source-jobs-report-2026?hsLang=en). 2026. Workforce and operational-readiness context. The report's download was not reliably retrievable; this analysis uses the accessible publisher summaries.
3. SadServers. [Pricing](https://sadservers.com/pricing). Live page. Monthly and annual individual offers; verified against directly retrieved page text.
4. iximiuz Labs. [Plans & Pricing](https://labs.iximiuz.com/pricing?open=plans). Live page. Regular monthly and annual prices; promotional values varied between retrieved versions and are not used as a stable benchmark.
5. KodeKloud. [Pricing & Subscription Plans](https://kodekloud.com/pricing). Live page. Feature bundles; exact personalized prices not verified.
6. KodeKloud Support. [How can I check the latest KodeKloud pricing and available discounts?](https://support.kodekloud.com/how-can-i-check-the-latest-kodekloud-pricing-and-available-discounts). Undated. Regional, currency, tax, and promotional variation.
7. roadmap.sh. [Premium Features](https://roadmap.sh/premium). Live page. AI feature competition and explicit team annual-billing terms; individual checkout amount unresolved.
8. killer.sh. [FAQ](https://killer.sh/faq). Live page. Exam-specific two-session pricing and access model.
9. Killercoda. [FAQ](https://killercoda.com/faq). Live page. Free scenarios, paid capabilities, and limits on external-platform dependencies. The paid pricing page required JavaScript and was not used for a price claim.
10. The Cloud Resume Challenge. [Challenge FAQ](https://cloudresumechallenge.dev/docs/faq/). Undated. Free core project steps.
11. Arie Bregman and contributors. [DevOps Exercises](https://github.com/bregman-arie/devops-exercises). Live repository. Public exercises and interview-preparation substitute.
12. Razorpay. [Payment Gateway Pricing](https://razorpay.com/pricing/). Live page. Standard gateway fees.
13. Razorpay. [Payment Gateway Pricing and Fees Explained](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/). 13 February 2026. Subscription surcharge, fee GST, international-method distinctions.
14. Razorpay Docs. [About Payment Methods](https://razorpay.com/docs/payments/payment-methods/?preferred-country=IN). Live documentation. Activation and available local methods.
15. Razorpay Docs. [About International Payments](https://razorpay.com/docs/payments/international-payments/?preferred-country=IN). Live documentation. International support and activation dependencies.
16. Paddle. [Pricing](https://www.paddle.com/pricing). Live page. Advertised processing/MoR price and sub-$10 custom-pricing instruction.
17. Paddle Help Center. [Which countries are supported by Paddle?](https://www.paddle.com/help/legal/sanctions/which-countries-are-supported-by-paddle). Live policy. Supplier-country restrictions; no guarantee of approval.
18. Paddle Help Center. [Understanding Paddle's Acceptable Use Policy](https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle). Updated 13 April 2026. Software focus and unrelated-human-service restrictions.
19. Lemon Squeezy. [Pricing](https://www.lemonsqueezy.com/pricing). Live page. Base platform fee.
20. Lemon Squeezy Docs. [Fees](https://docs.lemonsqueezy.com/help/getting-started/fees). Live documentation. Subscription, international, PayPal, and payout fees; fee calculation base.
21. Lemon Squeezy Docs. [Supported Countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries). Live documentation. India payout qualification.
22. Lemon Squeezy Docs. [Prohibited Products](https://docs.lemonsqueezy.com/help/getting-started/prohibited-products). Live policy. Restrictions affecting services and alternative business models.
23. Stripe Support. [Stripe accounts are invite-only in India](https://support.stripe.com/questions/stripe-accounts-are-invite-only-in-india?locale=en-GB). Live policy. New-account availability.
24. Lemon Squeezy Docs. [Sales Tax and VAT](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat). Live documentation. Merchant-of-record tax scope and seller obligations.
25. Razorpay Docs. [Validate and Test Webhooks](https://razorpay.com/docs/webhooks/validate-test/?preferred-country=US). Live documentation. Raw-body validation, duplicates, and event ordering.
26. Paddle Developer Docs. [How webhooks work](https://developer.paddle.com/webhooks/about/how-webhooks-work/). Live documentation. Event processing and ordering.
27. Paddle Developer Docs. [Provision access and handle subscription state](https://developer.paddle.com/build/subscriptions/provision-access-webhooks/). Live documentation. Application access lifecycle.
28. GitHub Docs. [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use?learn=getting_started&learnProduct=actions). Live documentation. Untrusted-code execution and runner isolation.
29. OnlyDevOps local source. `README.md`, `frontend/src/main.jsx`, `backend/app/main.py`, `docker-compose.yml`, and the existing test files in `/Users/talentcogent/onlydevops-poc`. Reviewed locally; not a publicly cited release or deployment audit.
