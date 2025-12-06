export function getDungeonCode(runId) {
  if (runId.includes('#')) {
    return runId.split('#')[0].trim();
  }
  return null;
};