<!-- Prepared with scripts/offers-run.ts for crm-cleanup. Invented test data (--synthetic). Review before sending. -->
# CRM Duplicate and Data-Quality Check

**Sample made from invented data.**

## What went in

- 320 contact records from Sales spreadsheet export (invented)
- Stages: 111 lead, 74 qualified, 104 customer, 31 lost
- Owners: Dee Walsh, Priya Nair, Sam Ortiz
- A lead or qualified contact counts as stale after 120 days without activity

## Summary

320 records from Sales spreadsheet export (invented) for Invented Test Co, reviewed as of 2026-10-11.

19 duplicate groups covering 39 records: 7 certain, 9 likely, 3 possible. Each has a suggested record to keep and the reason.

21 data-quality issues on 21 records.

260 proposed formatting changes: name and city capitals, phone format, email case and state codes.

8 stale leads: leads and qualified contacts with no activity for more than 120 days.

Nothing in your CRM is changed by this review. Amber does not merge, delete or edit records; you decide what to apply.

## Duplicate groups

| Group | Records | Confidence | Why | Suggested record to keep | Conflicts to decide |
|---|---|---|---|---|---|
| G1 | C-0003 Cora Abbott; C-0303 Cora Abbott | certain | Same email cora.abbott.3@co3.example (C-0003, C-0303); same name and company (C-0003, C-0303) | C-0303: as complete as C-0003 (10 of 10 fields filled), with more recent activity (2026-09-18) | Owners differ (Dee Walsh, Priya Nair); stages differ (customer, lead) |
| G2 | C-0001 Ava Abbott; C-0301 Ava Abbott | certain | Same email ava.abbott.1@co1.example (C-0001, C-0301); same name and company (C-0001, C-0301) | C-0001: as complete as C-0301 (10 of 10 fields filled), with more recent activity (2026-09-11) | Owners differ (Priya Nair, Sam Ortiz); stages differ (customer, lead) |
| G3 | C-0304 Dev Abbott; C-0004 Dev Abbott | certain | Same email dev.abbott.4@co4.example (C-0304, C-0004); same name and company (C-0304, C-0004) | C-0304: as complete as C-0004 (10 of 10 fields filled), with more recent activity (2026-09-22) | Owners differ (Sam Ortiz, Priya Nair); stages differ (lead, customer) |
| G4 | C-0319 Bea Abbott; C-0019 Sam Abbott; C-0320 Bee Abbott | certain | Same email sam.abbott.19@co19.example (C-0319, C-0019); same phone (290) 555-0121 (C-0319, C-0320) | C-0019: as complete as C-0319 (10 of 10 fields filled), with more recent activity (2026-10-03) | Stages differ (lead, customer) |
| G5 | C-0005 Elena Abbott; C-0305 Elena Abbott | certain | Same email elena.abbott.5@co5.example (C-0005, C-0305); same name and company (C-0005, C-0305) | C-0005: as complete as C-0305 (10 of 10 fields filled), with more recent activity (2026-09-11) | Owners differ (Sam Ortiz, Dee Walsh); stages differ (customer, lead) |
| G6 | C-0002 Ben Abbott; C-0302 Ben Abbott | certain | Same email ben.abbott.2@co2.example (C-0002, C-0302); same name and company (C-0002, C-0302) | C-0002: as complete as C-0302 (10 of 10 fields filled), with more recent activity (2026-09-11) | Owners differ (Sam Ortiz, Dee Walsh); stages differ (customer, lead) |
| G7 | C-0306 Femi Abbott; C-0006 Femi Abbott | certain | Same email femi.abbott.6@co6.example (C-0306, C-0006); same name and company (C-0306, C-0006) | C-0006: as complete as C-0306 (10 of 10 fields filled), with more recent activity (2026-09-11) | Owners differ (Priya Nair, Dee Walsh); stages differ (lead, customer) |
| G8 | C-0307 Gus Abbott; C-0007 Gus Abbott | likely | Same phone (200) 555-0106 (C-0307, C-0007); same name and company (C-0307, C-0007) | C-0307: as complete as C-0007 (10 of 10 fields filled), with more recent activity (2026-09-29) | None |
| G9 | C-0312 Leo Abbott; C-0012 Leo Abbott | likely | Same name and company (C-0312, C-0012) | C-0012: as complete as C-0312 (10 of 10 fields filled), with more recent activity (2026-09-26) | Stages differ (lead, customer) |
| G10 | C-0014 Noor Abbott; C-0314 Noor Abbott | likely | Same name and email domain co14.example (C-0014, C-0314) | C-0014: as complete as C-0314 (10 of 10 fields filled), with more recent activity (2026-09-29) | Stages differ (customer, lead) |
| G11 | C-0015 Oscar Abbott; C-0315 Oscar Abbott | likely | Same name and email domain co15.example (C-0015, C-0315) | C-0015: as complete as C-0315 (10 of 10 fields filled), with more recent activity (2026-09-29) | Stages differ (customer, lead) |
| G12 | C-0308 Hana Abbott; C-0008 Hana Abbott | likely | Same phone (200) 555-0107 (C-0308, C-0008); same name and company (C-0308, C-0008) | C-0308: as complete as C-0008 (10 of 10 fields filled), with more recent activity (2026-08-28) | None |
| G13 | C-0311 Kira Abbott; C-0011 Kira Abbott | likely | Same name and company (C-0311, C-0011) | C-0011: as complete as C-0311 (10 of 10 fields filled), with more recent activity (2026-09-26) | Stages differ (lead, customer) |
| G14 | C-0013 Maya Abbott; C-0313 Maya Abbott | likely | Same name and company (C-0013, C-0313) | C-0013: as complete as C-0313 (10 of 10 fields filled), with more recent activity (2026-09-26) | Stages differ (customer, lead) |
| G15 | C-0310 Jules Abbott; C-0010 Jules Abbott | likely | Same phone (200) 555-0109 (C-0310, C-0010); same name and company (C-0310, C-0010) | C-0310: as complete as C-0010 (10 of 10 fields filled), with more recent activity (2026-08-23) | None |
| G16 | C-0309 Ivan Abbott; C-0009 Ivan Abbott | likely | Same phone (200) 555-0108 (C-0309, C-0009); same name and company (C-0309, C-0009) | C-0309: as complete as C-0009 (10 of 10 fields filled), with more recent activity (2026-09-26) | None |
| G17 | C-0016 Pia Abbott; C-0316 Pia Abbotz | possible | Similar last names (Abbott, Abbotz), same first initial and company (C-0016, C-0316) | C-0016: as complete as C-0316 (10 of 10 fields filled), with more recent activity (2026-10-02) | Stages differ (customer, lead) |
| G18 | C-0017 Quinn Abbott; C-0317 Quinn Abbotz | possible | Similar last names (Abbott, Abbotz), same first initial and company (C-0017, C-0317) | C-0017: as complete as C-0317 (10 of 10 fields filled), with more recent activity (2026-10-02) | Stages differ (customer, lead) |
| G19 | C-0318 Rosa Abbotz; C-0018 Rosa Abbott | possible | Similar last names (Abbotz, Abbott), same first initial and company (C-0318, C-0018) | C-0018: as complete as C-0318 (10 of 10 fields filled), with more recent activity (2026-10-02) | Stages differ (lead, customer) |

