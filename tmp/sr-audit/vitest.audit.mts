import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'node',include:['tmp/sr-audit/*.test.ts']}});
