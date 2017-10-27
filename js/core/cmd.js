
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
var usrALIAS = os.usrALIAS;
var usrVAR = os.usrVAR;
var kernel = {};
// module var
var cmdFileStack=new Array();
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
			var fo=(ff.owner!=null)? krnlUIDs[ff.owner] : 'unknown';
			var fg=(ff.group!=null)? krnlGIDs[ff.group] : 'unknown';
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
//cmdFileRegistrate('/bin/ls', 'b', commandLs, 644, new Date());
// function
function cmdFileRegistrate(path,kind,file,perm,date) {
	// registrate a file for boot time (owner=root, group=wheel)
	cmdFileStack[cmdFileStack.length]=[path,kind,file,perm,date]
}

function commandInit(_kernel) {
	kernel = _kernel;
	var cmdFiles= [
	'/sbin/clear', ['#!/dev/js/commandClear'],
	'/sbin/reset', ['#!/dev/js/commandReset'],
	'/sbin/reboot', ['#!/dev/js/commandReset'],
	'/sbin/halt', ['#!/dev/js/commandHalt'],
	'/sbin/fexport', ['#!/dev/js/commandHomeExport'],
	'/sbin/fimport', ['#!/dev/js/commandHomeImport'],
	'/sbin/js', ['#!/dev/js/commandJs'],
	'/bin/cd', ['#!/dev/js/commandCd','# piped to shell cd','# for current subprocess only'],
	'/bin/cal', ['#!/dev/js/commandCal'],
	'/bin/date', ['#!/dev/js/commandDate'],
	'/bin/features', ['#!/dev/js/commandFeatures'],
	'/bin/hello', ['#!/dev/js/commandHello'],
	'/bin/help', ['#!/dev/js/commandHelp'],
	'/bin/info', ['#!/dev/js/commandInfo'],
	'/bin/ls', ['#!/dev/js/commandLs'],
	'/bin/mail', ['#!/dev/js/commandMail'],
	'/bin/man', ['#!/dev/js/commandMan'],
	'/bin/browse', ['#!/dev/js/commandBrowse'],
	'/bin/ps', ['#!/dev/js/commandPs'],
	'/bin/web', ['#!/dev/js/commandBrowse'],
	'/bin/parse', ['#!/dev/js/commandParse'],
	'/bin/time', ['#!/dev/js/commandTime'],
	'/bin/wc', ['#!/dev/js/commandWc'],
	'/bin/cat', ['#!/dev/js/commandCat'],
	'/bin/echo', ['#!/dev/js/commandEcho'],
	'/bin/type', ['#!/dev/js/commandType'],
	'/bin/write', ['#!/dev/js/commandWrite'],
	'/bin/more', ['#!/dev/js/commandMore'],
	'/bin/pager', ['#!/dev/js/commandMore'],
	'/bin/pg', ['#!/dev/js/commandMore'],
	'/bin/splitmode', ['#!/dev/js/commandSplitScreen'],
	'/bin/stty', ['#!/dev/js/commandStty'],
	'/bin/sh', ['#!/dev/js/shellExec'],
	'/bin/cp', ['#!/dev/js/commandCp'],
	'/bin/mv', ['#!/dev/js/commandMv'],
	'/bin/mkdir', ['#!/dev/js/commandMkdir'],
	'/bin/rmdir', ['#!/dev/js/commandRmdir'],
	'/bin/rm', ['#!/dev/js/commandRm'],
	'/bin/su', ['#!/dev/js/commandSu'],
	'/bin/pr', ['#!/dev/js/commandPr'],
	'/bin/touch', ['#!/dev/js/commandTouch'],
	'/bin/chmod', ['#!/dev/js/commandChmod'],
	'/usr/bin/logname', ['#!/dev/js/commandLogname'],
	'/usr/bin/uname', ['#!/dev/js/commandUname'],
	'/usr/bin/vi', ['#!/dev/js/commandVi'],
	'/usr/bin/view', ['#!/dev/js/commandVi'],
	'/usr/bin/which', ['#!/dev/js/commandWhich'],
	'/usr/bin/apropos', ['#!/dev/js/commandApropos'],
	'/usr/bin/news', ['#!/dev/js/commandNews']
	];
	for (var i=0; i<cmdFiles.length; i+=2) {
		vfsForceFile(cmdFiles[i], 'b', cmdFiles[i+1], 0755, os.os_mdate);
	}
	for (var i=0; i<cmdFileStack.length; i++) {
		var f=cmdFileStack[i];
		vfsForceFile(f[0], f[1], f[2], f[3], f[4]);
	}
	cmdList['commandLs'] = commandLs;
}

function sysvarsInit() {
	// preset vars
	usrVAR['PATH']='/bin/ /sbin/ /usr/bin/ ~/';
	usrVAR['USER']='user';
	usrVAR['VERSION']=os.os_version;
	usrVAR['HOME']='/home';
	usrVAR['CWD']='~';
	usrVAR['HOST']=(self.location.hostname)? self.location.hostname : 'localhost';
	
	// aliased commands
	usrALIAS['about']= 'features',
	usrALIAS['quit']= usrALIAS['close']= 'exit';
	usrALIAS['split']= 'splitmode on';
	usrALIAS['unsplit']= 'splitmode off';
}
	
console.log('loaded os_cmd.js ...');
	return {
		sysvarsInit: sysvarsInit,
		commandInit: commandInit,
		cmdFileRegistrate: cmdFileRegistrate,
		cmdFileStack: cmdFileStack
	};
});
/// eof