Suggestions only. Amber does not merge records: you pick the record to keep, settle any conflicts and merge in your CRM.

## Data-quality issues

| Record | Name | Field | Issue | Current value |
|---|---|---|---|---|
| C-0043 | Maya Banerjee | State | State is not a two-letter code and could not be read as a US state | Tex. |
| C-0039 | ivan banerjee | Name | Name is in all lowercase | ivan banerjee |
| C-0027 | Abel Abbott | Email and phone | No email and no phone | (both empty) |
| C-0034 | DEV BANERJEE | Name | Name is in ALL CAPS | DEV BANERJEE |
| C-0036 | FEMI BANERJEE | Name | Name is in ALL CAPS | FEMI BANERJEE |
| C-0041 | Kira Banerjee | State | State is not a two-letter code (reads as TX) | Texas |
| C-0038 | hana banerjee | Name | Name is in all lowercase | hana banerjee |
| C-0042 | Leo Banerjee | State | State is not a two-letter code (reads as TX) | Texas |
| C-0035 | ELENA BANERJEE | Name | Name is in ALL CAPS | ELENA BANERJEE |
| C-0026 | Zara Abbott | Email and phone | No email and no phone | (both empty) |
| C-0023 | Wren Abbott | Email | Email format is not valid | name.@co.example |
| C-0021 | Uma Abbott | Email | Email format is not valid | .name@co.example |
| C-0024 | Xavi Abbott | Email | Email format is not valid | na me@co.example |
| C-0020 | Tara Abbott | Email | Email format is not valid | name@@co.example |
| C-0037 | gus banerjee | Name | Name is in all lowercase | gus banerjee |
| C-0022 | Vik Abbott | Email | Email format is not valid | name..x@co.example |
| C-0025 | Yuki Abbott | Email and phone | No email and no phone | (both empty) |
| C-0040 | Jules Banerjee | State | State is not a two-letter code (reads as TX) | Texas |
| C-0033 | CORA BANERJEE | Name | Name is in ALL CAPS | CORA BANERJEE |
| C-0044 | Noor Banerjee | State | State is not a two-letter code and could not be read as a US state | Tex. |
| C-0028 | Bela Abbott | Email and phone | No email and no phone | (both empty) |

