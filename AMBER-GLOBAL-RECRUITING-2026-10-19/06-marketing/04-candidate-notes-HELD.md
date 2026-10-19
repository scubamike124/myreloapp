# Candidate notes: held until there is a real role

**Do not use.** Candidates come in on their own, for a specific role that an employer has asked Amber in writing to fill. Amber never writes first to a job seeker, never takes details from a profile, never buys a list, and never charges a candidate. Until an employer has engaged Amber, there is no honest reason to ask anyone to send details, so nothing is collected.

### Inviting applicants to one real role (example: a made-up company)

*Status: HELD: do not use.* Posted by the owner by hand, for one specific role that an employer has agreed to. Candidates come to Amber; Amber does not write to them first.

Before it is used:
- an employer has asked Amber in writing to find applicants for this role
- the employer agrees to the wording
- the intake form, consent text and privacy notice are live and a lawyer has read them

> Northwind is hiring a Senior Backend Engineer in Austin. The role has been listed since August and the team wants to hear from people who have run a Postgres-backed service in production.
>
> You can apply on Northwind's own page, or send your details to me and I will pass them to Northwind with your agreement. I do not charge candidates. What I keep, and for how long, is explained at the link.

*72 words. Wording check: 0 errors, 0 warnings.*

### Someone sends a CV without being asked

*Status: HELD: do not use.* Reply to a person who writes in on their own. The CV is not stored beyond the message until the person agrees.

Before it is used:
- the intake form and consent text are live
- a lawyer has read them

> Thanks for sending this. I have no role that fits it right now, and I am not keeping your CV unless you ask me to.
>
> If you would like me to keep it for 12 months and tell you when a role comes up, reply "keep it" and I will send you the short form that says exactly what I keep. Otherwise it will be deleted within 30 days. I never charge candidates.

*73 words. Wording check: 0 errors, 0 warnings.*

### Candidates never pay

*Status: HELD: do not use.* Public post by the owner when the candidate side opens.

Before it is used:
- the candidate side has opened

> One rule for the candidate side of Amber Global Recruiting, written before it opens: candidates are never charged. Not for a CV review, not for a profile, not for an introduction to an employer.
>
> If an employer ever pays a fee, it will be written down and the employer pays it. And if anyone asks you for money to find you a job, treat that as a warning sign, whoever they are.

*72 words. Wording check: 0 errors, 0 warnings.*

### What happens to a CV that is sent in

*Status: HELD: do not use.* Public post, or the first lines of the intake page.

Before it is used:
- the intake form and consent text are live
- a lawyer has read them

> If you send me your CV, this is what happens. I read it. If you say yes in writing, I keep it for 12 months from your last message so I can tell you about a role that fits. I show it to an employer only for a role you have picked.
>
> If you want it deleted, say so, and it is gone within 30 days.

*66 words. Wording check: 0 errors, 0 warnings.*


## The wording a candidate would agree to

This is the exact text in `src/lib/recruiting/candidates.ts` (version `2026-10-19-draft`). It is a draft for a lawyer. A candidate would tick it themselves; it would be stored with the candidate's details, the date and the version.

> I am sending my details myself. I agree that Amber Global Recruiting may keep them for 12 months from my last contact, may share them with the employers for the roles I choose, and will delete them within 30 days if I ask. I understand I will never be charged anything.

Kept for 12 months from the candidate's last contact. Deleted within 30 days of a request. A record that the deletion happened is kept, without the person's details.

## Notice for candidates (draft for a lawyer)

**Who we are.** Amber Global Recruiting, run by the owner (name and postal address in the settings), Los Angeles, California. Contact: the reply address in the settings.

**What we collect.** What you type or attach: your name, email address, where you are, your work history, skills, links you choose to share, and the roles you want to be considered for. Nothing is collected from anywhere else.

**Why.** To tell you about roles that match what you asked for, and, only with your agreement and only for roles you have picked, to give your details to the employer that is hiring.

**What we do not do.** We do not charge you. We do not buy or sell your details. We do not use software to score, rank, filter out or reject you; a person reads what you wrote. We do not collect anything from your social profiles.

**How long.** 12 months after your last contact, then it is deleted. If you ask us to delete it sooner, it is deleted within 30 days.

**Your rights.** To see what we hold, to have it corrected or deleted, and to withdraw your agreement at any time. If you live in California, the California Consumer Privacy Act gives you rights to know, delete and correct. If you live in the EU or UK, the GDPR gives you similar rights. Write to the reply address and we will answer within the time the law allows.

**Who sees it.** Only the owner and the employer for the role you picked. The service that stores the data (the database provider and the worker host) processes it for us under their terms.

**AI.** We use an AI assistant to read job listings and to draft messages. It does not decide anything about you.

*Questions for the lawyer:* whether this is enough for California, the EU and the UK; whether the processors need a data processing agreement; whether a candidate's agreement to share with a named employer needs to be collected role by role; whether a retention of 12 months is right.
