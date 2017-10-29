// JS/UIX .rc file
define(["os.common", "os.fs"],function(os, fs){

//import method
var vfsForceFile = fs.vfsForceFile;

vfsForceFile('/etc/profile', 'f', [
'#!/bin/sh',
'alias -s split splitmode on',
'alias -s unsplit splitmode off',
'set -s PATH = \'/bin /sbin /usr/bin ~\'',
'set -s PS = \'[${USER}@${HOST}:${CWD}]\'',
'alias -s ll "ls -l"',
//'stty -blink',
'write "                           %+r     Terminal ready.     %-r"',
'echo " $VERSION - The JavaScript virtual OS for the web."',
'echo " Type \\"info\\" for site information. Type \\"help\\" for available commands."',
'echo " ------------------------------------------------------------------------------"'
], 0755);
	
vfsForceFile('/var/lx', 'f', [
'#!/bin/sh',
'# command-test: copy this to /bin/lx (using cp -p)',
'echo  "Content of $1:"',
'ls -C $1',
'echo `ls -l $1 | wc -l` " file(s)."'
], 0777);

vfsForceFile('/etc/news', 'f', [
'%+r JS/UIX News %-r',
'-------------------------------------------------------------------------------',
'Oops: JS/UIX was slashdotted (June 16 2005)!',
'Thanks for mails and comments!',
' ',
'Recent changes:',
' * fixed a new dead keys issue with mac OS (backticks, tilde). [v.0.48]',
' * fixed the key-handler for Safari (fired BACKSPACE twice). [v.0.46]',
' * added ecxeption handling for command "js" for supporting browsers. [v.0.46]',
' * added "/usr/bin/invaders" to demo interactive run time. [v0.45]',
'   yes, it\'s space invaders for JS/UIX!',
' * added a new "smart console" feature for smart scolling. [v.044]',
'   this should avoid most scrolling delays by rendering only visble changes.',
'   the smart console option is activated by default and may be switched on/off',
'   using "stty [-]smart".',
' * fixed a bug in command "which" [v0.43]',
' * added news-feature (displays this file) [v0.42]',
' * fixed "wc" command to work like the real thing. [v0.42]',
' ',
'Any major changes to the system will be posted on this page.',
'Stay tuned to be informed.',
'-------------------------------------------------------------------------------'
], 0644);


console.log('loaded initrd.js ...');

});
// eof