// unix.js init ram disk.
define(["os.common", "os.fs"],function(os, fs){
//import deps
var vfsForceFile = fs.vfsForceFile;
var vfsCreate = fs.create;
var usrVAR = os.usrVAR;
var os_mdate = os.os_mdate;

function initRamDisk() {
	usrVAR.UID=0;
    usrVAR.GID=0;

	var permission = 0775;

	// create sys dir.
    var sysDirs=new Array('/sbin', '/dev', '/bin', '/home', '/var', '/usr', '/usr/bin');
    for (var i=0; i<sysDirs.length; i++) {
        var d=vfsCreate(sysDirs[i], 'd', permission, os_mdate);
    };
    permission = 01777;
    vfsCreate('/etc', 'd', permission, os_mdate);
    vfsCreate('/tmp', 'd', permission, os_mdate);

    vfsCreate('/root', 'd', 0700, os_mdate);

    //create device file.
    var f;
    f=vfsCreate('/dev/null','b',0666,os_mdate);
    f=vfsCreate('/dev/console','b',0644,os_mdate);
    f.lines=['1'];

    f=vfsCreate('/dev/js','b',0755,os_mdate);
    f.lines=['JavaScript native code'];

    //user profile script (called when user login system.)
    vfsForceFile('/etc/profile', 'f', [
		'#!/bin/sh',
		'set -s PATH = \'/bin /sbin /usr/bin ~\'',
		'set -s PS = \'[${USER}@${HOST}:${CWD}]\'',
		'alias -s split splitmode on',
		'alias -s unsplit splitmode off',
		'alias -s ll "ls -l"',
		'alias -s la "ls -a"',
		//'stty -blink',
		'write "                           %+r     Terminal ready.     %-r"',
		'echo " $VERSION - The JavaScript virtual OS for the web."',
		'echo " Type \\"info\\" for site information. Type \\"help\\" for available commands."',
		'echo " ------------------------------------------------------------------------------"'
	], 0755);

}

console.log('loaded initrd.js ...');
return {init: initRamDisk};
});
// eof