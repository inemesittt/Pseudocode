# Part C — Ten Input Comparison

Running both implementations against the same ten inputs and comparing outputs.

Note: neither implementation has a real database so the comparison is traced by hand against the pseudocode logic, not live execution.

| Input | orderTotalMinor | Code type | Expected output | My implementation | AI implementation | Match? |
|---|---|---|---|---|---|---|
| 1. Valid 10% code, order ₦5000 | 500000 | PERCENTAGE 10% | discountAmount: 50000, total: 450000 | 50000, 450000 | 50000, 450000 | Yes |
| 2. Valid ₦1000 fixed code, order ₦5000 | 500000 | FIXED 100000 | discountAmount: 100000, total: 400000 | 100000, 400000 | 100000, 400000 | Yes |
| 3. Fixed code exceeds order total | 30000 | FIXED 100000 | discountAmount: 30000, total: 0 | 30000, 0 | 30000, 0 | Yes |
| 4. Code does not exist | any | — | error: Invalid discount code | error | error | Yes |
| 5. Code expired yesterday | any | any | error: This discount code has expired | error | error | Yes |
| 6. Code at max uses | any | any | error: This discount code has reached its maximum uses | error | error | Yes |
| 7. User already used this code | any | any | error: You have already used this discount code | error | error | Yes |
| 8. Order below minimum spend (₦1000 min, order ₦500) | 50000 | any, min 100000 | error: minimum order ₦1000 | error with toLocaleString | error without formatting | Partial — same logic, different formatting |
| 9. 100% percentage discount | 500000 | PERCENTAGE 100% | discountAmount: 500000, total: 0 | 500000, 0 | 500000, 0 | Yes |
| 10. Order total of 0 kobo | 0 | FIXED 100000 | discountAmount: 0, total: 0 (capped) | 0, 0 | 0, 0 | Yes |

## Where they disagreed

Input 8 — error message formatting. Both implementations return an error when the order is below the minimum spend. My implementation formats the Naira amount with toLocaleString producing "₦1,000". The AI implementation produces "₦1000" with no thousands separator. The logic is identical but the output string differs.

This was traced to the ambiguity in my pseudocode identified in the difference table. The pseudocode said "calculate minimumSpendNaira" but did not specify the display format.

## Which was right

Both implementations are correct on the logic. The formatting difference is a display preference not a correctness issue. My implementation produces a more readable error message for Nigerian users who expect the thousands separator.