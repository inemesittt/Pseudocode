# Part C — Difference Table

Comparing original pseudocode (part-b/pseudocode.md) against reverse-engineered pseudocode from AI implementation (part-c/ai-implementation.ts).

| Step | Original pseudocode | AI implementation | Difference type | Notes |
|---|---|---|---|---|
| 2 | findFirst on code | findUnique on code | AI added something | findUnique only works if code has a @unique constraint in schema. findFirst is safer and matches the original intent. |
| 8 | formats minimumSpendNaira with toLocaleString | divides by 100 with no formatting | AI omitted something | A minimum of 150050 kobo gives ₦1500.5 in the AI version. My implementation uses toLocaleString for cleaner output like ₦1,500.50 |
| 9 | reads percentageOff from discountCode.percentageOff | reads percentageOff from discountCode.percentageOff | No difference | Both match |
| 12 | transaction creates DiscountCodeUsage with createdAt: new Date() | transaction creates DiscountCodeUsage with createdAt: new Date() | No difference | Both match |
| All error paths | returns { error: message } | returns { error: message } | No difference | Both return not throw |

## Summary

The AI followed the pseudocode correctly on 11 of 13 steps.

Two differences found:

1. findUnique vs findFirst on step 2 — the AI added a constraint (uniqueness) that was not in the pseudocode. This exposed an ambiguity in my pseudocode. Step 2 should have said "find one DiscountCode record" rather than leaving the lookup method unspecified.

2. Number formatting on step 8 — the AI omitted the toLocaleString formatting I used. This is not a bug but it produces a less readable error message. My pseudocode was ambiguous here — it said "calculate minimumSpendNaira" but did not specify the display format.

## Ambiguity found in my own pseudocode

Step 2 said "CALL database to find a DiscountCode record where code matches" without specifying whether the lookup should use findUnique or findFirst. The AI chose findUnique which is only valid if code has a database unique constraint. My implementation used findUnique too. Both would fail at runtime if the schema does not have that constraint. The pseudocode should have said "CALL database to find one DiscountCode record where code matches, using a unique index on the code field."