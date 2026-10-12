# Part C — Reverse Pseudocode

I read the AI implementation in part-c/ai-implementation.ts and wrote this pseudocode from the code alone. I did not look at my original pseudocode in part-b/pseudocode.md while writing this.

---

FUNCTION applyDiscountCode
INPUTS: code (string), orderTotalMinor (integer), userId (string)
OUTPUT: object with discountedTotalMinor and discountAmountMinor, or object with error string
SIDE EFFECTS: increments timesUsed on DiscountCode, creates DiscountCodeUsage record
FAILS WHEN: database unreachable

1. Trim whitespace from code and convert to uppercase
2. CALL database findUnique on DiscountCode where code matches
3. IF no record found RETURN { error: "Invalid discount code" }
4. IF expiresAt is not null AND expiresAt is less than current time RETURN { error: "This discount code has expired" }
5. IF maxUses is not null AND timesUsed is greater than or equal to maxUses RETURN { error: "This discount code has reached its maximum uses" }
6. CALL database findFirst on DiscountCodeUsage where codeId matches and userId matches
7. IF a record was found RETURN { error: "You have already used this discount code" }
8. IF minimumSpendMinor is not null AND orderTotalMinor is less than minimumSpendMinor divide minimumSpendMinor by 100 to get minimumSpendNaira RETURN { error: "This code requires a minimum order of ₦[minimumSpendNaira]" }
9. IF type is "PERCENTAGE" set discountAmountMinor to Math.floor(orderTotalMinor times percentageOff divided by 100) OTHERWISE set discountAmountMinor to fixedAmountMinor
10. IF discountAmountMinor is greater than orderTotalMinor set discountAmountMinor to orderTotalMinor
11. Set discountedTotalMinor to orderTotalMinor minus discountAmountMinor
12. CALL database $transaction with two operations: update DiscountCode incrementing timesUsed by 1, create DiscountCodeUsage with codeId userId and createdAt
13. RETURN { discountedTotalMinor, discountAmountMinor }