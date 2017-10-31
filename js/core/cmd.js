
define(["os.common", "os.fs"],function(common, fs){

//import method
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
var vfsCheckInPath = fs.vfsCheckInPath;

var usrALIAS = common.usrALIAS;
var usrVAR = common.usrVAR;
var kernel = {};
var krnlFOut;

// module var

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
function commandPs(env) {
	var krnlPIDs = kernel.data.krnlPIDs;
	var buf=new Array();
	buf[buf.length]=' PID   COMMAND';
	buf[buf.length]='---------------';
	for (var i=0; i<krnlPIDs.length; i++) {
		if (krnlPIDs[i]) {
			s=' '+i;
			if (i<10) s+=' ';
			if (i<100) s+=' ';
			if (i<1000) s+=' ';
			s+='  '+krnlPIDs[i].id;
			buf[buf.length]=s
		}
	};
	krnlFOut(env.stdout, buf);
}
function commandJs(env) {
	var jsuix_hasExceptions=true;
	var a=1;
	var opt=kernel.krnlGetOpts(env.args, 1);
	if (kernel.krnlTestOpts(opt,'eltsf')<0) {
		krnlFOut(env.stderr,'illegal option.');
		return
	};
	a+=opt.length;
	var vn=env.args[a];
	var vstring=vn;
	var vobj=null;
	if ((opt.l) || (opt.t) || (opt.s)) {
		if ((vn!=null) && ((vn.indexOf('.')>=0) || (vn.indexOf('[')>=0))) {
			var va1=vn.split('.');
			var va=new Array();
			var vt=new Array();
			for (var i=0; i<va1.length; i++) {
				if (va1[i]=='') continue;
				if (va1[i].indexOf('[')>=0) {
					var va2=va1[i].split('[');
					for (var k=0; k<va2.length; k++) {
						if (va2[k]=='') continue;
						if ((va2[k].length) && (va2[k].charAt(va2[k].length-1)==']')) va2[k]=va2[k].substring(0,va2[k].length-1);
						va[va.length]=va2[k];
						vt[vt.length]=(k==0)?'.':'['
					}
				}
				else {
					va[va.length]=va1[i];
					vt[vt.length]='.';
				}
			};
			var vobj=self;
			var vi=0;
			var vstring='self';
			while ((vobj!=null) && (vi<va.length)) {
				vstring+=(vt[vi]=='[')? '['+va[vi]+']' : '.'+va[vi];
				vobj=vobj[va[vi++]]
			}
		}
		else vobj=self[vn]
	};
	var ok=false
	if (opt.t) {
		var s=(vobj)? typeof vobj : 'undefined';
		if ((vobj!=null) && (typeof vobj=='object') && (vobj.constructor)) {
			var sc=''+vobj.constructor;
			var ofs1=sc.indexOf(' ');
			var ofs2=sc.indexOf('(');
			if ((ofs1>0) && (ofs2>0)) s+=' '+sc.substring(ofs1+1,ofs2);
		};
		krnlFOut(env.stdout,vstring+': '+s);
		ok=true
	};
	if (opt.l) {
		if (vobj==null) krnlFOut(env.stdout,'undefined')
		else if (typeof vobj=='object') {
			var s='';
			if (vobj.length) {
				for (var i=0; i<vobj.length; i++) {
					if (vobj[i]!=null) {
						if (s!='') s+='\n';
						s+='['+i+']: '+ ((jsuix_hasExceptions)? eval('try{String(vobj[i])} catch(e){"#ERROR ON ACCESSING PROPERTY#"}') : vobj[i]);
					}
				}
			}
			else {
				for (var i in vobj) {
					if (s!='') s+='\n';
					s+= i+': '+ ((jsuix_hasExceptions)? eval('try{String(vobj[i])} catch(e){"#ERROR ON ACCESSING PROPERTY#"}') : vobj[i]);
				}
			};
			krnlFOut(env.stdout,s);
		}
		else krnlFOut(env.stdout,vobj);
		ok=true
	}
	else if (opt.s) {
		if (env.args.length>a+1) {
			var val=''
			for (var ari=a+1; ari<env.args.length; ari++) {
				if (env.args[ari]!='') val+=env.args[ari];
			};
			if (opt.n) {//Number
				eval(vstring+'='+val);
				krnlFOut(env.stderr,'js-var self.'+vstring+' set to "'+val+'" (plain value).')
			}
			else {//String
				for (var ofs=val.indexOf("'"); val>=0; ofs=val.indexOf("'",ofs+2)) val=val.substring(0,ofs)+"\\'"+val.substring(ofs+1);
				eval(vstring+'="'+val+'"');
				krnlFOut(env.stderr,'js-var self.'+vstring+' set to \''+val+'\' (string value).')
			}
		}
		else 
			ok=false;
	}
	else if (opt.e) {
		for (var ari=a+1; ari<env.args.length; ari++) {
			if (env.args[ari]!='') vn+=env.args[ari];
		};
		krnlFOut(env.stdout,'evaluating "'+vn+'" in js ...%n');
		var result;
		try{
			result=eval(vn);
			krnlFOut(env.stdout,"returned: "+result);
		}catch(e){
			krnlFOut(env.stdout,"error: "+e);
		}

		ok=true
	}
	else if (opt.f) {
		var fileName = vn;
		var f=vfsOpen(vfsGetPath(fileName,env.cwd),4);
		if (f<0) {
			krnlFOut(env.stderr,vfsGetPath(env.args[1],env.cwd)+': permission denied.');
			return -1;
		}
		var jsCode = f.lines.join(" ");
		
		var result;
		try{
			result=eval(jsCode);
			krnlFOut(env.stdout,"program exit with code: "+result);
		}catch(e){
			krnlFOut(env.stdout,"error: "+e);
		}

		ok=true
	};

	if (!ok) {
			krnlFOut(env.stdout,'usage: '+env.args[0]+' -e|l[t]|s|t <expression> or -f <filename>');
	}
};
function commandMkdir(env) {
	var dirs=new Array();
	if (env.stdin) {
		ldscrp=env.stdin.readLine();
		while (ldscrp[0]>=0) {
			dirs[dirs.length]=vfsGetPath(ldscrp[1],env.cwd);
			ldscrp=env.stdin.readLine();
		}
	};
	for (var a=1; a<env.args.length; a++) {
		dirs[dirs.length]=vfsGetPath(env.args[a],env.cwd);
	};
	for (var i=0; i<dirs.length; i++) {
		if (dirs[i]!='') {
			var d=vfsCreate(dirs[i],'d',0750);
			if (d==-3) {
				krnlFOut(env.stderr,dirs[i]+': file already exists.')
			}
			else if (d<0) {
				krnlFOut(env.stderr,dirs[i]+': permission denied.')
			}
		}
	}
}
function commandClear(env) {
	tty.cls();
}
function commandSplitScreen(env) {
	var args=env.args;
	var split=false;
	if (args.length==2) {
		if (args[1]=='on') {
			split=true;
		}
		else if (args[1]!='off') {
			krnlFOut(env.stderr,'usage: '+args[0]+' on|off  - illegal argument');
			return
		}
	}
	else {
		krnlFOut(env.stderr,'usage: '+args[0]+' on|off');
		return
	};
	tty.clear();
	if (split) {
		tty.type('split mode on',1); tty.newLine();
		tty.typeAt(tty.maxLines-2,0,'--------------------------------------------------------------------------------');
		tty.typeAt(tty.maxLines-1,0,'type "splitmode off" or "clear" to return to normal mode.');
		tty.maxLines-=2;//key point.
	}
	else  {
		tty.maxLines+=2;//key point.
		krnlFOut(env.stdout,'split mode off',1)
	}
}
function commandInfo(env) {
	tty.clear();
	krnlFOut(env.stdout,[
		'%+r About me %-r',
		'              * web design & development',
		'              * clientside & serverside programming',
		'              * C/C++, HTML, JavaScript, Java, Python',
		'              * cloud compute & virtualization%n',
		'              e-mail: changxunzhou@qq.com',		
		'              github: https://github.com/zhouchangxun/%n',
		//'Type "mail" for email, "web" for website, "help" for available commands.',
		],1);
}
function commandRmdir(env) {
	var dirs=new Array();
	var opt=krnlGetOpts(env.args,1);
	if (krnlTestOpts(opt,'i')<0) {
		krnlFOut(env.stderr,'illegal option.');
		return
	};
	var verbous=(opt.i)? false:true;
	if (env.stdin) {
		ldscrp=env.stdin.readLine();
		while (ldscrp[0]>=0) {
			dirs[dirs.length]=vfsGetPath(ldscrp[1],env.cwd);
			ldscrp=env.stdin.readLine();
		}
	};
	for (var a=1+opt.length; a<env.args.length; a++) {
		dirs[dirs.length]=vfsGetPath(env.args[a],env.cwd);
	};
	for (var i=0; i<dirs.length; i++) {
		if (dirs[i]!='') {
			var dn=dirs[i];
			var d=vfsOpen(dn);
			if (d<0) {
				if (verbous) krnlFOut(env.stderr,dn+': path permission denied.');
				continue
			}
			else if (d==0) {
				if (verbous) krnlFOut(env.stderr,dn+': directory not found.');
				continue
			}
			else if (d.kind!='d') {
				if (verbous) krnlFOut(env.stderr,dn+': is not a directory.');
				continue
			}
			else if (vfsGetSize(d)) {
				if (verbous) krnlFOut(env.stderr,dn+': directory not empty.');
				continue
			};
			if (vfsCheckInPath(env.cwd,d)) {
				if (verbous) krnlFOut(env.stderr,dn+'can\'t delete directory in current path.');
				continue
			};
			var st=vfsUnlink(dn);
			if (!st) {
				if (verbous) krnlFOut(env.stderr,dn+': permission denied.');
				continue
			}
		}
	}
}
function cmdRegistrate(path, cmdCallback){
	var cmdFile = vfsForceFile(path, 'b', ['#!/dev/js'], 0755, os.os_mdate);
	cmdFile.callback = cmdCallback;
}

function commandInit(_kernel) {
	kernel = _kernel;
	krnlFOut = kernel.krnlFOut;
	krnlTestOpts = kernel.krnlTestOpts;
	krnlGetOpts = kernel.krnlGetOpts;
	cmdRegistrate('/bin/ls', commandLs);
	cmdRegistrate('/bin/cat', commandCat);
	cmdRegistrate('/bin/echo', commandEcho);
	cmdRegistrate('/bin/write', commandWrite);
	cmdRegistrate('/bin/cal', commandCal);
	cmdRegistrate('/bin/ps', commandPs);
	cmdRegistrate('/bin/js', commandJs);
	cmdRegistrate('/bin/mkdir', commandMkdir);
	cmdRegistrate('/bin/clear', commandClear);
	cmdRegistrate('/bin/splitmode', commandSplitScreen);
	cmdRegistrate('/bin/info', commandInfo);
	cmdRegistrate('/bin/rmdir', commandRmdir);
}


	
console.log('loaded os_cmd.js ...');
	return {
		init: commandInit,
		cmdRegistrate: cmdRegistrate
	};
});
/// eof