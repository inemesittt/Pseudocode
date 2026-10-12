# Task 5 — Pseudocoding

## The pseudocode standard used

Every pseudocode block in this repository follows this format:

```
FUNCTION name
INPUTS: each input with its type and what it means
OUTPUT: what is returned with its type
SIDE EFFECTS: anything written, sent, or changed outside the function, or NONE
FAILS WHEN: every condition under which this function cannot succeed

Numbered steps. One action per step. Plain English, present tense.
Branches are explicit: IF / OTHERWISE
Loops are explicit: FOR EACH / END FOR
Every early exit is named: RETURN / STOP
External calls are marked: CALL
State changes are marked: WRITE / UPDATE / CREATE
```

---

## Part A — Reading code into pseudocode

### A1 — Three functions from my own work

**Function 1 — Webhook Handler (payment-slice)**
The most critical function in the payment slice. Handles Flutterwave webhook delivery, signature verification, idempotency checking, amount verification, and subscription activation. All in one function with multiple early exit paths.

**Function 2 — Worker Job Claim (jobs-slice)**
The atomic claim function that ensures two workers can never take the same job. Uses a single SQL UPDATE statement as the lock mechanism.

**Function 3 — Rate Limit Check (auth-slice)**
The rate limiting wrapper that fails open when Redis is unreachable so a database outage does not block legitimate users.

Each function includes three hand traces: a normal input, an edge case, and an invalid input. The trace and the real code output were compared for each.

### A2 — Three functions from an open source library

**Library: Zod v4**

**Function 1 — z.string()** (short)
Constructs a ZodString schema object. Simple constructor, no validation runs at this point.

**Function 2 — z.string().min()** (medium)
Registers a minimum length check on the schema. Returns a new schema object rather than mutating the existing one.

**Function 3 — safeParse()** (hardest)
The full parse and validate flow. Creates a parse context, runs _parse, collects issues, and returns success or failure without throwing.

**What I got wrong vs the AI:**
- I described the min method as "copying" the object. The AI clarified that Zod uses a _def object pattern where each schema stores its definition separately. The effect is the same but the mechanism is different.
- I said safeParse always returns synchronously. The AI said the same. I checked the source and found we were both partially wrong — safeParseAsync exists for async refinements. The AI's explanation was incomplete here.

### A3 — Planted bug

A function was given to me with one planted bug. I wrote pseudocode for what it actually does and what it should do. The bug is the difference.

**The bug:** Two database writes happened as separate calls with no transaction wrapping them. If the server crashed between the two writes the token would be permanently marked as used but the password would never be updated. The user would be locked out with no recovery path.

**The fix:** Wrap both writes in a single Prisma $transaction so either both succeed or neither does.

---

## Part B — Writing pseudocode into code

**Feature:** Discount code application with expiry, maximum uses, one-use-per-customer, and minimum spend rules.

I wrote the complete pseudocode first including all failure conditions and five hand traces. I then implemented it from the pseudocode without AI, mapping each numbered step to a small identifiable piece of code.

**Files:**
- `part-b/pseudocode.md` — the pseudocode with five hand traces
- `part-b/implementation.ts` — my implementation from the pseudocode

---

## Part C — Directing AI with pseudocode and verifying the output

I gave the pseudocode from Part B to an AI agent with the instruction to implement it exactly, one function per pseudocode block, no additional behaviour.

I then reverse engineered pseudocode from the AI's output without looking at my original. I compared both pseudocodes and ran both implementations against ten inputs.

**What the AI added that I did not ask for:** Nothing significant. The AI followed the pseudocode closely.

**What the AI omitted:** The toLocaleString formatting on the minimum spend error message. My pseudocode said "calculate minimumSpendNaira" but did not specify the display format. The AI produced a raw number without formatting.

**What ambiguity in my pseudocode the AI exposed:** Step 2 said "find a DiscountCode record where code matches" without specifying findUnique vs findFirst. The AI chose findUnique which requires a unique database constraint. My pseudocode should have been explicit about the lookup strategy.

**Where the implementations disagreed:** Input 8 — error message formatting. Both were logically correct but produced different strings. I determined mine was more correct for Nigerian users because it includes the thousands separator.

**Files:**
- `part-c/ai-implementation.ts` — the AI's implementation
- `part-c/reverse-pseudocode.md` — pseudocode written from the AI's code
- `part-c/difference-table.md` — every difference classified
- `part-c/comparison.md` — ten input comparison

---

## What I learned

The most surprising thing from this task was how much a vague step in pseudocode costs you. Step 2 in my pseudocode said "find a DiscountCode record where code matches." That sounds complete. But it left open whether to use findUnique or findFirst. The AI chose findUnique. My implementation also chose findUnique. Both would fail at runtime if the code field does not have a unique database constraint — and neither of us checked that.

A pseudocode step that feels complete can still contain an assumption you did not realise you were making. The AI exposed that assumption not because it was smarter but because it had to make a choice where I had left a gap.