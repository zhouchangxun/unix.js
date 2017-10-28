
define(["os.common", "os.fs"],function(os, fs){

//import method
var cmdList= os.cmdList
var VfsFile=  fs.File ;          
var VfsFileHandle=  fs.fileHandle;     
var vfsRoot=  fs.root ;          
var vfsDirList=  fs.ls ;            
var vfsUnlink=  fs.unlink;         
var vfsCreate=  fs.create;         
var vfsFileCopy=  fs.copy;           
var vfsOpen=  fs.open ;          
var vfsGetDir=  fs.getDir;         
var vfsGetFile=  fs.getFile;        
var vfsGetParent= fs.getParentDir; 
var vfsForceFile=  fs.vfsForceFile; 
var vfsGetPath =fs.vfsGetPath;
var vfsBasename = fs.vfsBasename;
var vfsGetSize = fs.vfsGetSize;
var vfsGetMdate = fs.vfsGetMdate;
var usrALIAS = os.usrALIAS;
var usrVAR = os.usrVAR;
var kernel = {};
var krnlFOut;
// module var
var cmdFileStack=new Array();
//

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

// cmd
 function krnlTestOpts(opt,optstr) {
    var legalopts={length:1};
    if (opt.length==0) return 0;
    for (var i=0; i<optstr.length; i++) legalopts[optstr.charAt(i)]=1;
    for (var oi in opt) {
        if (!legalopts[oi]) return -1;
    };
    return 1
}
function commandLs(env) {
	var dir=new Array();
	var a=1;
	var opt=kernel.krnlGetOpts(env.args,1);
	if (opt.length>0) a+=opt.length;
	if (kernel.krnlTestOpts(opt,'aCFilL')<0) {
		kernel.krnlFOut(env.stderr,'illegal option - use "./<filename>" for files of "-*".');
		return
	};
	var dname=(env.args[a])? vfsGetPath(env.args[a],env.cwd) : env.cwd;
	var dfile=vfsOpen(dname,4);
	if (dfile==0) {
		kernel.krnlFOut(env.stderr,dname+': no such file or directory.');
		return
	}
	else if (dfile<0) {
		kernel.krnlFOut(env.stderr,dname+': permission denied.');
		return
	}
	else if (dfile.kind!='d') {
		dfile=vfsGetParent(dname);
		dir=[vfsBasename(dname)];
		opt.a=1
	}
	else {
		dir=vfsDirList(dfile)
	};
	var l=0;
	var so='';
	for (var i=0; i<dir.length; i++) {
		var n=dir[i];
		if ((n.charAt(0)=='.') && (opt.a==null)) continue;
		var ff;
		if (n=='.') ff=dfile
		else if (n=='..') {
			ff=vfsGetParent(dname)
			if (ff<=0) continue
		}
		else ff=dfile.lines[n];
		if (opt.l) {
			if (ff.kind=='d') so+='d'
			else if (ff.kind=='l') so+='l'
			else so+='-';
			if (ff.mode) {
				var m=ff.mode;
				var ma=new Array();
				for (var mi=0; mi<4; mi++) {
					ma[mi]=m&7;
					m>>=3
				};
				for (var mi=2; mi>=0; mi--) {
					so+= (ma[mi]&4)? 'r':'-';
					so+= (ma[mi]&2)? 'w':'-';
					if (mi==0) {
						if (ma[3]&1) {
							so+= (ma[mi]&1)? 't':'T';
						}
						else {
							so+= (ma[mi]&1)? 'x':'-';
						}
					}
					else so+= (ma[mi]&1)? 'x':'-';
				}
			}
			else so+='---------';
			so+='  ';
			so+=(ff.icnt)? ff.icnt:'?';
			var fo=(ff.owner!=null)? kernel.data.krnlUIDs[ff.owner] : 'unknown';
			var fg=(ff.group!=null)? kernel.data.krnlGIDs[ff.group] : 'unknown';
			while (fo.length<8) fo+=' ';
			while (fg.length<8) fg+=' ';
			so+='  '+fo+'  '+fg+'  ';
			if (ff.kind=='d') so+='--------  '
			else if (ff.kind=='b') so+='bin/n.a.  '
			else so+=txtFillLeft(vfsGetSize(ff),8)+'  ';
			so+= vfsGetMdate(ff) +'  '+n;
			if (i<dir.length-1) so+='\n';
		}
		else {
			if (opt.F) {
				if (ff.kind=='d') n+='/'
				else if ((ff.kind=='b') || (ff.mode&0111)) n+='*'
				else if (ff.kind=='l') n+='@';
			};
			if (opt.i) n+='    '+ ff.inode;
			if ((opt.L) || (((env.stdout) || (opt.i)) && (!opt.C))) {
				so+=n;
				if (i<dir.length-1) so+='\n';
				continue
			};
			var s='';
			if (l>0) {
				s=' ';
				for (var k=(l+2)%12; k<12; k++) s+=' ';
			};
			l+=n.length+s.length;
			if (l>=tty.conf.cols) {
				so+='\n';
				l=n.length;
				s=''
			};
			so+=s+n
		}
	};
	kernel.krnlFOut(env.stdout,so)
}
function commandCat(env) {
	var fh=null;
	var a=1;
	var buf=new Array();
	if (env.stdin) {
		fh=env.stdin
	}
	else if (env.args[1]) {
		var f=vfsOpen(vfsGetPath(env.args[1],env.cwd),4);
		if (f<0) {
			kernel.krnlFOut(env.stderr,vfsGetPath(env.args[1],env.cwd)+': permission denied.');
			return
		}
		else if (typeof f=='object') fh=new VfsFileHandle(f);
		a++
	};
	while (fh) {
		var ldscrp=fh.readLine();
		while (ldscrp[0]>=0) {
			buf[buf.length]=ldscrp[1];
			ldscrp=fh.readLine();
		};
		fh=null;
		if (env.args[a]) {
			var f=vfsOpen(vfsGetPath(env.args[a],env.cwd),4);
			if (f<0) {
				kernel.krnlFOut(env.stderr,vfsGetPath(env.args[a],env.cwd)+': permission denied.');
				return
			}
			else if (typeof f=='object') fh=new VfsFileHandle(f);
			a++
		}
	};
	kernel.krnlFOut(env.stdout,buf)
}
function commandEcho(env) {
	var args=env.args;
	var s='';
	for (var i=1; i<args.length; i++) {
		s+=args[i];
		if (i+1!=args.length) s+=' ';
	};
	kernel.krnlFOut(env.stdout,s+'%n');
}
function commandWrite(env) {
	var args=env.args;
	var s='';
	for (var i=1; i<args.length; i++) {
		s+=args[i];
		if (i+1!=args.length) s+=' ';
	};
	kernel.krnlFOut(env.stdout,s+'%n',1);
}
function commandCal(env) {
	var args=env.args;
	var mLength=new Array(31,28,31,30,31,30,31,31,30,31,30,31);
	var mLabel=new Array('January','February','March','April','May','June','July','August','September','October','November','December');
	var now=new Date();
	var weeks=false;
	var m,y;
	var a=1;
	var opt=kernel.krnlGetOpts(args,1);
	if (krnlTestOpts(opt,'w')<0) {
		krnlFOut(env.stderr,'illegal option.');
		return
	};
	if (opt.w) weeks=true;
	a+=opt.length;
	if (args.length==a) {
		m=now.getMonth();
		y=now.getFullYear()
	}
	else if (args.length<a+3) {
		m=parseInt(args[a],10);
		a++;
		if ((isNaN(m)) || (m<1) || (m>12)) {
			krnlFOut(env.stderr,'usage: '+args[0]+' [-w] [<month_nr>] [<year>] - month_nr must be in 1..12');
			return
		};
		m--;
		if (args.length==a+1) {
			y=parseInt(args[a],10);
			if ((isNaN(y)) || (y<1900) || (y>9999)) {
				krnlFOut(env.stderr,'usage: '+args[0]+' [-w] [<month_nr>] [<year>] - year must be in 1900..9999');
				return
			}
		}
		else {
			y=now.getFullYear()
		}
	}
	else {
		krnlFOut(env.stderr,'usage: '+args[0]+' [-w] [<month_nr>] [<year>] - to many arguments');
		return
	};
	var isLeap=(((y%4==0) && (y%100>0)) || (y%400==0))? true: false;
	var wcnt=0;
	var wos=0;
	var d=new Date(y,m,1,0,0,0);
	var buf=txtCenter(mLabel[m]+' '+y,20)+'\n S  M Tu  W Th  F  S';
	if (weeks) {
		buf+='  week';
		var df=new Date(y,0,1,0,0,0);
		var yds=df.getDay();
		for (var mi=0; mi<m; mi++) yds+= ((mi==1) && (isLeap))? mLength[mi]+1 : mLength[mi];
		wos=yds%7;
		wcnt=Math.floor(yds/7)+1;
	};
	buf+='\n';
	var os=d.getDay();
	var l=mLength[m];
	if ((m==1) && (isLeap)) l++;
	for (var i=0; i<os; i++) buf+='   ';
	for (var i=1; i<=l; i++) {
		var s= (i<10)? ' ': '';
		s+=i;
		if ((i+os)%7==0) {
			buf+=s;
			if (weeks) {
				var ws=(wcnt<10)? ' '+wcnt:wcnt;
				buf+='   '+ws;
				wcnt++
			};
			buf+='\n';
		}
		else buf+=s+' ';
		if ((weeks) && (i==l) && ((i+os)%7>0)) {
			var ii=i+os;
			var ss='';
			while (ii%7>0) {
				ss+='   ';
				ii++
			};
			var ws=(wcnt<10)? ' '+wcnt:wcnt;
			buf+='  '+ss+ws;
		}
	};
	krnlFOut(env.stdout, buf+'\n');
}
function cmdRegistrate(path, cmdCallback){
	var cmdFile = vfsForceFile(path, 'b', ['#!/dev/js'], 0755, os.os_mdate);
	cmdFile.callback = cmdCallback;
}

function commandInit(_kernel) {
	kernel = _kernel;
	krnlFOut = kernel.krnlFOut;
	cmdRegistrate('/bin/ls', commandLs);
	cmdRegistrate('/bin/cat', commandCat);
	cmdRegistrate('/bin/echo', commandEcho);
	cmdRegistrate('/bin/write', commandWrite);
	cmdRegistrate('/bin/cal', commandCal);
}


	
console.log('loaded os_cmd.js ...');
	return {
		init: commandInit,
		cmdRegistrate: cmdRegistrate
	};
});
/// eof