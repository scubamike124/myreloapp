<!-- Prepared with scripts/offers-run.ts for catalog-cleanup. Invented test data (--synthetic). Review before sending. -->
# Product Catalog Cleanup and Cross-Store Check

**Sample made from invented data.**

## What went in

- 123 rows from Hearth Shop and 118 rows from Marketplace
- Rules: titles up to 255 characters in Hearth Shop and 200 in Marketplace; descriptions of at least 50 characters; GTIN required in Marketplace; brand required in Marketplace; prices must match to the cent
- 4 SKUs with extra spaces or lowercase letters matched after cleaning

## Summary

241 product rows: 123 in Hearth Shop and 118 in Marketplace, covering 126 SKUs. Hearth Shop is the source of truth.

78 issues by product, 44 cross-store differences and 51 proposed changes for you to review and import yourself.

16 SKUs in one store only.

Amber does not change either store. Nothing is imported until you import it.

## Issues by product

| Store | SKU | Issue | Detail |
|---|---|---|---|
| Marketplace | HC-1001 | Missing brand | required in Marketplace |
| Marketplace | HC-1002 | Missing GTIN | required in Marketplace |
| Hearth Shop | HC-1003 | No images | at least 1 image is needed |
| Marketplace | HC-1004 | Missing GTIN | required in Marketplace |
| Hearth Shop | HC-1005 | Description too short | 10 characters; at least 50 needed |
| Marketplace | HC-1006 | Missing GTIN | required in Marketplace |
| Hearth Shop | HC-1007 | Invalid GTIN | 2000001002590 ends in 0, but its check digit should be 9 |
| Hearth Shop | HC-1008 | Duplicate SKU | 2 rows use it (rows 9, 10); only the first is compared across stores |
| Marketplace | HC-1010 | Missing GTIN | required in Marketplace |
| Marketplace | HC-1011 | Missing brand | required in Marketplace |
| Hearth Shop | HC-1012 | Size name not standard | "x-large"; the standard form is XL |
| Hearth Shop | HC-1013 | No images | at least 1 image is needed |
| Marketplace | HC-1014 | Missing GTIN | required in Marketplace |
| Hearth Shop | HC-1015 | Description too short | 10 characters; at least 50 needed |
| Marketplace | HC-1016 | Missing GTIN | required in Marketplace |
| Marketplace | HC-1016 | Size name not standard | "Small"; the standard form is S |
| Hearth Shop | HC-1017 | Invalid GTIN | 2000001006291 ends in 1, but its check digit should be 0 |
| Hearth Shop | HC-1018 | Duplicate SKU | 2 rows use it (rows 20, 21); only the first is compared across stores |
| Marketplace | HC-1020 | Missing GTIN | required in Marketplace |
| Marketplace | HC-1021 | Missing brand | required in Marketplace |
| Marketplace | HC-1022 | Missing GTIN | required in Marketplace |
| Hearth Shop | HC-1023 | No images | at least 1 image is needed |
| Hearth Shop | HC-1024 | Size name not standard | "large"; the standard form is L |
| Hearth Shop | HC-1025 | Description too short | 10 characters; at least 50 needed |
| Hearth Shop | HC-1027 | Invalid GTIN | 2000001009995 ends in 5, but its check digit should be 4 |
| Hearth Shop | HC-1028 | Duplicate SKU | 2 rows use it (rows 31, 32); only the first is compared across stores |
| Marketplace | HC-1028 | Size name not standard | "Extra Large"; the standard form is XL |
| Marketplace | HC-1030 | Invalid GTIN | 2000001011103 ends in 3, but its check digit should be 2 |
| Marketplace | HC-1031 | Missing brand | required in Marketplace |
| Marketplace | HC-1032 | Invalid GTIN | 2000001011844 ends in 4, but its check digit should be 3 |
| Hearth Shop | HC-1033 | No images | at least 1 image is needed |
| Marketplace | HC-1034 | Invalid GTIN | 2000001012582 ends in 2, but its check digit should be 1 |
| Hearth Shop | HC-1035 | Description too short | 10 characters; at least 50 needed |
| Marketplace | HC-1036 | Invalid GTIN | 2000001013329 ends in 9, but its check digit should be 8 |
| Hearth Shop | HC-1037 | Invalid GTIN | 2000001013695 ends in 5, but its check digit should be 4 |
| Marketplace | HC-1038 | Invalid GTIN | 2000001014067 ends in 7, but its check digit should be 6 |
| Marketplace | HC-1040 | Invalid GTIN | 1014806 has 7 digits (a GTIN has 8, 12, 13 or 14; a spreadsheet may have dropped a leading zero) |
| Marketplace | HC-1041 | Missing brand | required in Marketplace |
| Marketplace | HC-1042 | Invalid GTIN | 2.00482E+12 contains letters (a GTIN is digits only) |
| Hearth Shop | HC-1043 | No images | at least 1 image is needed |
| Marketplace | HC-1044 | Size name not standard | "Extra Large"; the standard form is XL |
| Hearth Shop | HC-1045 | Description too short | 10 characters; at least 50 needed |
| Hearth Shop | HC-1047 | Invalid GTIN | 2000001017396 ends in 6, but its check digit should be 5 |
| Marketplace | HC-1048 | Size name not standard | "Small"; the standard form is S |
| Marketplace | HC-1050 | No images | at least 1 image is needed |
| Marketplace | HC-1052 | No images | at least 1 image is needed |
| Hearth Shop | HC-1053 | No images | at least 1 image is needed |
| Marketplace | HC-1054 | No images | at least 1 image is needed |
| Hearth Shop | HC-1055 | Description too short | 10 characters; at least 50 needed |
| Marketplace | HC-1056 | No images | at least 1 image is needed |
| Hearth Shop | HC-1057 | Invalid GTIN | 2000001021096 ends in 6, but its check digit should be 5 |
| Marketplace | HC-1060 | Description too short | 13 characters; at least 50 needed |
| Marketplace | HC-1062 | Description too short | 13 characters; at least 50 needed |
| Hearth Shop | HC-1063 | No images | at least 1 image is needed |
| Marketplace | HC-1064 | Description too short | 13 characters; at least 50 needed |
| Marketplace | HC-1064 | Color name not standard | "navy blue"; the standard form is Navy Blue |
| Hearth Shop | HC-1065 | Description too short | 10 characters; at least 50 needed |
| Marketplace | HC-1066 | Description too short | 13 characters; at least 50 needed |
| Hearth Shop | HC-1067 | Invalid GTIN | 20000010O4799 contains letters (a GTIN is digits only) |
| Marketplace | HC-1068 | Description too short | 13 characters; at least 50 needed |
| Marketplace | HC-1068 | Color name not standard | "navy blue"; the standard form is Navy Blue |
| Marketplace | HC-1070 | Description too short | 13 characters; at least 50 needed |
| Marketplace | HC-1072 | Title too long | 212 characters; Marketplace allows 200 |
| Marketplace | HC-1072 | Color name not standard | "navy blue"; the standard form is Navy Blue |
| Marketplace | HC-1074 | Title too long | 212 characters; Marketplace allows 200 |
| Hearth Shop | HC-1075 | Description too short | 10 characters; at least 50 needed |
| Marketplace | HC-1076 | Title too long | 212 characters; Marketplace allows 200 |
| Marketplace | HC-1076 | Color name not standard | "navy blue"; the standard form is Navy Blue |
| Hearth Shop | HC-1077 | Invalid GTIN | 20000010O8490 contains letters (a GTIN is digits only) |
| Marketplace | HC-1080 | Duplicate SKU | 2 rows use it (rows 204, 205); only the first is compared across stores |
| Marketplace | HC-1082 | Duplicate SKU | 2 rows use it (rows 207, 208); only the first is compared across stores |
| Hearth Shop | HC-1085 | Description too short | 10 characters; at least 50 needed |
| Hearth Shop | HC-1087 | Title too long | 262 characters; Hearth Shop allows 255 |
| Marketplace | HC-1090 | SKU needed cleaning | "hc-1090" is matched as HC-1090 |
| Marketplace | HC-1092 | SKU needed cleaning | "hc-1092" is matched as HC-1092 |
| Marketplace | HC-1094 | SKU needed cleaning | "hc-1094" is matched as HC-1094 |
| Marketplace | HC-1096 | SKU needed cleaning | "hc-1096" is matched as HC-1096 |
| Marketplace | HC-1098 | Price not readable | "TBD" is not a price |

