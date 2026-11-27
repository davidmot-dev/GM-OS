import {Buffer} from 'node:buffer';
import {vi} from 'vitest';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
