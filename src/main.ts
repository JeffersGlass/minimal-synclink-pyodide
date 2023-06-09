import * as Synclink from 'synclink';
import type { loadPyodide as loadPyodideDeclaration, PyodideInterface, PyProxy, PyProxyDict } from 'pyodide';

declare const loadPyodide: typeof loadPyodideDeclaration;
const interpreterURL = 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js'

async function _startInterpreter_main(){
        console.info('Starting the interpreter in the main thread');
        const remote_interpreter = loadMainThreadInterpreter()
        const { port1, port2 } = new Synclink.FakeMessageChannel() as unknown as MessageChannel;
        port1.start();
        port2.start();
        Synclink.expose(remote_interpreter, port2);
        const wrapped_remote_interpreter = Synclink.wrap(port1);

        //User Code Here vvvv
        
        //User Code Above ^^^^

        console.log("User code complete")
}

async function loadMainThreadInterpreter(){
    console.info("Loading pyodide?")
    
    await import(interpreterURL);

    const interf = Synclink.proxy(
        await loadPyodide({
            fullStdLib: false,
        }),
    );
    interf.registerComlink(Synclink);
    //globals = Synclink.proxy(this.interface.globals as PyProxyDict);
    return interf
}

const interpreter = _startInterpreter_main()