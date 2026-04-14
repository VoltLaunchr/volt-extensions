const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

export function success(msg: string): void {
  console.log(`${GREEN}✔${RESET} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${RED}✖${RESET} ${msg}`);
}

export function warn(msg: string): void {
  console.warn(`${YELLOW}⚠${RESET} ${msg}`);
}

export function info(msg: string): void {
  console.log(`${CYAN}ℹ${RESET} ${msg}`);
}

export function bold(msg: string): string {
  return `${BOLD}${msg}${RESET}`;
}

export function dim(msg: string): string {
  return `${DIM}${msg}${RESET}`;
}

export function heading(msg: string): void {
  console.log(`\n${BOLD}${msg}${RESET}\n`);
}
