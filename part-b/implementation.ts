import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface DiscountResult {
    discountedTotalMinor: number
    discountAmountMinor: number
}

interface DiscountError {
    error: string
}

type DiscountResponse = DiscountResult | DiscountError

async function applyDiscountCode(
    code: string,
    orderTotalMinor: number,
    userId: string
): Promise<DiscountResponse> {
    // Step 1 — clean the code
    const cleanCode = code.trim().toUpperCase()

    // Step 2 — find the discount code in the database
    const discountCode = await db.discountCode.findUnique({
        where: { code: cleanCode }
    })

    // Step 3 — check if it exists
    if (!discountCode) {
        return { error: 'Invalid discount code' }
    }

    // Step 4 — check if it has expired
    if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
        return { error: 'This discount code has expired' }
    }

    // Step 5 — check max uses
    if (discountCode.maxUses !== null && discountCode.timesUsed >= discountCode.maxUses) {
        return { error: 'This discount code has reached its maximum uses' }
    }

    // Step 6 — check if this user has already used it
    const existingUsage = await db.discountCodeUsage.findFirst({
        where: {
            codeId: discountCode.id,
            userId: userId
        }
    })

    // Step 7 — return error if already used
    if (existingUsage) {
        return { error: 'You have already used this discount code' }
    }

    // Step 8 — check minimum spend
    if (discountCode.minimumSpendMinor !== null && orderTotalMinor < discountCode.minimumSpendMinor) {
        const minimumSpendNaira = discountCode.minimumSpendMinor / 100
        return { error: `This code requires a minimum order of ₦${minimumSpendNaira.toLocaleString('en-NG')}` }
    }

    // Step 9 — calculate the discount amount
    let discountAmountMinor: number
    if (discountCode.type === 'PERCENTAGE') {
        discountAmountMinor = Math.floor(orderTotalMinor * discountCode.percentageOff / 100)
    } else {
        discountAmountMinor = discountCode.fixedAmountMinor
    }

    // Step 10 — cap the discount so it never exceeds the order total
    if (discountAmountMinor > orderTotalMinor) {
        discountAmountMinor = orderTotalMinor
    }

    // Step 11 — calculate the discounted total
    const discountedTotalMinor = orderTotalMinor - discountAmountMinor

    // Step 12 — write to database in a single transaction
    await db.$transaction([
        db.discountCode.update({
            where: { id: discountCode.id },
            data: { timesUsed: { increment: 1 } }
        }),
        db.discountCodeUsage.create({
            data: {
                codeId: discountCode.id,
                userId: userId,
                createdAt: new Date()
            }
        })
    ])

    // Step 13 — return the result
    return { discountedTotalMinor, discountAmountMinor }
}

export { applyDiscountCode }