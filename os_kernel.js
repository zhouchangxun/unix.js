
//global var
var conf_defaultmail='changxunzhou'+'@'+'qq.com';
var conf_defaulturl='https://github.com/zhouchangxun';
var os_version='unix.js 1.0.0';
var os_greeting=' '+os_version+' - The JavaScript virtual OS for the web.';

var manPages=new Array();
var usrPATH=new Array();
var usrALIAS=new Array();
var usrVAR=new Array();
var usrHIST=new Array();
var usrHistPtr=0;
var usrGroups=new Array();
var krnlPIDs=new Array();
var krnlCurPcs=null;
var krnlTtyBuffer='';
var krnlTtyChar=0;
var vfsRoot=null;
var krnlGuiCounter=0;
var krnlInodes=0;
var krnlDevNull=0;
var krnlUIDcnt=100;
var krnlUIDs=new Array();
var krnlGIDs=new Array();
var conf_rootpassskey='7B56B841C38BF38C';
var os_mdate=new Date(2016,11,11,12,0,0);

var jsuix_hasExceptions = false;
//util

// vfs file system
//file desc
function VfsFile(k, lines) {
    this.mdate=new Date();
    this.kind=k;
    this.lines=(lines)? lines:[];
    this.inode=krnlInodes++;
    this.owner=0;
    this.group=0;
    this.mode=0;
    this.icnt=0
}
function _vffTouch() {
    this.mdate=new Date();
}
VfsFile.prototype.touch=_vffTouch;
//file operation
function VfsFileHandle(fh) {
    var f=null;
    if ((fh) && (typeof fh == 'object')) f=fh;
    this.file=f;
    this.lp=0;
    this.cp=0;
}

function _vfhReadLine() {
    if ((this.lp<this.file.lines.length) && (this.cp>=this.file.lines[this.lp].length) && (this.file.lines[this.lp]!='')) {
        this.cp=0;
        this.lp++
    };
    if (this.lp<this.file.lines.length) {
        var l=this.file.lines[this.lp].length;
        if (this.cp>0) {
            var p=this.cp;
            this.cp=0;
            return [l-p,this.file.lines[this.lp++].substring(p)]
        }
        else {
            return [l,this.file.lines[this.lp++]]
        }
    }
    else {
        return [-1,'']
    }
}

function _vfhClose() {
    if ((this.file.kind=='d') || (this.file.kind=='l')) return;
    if ((this.file.lines.length>0) && (this.file.lines[this.file.lines.length-1]=='')) {
        this.file.lines.length--
    };
    this.rewind()
}

function _vfhPutLine(t) {
    if (this.file.inode==krnlDevNull) return;
    var cl=Math.max(this.file.lines.length-1,0);
    if (this.file.lines[cl]) {
        this.file.lines[cl]+=t
    }
    else {
        this.file.lines[cl]=t;
    };
    this.file.lines[++cl]='';
    this.lp=cl;
    this.cp=0;
    this.file.touch()
}

function _vfhPutNewLine(t) {
    if (this.file.inode==krnlDevNull) return;
    this.lp=this.file.lines.length;
    this.file.lines[this.lp]=t;
    this.cp=this.file.lines[this.lp].length;
    this.file.touch()
}

function _vfhPutChunk(ch) {
    if (this.file.inode==krnlDevNull) return;
    var cl=Math.max(this.file.lines.length-1,0);
    if (this.file.lines[cl]) {
        this.file.lines[cl]+=t
    }
    else {
        this.file.lines[cl]=t;
    };
    this.lp=cl;
    this.cp=this.file.lines[cl].length;
    this.file.touch()
}

function _vfhGetChar() {
    if ((this.lp<this.file.lines.length) && (this.cp>=this.file.lines[this.lp].length) ) {
        cp=0;
        lp++
    };
    if (this.lp<this.file.lines.length) {
        return this.file.lines[this.lp].charAt(this.cp++)
    }
    else {
        return ''
    }
}

function _vfhUngetChar() {
    if (this.lp>=this.file.lines.length) {
        this.lp=this.file.lines.length-1;
        this.cp=Math.max(0,this.file.lines[this.lp].length-1)
    }
    else if (this.cp>0) {
        this.cp--
    }
    else {
        if (this.lp>0) {
            this.lp--;
            this.cp=Math.max(0,this.file.lines[this.lp].length-1)
        }
        else {
            this.cp=0;
            this.lp=0
        }
    }
}

function _vfhRewind() {
    this.cp=0;
    this.lp=0;
}

