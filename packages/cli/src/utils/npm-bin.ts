export interface NpmCommand {
  command: string;
  args: string[];
}

export function npxCommand(args: string[]): NpmCommand {
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec ?? 'cmd.exe',
      args: ['/d', '/s', '/c', 'npx', ...args],
    };
  }

  return {
    command: 'npx',
    args,
  };
}
