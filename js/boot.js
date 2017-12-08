/*
 init code
 */

require.config({
    //define all js file path base on this base path
    //actually this can setting same to data-main attribute in script tag
    baseUrl:"./js/"

    //define each js frame path, not need to add .js suffix name
    ,paths:{
        //"jquery":["http://libs.baidu.com/jquery/2.0.3/jquery", "lib/jquery/jquery-1.9.1.min"],
        "os.common":"core/common"
        ,"key":"vendor/jwerty"
        ,"os.fs":"core/fs"
        ,"os.initrd":"core/initrd"
        ,"os.cmd":"core/cmd"
        ,"os.shell":'core/shell'
        ,"os.kernel":"core/kernel"
        ,"os.terminal":"core/terminal"
        ,"os.crypt":"lib/crypt"
        ,"os.socket":"core/socket"
  
    }

    //include NOT AMD specification js frame code
    ,shim:{
        "underscore":{
            "exports":"_"
        }
    }

});

var os={}; //only export var.
var extraAppList = ["bin/vi"];
var tty;

require(["os.kernel"],function(kernel){
    os = kernel;   //export global os api.

    termOpen();    // auto open display.
    os.boot();     // boot os kernel.

    require(extraAppList); /* loading extra bin util. */
});

function termOpen() {

    if (!tty) {
        console.log('create tty...')
        os.io = tty = new os.tty.Terminal(
            {
                id: 1,
                x:100,y:50, //location
                rows: 24, cols: 80,
                termDiv: 'termDiv',   //id of terminal div
                crsrBlinkMode: true, //cursor blink ?
                crsrBlockMode: false,//cursor type: block / underline.
                handler: keyHandler, // keyboard event callback.
                initHandler:function(){this.write('%+r  Boot System ...  %-r %n');},
                exitHandler: null,
                ctrlHandler: os.termCtrlHandler,
                closeOnESC: false,
                printTab: false
            }
        );
        if (tty) {
            console.log('open tty and login system...');
            tty.open();
            //os.login(); //         
        }
    }
    else if (tty.closed) {
        console.log('reopen tty...');
        tty.open();
    }
    else {
        console.log('close tty...');
        tty.close();
    }

    function keyHandler() {
        // called on <CR> or <ENTER> under line mode
        this.newLine();
        var cmd=this.lineBuffer;
        if (cmd!='') {
            this.write('ignore typed: '+cmd);
        }
        this.prompt();
    }

}