VfsFileHandle.prototype.readLine=_vfhReadLine;
VfsFileHandle.prototype.close=_vfhClose;
VfsFileHandle.prototype.putLine=_vfhPutLine;
VfsFileHandle.prototype.putNewLine=_vfhPutNewLine;
VfsFileHandle.prototype.putChunk=_vfhPutChunk;
VfsFileHandle.prototype.getChar=_vfhGetChar;
VfsFileHandle.prototype.ungetChar=_vfhUngetChar;
VfsFileHandle.prototype.rewind=_vfhRewind;
//
function vfsGetPath(path,cwd) {
    while ((cwd) && (cwd.charAt(cwd.length-1)=='/')) cwd=cwd.substring(0,cwd.length-1);
    if (path) {
        if (path.charAt(0)!='/') path=cwd+'/'+path;
    }
    else path=cwd;
    var pa=path.split('/');
    var cwa=new Array();
    for (var i=0; i<pa.length; i++) {
        var f=pa[i];
        if (f=='') continue;
        if (f=='..') {
            if (cwa.length>0) cwa.length--;
        }
        else if (f=='~') { cwa.length=0; cwa[0]=usrVAR.HOME.substring(1) }
        else if (f!='.') cwa[cwa.length]=f;
    };
    return fp='/'+cwa.join('/')
}

function vfsGetDir(absPath) {
    var pa=absPath.split('/');
    var d=new Array();
    d[0]=vfsRoot;
    di=0;
    for (var i=1; i<pa.length; i++) {
        cd=d[di];
        var pd=pa[i];
        if ((!cd) || (cd.kind!='d')) {
            return 0;
        }
        else if (!vfsPermission(cd,1)) return -1
        else if ((pd=='.')  || (pd=='')) continue
        else if (pd=='..') {
            if (di>0) {
                di--;
                d.length--
            }
        }
        else if ((cd.lines[pd]) && (cd.lines[pd].kind=='d')) {
            di++;
            d[di]=cd.lines[pd]
        }
        else {
            return 0
        }
    };
    return d[di]
}

function vfsGetFile(absPath) {
    while (absPath.charAt(absPath.length-1)=='/') absPath=absPath.substring(0,absPath.length-1);
    var pa=absPath.split('/');
    var f=vfsRoot;
    for (var i=0; i<pa.length; i++) {
        if (pa[i]=='') continue
        else if (f.lines[pa[i]]) {
            if (vfsPermission(f,1)) f=f.lines[pa[i]]
            else return -1;
        }
        else return 0
    };
    return f
}

function vfsGetParent(absPath) {
    while (absPath.charAt(absPath.length-1)=='/') absPath=absPath.substring(0,absPath.length-1);
    if (absPath=='') return null;
    var pn=vfsDirname(absPath);
    return vfsGetDir(pn)
}

function vfsBasename(path) {
    if (path=='') return '';
    var fos=path.lastIndexOf('/');
    return (fos==path.length-1)? '': (fos>=0)? path.substring(fos+1): path;
}

function vfsDirname(path) {
    if (path=='') return '';
    var fos=path.lastIndexOf('/');
    return (fos==0)? '/' : (fos>0)? path.substring(0,fos): '';
}

function vfsOpen(absPath,m) {
    var f=vfsGetFile(absPath);
    if (f<=0) return f;
    if ((m) && (!vfsPermission(f,m))) return -2
    else if (f) return f
    else return 0;
}

function vfsFileCopy(sf,tf,append) {
    if (!append) tf.lines=[];
    for (var i=0; i<sf.lines.length; i++) tf.lines[tf.lines.length]=sf.lines[i];
}

function vfsCreate(absPath,kind,fmode,cdate) {
    var fn=vfsBasename(absPath);
    var pn=vfsDirname(absPath);
    if ((fn=='') || (fn=='.') || (fn=='..') || (fn=='~')) return 0;
    if ((fn) && (pn)) {
        var pd=vfsGetDir(pn);
        if (pd<=0) return pd
        else if (pd) {
            if ((pd.mode) && (!vfsPermission(pd,2))) return -1;
            //if (pd.lines[fn]) return -3;
            var f=(kind=='d')? new VfsFile('d',{}) :  new VfsFile(kind,[]);
            f.icnt=(kind=='d')? 2:1;
            if (cdate) f.mdate=cdate;
            if (fmode) f.mode=fmode;
            if (usrVAR.UID!=null) f.owner=usrVAR.UID;
            if (usrVAR.GID!=null) f.group=usrVAR.GID;
            pd.lines[fn]=f;
            pd.mdate=f.mdate;
            return f
        }
    };
    return 0
}

function vfsForceFile(absPath,kind,flines,fmode,cdate) {
    var f=vfsCreate(absPath,kind,fmode,cdate);
    if (typeof f=='object') f.lines=flines;
    return f
}

