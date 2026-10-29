import { readTestEnv, sweepStaleTestData } from './harness.js';

export default async function setup() {
  readTestEnv();
  await sweepStaleTestData();
  return async () => {
    await sweepStaleTestData();
  };
}
