// Preparation outside src: keep all J1 changes and the existing business logic.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const out = path.join(__dirname, 'candidats');
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const write = (name, text) => fs.writeFileSync(path.join(out, name), text, 'utf8');
function replaceOnce(source, pattern, replacement) {
    if (!pattern.test(source)) throw new Error(`Pattern absent: ${pattern}`);
    return source.replace(pattern, replacement);
}
let source = read('src/components/hub/HubMessenger.tsx');
source = replaceOnce(source, /    return \(\n        <AnimatePresence>[\s\S]*$/, read(path.join(out, 'messagerie-rendu.txt')));
source = source.replace('MessageSquare, Send, X, Users', 'Send, Users').replace('Bouton, EnTeteDeModule, Panneau', 'Bouton, EnTeteDeModule');
source = source.replace("import React,", "import { useFermetureParEchap } from '../../hooks/useFermetureParEchap';\nimport React,");
source = source.replace('    return (\n        <AnimatePresence>', "    useFermetureParEchap(isOpen, () => {\n        if (isDropdownOpen) setIsDropdownOpen(false);\n        else onClose();\n    }, 'Messagerie tablette');\n\n    return (\n        <AnimatePresence>");
write('HubMessenger.tsx', source);
source = read('src/components/hub/HubNotificationCenter.tsx');
source = replaceOnce(source, /    return \(\n        <div[\s\S]*$/, read(path.join(out, 'notification-rendu.txt'))).replace('Bell, X, ShieldAlert', 'Bell, ShieldAlert');
write('HubNotificationCenter.tsx', source);
source = read('src/modules/session/components/PlayerPrivateNotes.tsx');
source = source.replace('w-full h-[600px]', 'w-full min-h-48 h-[40dvh]').replaceAll('text-ui-10', 'text-[14px]').replaceAll('text-xs', 'text-[14px]').replaceAll('text-sm', 'text-[16px]');
source = source.replace('gap-4 bg-app-bg/30 border border-app-text/5 p-5', 'gap-4 bg-app-bg/30 border border-app-text/5 p-3').replace('max-h-[640px] overflow-y-auto pr-1', 'pr-1');
source = source.replaceAll('flex items-center justify-between', 'flex flex-wrap items-center justify-between gap-2');
source = source.replace('gap-4">\n                    {activeTab', 'gap-2">\n                    {activeTab');
source = source.replace('gap-2">\n                    <BookText', 'gap-2 min-w-0">\n                    <BookText');
source = source.replace('uppercase tracking-wider text-[16px]', 'text-[16px]');
for (const [name, rating] of [['Plaisir de jeu', 'Fun'], ['Histoire', 'Story'], ['Combat / Action', 'Combat']]) {
    source = replaceOnce(source, new RegExp('onClick=\\{\\(\\) => set' + rating + 'Rating\\(i \\+ 1\\)\\}\\n\\s*className="[^"]+"'),
        `onClick={() => set${rating}Rating(i + 1)}\n                                                        aria-label={\`${name} : \${i + 1} sur 5\`}\n                                                        aria-pressed={${rating.toLowerCase()}Rating === i + 1}\n                                                        className="flex size-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent hover:bg-app-text/10"`);
}
source = source.replace('className="flex w-full items-center justify-between', 'className="flex flex-wrap gap-2 w-full items-center justify-between');
write('PlayerPrivateNotes.tsx', source);
source = read('src/components/TabletHub.tsx');
source = replaceOnce(source, /            <div className="relative z-40 flex h-screen[\s\S]*?            <\/div>\n            \)\}/, read(path.join(out, 'consultations-rendu.txt')).trimEnd() + '\n            )}');
source = replaceOnce(source, /                    <AnimatePresence>\n                        \{isNotesOpen[\s\S]*?                    <\/AnimatePresence>/, read(path.join(out, 'notes-rendu.txt')).trimEnd());
source = source.replace("import React, { useState, useMemo, useEffect, useRef }", "import React, { useState, useMemo, useEffect }");
source = source.replace("import NarrativeClock from '../modules/clock/components/NarrativeClock';\n", '').replace("import ClockVisualizer from '../modules/clock/components/ClockVisualizer';\n", '').replace("import { type TensionClock } from '../store/useClockStore';\n", '');
source = source.replace("import { useMediaUrl }", "import { useFermetureParEchap } from '../hooks/useFermetureParEchap';\nimport { useMediaUrl }");
source = source.replace("    const navScrollRef = useRef<HTMLDivElement>(null);\n    const [navEdges, setNavEdges] = useState({ left: false, right: false });\n", '');
source = replaceOnce(source, /    useEffect\(\(\) => \{\n        const nav = navScrollRef.current;[\s\S]*?    \}, \[currentTab\]\);\n/, '');
source = replaceOnce(source, /<div ref=\{navScrollRef\} data-hub-nav-scroll onScroll=\{\(\) => \{[\s\S]*?\}\} className=/, '<div data-hub-nav-scroll className=');
// All six tabs now use the same flowing layout. Resolve the former feature
// switch with the parser, preserving comments and formatting elsewhere.
let ast = ts.createSourceFile('TabletHub.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const value = n => ts.isIdentifier(n) && n.text === 'estReagence' ? true : ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.ExclamationToken && ts.isIdentifier(n.operand) && n.operand.text === 'estReagence' ? false : undefined;
function render(n) {
    if (ts.isConditionalExpression(n) && value(n.condition) !== undefined) return render(value(n.condition) ? n.whenTrue : n.whenFalse);
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        if (value(n.left) === false || (ts.isBinaryExpression(n.left) && value(n.left.left) === false)) return 'false';
        if (value(n.left) === true) return render(n.right);
    }
    let result = '', cursor = n.getStart(ast);
    n.forEachChild(child => { result += source.slice(cursor, child.getStart(ast)) + render(child); cursor = child.end; });
    return result + source.slice(cursor, n.end);
}
source = render(ast);
source = source.replace(/    const estReagence = .*;\n/, '').replace(/^\s*\{false\}\s*\n/gm, '').replaceAll('habillage={\'socle\'}', 'habillage="socle"');
source = source.replace("${'h-dvh'} bg-app-bg", 'h-dvh [--hub-navigation-hauteur:148px] lg:[--hub-navigation-hauteur:100px] bg-app-bg');
source = source.replace("    return (\n        <div className={`h-dvh", "    useFermetureParEchap(isNotesOpen, () => setIsNotesOpen(false), 'Notes joueur');\n    useFermetureParEchap(isCombatOverlayOpen, () => setIsCombatOverlayOpen(false), 'Initiative tablette');\n\n    return (\n        <div className={`h-dvh");
source = source.replaceAll(", x: '-50%'", '').replace('fixed bottom-24 left-1/2 z-[200] cursor-pointer', 'fixed bottom-[calc(var(--hub-navigation-hauteur)+env(safe-area-inset-bottom)+8px)] inset-x-3 z-[200] cursor-pointer lg:left-auto lg:w-[440px]');
source = source.replace('className="bg-accent text-app-on-accent backdrop-blur-xl', 'className="w-full bg-accent text-app-on-accent backdrop-blur-xl').replace('className="flex flex-col">\n                    <span className="text-ui-10', 'className="min-w-0 flex flex-col">\n                    <span className="text-[14px]').replace('className="text-sm font-bold leading-tight">\n                        {fromName}', 'className="break-words text-[16px] font-bold leading-tight">\n                        {fromName}');
source = source.replaceAll('    ChevronRight,\n', '').replaceAll('    BookOpen,\n', '').replaceAll('    User,\n', '').replaceAll('    LogOut,\n', '');
source = source.replace(/\s*<tab.icon className=\{'hidden'\} \/>/, '').replace(/\s*<(User|BookOpen|MessageSquare|LogOut) className=\{'hidden'\} \/>/g, '');
write('TabletHub.tsx', source);
for (const name of fs.readdirSync(out).filter(n => n.endsWith('.tsx'))) {
    const parsed = ts.transpileModule(read(path.join(out, name)), { fileName: name, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
    if (parsed.diagnostics?.length) throw new Error(name + ': ' + ts.formatDiagnosticsWithColorAndContext(parsed.diagnostics, { getCurrentDirectory: () => process.cwd(), getCanonicalFileName: f => f, getNewLine: () => '\n' }));
}
console.log('12 candidats TSX prepares et parses ; src et electron inchanges.');
