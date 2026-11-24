import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts'],include:['output/videos-explicatives/star-trek/2026-11-23-r1/preparer.test.ts']}});
