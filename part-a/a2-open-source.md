# Part A2 — Pseudocode for Three Open Source Functions

**Library chosen:** Zod (version 4.x)
**Why chosen:** Used in every project in this bootcamp for request body validation and structured output validation from AI models.

**Note on process:** I read each function in the Zod source code first and wrote my own pseudocode. I then asked an AI to explain the same function and recorded every place my understanding differed from the AI's explanation.

---

## Function 1 — z.string() (short)
**Source:** `packages/zod/src/types.ts` — ZodString class constructor

---

FUNCTION z.string
INPUTS: none
OUTPUT: a ZodString schema object
SIDE EFFECTS: none
FAILS WHEN: never — this is a constructor, it always succeeds

1. Create a new ZodString object
2. Set the internal type identifier to "string"
3. Set the checks array to empty — no validation rules have been added yet
4. Set coerce to false by default — do not try to convert non-strings to strings
5. RETURN the ZodString object

---

### AI comparison notes

My understanding matched the AI explanation on all key points. One thing the AI added that I did not capture: the ZodString object also stores a reference to the parent ZodType class which gives it access to methods like .optional(), .nullable(), and .array(). I had not traced the inheritance chain so I missed that.

One thing I had that the AI did not emphasise: the checks array being empty at construction time is important because it means z.string() with no chained methods only checks that the value is a string and nothing else. The AI mentioned this but only briefly.

---

## Function 2 — z.string().min() (medium)
**Source:** `packages/zod/src/types.ts` — ZodString.min method

---

FUNCTION ZodString.min
INPUTS: minLength (integer — the minimum number of characters), message (optional string — custom error message)
OUTPUT: a new ZodString schema object with the minimum length check added
SIDE EFFECTS: none — returns a new object, does not mutate the existing one
FAILS WHEN: never at definition time — fails only when the schema is used to parse a value that is too short

1. Read the existing checks array from the current ZodString object
2. Create a new check object with:
   - kind: "min"
   - value: minLength
   - message: the custom message if provided, otherwise undefined
3. Create a new ZodString object that is a copy of the current one
4. Add the new check object to the checks array of the new ZodString object
5. RETURN the new ZodString object

Note: this function does not run the validation. It only registers that the validation should run later when .parse() or .safeParse() is called.

---

### AI comparison notes

My understanding was mostly correct. The key difference: I described it as "copying" the existing object. The AI was more precise — Zod uses a _def object pattern where each schema stores its definition separately from its methods. The min method creates a new _def object merging the old checks with the new one and passes it to the ZodString constructor. The practical effect is the same but the implementation detail matters if you are debugging.

The AI also clarified that the message parameter can be either a string or an object with a message property. I had only described the string case.

---

## Function 3 — safeParse() (hardest)
**Source:** `packages/zod/src/types.ts` — ZodType.safeParse method

---

FUNCTION safeParse
INPUTS: data (any value — the data to validate), options (optional object with path and error map settings)
OUTPUT: object with either { success: true, data: parsedValue } or { success: false, error: ZodError }
SIDE EFFECTS: none
FAILS WHEN: never throws — all errors are returned as { success: false, error } instead of thrown

1. Create a new parse context object with:
   - the input data
   - the current path (empty array if not provided)
   - the error map (default if not provided)
   - a list to collect any issues found during parsing
2. CALL the internal _parse method with this context
   (This is where the actual type checking and validation runs)
3. IF _parse returns a value synchronously
   IF there are no issues in the context
     RETURN { success: true, data: the parsed and transformed value }
   OTHERWISE
     Collect all issues into a ZodError object
     RETURN { success: false, error: the ZodError }
4. IF _parse returns a Promise (async schema)
   RETURN a Promise that resolves to the same success or failure shape

Note: safeParse never throws. It catches all validation failures and returns them as structured errors. This is different from parse() which throws a ZodError on failure.

---

### AI comparison notes

This is where my understanding had the most gaps.

**Where I was wrong:** I described _parse as a single function. The AI clarified that _parse is actually defined differently on every ZodType subclass. ZodString._parse checks that the value is a string and then runs each check in the checks array in order. ZodObject._parse validates each key against its schema. They share the same interface but the implementation is different per type.

**Where the AI was wrong:** The AI said safeParse always returns synchronously. I checked the source code again and found that ZodType does have async support via safeParseAsync. The regular safeParse can return a Promise if an async refinement is used. I was right to note this and the AI's explanation was incomplete on this point.

**Where we agreed:** The success/failure shape, the ZodError structure, and the fact that safeParse never throws.