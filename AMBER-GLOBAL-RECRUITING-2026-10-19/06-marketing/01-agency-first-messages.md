# Agency first messages: examples from the real composer

These four messages were composed by `composeBatch` in `src/lib/recruiting/drafts.ts` for four **invented** staffing companies, with an **invented** sender. They show what the owner will find in the queue on the page: each is built from facts about that company (the name, a role it lists, the page where its hiring address is printed) and from the owner's settings. When the sender's real name, business name and address are entered, they appear in the footer.

The composer chooses among several hand-written versions of each sentence, picks the least-used version across the batch, and tries other combinations when a message would share too much with one already made or when the wording check has something to say about it. It says what the sender is not ("I do not place candidates, so I am no competition for your desk") instead of guessing at the agency's business, and its footer says that one follow-up at most will come. Across this batch, template-like pairs: **0**.

The owner reads, edits if wanted, approves on the page, and sends from their own mail. Nothing is sent by Amber.

### A short list of long-open job ads for Hooli Staffing

> Hello Hooli Staffing team,
>
> I am writing because my software picked up the Healthcare Recruiter listing on your careers page. I use software to read employers' public job listings and careers pages. If the same role is still up after 45 days, it goes on the list.
>
> What comes back is one line per employer: company, role, link, date posted, and a hiring address where one is printed.
>
> I'm not a recruiter and I place no one. What I do is research on employers, for agencies.
>
> A sample of about ten rows is free, so you can check them against the live ads. If that sounds useful, shall I send them for healthcare?
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

*115 words before the footer. Wording check: 0 errors, 0 warnings.*

### Long-open job ads, each with its link

> Hello Initech Talent Partners,
>
> The Technical Recruiter listing on your careers page is what my software flagged, so I am writing to you.
>
> Roles still listed after 45 days are the ones I keep. They come from employers' own careers pages and the job boards that host them, read by my software.
>
> A line in the sheet has the company, the role, the link, the date, and, if the company publishes one, a hiring address. Ten or so rows are free to start, and you can check each one against the live ad.
>
> There's no candidate pitch here: I do research for agencies and place no one. Would a sample for technology be worth a look?
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

*120 words before the footer. Wording check: 0 errors, 0 warnings.*

### Ten employers with roles that stay open

> Hello,
>
> My software flagged your Light Industrial Recruiter listing on your careers page, so I am writing to Cyberdyne Talent. This is research for agencies, not a candidate pitch: I place no one.
>
> A program I run reads public job listings from employers' own pages and from the job boards that host them, and it keeps the roles that have been listed for 45 days or longer. For each employer there is the role, a link to the live ad, how long it has been up, and the address the company itself prints for hiring, if it prints one.
>
> A first look costs nothing: ten rows, each with its link, so you can check them yourself.
>
> Would you like to see ten rows for light industrial and trades?
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

*130 words before the footer. Wording check: 0 errors, 0 warnings.*

### A sample of employers with long-open job ads

> Hi Wayne Workforce Solutions team,
>
> Your careers page lists an Account Manager position, and my software flagged it while reading staffing firms' websites. The listings come from pages anyone can open: employers' careers pages and the job boards that host them. Only roles that have stayed listed for 45 days or longer make the list.
>
> Every row has the company, the role, the listing link and the date, and the hiring address when the company publishes one.
>
> I don't place candidates. I find employers that agencies might want to call.
>
> I would send ten rows first, free, and you can open each link to see whether the ad is still there. Shall I send them over?
>
> Thank you,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

*119 words before the footer. Wording check: 0 errors, 0 warnings.*

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
