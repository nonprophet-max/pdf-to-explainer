declare module '*.json';
declare const require: {context: (dir: string, deep: boolean, re: RegExp) => {keys(): string[]; <T>(id: string): T}};
