# Agency first messages: examples from the real composer

These four messages were composed by `composeBatch` in `src/lib/recruiting/drafts.ts` for four **invented** staffing companies, with an **invented** sender. They show what the owner will find in the queue on the page: each is built from facts about that company (the name, a role it lists, the page where its hiring address is printed) and from the owner's settings. When the sender's real name, business name and address are entered, they appear in the footer.

The composer chooses among several hand-written versions of each sentence, picks the least-used version across the batch, and tries other combinations when a message would share too much with one already made or when the wording check has something to say about it. It says what the sender is not ("I do not place candidates, so I am no competition for your desk") instead of guessing at the agency's business, and its footer says that one follow-up at most will come. Across this batch, template-like pairs: **0**.

The owner reads, edits if wanted, approves on the page, and sends from their own mail. Nothing is sent by Amber.

### Employers whose job ads have stayed up 45+ days

> Hi,
>
> Your careers page lists a Healthcare Recruiter role, which is how my software found Hooli Staffing. I should say up front that I place no one. I do research on employers for staffing agencies.
>
> What I look for is simple: public job listings that have stayed up for 45 days or longer. The software does the reading and I go through what it keeps. For each employer there is the role, a link to the live ad, how long it has been up, and the address the company itself prints for hiring, if it prints one.
>
> A first look costs nothing: ten or so rows, each with its link, so you can check them yourself.
>
> Shall I send them over?
>
> Regards,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*123 words before the footer. Wording check: 0 errors, 0 warnings.*

### Employers whose job ads have stayed up 45+ days

> Hi,
>
> While going through staffing firms' careers pages, my software flagged your Technical Recruiter listing, so I am writing to Initech Talent Partners. There's no candidate pitch here: I do research for agencies and place no one.
>
> I read employers' public job listings with a bit of software, and what I keep is the roles that haven't come down after 45 days. Each row gives the company, the role, the link, the date the ad went up (or the day I first saw it, when the ad shows no date), and a hiring address if the company publishes one.
>
> I would send ten or so rows first, free, and you can open each link to see whether the ad is still there.
>
> Shall I send them over?
>
> Regards,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*129 words before the footer. Wording check: 0 errors, 0 warnings.*

### Your Light Industrial Recruiter listing at Cyberdyne Talent

> Hello,
>
> You are hiring a Light Industrial Recruiter, and my software flagged the listing, which is why I am writing to Cyberdyne Talent. Roles still listed after 45 days are the ones I keep. They come from employers' own careers pages and the job boards that host them, read by my software.
>
> What comes back is one line per employer: company, role, link, date posted, and a hiring address where one is printed.
>
> To be clear, I'm not offering you candidates and I'm not a competitor.
>
> A sample of about ten rows is free, so you can check them against the live ads. Does that sound useful for light industrial and trades?
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

*114 words before the footer. Wording check: 0 errors, 0 warnings.*

### A free sample of employers with long-open job ads

> Hello Wayne Workforce Solutions team,
>
> My software flagged the Account Manager listing on your careers page, which is how Wayne Workforce Solutions came to my attention.
>
> The software goes through employers' public job pages and picks out roles that are still listed after 45 days.
>
> In the sheet you would see who is hiring, for what, where the ad is, and since when, with the company's own hiring address when it has one. You can look at ten rows for nothing and compare them with the live ads.
>
> I'm not selling candidates or placement. It's research on employers, for agencies to use. Want me to send ten rows for the roles you fill?
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

*115 words before the footer. Wording check: 0 errors, 0 warnings.*

### The one follow-up, seven or more days later

> Hi,
>
> Following my note of October 12 to Hooli Staffing, here is a single row from the list I described:
>
> Redwood Dental Group: Practice Manager, listed since late August. https://redwooddental.example/careers/12
>
> If you'd like a few more for your area, say so and I'll send them. Otherwise this is my last note.
>
> Regards,
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
