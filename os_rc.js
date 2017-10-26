// JS/UIX .rc file

function jsuixRC() {

vfsForceFile('/etc/profile', 'f', [
'#!/bin/sh',
'alias -s split splitmode on',
'alias -s unsplit splitmode off',
'set -s PATH = \'/bin /sbin /usr/bin ~\'',
'set -s PS = \'[${USER}@${HOST}:${CWD}]\'',
'alias -s ll "ls -l"',
'alias -s bla \'echo "Vergil, Aeneis:" | more /var/testfile\'',
'stty -blink',
'write "                           %+r     Terminal ready.     %-r"',
'echo " $VERSION - The JavaScript virtual OS for the web."',
'echo " Type \\"info\\" for site information. Type \\"help\\" for available commands."',
'echo " ------------------------------------------------------------------------------"'
], 0755);

vfsForceFile('/var/testfile', 'f', [
"01    Arma virumque cano, Troiae qui primus ab oris",
"02  Italiam fato profugus Laviniaque venit",
"03  litora, multum ille et terris iactatus et alto",
"04  vi superum saeyae memorem Iunonis ob iram",
"05  multa quoque et bello passus, dum conderet urbem",
"06  inferretque deos Latio, genus unde Latinum",
"07  Albanique patres atque altae moenia Romae.",
"08    Musa, mihi causa memora, quo numine laeso",
"09  quidve dolens regina deum tot volvere casus",
"10  insignem pietate virum, tot adire, labores",
"11  inpulerit. tantaene animis caelestibus irae?",
"12    Urbs antiqua fuit - Tyrii tenuere coloni -",
"13  Karthago, Italiam contra Tiberinaque longe",
"14  ostia, dives opum studiisque asperrima belli;",
"15  quam Iuno fertur terris magnis omnibus unam",
"16  posthabita coluisse Samo: hic illus arma,",
"17  hic currus fuit; hoc regnum dea gentibus esse,",
"18  si qua fata sinant, iam tum tenditque fovetque.",
"19  progeniem sed enim Troiano a sanguine duci",
"20  audierat, Tyrias olim quae verteret arces;",
"21  hinc populum late regem belloque superbum",
"22  venturum excidio Libyae: sic volvere Parcas.",
"23  id metuens veterisque memor Saturnia belli,",
"24  prima quod Troiam pro caris gesserat Argis",
"25  ..."
], 0666);

vfsForceFile('/var/test.sh', 'f', [
'# start this file with "/var/test.sh" or "sh /var/test.sh"',
'write "%+istarting test with PID=$PID%-i"',
'write \'%+i> "date":%-i\'; date',
'write \'%+i> "cal -w":%-i\'; cal -w',
'write \'%+i> "cal -w | wc":%-i\'; cal -w | wc',
'write \'%+i> "ls -l /var":%-i\'; ls -l /var',
'write "%+idone.%-i"'
], 0777);

vfsForceFile('/var/test.js', 'f', [
'var arr = [1,5,3,4,2];',
'arr.sort();',
'io.out("after sort:"+arr);'
], 0777);

vfsForceFile('/var/lx', 'f', [
'#!/bin/sh',
'# command-test: copy this to /bin/lx (using cp -p)',
'echo  "Content of $1:"',
'ls -C $1',
'echo `ls -l $1 | wc -l` "file(s)."'
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

}


// must be included as last function for integrety test at start up
function jsuixRX() {
	return true
}
console.log('loaded os_rc.js ...')
// eof