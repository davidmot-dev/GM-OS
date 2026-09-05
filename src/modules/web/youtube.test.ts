import { describe, it, expect } from 'vitest';
import {
    videoYouTube,
    adresseDIntegration,
    marqueurDeProjection,
    videoDuMarqueur,
} from './youtube';

describe('reconnaître une vidéo YouTube', () => {
    it('lit les quatre écritures que YouTube produit lui-même', () => {
        // Ce sont celles qu'on obtient en copiant depuis le site, l'application
        // mobile, le bouton Partager, et le code d'intégration.
        for (const adresse of [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://youtu.be/dQw4w9WgXcQ',
            'https://www.youtube.com/embed/dQw4w9WgXcQ',
            'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        ]) {
            expect(videoYouTube(adresse), adresse).toEqual({ id: 'dQw4w9WgXcQ', debut: undefined });
        }
    });

    it('garde les autres paramètres à distance', () => {
        // Une adresse copiée depuis une playlist traîne toujours du bagage.
        const video = videoYouTube(
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234&index=3&pp=abc',
        );
        expect(video?.id).toBe('dQw4w9WgXcQ');
    });

    it('retient le point de départ, dans les trois écritures', () => {
        expect(videoYouTube('https://youtu.be/dQw4w9WgXcQ?t=90')?.debut).toBe(90);
        expect(videoYouTube('https://youtu.be/dQw4w9WgXcQ?t=90s')?.debut).toBe(90);
        expect(videoYouTube('https://youtu.be/dQw4w9WgXcQ?t=1m30s')?.debut).toBe(90);
        expect(videoYouTube('https://www.youtube.com/embed/dQw4w9WgXcQ?start=90')?.debut).toBe(90);
    });

    it('ne reconnaît rien dans les autres liens du meneur', () => {
        /*
          C'est le cas courant : la liste de David est faite de tables de règles
          et de générateurs de noms. Un bouton « Projeter » qui s'allume sur ce
          qu'il ne sait pas faire ment.
        */
        for (const adresse of [
            'https://5thsrd.org/',
            'https://www.fantasynamegenerators.com/',
            'https://www.youtube.com/results?search_query=blade+runner',
            'https://www.youtube.com/@unechaine',
            'https://www.youtube.com/playlist?list=PL1234',
            'https://vimeo.com/123456789',
            'pas une adresse',
            '',
        ]) {
            expect(videoYouTube(adresse), adresse).toBeNull();
        }
    });

    it('refuse un identifiant qui n’en est pas un', () => {
        // Onze caractères de l'alphabet des URL, ni plus ni moins.
        expect(videoYouTube('https://youtu.be/trop-court')).toBeNull();
        expect(videoYouTube('https://www.youtube.com/watch?v=beaucoup_trop_long_pour_un_id')).toBeNull();
    });

    it('refuse un hôte qui imite YouTube', () => {
        /*
          `youtube.com.exemple.net` contient bien « youtube.com ». Une
          comparaison en sous-chaîne l'aurait accepté — la même erreur que celle
          payée sur l'Oracle le 23/08.
        */
        expect(videoYouTube('https://youtube.com.exemple.net/watch?v=dQw4w9WgXcQ')).toBeNull();
        expect(videoYouTube('https://monyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    });

    it('refuse un protocole qui n’est pas le web', () => {
        expect(videoYouTube('javascript:alert(1)')).toBeNull();
        expect(videoYouTube('file:///C:/youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    });
});

describe('adresse d’intégration', () => {
    it('vise le domaine sans traceur et bride l’écran de fin', () => {
        const url = adresseDIntegration({ id: 'dQw4w9WgXcQ' });
        expect(url).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(url).toContain('rel=0');
        expect(url).toContain('autoplay=1');
        expect(url).toContain('playsinline=1');
    });

    it('reporte le point de départ, et l’omet quand il n’y en a pas', () => {
        expect(adresseDIntegration({ id: 'dQw4w9WgXcQ', debut: 90 })).toContain('start=90');
        expect(adresseDIntegration({ id: 'dQw4w9WgXcQ' })).not.toContain('start=');
    });
});

describe('le marqueur envoyé au projecteur', () => {
    it('fait l’aller-retour sans rien perdre', () => {
        for (const video of [
            { id: 'dQw4w9WgXcQ', debut: undefined },
            { id: 'dQw4w9WgXcQ', debut: 90 },
        ]) {
            expect(videoDuMarqueur(marqueurDeProjection(video))).toEqual(video);
        }
    });

    it('ne se confond pas avec un chemin de média, ni avec les autres marqueurs', () => {
        /*
          Le projecteur reçoit une seule chaîne pour tout : un identifiant de
          média, la carte, le tableau blanc, et maintenant une vidéo. Chacun doit
          rester aveugle aux marqueurs des autres.
        */
        expect(videoDuMarqueur('m-1234-abcd')).toBeNull();
        expect(videoDuMarqueur('__whiteboard__')).toBeNull();
        expect(videoDuMarqueur('__tactical_map__')).toBeNull();
    });

    it('refuse un marqueur abîmé plutôt que de projeter un cadre mort', () => {
        expect(videoDuMarqueur('__youtube__')).toBeNull();
        expect(videoDuMarqueur('__youtube__pas-un-id')).toBeNull();
    });
});