function vfsUnlink(absPath) {
    var fn=vfsBasename(absPath);
    var pn=vfsDirname(absPath);
    if ((fn=='') || (fn=='.') || (fn=='~') || (fn=='..')) return 0;
    if ((fn) && (pn)) {
        var pd=vfsGetDir(pn);
        if (pd<=0) return pd
        else if (pd) {
            if ((pd.mode) && (!vfsPermission(pd,2))) return -1;
            if (pd.lines[fn]) {
                if ((pd.mode&01000) && ((pd.owner!=usrVAR.UID) && (pd.lines[fn].owner!=usrVAR.UID))) return -1;
                delete(pd.lines[fn])
                pd.touch();
                return 1
            }
        }
    };
    return 0
}

function vfsMove(fn1,fn2) {
    var f1=vfsOpen(fn1,4);
    if (typeof f1=='object') {
        var d=vfsGetParent(fn2);
        if (typeof d=='object') {
            if ((vfsPermission(d,2)) && (vfsUnlink(fn1)>0)) {
                d.lines[vfsBasename(fn2)]=f1;
                d.touch();
                return 1
            }
            else return -1
        }
        else return d
    }
    else return f1
}

function vfsGetSize(f) {
    var n=0;
    if ((f) && (f.kind=='d')) {
        for (var i in f.lines) n++;
    }
    else if (f) {
        for (var i=0; i<f.lines.length; i++) n+=f.lines[i].length;
    };
    return n
}

function vfsGetMdate(f) {
    var fd=f.mdate;
    return (fd)? fd.getFullYear()+'/'+txtNormalize(fd.getMonth()+1,2)+'/'+txtNormalize(fd.getDate(),2)+' '+txtNormalize(fd.getHours(),2)+':'+txtNormalize(fd.getMinutes(),2)+':'+txtNormalize(fd.getSeconds(),2) : '???';
}

function vfsDirList(d) {
    var list=new Array();
    if ((d) && (d.lines)) {
        list[0]='.';
        list[1]='..';
        for (var i in d.lines) list[list.length]=i;
    };
    list.sort();
    return list
}

function vfsPermission(f,mode) {
    if (f) {
        if (usrVAR.UID==0) return ((mode) && (mode&1) && (f.kind!='d'))? f.mode&0100:1;
        var m=0;
        if (usrVAR.UID==f.owner) m= (f.mode>>6)&7
        else if (usrGroups[f.group]) m= (f.mode>>3)&7
        else m= f.mode&7;
        return m&mode
    }
    else return 0
}

function vfsCheckInPath(fn,fobj) {
    if ((typeof fobj=='object') && (fobj.kind=='d')) {
        while (fn) {
            while (fn.charAt(fn.length-1)=='/') fn=fn.substring(0,fn.length-1);
            var fp=vfsGetFile(fn);
            if ((fp.inode==fobj.inode) && (fobj.inode!=vfsRoot.inode)) return true;
            fn=vfsDirname(fn)
        }
    };
    return false
}
//
function vfsTreeSetup() {
    var sysDirs=new Array('/sbin', '/dev');
    var wheelDirs=new Array('/bin', '/home', '/usr', '/var', '/usr/bin');
    usrVAR.UID=0;
    usrVAR.GID=0;
    for (var i=0; i<sysDirs.length; i++) {
        var d=vfsCreate(sysDirs[i],'d',0775,os_mdate);
    };
    vfsCreate('/etc','d',01777,os_mdate);
    vfsCreate('/tmp','d',01777,os_mdate);
    vfsCreate('/root','d',0700,os_mdate);
    var f;
    f=vfsCreate('/dev/null','b',0666,os_mdate);
    f=vfsCreate('/dev/js','b',0755,os_mdate);
    f.lines=['JavaScript native code'];
    f=vfsCreate('/dev/console','b',0644,os_mdate);
    f.lines=['1'];
    usrVAR.GID=1;
    for (var i=0; i<wheelDirs.length; i++) {
        var d=vfsCreate(wheelDirs[i],'d',0777,os_mdate);
    }
}
//add user
function krnlAddUser(user) {
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
}
//
function vfsInit() {
    krnlInodes=100;
    vfsRoot=new VfsFile('d',{});
    vfsRoot.mdate=os_mdate;
    vfsRoot.mode=01777;
    vfsRoot.owner=0;
    vfsRoot.group=0;
    vfsRoot.icnt=2
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
}
// os boot
function typeResult(ret){
    tty.cursorSet(tty.r,tty.conf.cols-16)
    tty.write('... '+ret+'%n')
}
        
//create init process.
function fork_init(){
  	krnlPIDs = [];
    krnlCurPcs = new KrnlProcess(['init']);
    krnlCurPcs.id = 'init';
    krnlUIDs[0] = 'root';
    krnlGIDs[0] = 'system';
    krnlGIDs[1] = 'wheel';
    krnlGIDs[2] = 'users';
    typeResult('ok')
}

