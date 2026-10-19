# Agency first messages: examples from the real composer

These four messages were composed by `composeBatch` in `src/lib/recruiting/drafts.ts` for four **invented** staffing companies, with an **invented** sender. They show what the owner will find in the queue on the page: each is built from facts about that company (the name, a role it lists, the page where its hiring address is printed) and from the owner's settings. When the sender's real name, business name and address are entered, they appear in the footer.

The composer chooses among several hand-written versions of each sentence, picks the least-used version across the batch, and tries other combinations when a message would share too much with one already made or when the wording check has something to say about it. It says what the sender is not ("I do not place candidates, so I am no competition for your desk") instead of guessing at the agency's business, and its footer says that one follow-up at most will come. Across this batch, template-like pairs: **0**.

The owner reads, edits if wanted, approves on the page, and sends from their own mail. Nothing is sent by Amber.

### A weekly list of long-open roles for Hooli Staffing

> Hi Hooli Staffing team,
>
> I saw on your careers page that Hooli Staffing is hiring a Healthcare Recruiter. I should say first that I do not place candidates. This is research for agencies.
>
> My software reads employers' public job listings and careers pages, and I check what it finds. I pick out roles that have been listed for 45 days or more. The list has one line per role: who, what, the link, when I first saw it, and the hiring address from their own site. The sample is free; if you want more, I charge a flat fee that we settle in writing before I start.
>
> Would you like a sample of ten or so employers in healthcare?
>
> Thanks,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*121 words before the footer. Wording check: 0 errors, 0 warnings.*

### A weekly list of long-open roles for Initech Talent Partners

> Hi Initech Talent Partners team,
>
> I noticed that Initech Talent Partners has a Technical Recruiter role open right now. I do not place candidates, so I am no competition for your desk.
>
> The software I run reads public job listings every day, and I check the results before anything reaches you. When a role is still listed after 45 days, I make a note of it. Each line gives the company, the role, a link to the listing, when I first saw it, and the address the company itself prints for hiring. The sample is free; if you want more, I charge a flat fee that we settle in writing before I start.
>
> Is a sample in technology something you would want to see?
>
> Thanks,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*126 words before the footer. Wording check: 0 errors, 0 warnings.*

### A weekly list of long-open roles for Cyberdyne Talent

> Hello Cyberdyne Talent team,
>
> I saw on your careers page that Cyberdyne Talent is hiring a Light Industrial Recruiter. Nothing here competes with you: I do not place candidates.
>
> I run a small program that reads employers' public job listings. I pick out roles that have been listed for 45 days or more. What I send is a plain list with the company, the role, the listing link, the first date I saw it, and the published hiring address. Nothing to pay for the sample. A regular list would be a flat fee, written down and agreed before I start.
>
> I can send ten or so rows for light industrial and trades so you can judge whether it saves you time. Should I?
>
> Thanks for reading,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*127 words before the footer. Wording check: 0 errors, 0 warnings.*

### Your Account Manager listing at Wayne Workforce Solutions

> Hello Wayne Workforce Solutions team,
>
> I was reading Wayne Workforce Solutions' open positions and noticed the Account Manager listing. I am not a recruiter and I place no one; this is research for agencies.
>
> I look at what employers publish about their open roles, with some software to do the reading. I pick out roles that have been listed for 45 days or more. Agencies get a short list: company, role, link, the date I first saw it, and the hiring address the company publishes. The sample is on me. If you want it weekly after that, it would be a flat monthly fee that we agree in writing.
>
> Would a short sample for the roles you fill be worth a look?
>
> Best,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*124 words before the footer. Wording check: 0 errors, 0 warnings.*

### The one follow-up, seven or more days later

> Hello Hooli Staffing team,
>
> On October 12 I wrote about a list of long-open roles. This is one line from it, as an example:
>
> Redwood Dental Group: Practice Manager, listed since late August. https://redwooddental.example/careers/12
>
> If you want more like it for your area, say so and I will send them. Otherwise this is my last message.
>
> Thank you,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and the last one from me. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.


## What the page checks before it calls a message ready

The wording check (above), and the compliance gate (`compliance.ts`): the company is a US business, the address is a role mailbox on its own domain, it has not been written to before, it has not asked to be left alone, the footer has the sender's name, the business, a postal address, the commercial-message line (which says one follow-up at most will come), how the address was found, and a plain way to opt out, and the owner has approved the process. A message that fails any of these is shown with the reason and cannot be approved.
