import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'user@success.com'
    const user = await prisma.user.update({
        where: { email },
        data: { email_verified: true },
    })
    console.log(`Verified user: ${user.email}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
