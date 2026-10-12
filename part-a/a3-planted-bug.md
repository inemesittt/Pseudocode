# Part A3 — Planted Bug

**Function given:** processPasswordReset
**Bug type:** Missing database transaction

---

## Pseudocode for what the function actually does

FUNCTION processPasswordReset
INPUTS: token (string), newPassword (string)
OUTPUT: none
SIDE EFFECTS: marks reset token as used in database, updates user password hash in database
FAILS WHEN: token not found, token already used, token expired, database unreachable

1. CALL database to find a PasswordResetToken where token matches AND used is false
2. IF no token found
   THROW error "Invalid or already used token"
   STOP
3. IF token expiresAt is in the past
   THROW error "Token has expired"
   STOP
4. CALL bcrypt.hash with newPassword and cost factor 12 to produce passwordHash
5. CALL database to update PasswordResetToken: set used to true
6. CALL database to update User: set passwordHash to the new hash

---

## Pseudocode for what the function should do

FUNCTION processPasswordReset
INPUTS: token (string), newPassword (string)
OUTPUT: none
SIDE EFFECTS: marks reset token as used in database, updates user password hash in database — both in a single atomic operation
FAILS WHEN: token not found, token already used, token expired, database unreachable

1. CALL database to find a PasswordResetToken where token matches AND used is false
2. IF no token found
   THROW error "Invalid or already used token"
   STOP
3. IF token expiresAt is in the past
   THROW error "Token has expired"
   STOP
4. CALL bcrypt.hash with newPassword and cost factor 12 to produce passwordHash
5. BEGIN database transaction
   UPDATE PasswordResetToken: set used to true
   UPDATE User: set passwordHash to the new hash
   COMMIT transaction
   IF anything fails inside the transaction
   ROLLBACK — neither write is applied

---

## The bug

The difference between the two pseudocodes is step 5 and 6.

In the actual function the two database writes happen as two separate calls. There is no transaction wrapping them.

If the server crashes or loses the database connection after step 5 succeeds but before step 6 runs the token is permanently marked as used but the password was never changed. The user cannot try again because the token is used. The user is locked out with no recovery path.

The fix is to wrap both writes in a single Prisma transaction using prisma.$transaction so either both succeed or neither does.

```typescript
await db.$transaction([
  db.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true }
  }),
  db.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash }
  })
]);
```