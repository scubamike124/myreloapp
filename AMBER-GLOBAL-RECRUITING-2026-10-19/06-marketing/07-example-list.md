# What an agency receives: an example list

**Every company, role, address and link below is invented.** The domains end in `.example`, which cannot exist. This is the shape of the weekly spreadsheet that the one-page offer describes, produced by the real code (`lead-list.ts`) from invented data, so the owner and a prospect can see exactly what is being sold. A real list carries real companies read from public job listings on the day it is made.

What to notice:

- One row per company, longest-open first. Recruiter jobs are left out.
- "Listed since" is the date the job board gave, or, where it gave none, the day Amber first saw the listing, and the row says so ("first seen").
- The hiring address is one the company prints on its own site; where none was found, the cell says so. There is no person's name anywhere in the list.
- Every row carries the link to the listing so the agency can check it before calling.

# Employers whose roles have stayed open (example, invented companies)

Prepared 2026-10-19. Roles open 45 days or more, United States. All names in this example are invented.

| Company | Role | Where | Listed since | Days open | Listing | Where it was read | Hiring address the company publishes |
|---|---|---|---|---|---|---|---|
| Northfield Robotics | Controls Engineer | Austin, TX | 2026-07-19 | 92 | https://northfieldrobotics.example/careers/100 | Greenhouse job board | none found |
| Cedar & Stone Construction | Project Estimator | Denver, CO | 2026-08-03 | 77 | https://cedarandstone.example/careers/101 | Greenhouse job board | careers@cedarandstone.example (printed at https://cedarandstone.example/careers) |
| Redwood Dental Group | Practice Manager | Sacramento, CA | 2026-08-09 | 71 | https://redwooddental.example/careers/102 | Greenhouse job board | jobs@redwooddental.example (printed at https://redwooddental.example/careers) |
| Brightwater Software | Senior Backend Engineer | Remote (US) | 2026-08-12 | 68 | https://brightwatersoftware.example/careers/103 | Greenhouse job board | careers@brightwatersoftware.example (printed at https://brightwatersoftware.example/careers) |
| Lakeside Logistics | Dispatch Supervisor | Columbus, OH | 2026-08-17 | 63 | https://lakesidelogistics.example/careers/104 | Greenhouse job board | none found |
| Birchwood Accounting Partners | Staff Accountant | Tampa, FL | 2026-08-22 (first seen) | 58 | https://birchwoodaccounting.example/careers/105 | Greenhouse job board | hello@birchwoodaccounting.example (printed at https://birchwoodaccounting.example/careers) |
| Maple Street Pharmacy Group | Pharmacy Technician | Phoenix, AZ | 2026-08-25 | 55 | https://maplestreetpharmacy.example/careers/106 | Greenhouse job board | jobs@maplestreetpharmacy.example (printed at https://maplestreetpharmacy.example/careers) |
| Harbor Light Home Health | Registered Nurse, Home Care | Portland, ME | 2026-08-31 | 49 | https://harborlighthealth.example/careers/107 | Greenhouse job board | none found |

Every row is taken from a public job listing: the company's own careers page or a job board that lists the role (the column "Where it was read" names it). Nothing here is about a named person. "Days open" counts from the date the vendor gave for the listing, or from the first day Amber saw it listed; a role may have been open longer, or may have been withdrawn since the page was read.

Listings were read from the public job-board pages of: Greenhouse job board.

## The same list as a spreadsheet file

```csv
company,role,location,listed_since,since_basis,days_open,listing_url,hiring_address,address_printed_at,source
Northfield Robotics,Controls Engineer,"Austin, TX",2026-07-19,published,92,https://northfieldrobotics.example/careers/100,,,greenhouse
Cedar & Stone Construction,Project Estimator,"Denver, CO",2026-08-03,published,77,https://cedarandstone.example/careers/101,careers@cedarandstone.example,https://cedarandstone.example/careers,greenhouse
Redwood Dental Group,Practice Manager,"Sacramento, CA",2026-08-09,published,71,https://redwooddental.example/careers/102,jobs@redwooddental.example,https://redwooddental.example/careers,greenhouse
Brightwater Software,Senior Backend Engineer,Remote (US),2026-08-12,published,68,https://brightwatersoftware.example/careers/103,careers@brightwatersoftware.example,https://brightwatersoftware.example/careers,greenhouse
Lakeside Logistics,Dispatch Supervisor,"Columbus, OH",2026-08-17,published,63,https://lakesidelogistics.example/careers/104,,,greenhouse
Birchwood Accounting Partners,Staff Accountant,"Tampa, FL",2026-08-22,first seen,58,https://birchwoodaccounting.example/careers/105,hello@birchwoodaccounting.example,https://birchwoodaccounting.example/careers,greenhouse
Maple Street Pharmacy Group,Pharmacy Technician,"Phoenix, AZ",2026-08-25,published,55,https://maplestreetpharmacy.example/careers/106,jobs@maplestreetpharmacy.example,https://maplestreetpharmacy.example/careers,greenhouse
Harbor Light Home Health,"Registered Nurse, Home Care","Portland, ME",2026-08-31,published,49,https://harborlighthealth.example/careers/107,,,greenhouse
```
