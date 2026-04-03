export const SAFETY = {
  STORM: Number(process.env.STORM_TH || 5),
  STARTUP: Number(process.env.STARTUP_TH || 10_000),
  PG_REQUIRED: String(process.env.PG_REQUIRED || 'false').toLowerCase() === 'true'
};
