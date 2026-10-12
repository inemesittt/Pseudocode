import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function applyDiscountCode(
  code: string,
  orderTotalMinor: number,
  userId: string
) {
  // 1. Trim whitespace from code and convert to uppercase
  const normalisedCode = code.trim().toUpperCase();

  // 2. Find DiscountCode record where code matches
  const discountCode = await prisma.discountCode.findUnique({
    where: { code: normalisedCode },
  });

  // 3. No DiscountCode found
  if (!discountCode) {
    return { error: "Invalid discount code" };
  }

  // 4. Expired
  if (discountCode.expiresAt !== null && discountCode.expiresAt < new Date()) {
    return { error: "This discount code has expired" };
  }

  // 5. Maximum uses reached
  if (discountCode.maxUses !== null && discountCode.timesUsed >= discountCode.maxUses) {
    return { error: "This discount code has reached its maximum uses" };
  }

  // 6. Find DiscountCodeUsage record for this code and user
  const usage = await prisma.discountCodeUsage.findFirst({
    where: { codeId: discountCode.id, userId: userId },
  });

  // 7. User has already used this code
  if (usage) {
    return { error: "You have already used this discount code" };
  }

  // 8. Minimum spend not met
  if (discountCode.minimumSpendMinor !== null && orderTotalMinor < discountCode.minimumSpendMinor) {
    const minimumSpendNaira = discountCode.minimumSpendMinor / 100;
    return { error: `This code requires a minimum order of ₦${minimumSpendNaira}` };
  }

  // 9. Calculate discount amount
  let discountAmountMinor: number;
  if (discountCode.type === "PERCENTAGE") {
    discountAmountMinor = Math.floor((orderTotalMinor * discountCode.percentageOff) / 100);
  } else {
    discountAmountMinor = discountCode.fixedAmountMinor;
  }

  // 10. Cap discount at order total
  if (discountAmountMinor > orderTotalMinor) {
    discountAmountMinor = orderTotalMinor;
  }

  // 11. Calculate discounted total
  const discountedTotalMinor = orderTotalMinor - discountAmountMinor;

  // 12. Transaction: increment timesUsed, create usage record, commit
  await prisma.$transaction([
    prisma.discountCode.update({
      where: { id: discountCode.id },
      data: { timesUsed: { increment: 1 } },
    }),
    prisma.discountCodeUsage.create({
      data: { codeId: discountCode.id, userId: userId, createdAt: new Date() },
    }),
  ]);

  // 13. Return result
  return { discountedTotalMinor, discountAmountMinor };
}