Checked: at least 1 image, descriptions of at least 50 characters, title limits, required GTINs and brands, GTIN check digits, duplicate SKUs and variant names.

## Cross-store differences

| SKU | Field | Hearth Shop | Marketplace |
|---|---|---|---|
| HC-1003 | Inventory (check whether intended) | 14 | 18 |
| HC-1007 | GTIN | 2000001002590 | 2000001002599 |
| HC-1013 | Inventory (check whether intended) | 44 | 48 |
| HC-1017 | GTIN | 2000001006291 | 2000001006290 |
| HC-1023 | Inventory (check whether intended) | 24 | 28 |
| HC-1027 | GTIN | 2000001009995 | 2000001009994 |
| HC-1030 | GTIN | 2000001011102 | 2000001011103 |
| HC-1032 | GTIN | 2000001011843 | 2000001011844 |
| HC-1033 | Inventory (check whether intended) | 54 | 58 |
| HC-1034 | GTIN | 2000001012581 | 2000001012582 |
| HC-1036 | GTIN | 2000001013328 | 2000001013329 |
| HC-1037 | GTIN | 2000001013695 | 2000001013694 |
| HC-1038 | GTIN | 2000001014066 | 2000001014067 |
| HC-1040 | GTIN | 2000001014806 | 1014806 |
| HC-1042 | GTIN | 2000001015544 | 2.00482E+12 |
| HC-1043 | Inventory (check whether intended) | 34 | 38 |
| HC-1044 | GTIN | 2000001016282 | 2000002866282 |
| HC-1046 | GTIN | 2000001017029 | 2000002867029 |
| HC-1047 | GTIN | 2000001017396 | 2000001017395 |
| HC-1048 | GTIN | 2000001017760 | 2000002867760 |
| HC-1051 | Brand | Hearth & Co | Hearth and Co |
| HC-1053 | Inventory (check whether intended) | 14 | 18 |
| HC-1056 | Size | L | S |
| HC-1057 | GTIN | 2000001021096 | 2000001021095 |
| HC-1060 | Size | XL | M |
| HC-1061 | Brand | Hearth & Co | Hearth and Co |
| HC-1063 | Inventory (check whether intended) | 44 | 48 |
| HC-1067 | GTIN | 20000010O4799 | 2000001024799 |
| HC-1073 | Inventory (check whether intended) | 24 | 28 |
| HC-1077 | GTIN | 20000010O8490 | 2000001028490 |
| HC-1083 | Inventory (check whether intended) | 54 | 58 |
| HC-1093 | Inventory (check whether intended) | 34 | 38 |
| HC-1097 | Inventory (check whether intended) | 46 | 50 |
| HC-1099 | Inventory (check whether intended) | 52 | 56 |
| HC-1100 | Price | $40.00 | $42.50 |
| HC-1101 | Price | $41.50 | $44.00 |
| HC-1102 | Price | $43.00 | $45.50 |
| HC-1103 | Price | $44.50 | $47.00 |
| HC-1104 | Price | $46.00 | $48.50 |
| HC-1105 | Price | $47.50 | $50.00 |
| HC-1106 | Price | $49.00 | $51.50 |
| HC-1107 | Price | $50.50 | $53.00 |
| HC-1108 | Price | $52.00 | $54.50 |
| HC-1109 | Price | $53.50 | $56.00 |

