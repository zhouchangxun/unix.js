define(["os.common","os.fs", "os.terminal", "os.cmd", "os.shell", "os.initrd",],function(os, fs, terminal, cmd, shell){

//import var
var vfsGetFile = fs.getFile ;
var vfsCreate = fs.create;
var vfsForceFile = fs.vfsForceFile;
var VfsFileHandle = fs.fileHandle;

var shellExec = shell.shellExec;
var shellParseLine = shell.shellParseLine;
//global var
var conf_defaultmail='changxunzhou'+'@'+'qq.com';
var conf_defaulturl='https://github.com/zhouchangxun';
var conf_rootpassskey='8069D76C';

var os_version='unix.js 1.0.0';
var os_greeting=' '+os_version+' - The JavaScript virtual OS for the web.';
var os_mdate=new Date(2016,11,11,12,0,0);

var manPages=new Array();

//user
var usrPATH=new Array();
var usrALIAS= os.usrALIAS;
var usrVAR=  os.usrVAR;
var usrHIST=new Array();
var usrHistPtr=0;

var usrGroups=new Array();

//fs
var vfsRoot=fs.root;
var krnlInodes=0;
//tty
var krnlTtyBuffer='';
var krnlTtyChar=0;
var krnlGuiCounter=0;
//kernel
var krnlPIDs=new Array(); //process list
var krnlUIDs=new Array();
var krnlGIDs=new Array();
var krnlCurPcs=null;
var krnlDevNull=0;
var krnlUIDcnt=100;


var jsuix_hasExceptions = false;


//add user
function krnlAddUser(user) {
    console.log('add user:', user);
    var lsh='/bin/sh';
    usrVAR.UID=0; usrVAR.GID=0;
    usrVAR.CWD='~';
    var etc=vfsGetFile('/etc');
    if ((typeof etc=='object') && (etc.kind!='d')) {
        vfsUnlink('/etc');
        etc=0
    };
    if (etc<=0) etc=vfsCreate('/etc','d',01777);
    usrVAR.GID=1;
    var hdr=vfsGetFile('/home'); /*home dir base. */
    if ((typeof hdr=='object') && (hdr.kind!='d')) {
        vfsUnlink('/home');
        hdr=0
    };
    if (hdr<=0) hdr=vfsCreate('/home','d',0777);
    var hdir='/home/'+user; /* home dir */
    var passwd=vfsGetFile('/etc/passwd');
    if (passwd<=0) {
        passwd=vfsCreate('/etc/passwd','f',0644);
        passwd.lines[0]='root:*:0:1:root:/root:'+lsh
    };
    var group=vfsGetFile('/etc/group');
    if (group<=0) {
        group=vfsCreate('/etc/group','f',0644);
        group.lines[0]='system:0:root';
        group.lines[1]='wheel:1:root';
        group.lines[2]='users:2:';
    };

    if (user=='root') {
        usrVAR.UID='0';
        usrVAR.GID='1';
        usrGroups[0]=1;
        usrGroups[1]=1;
        usrGroups[2]=1;
        usrVAR.USER=user;
        hdir=usrVAR.HOME='/root';
        var uhd=vfsGetFile(hdir);
        if ((typeof uhd=='object') && (uhd.kind!='d')) {
            vfsUnlink(hdir);
            uhd=0
        };
        if (uhd<=0) uhd=vfsCreate(hdir,'d',0700);
        var hstf=vfsGetFile(hdir+'/.history');
        if (hstf<=0) hstf=vfsCreate(hdir+'/.history','f',0600);
        usrHIST=hstf.lines; /* get reference */
        usrHistPtr=hstf.lines.length;
        return
    };

    var exists=false;
    for (var i=1; i<passwd.lines.length; i++) {
        if (passwd.lines[i].indexOf(user+':')==0) {
            exists=true;
            var up=passwd.lines[i].split(':');
            usrVAR.UID=up[2];
            break
        }
    };
    if (!exists) {
        krnlUIDcnt++;
        /* (passwd file format): "username : passwd : uid : gid : fullname : home-dir : shell-path" */
        passwd.lines[passwd.lines.length]=user+':*:'+krnlUIDcnt+':2:'+user+':'+hdir+':'+lsh;
        passwd.touch()
    };
    usrGroups.length=0;
    var groups=new Array('wheel','users');
    var groupids=new Array(1,2);
    for (var i=0; i<groups.length; i++) {
        var gn=groups[i];
        exists=false;
        var gl=-1;
        for (var k=0; k<group.lines.length; k++) {
            if (group.lines[k].indexOf(gn+':')==0) {
                exists=true;
                gl=k;
                break;
            }
        };
        if (exists) {
            var ll=group.lines[gl].substring(gn.length+3);
            var gs=ll.split(',');
            var uexists=false;
            for (var j=0; j<gs.length; j++) {
                if (gs[j]==user) uexists=true;
            };
            if (!uexists) {
                if (ll) {
                    gs[gs.length]=user;
                    group.lines[gl]=gn+':'+groupids[i]+':'+gs.join();
                }
                else {
                    group.lines[gl]=gn+':'+groupids[i]+':'+user
                };
                group.touch()
            }
        }
        else {
            group.lines[group.lines.length]=gn+':'+groupids[i]+':'+user;
            group.touch()
        }
    };

    usrVAR.HOME=hdir;

    var uhd=vfsGetFile(hdir); /* file obj of user home dir . */
    if ((typeof uhd=='object') && (uhd.kind!='d')) {
        vfsUnlink(hdir);
        uhd=0
    };
    if (uhd<=0) uhd=vfsCreate(hdir,'d',0750);
    uhd.owner=krnlUIDcnt;
    usrVAR.UID=''+krnlUIDcnt;
    krnlUIDs[krnlUIDcnt]=usrVAR.USER=user;
    usrVAR.GID='2';
    usrGroups[1]=1;
    usrGroups[2]=1;
    var hstf=vfsGetFile(hdir+'/.history');
    if (hstf<=0) hstf=vfsCreate(hdir+'/.history','f',0600);
    usrHIST=hstf.lines;
    usrHistPtr=hstf.lines.length;
    vfsForceFile(hdir+'/test.txt', 'f', [
			"01    if this file can be opened,",
			"02  it mean this OS's file system has worked!",
			"03  enjoy !"
			], 0666);
    vfsForceFile(hdir+'/test.sh', 'f', [
        '# start this file with "test.sh" or "sh test.sh"',
        'write "%+istarting test with PID=$PID%-i"',
        'write \'%+i> "date":%-i\'; date',
        'write \'%+i> "cal -w":%-i\'; cal -w',
        'write \'%+i> "cal -w | wc":%-i\'; cal -w | wc',
        'write \'%+i> "ls -l /var":%-i\'; ls -l /var',
        'write "%+idone.%-i"'
    ], 0777);

}

//process obj
function KrnlProcess(args) {
    this.pid=krnlPIDs.length;
    this.id='';
    this.stdin=null;
    this.stdout=null;
    this.stderr=null;
    this.er=null;
    this.cwd=null;
    this.args=args;
    this.status='';
    this.child=null;
    krnlPIDs[krnlPIDs.length]=this;
    console.log('new process:', args);
}
// os boot
function typeResult(ret){
    tty.cursorSet(tty.r,tty.conf.cols-16)
    if(ret != 'ok' )
        tty.write('... %c(red)'+ret+'%n')
    else
        tty.write('... %c(green)'+ret+'%n')
}
        
//create init process.
function fork_init(){
    tty.write('  starting up [init] ...');
  	krnlPIDs = [];
    krnlCurPcs = new KrnlProcess(['init']);
    krnlCurPcs.id = 'init';
    krnlUIDs[0] = 'root';
    krnlGIDs[0] = 'system';
    krnlGIDs[1] = 'wheel';
    krnlGIDs[2] = 'users';
    typeResult('ok');
}

      	
function krnlInit() {
    // wait for gui
    console.log('boot kernel ...');  

    if (!tty.closed) {
        
        tty.cursorSet(1,2)
        tty.write('version: '+os_version+'%n%n');     
        fs.init(this);
        cmd.init(this);
        shell.init(this);
        fork_init();
    	tty.write('  %c(yellow)system up and stable.  :)');
    	tty.write('%n%n  starting login-demon...%n%n');

		//fork login process.
        krnlLogin() ;   
        
    }else{
        alert('please open tty before.')
    }

}

function krnlLogin(reenter) {
    //init
    usrUID=usrGID=0;
    if (reenter) {
        tty.clear();
        tty.write(tty.globals.center('version: '+os_version, tty.maxCols)+'%n%n%n');
        tty.write('  re-login to system.%n');
    };
    krnlCurPcs = new KrnlProcess(['login']);
    krnlCurPcs.id='logind';
    krnlLoginDmn(first=true);
}
function krnlLoginDmn(first) {
	var help='  type user-name (e.g. "guest") and hit <return>.%n%n';
    var user_prompt = '  UserName:';
    if(first) {
        //begin login(redirect 'stdin' to logind process)
        tty.handler = krnlLoginDmn;
        tty.write(help+user_prompt)
				tty._charOut(1);/*do this so that cursor can't backspace */ 
				tty.lock=false;
				tty.cursorOn();
        return
    }
    var cmd=this.lineBuffer;
    var user = cmd.split(' ')[0] || "guest"
    if (user.length>8) user=user.substring(0,8);
    //console.info(' entering system with user:  '+user);
    if (usrVAR.USER!=user) {
        usrHIST.length=0;
        usrHistPtr=0
    };
    //add new user
    krnlAddUser(user);
    
    krnlCurPcs.id='ttyd'
    krnlCurPcs.args=['TTY'];
    krnlTTY(krnlCurPcs);
    return

}

/* param env: KrnlProcess obj
   param bindcmd: */
function krnlTTY(env, bincmd) {
    console.log('enter krnlTTY handle...')
    //tty.charMode = false;
    if ((env) && (env.args[0] == 'TTY')) {
    	console.log('init && start a login shell...');
        var shenv;
        var pfg = vfsGetFile('/etc/profile');
        shenv = krnlGetEnv(['shell'], pfg, null);
        shenv.cwd = usrVAR.HOME;
        shenv.loginShell = true;
        tty.cls();
        console.log('shell process:', shenv)
        shellExec(shenv, 'shellExec');
        tty.handler = krnlTTY;
        //tty.charMode = true;
        return;
    }

    if(tty.inputChar == tty.globals.termKey.TAB){
        searchCmdList('')
    }

	if (env) {
		tty.env=env;
		tty.bincmd=bincmd;
		if (env.wantChar){ 
			tty.charMode=true
			tty.lock=false;
		}
		else if (env.wantMore) {
			tty.type(3);
			tty.type(2);
			//tty.cursorOn()
		}
		else {
            var format_string = shellParseLine('$PS')[0]; //calculate value of $PS.(result like this: "[${USER}@${HOST}:${CWD}]")
			tty.ps = shellParseLine(format_string)[0]; //calculate value of format_string.(result like this: "[mike@localhost:/home/]")
			tty.prompt();
		};
		tty.lock=false
	}
	else if (this.env) {
		tty.lock=true;
		tty.cursorOff()
		tty.newLine();
		shell.shellCMD[this.bincmd](this.env)
	}
	else {
		//to here when cmd 'exit' executed.
		krnlPIDs.length=1;
		krnlLogin(1)
	}
}

function termCtrlHandler() {
    console.log('termCtrlHandler');
    var ch = this.inputChar;
    if (ch == tty.globals.termKey.TAB || ch == tty.globals.termKey.ESC) {
        this.lock=true;
        // get the command line input and extract the last word
        var line = this._getLine();
        var words = line.split(/\s+/);
        if (words.length) {
            var word=words[words.length-1];
            var cmdList = searchCmdList(word);
            if(cmdList.length > 0){
                if(cmdList.length==1){
                    tty.type(cmdList[0].substring(word.length)+' ');
                }else{
                    tty.cursorOff();
                    tty.newLine();
                    tty.write(cmdList.join('  '));
                    tty.newLine();
                    tty.prompt();
                    tty.write(line);
                    tty.cursorOn();

                }
            }
        }

    }

    this.lock=false;
}

function searchCmdList(cmdName){
    console.log('find cmd list with prefix('+cmdName+')');
    var cmdList = [];
    var path = shellParseLine('$PATH')[0].split(' ');
    for(var i in path){
        var ret=vfsGetFile(path[i]);
        if(typeof ret != 'object') continue;
        for( var name in ret.lines){
            if(name.startsWith( cmdName))
                cmdList.push(name);
        }
    }   
    return cmdList;
}
//krnl
/*
param  fhin: input file hander obj
return  env:shell env process
return type: KrnlProcess obj
*/
function krnlGetEnv(args,fhin,fhout) {
    var env=new KrnlProcess(args);
    var fi=null;
    var fo=null;
    if ((fhin) && (typeof fhin == 'object')) fi=fhin;
    if ((fhout) && (typeof fhout == 'object')) fo=fhout;
    if (fi) env.stdin=new VfsFileHandle(fi);
    if (fo) env.stdout=new VfsFileHandle(fo);
    return env
}
function krnlFork(env) {
    var child=new KrnlProcess([]);
    env.child=child;
    child.id=env.id;
    child.stdin=env.stdin;
    child.stdout=env.stdout;
    child.stderr=env.stderr;
    child.cwd=env.cwd;
    return child
}

function krnlWordChar(ch) {
    return (((ch>='a') && (ch<='z')) || ((ch>='A') && (ch<='Z')) || ((ch>='0') && (ch<='9')) || (ch=='_'));
}

function krnlGetOpt(s) {
    var opts=new Object();
    opts.length=0;
    if ((s) && (s.charAt(0)=='-')) {
        for (var i=1; i<s.length; i++) {
            opts[s.charAt(i)]=1;
            opts.length++
        }
    };
    return opts
}

function krnlGetOpts(args,ofs) {
    var opts=new Object();
    var pos=1;
    opts.length=0;
    if (ofs==null) ofs=1;
    while ((args.length>ofs) && (args[ofs]!=null)) {
        var s=args[ofs];
        if ((s) && (s.charAt(0)=='-')) {
            opts.length++;
            ofs++;
            for (var i=1; i<s.length; i++) opts[s.charAt(i)]=pos++;
        }
        else break
    };
    return opts
}

function krnlTestOpts(opt,optstr) {
    var legalopts={length:1};
    if (opt.length==0) return 0;
    for (var i=0; i<optstr.length; i++) legalopts[optstr.charAt(i)]=1;
    for (var oi in opt) {
        if (!legalopts[oi]) return -1;
    };
    return 1
}

function krnlCsl2stdin() {
    var cmd=tty.lineBuffer;
    return [0,cmd]
}
function krnlKill(pid) {
    var child=krnlPIDs[pid].child;
    if (child!=null) {
        if (child.pid==pid) {
            //alert('PID recursion: '+pid+' ('+krnlPIDs[pid].args[0]+')');
        }
        else  {
            krnlKill(child.pid);
            krnlPIDs[pid].child=null
        }
    };
    krnlPIDs[pid]=null;
    krnlPIDs.length--
}

function krnlFOut(fh,text,useMore) {
	//to array type
	
	if(fh==null){
		tty.write(text);
	}else {
		// new line = '%n' prepare any strings or arrys first
		var ta=[];
		if (typeof text != 'object') {
			if (typeof text!='string') text=''+text;
			ta=text.split('%n');
		}
		for (var i=0; i<ta.length; i++) fh.putLine(ta[i]);
	}
}


// crypt
var crptSalt= '0e7aff21';
var crptHexCode = new Array('0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F');
var crptKeyquence= new Array();

for (var i = 0; i<crptSalt.length; i+=2) {
	crptKeyquence[crptKeyquence.length]=parseInt(crptSalt.substring(i, i+2),16);
}

function krnlCrypt(x) {
	var enc='';
	var k=0;
	var last=0;
	for (var i=0; i<x.length; i++) {
		var s= (x.charCodeAt(i)+crptKeyquence[k++]+last) % 256;
		last=s;
		var h= Math.floor(s/16);
		var l= s-(h*16);
		enc+= crptHexCode[h]+crptHexCode[l];
		if (k==crptKeyquence.length) k=0;
	};
	//console.info('passwd encrypted:',enc);
	return enc
}

console.log('loaded kernel.js ...')
    return {
        boot: krnlInit,
        krnlTTY: krnlTTY,
        krnlGetEnv: krnlGetEnv,
        krnlGetOpt:krnlGetOpt,
        krnlGetOpts:krnlGetOpts,
        krnlTestOpts:krnlTestOpts,
        krnlKill: krnlKill,
        krnlFOut: krnlFOut,
        krnlFork: krnlFork,
        searchCmdList:searchCmdList,
        termCtrlHandler:termCtrlHandler,
        data:{
            krnlUIDs:krnlUIDs,
            krnlGIDs:krnlGIDs,
            usrGroups:usrGroups,
            krnlPIDs:krnlPIDs,
            krnlCurPcs:krnlCurPcs,
            krnlDevNull:krnlDevNull
        },
        modules:{
            fs: fs,
            shell:shell
        }
    };
});
//eof