function setup_rc_file(){
  if (self.jsuixRC) {
    typeResult('found');
    if (self.jsuixRX)  {
        tty.type('  rc-profile looks good.');
        tty.newLine();
    }
    else {
        tty.type('# rc-profile seems to have syntactical problems,');
        tty.newLine();
        tty.type('# system may hang, trying further ...');
        tty.newLine()
    }
    
    tty.type('  initializing rc-profile ... ');
    jsuixRC();
    typeResult('ok')
  }
  else {
      typeResult('not found');
  }
}
      	
function krnlInit() {
    // wait for gui
    console.log(tty)
    
    var i=0;
    function next(){
    	return (i+=369);
    }
    if (!tty.closed) {
        
        tty.cursorSet(1,2)
        tty.write('version: '+os_version+'%n%n');     
        tty.write('  starting up [init] ...');

        setTimeout("fork_init(); tty.type('  bringing up the file-system ... ');", next());
        //init file system.       
        setTimeout("vfsInit();typeResult('ok');tty.type('  building vfs tree ... ');", next());
        //build vfs tree.
        setTimeout("vfsTreeSetup();typeResult('ok');tty.type('  trying for RC-file ... ');", next());
        //RC file
        setTimeout("setup_rc_file(); tty.type('  command-system init... ');", next())
				//command init
        setTimeout("commandInit(); typeResult('ok'); tty.type('  setting up system variables ... ');",next());
        //env var init.
        setTimeout("sysvarsInit();typeResult('ok'); tty.write('  system up and stable.  :)');tty.write('%n%n  starting login-demon...%n%n');", next());
				//fork logi	n process.
        setTimeout(" krnlLogin()", next());      
        
    }else{
        console.log('please open tty before.')
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
    krnlCurPcs=new KrnlProcess(['login']);
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
function krnlTTY(env,bincmd) {
    tty.charMode = false;
    if ((env) && (env.args[0] == 'TTY')) {
    	  // init && start a login shell
        var shenv;
        var pfg = vfsGetFile('/etc/profile');
        shenv = krnlGetEnv(['shell'], pfg, null);
        shenv.cwd = usrVAR.HOME;
        shenv.loginShell = true;
        tty.cls();
        //console.log('shell process:',shenv)
        shellExec(shenv, 'shellExec');
        tty.handler = krnlTTY;
    }
		else if (env) {
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
					tty.ps = shellParseLine(shellParseLine('$PS')[0])[0]
					tty.prompt();
				};
				tty.lock=false
		}
		else if (this.env) {
				tty.lock=true;
				tty.cursorOff()
				tty.newLine();
				self[this.bincmd](this.env)
		}
		else {
			//to here when cmd 'exit' executed.
				krnlPIDs.length=1;
				krnlLogin(1)
		}
}
//krnl
/*
param  fhin: input file hander obj
return  env:shell env process
return type: KrnlProcess obj
*/
function krnlGetEnv(args,fhin,fhout) {
    var env=new KrnlProcess([args]);
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

function krnlFOut(fh,t,useMore) {
	//to array type
	
	if(fh==null){
		tty.write(t);
	}else {
		for (var i=0; i<t.length; i++) fh.putLine(t[i]);
	}
}
//util txt
// text related

function txtStripStyles(text) {
    // strip markup from text
    var chunks=text.split('%');
    var esc=(text.charAt(0)!='%');
    var rs='';
    for (var i=0; i<chunks.length; i++) {
        if (esc) {
            if (chunks[i].length>0) rs+=chunks[i];
            else if (i>0) rs+='%';
            esc=false
        }
        else {
            var func=chunks[i].charAt(0);
            if ((chunks[i].length==0) && (i>0)) {
                rs+='%';
                esc=true
            }
            else if (func=='n') {
                rs+='\n';
                if (chunks[i].length>1) rs+=chunks[i].substring(1);
            }
            else if ((func=='+') || (func=='-')) {
                if (chunks[i].length>2) rs+=chunks[i].substring(2);
            }
            else {
                if (chunks[i].length>0) rs+=chunks[i];
            }
        }
    };
    return rs
}

function txtNormalize(n,m) {
    var s=''+n;
    while (s.length<m) s='0'+s;
    return s
}

function txtFillLeft(t,n) {
    if (typeof t != 'string') t=''+t;
    while (t.length<n) t=' '+t;
    return t
}

function txtCenter(t,l) {
    var s='';
    for (var i=t.length; i<l; i+=2) s+=' ';
    return s+t
}

function txtStringReplace(s1,s2,t) {
    var l1=s1.length;
    var l2=s2.length;
    var ofs=t.indexOf(s1);
    while (ofs>=0) {
        t=t.substring(0,ofs)+s2+t.substring(ofs+l1);
        ofs=t.indexOf(s1,ofs+l2)
    };
    return t
}

console.log('loaded kernel.js ...')
//eof