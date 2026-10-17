import { describe, it, expect } from 'vitest';
import { assemblerLeMultipart, estUnCorpsMultipart } from './corpsMultipart';

/** **Le formulaire des FLUX.2 de Cloudflare** — 2026-10-17. */
describe('le corps multipart', () => {
    it('reconnaît la déclaration de l’écran, et rien d’autre', () => {
        expect(estUnCorpsMultipart({ multipart: { champs: { prompt: 'x' } } })).toBe(true);
        expect(estUnCorpsMultipart({ prompt: 'x', steps: 4 })).toBe(false);
        expect(estUnCorpsMultipart('texte')).toBe(false);
        expect(estUnCorpsMultipart(null)).toBe(false);
    });

    it('assemble les champs puis les fichiers, avec la frontière annoncée', () => {
        const { corps, typeDeContenu } = assemblerLeMultipart({
            multipart: {
                champs: { prompt: 'a lone helmet', width: '768' },
                fichiers: [{ nom: 'input_image_0', base64: Buffer.from([1, 2, 3]).toString('base64'), type: 'image/jpeg' }],
            },
        }, 'FRONTIERE');
        expect(typeDeContenu).toBe('multipart/form-data; boundary=FRONTIERE');
        const texte = corps.toString('latin1');
        expect(texte).toBe([
            '--FRONTIERE', 'Content-Disposition: form-data; name="prompt"', '', 'a lone helmet',
            '--FRONTIERE', 'Content-Disposition: form-data; name="width"', '', '768',
            '--FRONTIERE', 'Content-Disposition: form-data; name="input_image_0"; filename="input_image_0.jpeg"',
            'Content-Type: image/jpeg', '', '\x01\x02\x03',
            '--FRONTIERE--', '',
        ].join('\r\n'));
    });

    it('les octets de l’image passent intacts', () => {
        const octets = Buffer.from([0xff, 0xd8, 0x00, 0x0d, 0x0a, 0xff, 0xd9]);
        const { corps } = assemblerLeMultipart({ multipart: { champs: {}, fichiers: [{ nom: 'input_image_0', base64: octets.toString('base64'), type: 'image/jpeg' }] } }, 'F');
        expect(corps.includes(octets)).toBe(true);
    });
});
