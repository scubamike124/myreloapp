# Agency first messages: examples from the real composer

These four messages were composed by `composeBatch` in `src/lib/recruiting/drafts.ts` for four **invented** staffing companies, with an **invented** sender. They show what the owner will find in the queue on the page: each is built from facts about that company (the name, a role it lists, the page where its hiring address is printed) and from the owner's settings. When the sender's real name, business name and address are entered, they appear in the footer.

The composer chooses among several hand-written versions of each sentence, picks the least-used version across the batch, and tries other combinations when a message would share too much with one already made. Across this batch, template-like pairs: **0**.

The owner reads, edits if wanted, approves on the page, and sends from their own mail. Nothing is sent by Amber.

### Hooli Staffing: employers with roles open 45+ days

> Hi Hooli Staffing team,
>
> I noticed that Hooli Staffing has a Healthcare Recruiter role open right now. A new recruiter takes a while to build a pipeline, and the desk still has to work the current roles in the meantime.
>
> I work from public job listings and nothing else. I pick out roles that have not moved in 45 days. Each line gives the company, the role, a link to the listing, when I first saw it, and the address the company itself prints for hiring. The first sample is free, and after that I would suggest a flat monthly fee, agreed in writing before anything is billed.
>
> Should I send a sample for healthcare? It would be ten rows, taken from public job listings.
>
> Thank you,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a one-time commercial message. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*128 words before the footer. Wording check: 0 errors, 0 warnings.*

### A weekly list of long-open roles for Initech Talent Partners

> Hello Initech Talent Partners team,
>
> I was reading through Initech Talent Partners' open positions and saw the Technical Recruiter role. Until that seat is filled the rest of the team is covering it, and business development is usually what slips first.
>
> I look at what employers publish about their open roles. The roles I keep are the ones that have been open for 45 days or more. Every row has the company, the role, the link to the listing, the date I first saw it, and the hiring address they publish. Nothing to pay for the sample. A regular list would be a flat fee, written down and agreed before I start.
>
> I could send ten rows for technology as a first look. Would that help?
>
> Thanks for reading,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a one-time commercial message. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*130 words before the footer. Wording check: 0 errors, 0 warnings.*

### Your Light Industrial Recruiter listing at Cyberdyne Talent

> Hi Cyberdyne Talent team,
>
> Cyberdyne Talent has a Light Industrial Recruiter position open on its careers page, which is why I am writing. Hiring for the desk takes weeks, and finding new employers to call is often the part that waits.
>
> Most of my day goes into employers' job listings and careers pages. I keep the ones where the same role has stayed open for 45 days or longer. The list has one line per role: who, what, the link, when I first saw it, and the hiring address from their own site. I do not charge for a sample. Anything after that is a flat monthly fee, in writing, before I start.
>
> Would you like a sample of ten employers in light industrial and trades?
>
> Thanks,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a one-time commercial message. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*128 words before the footer. Wording check: 0 errors, 0 warnings.*

### A weekly list of long-open roles for Wayne Workforce Solutions

> Hello Wayne Workforce Solutions team,
>
> While looking through Wayne Workforce Solutions' open positions, the Account Manager listing stood out. Most agencies I can think of would rather spend their week on calls than on searching for who to call.
>
> I go through public job listings every week. If the same job is still up after a month and a half, it goes on my list. For every role you get the company, the title, the link, the date I first saw it, and the address the company publishes for hiring. The sample is free; if you want more, I charge a flat fee that we settle in writing before I start.
>
> Is a sample of ten employers in finance and accounting something you would want to see?
>
> Best,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a one-time commercial message. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*129 words before the footer. Wording check: 0 errors, 0 warnings.*

### The one follow-up, seven or more days later

> Hello Hooli Staffing team,
>
> On October 12 I wrote about a list of long-open roles. This is one line from it, as an example:
>
> Redwood Dental Group: Practice Manager, listed since late August. https://redwooddental.example/careers/12
>
> If it is useful I will send more for your area. If it is not, that is fine, and this is the last note from me.
>
> Thank you,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a one-time commercial message. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.


## What the page checks before it calls a message ready

The wording check (above), and the compliance gate (`compliance.ts`): the company is a US business, the address is a role mailbox on its own domain, it has not been written to before, it has not asked to be left alone, the footer has the sender's name, the business, a postal address, the one-time-commercial-message line, how the address was found, and a plain way to opt out, and the owner has approved the process. A message that fails any of these is shown with the reason and cannot be approved.