Checked: email format, a way to reach each contact, 10-digit phone numbers, name capitals and two-letter state codes.

## Proposed changes (you review and apply them in your CRM)

| Record | Field | Current | Proposed | Reason |
|---|---|---|---|---|
| C-0043 | Phone | 200.555.0142 | (200) 555-0142 | One phone format for every record |
| C-0307 | Phone | 200.555.0106 | (200) 555-0106 | One phone format for every record |
| C-0287 | Phone | 202.555.0186 | (202) 555-0186 | One phone format for every record |
| C-0106 | Phone | 201-555-0105 | (201) 555-0105 | One phone format for every record |
| C-0003 | Phone | 200.555.0102 | (200) 555-0102 | One phone format for every record |
| C-0103 | Phone | 201.555.0102 | (201) 555-0102 | One phone format for every record |
| C-0030 | Phone | 200-555-0129 | (200) 555-0129 | One phone format for every record |
| C-0050 | Phone | 200-555-0149 | (200) 555-0149 | One phone format for every record |
| C-0099 | Phone | 200.555.0198 | (200) 555-0198 | One phone format for every record |
| C-0175 | Phone | 201.555.0174 | (201) 555-0174 | One phone format for every record |
| C-0312 | Phone | 290.555.0110 | (290) 555-0110 | One phone format for every record |
| C-0235 | Phone | 202.555.0134 | (202) 555-0134 | One phone format for every record |
| C-0016 | Phone | +1 200 555 0115 | (200) 555-0115 | One phone format for every record |
| C-0124 | Phone | +1 201 555 0123 | (201) 555-0123 | One phone format for every record |
| C-0246 | Phone | 202-555-0145 | (202) 555-0145 | One phone format for every record |
| C-0263 | Phone | 202.555.0162 | (202) 555-0162 | One phone format for every record |
| C-0203 | Phone | 202.555.0102 | (202) 555-0102 | One phone format for every record |
| C-0048 | Phone | +1 200 555 0147 | (200) 555-0147 | One phone format for every record |
| C-0066 | Phone | 200-555-0165 | (200) 555-0165 | One phone format for every record |
| C-0131 | Phone | 201.555.0130 | (201) 555-0130 | One phone format for every record |
| C-0252 | Phone | +1 202 555 0151 | (202) 555-0151 | One phone format for every record |
| C-0283 | Phone | 202.555.0182 | (202) 555-0182 | One phone format for every record |
| C-0039 | First name | ivan | Ivan | Name in all lowercase |
| C-0039 | Last name | banerjee | Banerjee | Name in all lowercase |
| C-0039 | Phone | 200.555.0138 | (200) 555-0138 | One phone format for every record |
| C-0226 | Phone | 202-555-0125 | (202) 555-0125 | One phone format for every record |
| C-0082 | Phone | 200-555-0181 | (200) 555-0181 | One phone format for every record |
| C-0176 | Phone | +1 201 555 0175 | (201) 555-0175 | One phone format for every record |
| C-0071 | Phone | 200.555.0170 | (200) 555-0170 | One phone format for every record |
| C-0158 | Phone | 201-555-0157 | (201) 555-0157 | One phone format for every record |
| C-0155 | Phone | 201.555.0154 | (201) 555-0154 | One phone format for every record |
| C-0251 | Phone | 202.555.0150 | (202) 555-0150 | One phone format for every record |
| C-0171 | Phone | 201.555.0170 | (201) 555-0170 | One phone format for every record |
| C-0190 | Phone | 201-555-0189 | (201) 555-0189 | One phone format for every record |
| C-0282 | Phone | 202-555-0181 | (202) 555-0181 | One phone format for every record |
| C-0206 | Phone | 202-555-0105 | (202) 555-0105 | One phone format for every record |
| C-0076 | Phone | +1 200 555 0175 | (200) 555-0175 | One phone format for every record |
| C-0034 | First name | DEV | Dev | Name in ALL CAPS |
| C-0034 | Last name | BANERJEE | Banerjee | Name in ALL CAPS |
| C-0034 | Phone | 200-555-0133 | (200) 555-0133 | One phone format for every record |
| C-0059 | Phone | 200.555.0158 | (200) 555-0158 | One phone format for every record |
| C-0107 | Phone | 201.555.0106 | (201) 555-0106 | One phone format for every record |
| C-0288 | Phone | +1 202 555 0187 | (202) 555-0187 | One phone format for every record |
| C-0210 | Phone | 202-555-0109 | (202) 555-0109 | One phone format for every record |
| C-0292 | Phone | +1 202 555 0191 | (202) 555-0191 | One phone format for every record |
| C-0179 | Phone | 201.555.0178 | (201) 555-0178 | One phone format for every record |
| C-0058 | Phone | 200-555-0157 | (200) 555-0157 | One phone format for every record |
| C-0230 | Phone | 202-555-0129 | (202) 555-0129 | One phone format for every record |
| C-0317 | Phone | 290.555.0118 | (290) 555-0118 | One phone format for every record |
| C-0036 | First name | FEMI | Femi | Name in ALL CAPS |
| C-0036 | Last name | BANERJEE | Banerjee | Name in ALL CAPS |
| C-0036 | Phone | +1 200 555 0135 | (200) 555-0135 | One phone format for every record |
| C-0180 | Phone | +1 201 555 0179 | (201) 555-0179 | One phone format for every record |
| C-0140 | Phone | +1 201 555 0139 | (201) 555-0139 | One phone format for every record |
| C-0079 | Phone | 200.555.0178 | (200) 555-0178 | One phone format for every record |
| C-0126 | Phone | 201-555-0125 | (201) 555-0125 | One phone format for every record |
| C-0276 | Phone | +1 202 555 0175 | (202) 555-0175 | One phone format for every record |
| C-0094 | Phone | 200-555-0193 | (200) 555-0193 | One phone format for every record |
| C-0041 | State | Texas | TX | Two-letter state code |
| C-0038 | First name | hana | Hana | Name in all lowercase |
| C-0038 | Last name | banerjee | Banerjee | Name in all lowercase |
| C-0038 | Phone | 200-555-0137 | (200) 555-0137 | One phone format for every record |
| C-0014 | Phone | 200-555-0113 | (200) 555-0113 | One phone format for every record |
| C-0015 | Phone | 200.555.0114 | (200) 555-0114 | One phone format for every record |
| C-0298 | Phone | 202-555-0197 | (202) 555-0197 | One phone format for every record |
| C-0170 | Phone | 201-555-0169 | (201) 555-0169 | One phone format for every record |
| C-0134 | Phone | 201-555-0133 | (201) 555-0133 | One phone format for every record |
| C-0182 | Phone | 201-555-0181 | (201) 555-0181 | One phone format for every record |
| C-0138 | Phone | 201-555-0137 | (201) 555-0137 | One phone format for every record |
| C-0300 | Phone | +1 202 555 0199 | (202) 555-0199 | One phone format for every record |
| C-0139 | Phone | 201.555.0138 | (201) 555-0138 | One phone format for every record |
| C-0280 | Phone | +1 202 555 0179 | (202) 555-0179 | One phone format for every record |
| C-0102 | Phone | 201-555-0101 | (201) 555-0101 | One phone format for every record |
| C-0111 | Phone | 201.555.0110 | (201) 555-0110 | One phone format for every record |
| C-0243 | Phone | 202.555.0142 | (202) 555-0142 | One phone format for every record |
| C-0052 | Phone | +1 200 555 0151 | (200) 555-0151 | One phone format for every record |
| C-0271 | Phone | 202.555.0170 | (202) 555-0170 | One phone format for every record |
| C-0187 | Phone | 201.555.0186 | (201) 555-0186 | One phone format for every record |
| C-0163 | Phone | 201.555.0162 | (201) 555-0162 | One phone format for every record |
| C-0074 | Phone | 200-555-0173 | (200) 555-0173 | One phone format for every record |
| C-0216 | Phone | +1 202 555 0115 | (202) 555-0115 | One phone format for every record |
| C-0042 | Phone | 200-555-0141 | (200) 555-0141 | One phone format for every record |
| C-0042 | State | Texas | TX | Two-letter state code |
| C-0167 | Phone | 201.555.0166 | (201) 555-0166 | One phone format for every record |
| C-0183 | Phone | 201.555.0182 | (201) 555-0182 | One phone format for every record |
| C-0147 | Phone | 201.555.0146 | (201) 555-0146 | One phone format for every record |
| C-0220 | Phone | +1 202 555 0119 | (202) 555-0119 | One phone format for every record |
| C-0166 | Phone | 201-555-0165 | (201) 555-0165 | One phone format for every record |
| C-0314 | Phone | 290-555-0113 | (290) 555-0113 | One phone format for every record |
| C-0222 | Phone | 202-555-0121 | (202) 555-0121 | One phone format for every record |
| C-0160 | Phone | +1 201 555 0159 | (201) 555-0159 | One phone format for every record |
| C-0035 | First name | ELENA | Elena | Name in ALL CAPS |
| C-0035 | Last name | BANERJEE | Banerjee | Name in ALL CAPS |
| C-0035 | Phone | 200.555.0134 | (200) 555-0134 | One phone format for every record |
| C-0228 | Phone | +1 202 555 0127 | (202) 555-0127 | One phone format for every record |
| C-0120 | Phone | +1 201 555 0119 | (201) 555-0119 | One phone format for every record |
| C-0146 | Phone | 201-555-0145 | (201) 555-0145 | One phone format for every record |
| C-0064 | Phone | +1 200 555 0163 | (200) 555-0163 | One phone format for every record |
| C-0308 | Phone | 200-555-0107 | (200) 555-0107 | One phone format for every record |
| C-0215 | Phone | 202.555.0114 | (202) 555-0114 | One phone format for every record |
| C-0299 | Phone | 202.555.0198 | (202) 555-0198 | One phone format for every record |
| C-0188 | Phone | +1 201 555 0187 | (201) 555-0187 | One phone format for every record |
| C-0242 | Phone | 202-555-0141 | (202) 555-0141 | One phone format for every record |
| C-0072 | Phone | +1 200 555 0171 | (200) 555-0171 | One phone format for every record |
| C-0067 | Phone | 200.555.0166 | (200) 555-0166 | One phone format for every record |
| C-0259 | Phone | 202.555.0158 | (202) 555-0158 | One phone format for every record |
| C-0191 | Phone | 201.555.0190 | (201) 555-0190 | One phone format for every record |
| C-0196 | Phone | +1 201 555 0195 | (201) 555-0195 | One phone format for every record |
| C-0122 | Phone | 201-555-0121 | (201) 555-0121 | One phone format for every record |
| C-0060 | Phone | +1 200 555 0159 | (200) 555-0159 | One phone format for every record |
| C-0023 | Phone | 200.555.0122 | (200) 555-0122 | One phone format for every record |
| C-0084 | Phone | +1 200 555 0183 | (200) 555-0183 | One phone format for every record |
| C-0096 | Phone | +1 200 555 0195 | (200) 555-0195 | One phone format for every record |
| C-0304 | Email | DEV.ABBOTT.4@CO4.EXAMPLE | dev.abbott.4@co4.example | Email in lowercase without spaces |
| C-0211 | Phone | 202.555.0110 | (202) 555-0110 | One phone format for every record |
| C-0319 | Phone | 290-555-0121 | (290) 555-0121 | One phone format for every record |
| C-0024 | Phone | +1 200 555 0123 | (200) 555-0123 | One phone format for every record |
| C-0063 | Phone | 200.555.0162 | (200) 555-0162 | One phone format for every record |
| C-0054 | Phone | 200-555-0153 | (200) 555-0153 | One phone format for every record |
| C-0238 | Phone | 202-555-0137 | (202) 555-0137 | One phone format for every record |
| C-0090 | Phone | 200-555-0189 | (200) 555-0189 | One phone format for every record |
| C-0150 | Phone | 201-555-0149 | (201) 555-0149 | One phone format for every record |
| C-0020 | Phone | +1 200 555 0119 | (200) 555-0119 | One phone format for every record |
| C-0301 | Email | AVA.ABBOTT.1@CO1.EXAMPLE | ava.abbott.1@co1.example | Email in lowercase without spaces |
| C-0301 | Phone | 290-555-0101 | (290) 555-0101 | One phone format for every record |
| C-0162 | Phone | 201-555-0161 | (201) 555-0161 | One phone format for every record |
| C-0207 | Phone | 202.555.0106 | (202) 555-0106 | One phone format for every record |
| C-0219 | Phone | 202.555.0118 | (202) 555-0118 | One phone format for every record |
| C-0274 | Phone | 202-555-0173 | (202) 555-0173 | One phone format for every record |
| C-0087 | Phone | 200.555.0186 | (200) 555-0186 | One phone format for every record |
| C-0240 | Phone | +1 202 555 0139 | (202) 555-0139 | One phone format for every record |
| C-0135 | Phone | 201.555.0134 | (201) 555-0134 | One phone format for every record |
| C-0098 | Phone | 200-555-0197 | (200) 555-0197 | One phone format for every record |
| C-0195 | Phone | 201.555.0194 | (201) 555-0194 | One phone format for every record |
| C-0100 | Phone | +1 200 555 0199 | (200) 555-0199 | One phone format for every record |
| C-0194 | Phone | 201-555-0193 | (201) 555-0193 | One phone format for every record |
| C-0198 | Phone | 201-555-0197 | (201) 555-0197 | One phone format for every record |
| C-0178 | Phone | 201-555-0177 | (201) 555-0177 | One phone format for every record |
| C-0267 | Phone | 202.555.0166 | (202) 555-0166 | One phone format for every record |
| C-0092 | Phone | +1 200 555 0191 | (200) 555-0191 | One phone format for every record |
| C-0247 | Phone | 202.555.0146 | (202) 555-0146 | One phone format for every record |
| C-0110 | Phone | 201-555-0109 | (201) 555-0109 | One phone format for every record |
| C-0080 | Phone | +1 200 555 0179 | (200) 555-0179 | One phone format for every record |
| C-0037 | First name | gus | Gus | Name in all lowercase |
| C-0037 | Last name | banerjee | Banerjee | Name in all lowercase |
| C-0214 | Phone | 202-555-0113 | (202) 555-0113 | One phone format for every record |
| C-0255 | Phone | 202.555.0154 | (202) 555-0154 | One phone format for every record |
| C-0114 | Phone | 201-555-0113 | (201) 555-0113 | One phone format for every record |
| C-0199 | Phone | 201.555.0198 | (201) 555-0198 | One phone format for every record |
| C-0266 | Phone | 202-555-0165 | (202) 555-0165 | One phone format for every record |
| C-0310 | Phone | 200.555.0109 | (200) 555-0109 | One phone format for every record |
| C-0164 | Phone | +1 201 555 0163 | (201) 555-0163 | One phone format for every record |
| C-0204 | Phone | +1 202 555 0103 | (202) 555-0103 | One phone format for every record |
| C-0088 | Phone | +1 200 555 0187 | (200) 555-0187 | One phone format for every record |
| C-0130 | Phone | 201-555-0129 | (201) 555-0129 | One phone format for every record |
| C-0068 | Phone | +1 200 555 0167 | (200) 555-0167 | One phone format for every record |
| C-0151 | Phone | 201.555.0150 | (201) 555-0150 | One phone format for every record |
| C-0309 | Phone | 200.555.0108 | (200) 555-0108 | One phone format for every record |
| C-0132 | Phone | +1 201 555 0131 | (201) 555-0131 | One phone format for every record |
| C-0018 | Phone | 200-555-0117 | (200) 555-0117 | One phone format for every record |
| C-0231 | Phone | 202.555.0130 | (202) 555-0130 | One phone format for every record |
| C-0083 | Phone | 200.555.0182 | (200) 555-0182 | One phone format for every record |
| C-0051 | Phone | 200.555.0150 | (200) 555-0150 | One phone format for every record |
| C-0002 | Phone | 200-555-0101 | (200) 555-0101 | One phone format for every record |
| C-0227 | Phone | 202.555.0126 | (202) 555-0126 | One phone format for every record |
| C-0128 | Phone | +1 201 555 0127 | (201) 555-0127 | One phone format for every record |
| C-0248 | Phone | +1 202 555 0147 | (202) 555-0147 | One phone format for every record |
| C-0156 | Phone | +1 201 555 0155 | (201) 555-0155 | One phone format for every record |
| C-0208 | Phone | +1 202 555 0107 | (202) 555-0107 | One phone format for every record |
| C-0256 | Phone | +1 202 555 0155 | (202) 555-0155 | One phone format for every record |
| C-0172 | Phone | +1 201 555 0171 | (201) 555-0171 | One phone format for every record |
| C-0234 | Phone | 202-555-0133 | (202) 555-0133 | One phone format for every record |
| C-0254 | Phone | 202-555-0153 | (202) 555-0153 | One phone format for every record |
| C-0258 | Phone | 202-555-0157 | (202) 555-0157 | One phone format for every record |
| C-0116 | Phone | +1 201 555 0115 | (201) 555-0115 | One phone format for every record |
| C-0091 | Phone | 200.555.0190 | (200) 555-0190 | One phone format for every record |
| C-0022 | Phone | 200-555-0121 | (200) 555-0121 | One phone format for every record |
| C-0296 | Phone | +1 202 555 0195 | (202) 555-0195 | One phone format for every record |
| C-0136 | Phone | +1 201 555 0135 | (201) 555-0135 | One phone format for every record |
| C-0062 | Phone | 200-555-0161 | (200) 555-0161 | One phone format for every record |
| C-0174 | Phone | 201-555-0173 | (201) 555-0173 | One phone format for every record |
| C-0112 | Phone | +1 201 555 0111 | (201) 555-0111 | One phone format for every record |
| C-0119 | Phone | 201.555.0118 | (201) 555-0118 | One phone format for every record |
| C-0070 | Phone | 200-555-0169 | (200) 555-0169 | One phone format for every record |
| C-0290 | Phone | 202-555-0189 | (202) 555-0189 | One phone format for every record |
| C-0260 | Phone | +1 202 555 0159 | (202) 555-0159 | One phone format for every record |
| C-0007 | Phone | 200.555.0106 | (200) 555-0106 | One phone format for every record |
| C-0244 | Phone | +1 202 555 0143 | (202) 555-0143 | One phone format for every record |
| C-0143 | Phone | 201.555.0142 | (201) 555-0142 | One phone format for every record |
| C-0118 | Phone | 201-555-0117 | (201) 555-0117 | One phone format for every record |
| C-0275 | Phone | 202.555.0174 | (202) 555-0174 | One phone format for every record |
| C-0306 | Email | FEMI.ABBOTT.6@CO6.EXAMPLE | femi.abbott.6@co6.example | Email in lowercase without spaces |
| C-0306 | Phone | 290.555.0106 | (290) 555-0106 | One phone format for every record |
| C-0159 | Phone | 201.555.0158 | (201) 555-0158 | One phone format for every record |
| C-0040 | Phone | +1 200 555 0139 | (200) 555-0139 | One phone format for every record |
| C-0040 | State | Texas | TX | Two-letter state code |
| C-0006 | Phone | 200-555-0105 | (200) 555-0105 | One phone format for every record |
| C-0268 | Phone | +1 202 555 0167 | (202) 555-0167 | One phone format for every record |
| C-0279 | Phone | 202.555.0178 | (202) 555-0178 | One phone format for every record |
| C-0264 | Phone | +1 202 555 0163 | (202) 555-0163 | One phone format for every record |
| C-0272 | Phone | +1 202 555 0171 | (202) 555-0171 | One phone format for every record |
| C-0270 | Phone | 202-555-0169 | (202) 555-0169 | One phone format for every record |
| C-0019 | Phone | 200.555.0118 | (200) 555-0118 | One phone format for every record |
| C-0320 | Phone | 290-555-0121 | (290) 555-0121 | One phone format for every record |
| C-0078 | Phone | 200-555-0177 | (200) 555-0177 | One phone format for every record |
| C-0286 | Phone | 202-555-0185 | (202) 555-0185 | One phone format for every record |
| C-0218 | Phone | 202-555-0117 | (202) 555-0117 | One phone format for every record |
| C-0223 | Phone | 202.555.0122 | (202) 555-0122 | One phone format for every record |
| C-0031 | Phone | 200.555.0130 | (200) 555-0130 | One phone format for every record |
| C-0154 | Phone | 201-555-0153 | (201) 555-0153 | One phone format for every record |
| C-0115 | Phone | 201.555.0114 | (201) 555-0114 | One phone format for every record |
| C-0232 | Phone | +1 202 555 0131 | (202) 555-0131 | One phone format for every record |
| C-0250 | Phone | 202-555-0149 | (202) 555-0149 | One phone format for every record |
| C-0047 | Phone | 200.555.0146 | (200) 555-0146 | One phone format for every record |
| C-0291 | Phone | 202.555.0190 | (202) 555-0190 | One phone format for every record |
| C-0144 | Phone | +1 201 555 0143 | (201) 555-0143 | One phone format for every record |
| C-0152 | Phone | +1 201 555 0151 | (201) 555-0151 | One phone format for every record |
| C-0305 | Email | ELENA.ABBOTT.5@CO5.EXAMPLE | elena.abbott.5@co5.example | Email in lowercase without spaces |
| C-0305 | Phone | 290-555-0105 | (290) 555-0105 | One phone format for every record |
| C-0011 | Phone | 200.555.0110 | (200) 555-0110 | One phone format for every record |
| C-0075 | Phone | 200.555.0174 | (200) 555-0174 | One phone format for every record |
| C-0033 | First name | CORA | Cora | Name in ALL CAPS |
| C-0033 | Last name | BANERJEE | Banerjee | Name in ALL CAPS |
| C-0104 | Phone | +1 201 555 0103 | (201) 555-0103 | One phone format for every record |
| C-0148 | Phone | +1 201 555 0147 | (201) 555-0147 | One phone format for every record |
| C-0294 | Phone | 202-555-0193 | (202) 555-0193 | One phone format for every record |
| C-0032 | Phone | +1 200 555 0131 | (200) 555-0131 | One phone format for every record |
| C-0008 | Phone | +1 200 555 0107 | (200) 555-0107 | One phone format for every record |
| C-0295 | Phone | 202.555.0194 | (202) 555-0194 | One phone format for every record |
| C-0202 | Phone | 202-555-0101 | (202) 555-0101 | One phone format for every record |
| C-0315 | Phone | 290.555.0114 | (290) 555-0114 | One phone format for every record |
| C-0044 | Phone | +1 200 555 0143 | (200) 555-0143 | One phone format for every record |
| C-0108 | Phone | +1 201 555 0107 | (201) 555-0107 | One phone format for every record |
| C-0010 | Phone | 200-555-0109 | (200) 555-0109 | One phone format for every record |
| C-0168 | Phone | +1 201 555 0167 | (201) 555-0167 | One phone format for every record |
| C-0278 | Phone | 202-555-0177 | (202) 555-0177 | One phone format for every record |
| C-0055 | Phone | 200.555.0154 | (200) 555-0154 | One phone format for every record |
| C-0056 | Phone | +1 200 555 0155 | (200) 555-0155 | One phone format for every record |
| C-0303 | Email | CORA.ABBOTT.3@CO3.EXAMPLE | cora.abbott.3@co3.example | Email in lowercase without spaces |
| C-0303 | Phone | +1 290 555 0103 | (290) 555-0103 | One phone format for every record |
| C-0262 | Phone | 202-555-0161 | (202) 555-0161 | One phone format for every record |
| C-0239 | Phone | 202.555.0138 | (202) 555-0138 | One phone format for every record |
| C-0186 | Phone | 201-555-0185 | (201) 555-0185 | One phone format for every record |
| C-0212 | Phone | +1 202 555 0111 | (202) 555-0111 | One phone format for every record |
| C-0142 | Phone | 201-555-0141 | (201) 555-0141 | One phone format for every record |
| C-0302 | Email | BEN.ABBOTT.2@CO2.EXAMPLE | ben.abbott.2@co2.example | Email in lowercase without spaces |
| C-0302 | Phone | 290.555.0102 | (290) 555-0102 | One phone format for every record |
| C-0004 | Phone | +1 200 555 0103 | (200) 555-0103 | One phone format for every record |
| C-0200 | Phone | +1 201 555 0199 | (201) 555-0199 | One phone format for every record |
| C-0127 | Phone | 201.555.0126 | (201) 555-0126 | One phone format for every record |
| C-0046 | Phone | 200-555-0145 | (200) 555-0145 | One phone format for every record |
| C-0095 | Phone | 200.555.0194 | (200) 555-0194 | One phone format for every record |
| C-0224 | Phone | +1 202 555 0123 | (202) 555-0123 | One phone format for every record |
| C-0086 | Phone | 200-555-0185 | (200) 555-0185 | One phone format for every record |
| C-0192 | Phone | +1 201 555 0191 | (201) 555-0191 | One phone format for every record |
| C-0184 | Phone | +1 201 555 0183 | (201) 555-0183 | One phone format for every record |
| C-0012 | Phone | +1 200 555 0111 | (200) 555-0111 | One phone format for every record |
| C-0123 | Phone | 201.555.0122 | (201) 555-0122 | One phone format for every record |
| C-0284 | Phone | +1 202 555 0183 | (202) 555-0183 | One phone format for every record |
| C-0236 | Phone | +1 202 555 0135 | (202) 555-0135 | One phone format for every record |

