# Part B — Discount Code Feature

## The feature
A user applies a discount code at checkout. The system validates the code and returns the discounted total or an error explaining why the code cannot be applied.

---

FUNCTION applyDiscountCode
INPUTS:
  - code (string — the discount code the user entered)
  - orderTotalMinor (integer — the order total in kobo before discount)
  - userId (string — the id of the user applying the code)
OUTPUT:
  - object with discountedTotalMinor (integer in kobo) and discountAmountMinor (integer in kobo)
SIDE EFFECTS:
  - Records that this user has used this code (written to database on success)
FAILS WHEN:
  - code does not exist
  - code has expired
  - code has been used the maximum number of times across all users
  - this specific user has already used this code
  - order total is below the minimum spend required by the code

---

1. Trim whitespace from code and convert to uppercase
2. CALL database to find a DiscountCode record where code matches
3. IF no DiscountCode found
   RETURN error "Invalid discount code"
   STOP
4. IF DiscountCode.expiresAt is not null AND expiresAt is in the past
   RETURN error "This discount code has expired"
   STOP
5. IF DiscountCode.maxUses is not null AND DiscountCode.timesUsed >= DiscountCode.maxUses
   RETURN error "This discount code has reached its maximum uses"
   STOP
6. CALL database to find a DiscountCodeUsage record where codeId matches DiscountCode.id AND userId matches the input userId
7. IF a DiscountCodeUsage record exists
   RETURN error "You have already used this discount code"
   STOP
8. IF DiscountCode.minimumSpendMinor is not null AND orderTotalMinor < DiscountCode.minimumSpendMinor
   Calculate minimumSpendNaira by dividing minimumSpendMinor by 100
   RETURN error "This code requires a minimum order of ₦[minimumSpendNaira]"
   STOP
9. IF DiscountCode.type is "PERCENTAGE"
   Calculate discountAmountMinor as orderTotalMinor multiplied by DiscountCode.percentageOff divided by 100
   Round discountAmountMinor down to nearest integer using Math.floor
   OTHERWISE (type is "FIXED")
   Set discountAmountMinor to DiscountCode.fixedAmountMinor
10. IF discountAmountMinor is greater than orderTotalMinor
    Set discountAmountMinor to orderTotalMinor
    (Discount cannot exceed the order total — minimum charge is zero)
11. Calculate discountedTotalMinor as orderTotalMinor minus discountAmountMinor
12. BEGIN database transaction
    INCREMENT DiscountCode.timesUsed by 1
    CREATE a new DiscountCodeUsage record with codeId and userId and createdAt now
    COMMIT transaction
13. RETURN { discountedTotalMinor, discountAmountMinor }

---

## Hand traces

**Trace 1 — Normal input (valid percentage code)**
- code: "SAVE10", orderTotalMinor: 500000 (₦5000), userId: "user-1"
- Step 1: code becomes "SAVE10"
- Step 2: finds DiscountCode with type PERCENTAGE, percentageOff 10, no expiry, no maxUses, minimumSpend 200000
- Step 4: no expiry — continue
- Step 5: no maxUses — continue
- Step 6: no usage record for this user — continue
- Step 8: 500000 >= 200000 — continue
- Step 9: discountAmountMinor = floor(500000 * 10 / 100) = 50000
- Step 10: 50000 < 500000 — no cap needed
- Step 11: discountedTotalMinor = 500000 - 50000 = 450000
- Step 12: timesUsed incremented, usage record created
- Output: { discountedTotalMinor: 450000, discountAmountMinor: 50000 } ✓

**Trace 2 — Edge case (discount exceeds order total)**
- code: "FLAT5000", orderTotalMinor: 300000 (₦3000), userId: "user-2"
- Step 9: type is FIXED, discountAmountMinor = 500000
- Step 10: 500000 > 300000 — cap at 300000
- Step 11: discountedTotalMinor = 300000 - 300000 = 0
- Output: { discountedTotalMinor: 0, discountAmountMinor: 300000 } ✓

**Trace 3 — Invalid input (code already used by this user)**
- code: "SAVE10", userId: "user-1" (already used this code)
- Step 6: finds a DiscountCodeUsage record for this user
- Step 7: returns error "You have already used this discount code"
- Output: error ✓

**Trace 4 — Invalid input (below minimum spend)**
- code: "SAVE10", orderTotalMinor: 100000 (₦1000), minimumSpend is 200000
- Step 8: 100000 < 200000
- Returns error "This code requires a minimum order of ₦2000"
- Output: error ✓

**Trace 5 — Invalid input (expired code)**
- code: "XMAS25", expiresAt: yesterday
- Step 4: expiresAt is in the past
- Returns error "This discount code has expired"
- Output: error ✓