/** PDF minimal de test, sans document réel : une ligne ASCII par page. */
export function pdfArtificiel(pages: readonly string[]): Buffer {
    const objets = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + 2 * i} 0 R`).join(' ')}] /Count ${pages.length} >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    for (const [i, texte] of pages.entries()) {
        const echappe = texte.replace(/[\\()]/g, '\\$&');
        const contenu = `BT /F1 12 Tf 72 720 Td (${echappe}) Tj ET`;
        objets.push(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + 2 * i} 0 R >>`,
            `<< /Length ${Buffer.byteLength(contenu, 'ascii')} >>\nstream\n${contenu}\nendstream`,
        );
    }
    let document = '%PDF-1.4\n';
    const offsets = [0];
    for (const [i, objet] of objets.entries()) {
        offsets.push(Buffer.byteLength(document, 'ascii'));
        document += `${i + 1} 0 obj\n${objet}\nendobj\n`;
    }
    const xref = Buffer.byteLength(document, 'ascii');
    document += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
    document += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    document += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(document, 'ascii');
}