Formatting only: no record is deleted or merged, and no value is rewritten. Check names such as McDonald or O'Neil before you apply a capitals fix.

## Stale leads

- C-0051 Uma Banerjee (Company 51 Realty), qualified, owner Dee Walsh: last activity 2025-12-06, 309 days ago
- C-0045 Oscar Banerjee (Company 45 Foods), qualified, owner Dee Walsh: last activity 2025-12-07, 308 days ago
- C-0049 Sam Banerjee (Company 49 Plumbing), qualified, owner Priya Nair: last activity 2026-01-29, 255 days ago
- C-0052 Vik Banerjee (Company 52 Studio), qualified, owner Priya Nair: last activity 2026-02-20, 233 days ago
- C-0048 Rosa Banerjee (Company 48 Clinic), lead, owner Dee Walsh: last activity 2026-04-04, 190 days ago
- C-0050 Tara Banerjee (Company 50 Dental), qualified, owner Sam Ortiz: last activity 2026-04-12, 182 days ago
- C-0046 Pia Banerjee (Company 46 Auto), lead, owner Priya Nair: last activity 2026-04-26, 168 days ago
- C-0047 Quinn Banerjee (Company 47 Design), lead, owner Sam Ortiz: last activity 2026-05-11, 153 days ago

Leads and qualified contacts with no activity for more than 120 days, longest first. Each is worth a check-in or a stage change; you decide.

---

## How this report was checked

12 of 12 QA checks passed.

- Passed: Each record is in at most one duplicate group, and every group has two or more records
- Passed: The suggested record to keep is a member of its group
- Passed: Every certain group has records that share an email
- Passed: Proposed changes only fix formatting: none deletes, merges or rewrites a value
- Passed: The summary's counts equal the rows in each section
- Passed: Stale leads are exactly the leads and qualified contacts with no activity for more than 120 days
- Passed: Nothing says a record was merged, updated, applied or deleted
- Passed: No claims of guarantees, certification, compliance, affiliation or unmeasured results
- Passed: Nothing says a message was sent (Amber drafts; a person sends)
- Passed: Every section of messages is labelled as drafts
- Passed: No empty section without a note saying why
- Passed: Every stage of the demo completed
