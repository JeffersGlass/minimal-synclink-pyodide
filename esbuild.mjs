import { build } from 'esbuild';
import { spawn } from 'child_process';
import { join } from 'path';
import { watchFile } from 'fs';
import { lstat, readdir } from 'fs/promises';

const production = !process.env.NODE_WATCH || process.env.NODE_ENV === 'production';

const pyScriptConfig = {
    entryPoints: ['src/main.ts'],
    loader: { '.py': 'text' },
    bundle: true,
    format: 'iife',
    globalName: 'pyscript',
};

const interpreterWorkerConfig = {
    entryPoints: ['src/worker.ts'],
    loader: { '.py': 'text' },
    bundle: true,
    format: 'iife',
};


const esbuild = async () => {
    const timer = `\x1b[1mpyscript\x1b[0m \x1b[2m('dev')\x1b[0m built in`;
    console.time(timer);

    await Promise.all([
        build({
            ...pyScriptConfig,
            sourcemap: true,
            minify: false,
            outfile: 'build/main.js',
        }),
        build({
            ...interpreterWorkerConfig,
            sourcemap: false,
            minify: false,
            outfile: 'build/interpreter_worker.js',
        }),
    ]);

    console.timeEnd(timer);
};

esbuild().then(() => {
    if (!production) {
        (async function watchPath(path) {
            for (const file of await readdir(path)) {
                const whole = join(path, file);
                if (/\.(js|ts|css|py)$/.test(file)) {
                    watchFile(whole, async () => {
                        await esbuild();
                    });
                } else if ((await lstat(whole)).isDirectory()) {
                    watchPath(whole);
                }
            }
        })('src');

        const server = spawn('python', ['-m', 'http.server', '--directory', './examples', '8080'], {
            stdio: 'inherit',
            detached: false,
        });

        process.on('exit', () => {
            server.kill();
        });
    }
});
