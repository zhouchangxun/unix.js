/*
 init code
 */

var tty;
termOpen();

function termOpen() {

    if (!tty) {
        console.log('create tty...')
        tty = new Terminal(
            {
                rows: 24,
                cols: 80,
                greeting: '%+r  Power up ...  %-r',
                id: 1,
                termDiv: 'termDiv',  //id of terminal div
                crsrBlinkMode: true,
                handler: termHandler,
                exitHandler: termExitHandler,

            }
        );
        if (tty) {
            tty.open();
            krnlInit();
        }
    }
    else if (tty.closed) {
        tty.open();
        krnlInit();
    }
    else {
        tty.close();
    }
}
function termHandler() {
    // called on <CR> or <ENTER> under line mode
    this.newLine();
    var cmd=this.lineBuffer;
    if (cmd!='') {
        console.log('ignore typed: '+cmd);
        //this.newLine();
    }
    this.prompt();
}
function termExitHandler() {
    // optional handler called on exit
    console.log('close terminal...')
}