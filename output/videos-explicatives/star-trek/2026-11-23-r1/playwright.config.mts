import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:process.env.GMOS_TOURNER==='1'?'tourner.spec.ts':'reperage.spec.ts',workers:1,reporter:'list',outputDir:'resultats-reperage',use:{trace:'retain-on-failure'}});
