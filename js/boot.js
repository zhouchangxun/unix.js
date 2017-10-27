/*
 init code
 */

require.config({
    //define all js file path base on this base path
    //actually this can setting same to data-main attribute in script tag
    //定义所有JS文件的基本路径,实际这可跟script标签的data-main有相同的根路径
    baseUrl:"./js/"

    //define each js frame path, not need to add .js suffix name
    //定义各个JS框架路径名,不用加后缀 .js
    ,paths:{
        //"jquery":["http://libs.baidu.com/jquery/2.0.3/jquery", "lib/jquery/jquery-1.9.1.min"] //把对应的 jquery 这里写对即可
        "os.common":"core/common"
        ,"os.fs":"core/fs"
        ,"os.initrd":"core/initrd"
        ,"os.cmd":"core/cmd"
        ,"os.shell":'core/shell'
        ,"os.kernel":"core/kernel"
        ,"os.terminal":"core/terminal"

        ,"underscore":"" //路径未提供，可网上搜索然后加上即可
    }

    //include NOT AMD specification js frame code
    //包含其它非AMD规范的JS框架
    ,shim:{
        "underscore":{
            "exports":"_"
        }
    }

});


require(["os.kernel", "os.terminal"],function(os, terminal){

    termOpen(terminal);
    os.boot();
});

var os={};
var tty;

function termOpen(terminal) {

    if (!tty) {
        console.log('create tty...')
        os.tty = tty = new terminal.Terminal(
            {
                id: 1,
                x:100,y:50, //location
                rows: 24, cols: 80,
                greeting: '%+r  Power up ...  %-r',
                termDiv: 'termDiv',   //id of terminal div
                crsrBlinkMode: true, //cursor blink ?
                crsrBlockMode: false,//cursor type: block / underline.
                handler: termHandler, // keyboard event callback.
                exitHandler: termExitHandler,

            }
        );
        if (tty) {
            tty.open();
            
        }
    }
    else if (tty.closed) {
        console.log('open tty...')
        tty.open();
        //krnlInit();
    }
    else {
        tty.close();
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
}
