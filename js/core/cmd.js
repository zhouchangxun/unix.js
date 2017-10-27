
define(["os.common", "os.fs"],function(os, fs){

//import method
var vfsForceFile = fs.vfsForceFile;
var usrALIAS = os.usrALIAS;
var usrVAR = os.usrVAR;
// module var
var cmdFileStack=new Array();

// function
function cmdFileRegistrate(path,kind,file,perm,date) {
	// registrate a file for boot time (owner=root, group=wheel)
	cmdFileStack[cmdFileStack.length]=[path,kind,file,perm,date]
}

function commandInit() {

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
		commandInit: commandInit
	};
});
/// eof