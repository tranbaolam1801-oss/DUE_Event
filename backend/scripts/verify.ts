import prisma from '../src/config/database';
import { getEvents } from '../src/services/event.service';
import { login } from '../src/services/auth.service';

async function main() {
  console.log('--- EVENTFLOW BACKEND VERIFICATION ---');
  
  // 1. Check database counts
  const userCount = await prisma.user.count();
  const facilityCount = await prisma.facility.count();
  const equipmentCount = await prisma.equipment.count();
  const eventCount = await prisma.event.count();
  console.log(`Users: ${userCount}, Facilities: ${facilityCount}, Equipment: ${equipmentCount}, Events: ${eventCount}`);

  // 2. Test auth login & permissions
  const loginResult = await login('btc@due.edu.vn', '123456');
  console.log(`Login test success: User "${loginResult.user.fullName}" (${loginResult.user.role})`);
  console.log(`Permissions granted (${loginResult.user.permissions.length}):`, loginResult.user.permissions.slice(0, 5).join(', ') + '...');
  console.log(`JWT Token generated: ${loginResult.token.substring(0, 20)}...`);

  // 3. Test event query
  const eventsResult = await getEvents({});
  console.log(`Events queried successfully: ${eventsResult.total} events found`);
  if (eventsResult.events.length > 0) {
    const ev = eventsResult.events[0];
    console.log(`First Event: "${ev.title}" [Status: ${ev.status}] - Code: ${ev.eventCode}`);
  }

  console.log('--- ALL BACKEND CHECKS PASSED SUCCESSFULLY ---');
}

main().catch(console.error);