Inventory differences are for information: channels often hold back stock on purpose, so check whether each one is intended.

## Proposed changes (you review and import them yourself)

| Store | SKU | Field | Current | Proposed | Reason |
|---|---|---|---|---|---|
| Marketplace | HC-1001 | Brand | (empty) | Hearth & Co | Match Hearth Shop (source of truth) |
| Marketplace | HC-1002 | GTIN | (empty) | 2000001000748 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1004 | GTIN | (empty) | 2000001001486 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1006 | GTIN | (empty) | 2000001002223 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1010 | GTIN | (empty) | 2000001003701 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1011 | Brand | (empty) | Hearth & Co | Match Hearth Shop (source of truth) |
| Hearth Shop | HC-1012 | Size | x-large | XL | Standard size name |
| Marketplace | HC-1014 | GTIN | (empty) | 2000001005187 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1016 | Size | Small | S | Standard size name |
| Marketplace | HC-1016 | GTIN | (empty) | 2000001005927 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1020 | GTIN | (empty) | 2000001007402 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1021 | Brand | (empty) | Hearth & Co | Match Hearth Shop (source of truth) |
| Marketplace | HC-1022 | GTIN | (empty) | 2000001008140 | Match Hearth Shop (source of truth) |
| Hearth Shop | HC-1024 | Size | large | L | Standard size name |
| Marketplace | HC-1028 | Size | Extra Large | XL | Standard size name |
| Marketplace | HC-1030 | GTIN | 2000001011103 | 2000001011102 | Match Hearth Shop (source of truth); the current code is not a valid GTIN |
| Marketplace | HC-1031 | Brand | (empty) | Hearth & Co | Match Hearth Shop (source of truth) |
| Marketplace | HC-1032 | GTIN | 2000001011844 | 2000001011843 | Match Hearth Shop (source of truth); the current code is not a valid GTIN |
| Marketplace | HC-1034 | GTIN | 2000001012582 | 2000001012581 | Match Hearth Shop (source of truth); the current code is not a valid GTIN |
| Marketplace | HC-1036 | GTIN | 2000001013329 | 2000001013328 | Match Hearth Shop (source of truth); the current code is not a valid GTIN |
| Marketplace | HC-1038 | GTIN | 2000001014067 | 2000001014066 | Match Hearth Shop (source of truth); the current code is not a valid GTIN |
| Marketplace | HC-1040 | GTIN | 1014806 | 2000001014806 | Match Hearth Shop (source of truth); the current code is not a valid GTIN |
| Marketplace | HC-1041 | Brand | (empty) | Hearth & Co | Match Hearth Shop (source of truth) |
| Marketplace | HC-1042 | GTIN | 2.00482E+12 | 2000001015544 | Match Hearth Shop (source of truth); the current code is not a valid GTIN |
| Marketplace | HC-1044 | Size | Extra Large | XL | Standard size name |
| Marketplace | HC-1044 | GTIN | 2000002866282 | 2000001016282 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1046 | GTIN | 2000002867029 | 2000001017029 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1048 | Size | Small | S | Standard size name |
| Marketplace | HC-1048 | GTIN | 2000002867760 | 2000001017760 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1051 | Brand | Hearth and Co | Hearth & Co | Match Hearth Shop (source of truth) |
| Marketplace | HC-1056 | Size | S | L | Match Hearth Shop (source of truth) |
| Marketplace | HC-1060 | Size | M | XL | Match Hearth Shop (source of truth) |
| Marketplace | HC-1061 | Brand | Hearth and Co | Hearth & Co | Match Hearth Shop (source of truth) |
| Marketplace | HC-1064 | Color | navy blue | Navy Blue | Standard capitals |
| Marketplace | HC-1068 | Color | navy blue | Navy Blue | Standard capitals |
| Marketplace | HC-1072 | Color | navy blue | Navy Blue | Standard capitals |
| Marketplace | HC-1076 | Color | navy blue | Navy Blue | Standard capitals |
| Marketplace | HC-1090 | SKU | "hc-1090" | HC-1090 | Same SKU without extra spaces, in capitals |
| Marketplace | HC-1092 | SKU | "hc-1092" | HC-1092 | Same SKU without extra spaces, in capitals |
| Marketplace | HC-1094 | SKU | "hc-1094" | HC-1094 | Same SKU without extra spaces, in capitals |
| Marketplace | HC-1096 | SKU | "hc-1096" | HC-1096 | Same SKU without extra spaces, in capitals |
| Marketplace | HC-1100 | Price | 42.5 | 40.00 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1101 | Price | 44 | 41.50 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1102 | Price | 45.5 | 43.00 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1103 | Price | 47 | 44.50 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1104 | Price | 48.5 | 46.00 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1105 | Price | 50 | 47.50 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1106 | Price | 51.5 | 49.00 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1107 | Price | 53 | 50.50 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1108 | Price | 54.5 | 52.00 | Match Hearth Shop (source of truth) |
| Marketplace | HC-1109 | Price | 56 | 53.50 | Match Hearth Shop (source of truth) |

