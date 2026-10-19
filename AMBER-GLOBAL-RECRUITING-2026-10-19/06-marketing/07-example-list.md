# What an agency receives: an example list

**Every company, role, address and link below is invented.** The domains end in `.example`, which cannot exist. This is the shape of the weekly spreadsheet that the one-page offer describes, produced by the real code (`lead-list.ts`) from invented data, so the owner and a prospect can see exactly what is being sold. A real list carries real companies read from public job listings on the day it is made.

What to notice:

- One row per company, longest-open first. Recruiter jobs are left out.
- "Listed since" is the date the job board gave, or, where it gave none, the day Amber first saw the listing, and the row says so ("first seen").
- The hiring address is one the company prints on its own site; where none was found, the cell says so. No person is named in the list on purpose, and an address or phone number of an individual would be cut out when a listing is read.
- Every row carries the link to the listing so the agency can check it before calling.

# Employers whose roles have stayed open (example, invented companies)

Prepared 2026-10-19. Roles open 45 days or more, United States. All names in this example are invented.

| Company | Role | Where | Listed since | Days open | Last seen listed | Listing | Where it was read | Hiring address the company publishes |
|---|---|---|---|---|---|---|---|---|
| Northfield Robotics | Controls Engineer | Austin, TX | 2026-07-19 | 92 | 2026-10-19 | <https://northfieldrobotics.example/careers/100> | Greenhouse job board | not looked for (its site was not read) |
| Cedar \& Stone Construction | Project Estimator | Denver, CO | 2026-08-03 | 77 | 2026-10-19 | <https://cedarandstone.example/careers/101> | Greenhouse job board | careers\@cedarandstone\.example (printed at <https://cedarandstone.example/careers>) |
| Redwood Dental Group | Practice Manager | Sacramento, CA | 2026-08-09 | 71 | 2026-10-19 | <https://redwooddental.example/careers/102> | Greenhouse job board | jobs\@redwooddental\.example (printed at <https://redwooddental.example/careers>) |
| Brightwater Software | Senior Backend Engineer | Remote \(US\) | 2026-08-12 | 68 | 2026-10-19 | <https://brightwatersoftware.example/careers/103> | Greenhouse job board | careers\@brightwatersoftware\.example (printed at <https://brightwatersoftware.example/careers>) |
| Lakeside Logistics | Dispatch Supervisor | Columbus, OH | 2026-08-17 | 63 | 2026-10-19 | <https://lakesidelogistics.example/careers/104> | Greenhouse job board | not looked for (its site was not read) |
| Birchwood Accounting Partners | Staff Accountant | Tampa, FL | 2026-08-22 (first seen) | 58 | 2026-10-19 | <https://birchwoodaccounting.example/careers/105> | Greenhouse job board | hello\@birchwoodaccounting\.example (printed at <https://birchwoodaccounting.example/careers>) |
| Maple Street Pharmacy Group | Pharmacy Technician | Phoenix, AZ | 2026-08-25 | 55 | 2026-10-19 | <https://maplestreetpharmacy.example/careers/106> | Greenhouse job board | jobs\@maplestreetpharmacy\.example (printed at <https://maplestreetpharmacy.example/careers>) |
| Harbor Light Home Health | Registered Nurse, Home Care | Portland, ME | 2026-08-31 | 49 | 2026-10-19 | <https://harborlighthealth.example/careers/107> | Greenhouse job board | not looked for (its site was not read) |

Every row is taken from a public job listing: the company's own careers page or a job board that lists the role (the column "Where it was read" names it). The rows are about companies and roles: no person is named on purpose, and an address or phone number of an individual is cut out when a listing is read. "Days open" counts from the date the vendor gave for the listing, or from the first day Amber saw it listed; a role may have been open longer. A role appears only if Amber's reading found it still listed within the last two weeks (the column "Last seen listed" gives the day), but it may have been withdrawn since. Where Amber could read a company's own website it looked there for a note saying the company does not want approaches from agencies and left those companies out; where the last column says the site was not read, that look has not been done, so check the company's site before you write to it.

Listings were read from the public job-board pages of: Greenhouse job board.

## The same list as a spreadsheet file

```csv
company,role,location,listed_since,since_basis,days_open,last_seen_listed,listing_url,hiring_address,address_printed_at,company_site_read,source
Northfield Robotics,Controls Engineer,"Austin, TX",2026-07-19,published,92,2026-10-19,https://northfieldrobotics.example/careers/100,,,no,greenhouse
Cedar & Stone Construction,Project Estimator,"Denver, CO",2026-08-03,published,77,2026-10-19,https://cedarandstone.example/careers/101,careers@cedarandstone.example,https://cedarandstone.example/careers,no,greenhouse
Redwood Dental Group,Practice Manager,"Sacramento, CA",2026-08-09,published,71,2026-10-19,https://redwooddental.example/careers/102,jobs@redwooddental.example,https://redwooddental.example/careers,no,greenhouse
Brightwater Software,Senior Backend Engineer,Remote (US),2026-08-12,published,68,2026-10-19,https://brightwatersoftware.example/careers/103,careers@brightwatersoftware.example,https://brightwatersoftware.example/careers,no,greenhouse
Lakeside Logistics,Dispatch Supervisor,"Columbus, OH",2026-08-17,published,63,2026-10-19,https://lakesidelogistics.example/careers/104,,,no,greenhouse
Birchwood Accounting Partners,Staff Accountant,"Tampa, FL",2026-08-22,first seen,58,2026-10-19,https://birchwoodaccounting.example/careers/105,hello@birchwoodaccounting.example,https://birchwoodaccounting.example/careers,no,greenhouse
Maple Street Pharmacy Group,Pharmacy Technician,"Phoenix, AZ",2026-08-25,published,55,2026-10-19,https://maplestreetpharmacy.example/careers/106,jobs@maplestreetpharmacy.example,https://maplestreetpharmacy.example/careers,no,greenhouse
Harbor Light Home Health,"Registered Nurse, Home Care","Portland, ME",2026-08-31,published,49,2026-10-19,https://harborlighthealth.example/careers/107,,,no,greenhouse
```
