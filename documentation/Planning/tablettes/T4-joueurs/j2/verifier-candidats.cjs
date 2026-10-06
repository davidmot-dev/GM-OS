// Read-only typecheck: substitute candidate files in the compiler host.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = process.cwd();
const out = path.join(__dirname, 'candidats');
const normalize = p => path.resolve(p).replaceAll('\\', '/').toLowerCase();
const candidates = new Map(fs.readdirSync(out).filter(n => n.endsWith('.tsx')).map(name => {
    const target = name === 'TabletHub.tsx' ? 'src/components/' + name : name === 'PlayerPrivateNotes.tsx' ? 'src/modules/session/components/' + name : 'src/components/hub/' + name;
    return [normalize(target), { target: path.resolve(target), text: fs.readFileSync(path.join(out, name), 'utf8') }];
}));
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const host = ts.createCompilerHost(parsed.options);
const originalRead = host.readFile;
host.readFile = f => candidates.get(normalize(f))?.text ?? originalRead(f);
const originalExists = host.fileExists;
host.fileExists = f => candidates.has(normalize(f)) || originalExists(f);
const program = ts.createProgram([...new Set([...parsed.fileNames, ...[...candidates.values()].map(c => c.target)])], parsed.options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
    console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => root, getCanonicalFileName: f => f, getNewLine: () => '\n' }));
    process.exitCode = 1;
} else console.log('Types J2 valides par substitution virtuelle ; src et electron inchanges.');
