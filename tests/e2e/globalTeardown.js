import { adminClient, deleteTestData, escapeLike } from '../integration/harness.js';

export default async function teardown() {
  await deleteTestData(adminClient(), `${escapeLike(process.env.E2E_PREFIX)}%`);
}