A change that resolves a difference between the stores goes to Marketplace, because Hearth Shop is the source of truth. Standard size names and capitals can apply to either store. Nothing is imported until you import it.

## SKUs in one store only

- HC-1110 (Dune Oak Tray 110): only in Hearth Shop
- HC-1111 (Cove Brass Hook 111): only in Hearth Shop
- HC-1112 (Cedar Soy Candle 112): only in Hearth Shop
- HC-1113 (Amber Linen Throw 113): only in Hearth Shop
- HC-1114 (Harbor Ceramic Mug 114): only in Hearth Shop
- HC-1115 (Meadow Wool Blanket 115): only in Hearth Shop
- HC-1116 (Smoke Glass Vase 116): only in Hearth Shop
- HC-1117 (Fern Cotton Towel 117): only in Hearth Shop
- HC-1118 (Dune Oak Tray 118): only in Hearth Shop
- HC-1119 (Cove Brass Hook 119): only in Hearth Shop
- HC-9001 (Marketplace Exclusive 1): only in Marketplace
- HC-9002 (Marketplace Exclusive 2): only in Marketplace
- HC-9003 (Marketplace Exclusive 3): only in Marketplace
- HC-9004 (Marketplace Exclusive 4): only in Marketplace
- HC-9005 (Marketplace Exclusive 5): only in Marketplace
- HC-9006 (Marketplace Exclusive 6): only in Marketplace

List each one in the other store, or confirm it is meant to sell in one place only.

---

## How this report was checked

11 of 11 QA checks passed.

- Passed: The GTIN check accepts valid invented codes (8, 12, 13 and 14 digits, leading zeros kept) and rejects a wrong check digit, letters and wrong lengths
- Passed: Every issue names a store and a SKU
- Passed: Changes that resolve a difference between stores target only Marketplace, never the source of truth, and inventory is never changed
- Passed: Every GTIN that fails the check is listed as an issue
- Passed: The summary's counts equal the rows in each section
- Passed: Nothing says a listing was updated, applied or imported
- Passed: No claims of guarantees, certification, compliance, affiliation or unmeasured results
- Passed: Nothing says a message was sent (Amber drafts; a person sends)
- Passed: Every section of messages is labelled as drafts
- Passed: No empty section without a note saying why
- Passed: Every stage of the demo completed
