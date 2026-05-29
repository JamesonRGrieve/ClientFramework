type Verbosity = {
  client?: number | undefined;
  server?: number | undefined;
};

const DEFAULT_VERBOSITY: Verbosity = { client: 3, server: 3 };

function emit(logItems: unknown[], heading: string | null): void {
  if (heading !== null && heading !== '') {
    console.log(`--- ${heading.toUpperCase()} ---`);
  }
  console.log(...logItems);
  if (heading !== null && heading !== '') {
    console.log('-'.repeat(heading.length + 8));
  }
}

export default function log(
  logItems: unknown[],
  verbosity: Verbosity = DEFAULT_VERBOSITY,
  heading: string | null = null,
): void {
  // Server
  if (typeof window === 'undefined') {
    if (!Number.isNaN(Number(process.env.LOG_VERBOSITY_SERVER)) && verbosity.server !== undefined) {
      // If we are on server, the env var for server output is defined and there is a server verbosity level for this log.
      emit(logItems, heading);
    }
    return;
  }
  // If we are on client, the env var for client output is defined and there is a client verbosity level for this log.
  if (!Number.isNaN(Number(process.env.NEXT_PUBLIC_LOG_VERBOSITY_CLIENT)) && verbosity.client !== undefined) {
    emit(logItems, heading);
  }
}
