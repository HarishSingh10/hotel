import { prisma } from '../lib/db'

async function main() {
  const propertyId = '698f40f2c1d818598d5213bc'
  console.log('--- DB CLEANUP (RAW) ---')
  
  // Use updateMany with MongoDB-specific null check (isSet: false)
  // @ts-ignore
  const result = await prisma.booking.updateMany({
    where: { 
      propertyId: { equals: null } 
    },
    data: { 
      propertyId: propertyId 
    }
  })
  
  console.log(`Updated ${result.count} orphan bookings.`)
  
  // Also check for status: CHECKED_IN but checkOut is in the past
  // and mark them CHECKED_OUT or just leave them but they won't show in modal now because of my filter fix.
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
