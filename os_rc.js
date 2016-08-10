// JS/UIX .rc file

function jsuixRC() {

vfsForceFile('/etc/profile', 'f', [
'#!/bin/sh',
'alias -s split splitmode on',
'alias -s unsplit splitmode off',
'set -s PATH = \'/bin /sbin /usr/bin ~\'',
'set -s PS = \'[${USER}@${HOST}:${PID}]\'',
'alias -s ll "ls -l"',
'alias -s bla \'echo "Vergil, Aeneis:" | more /var/testfile\'',
'stty -blink',
'write "                           %+r     Terminal ready.     %-r"',
'echo " $VERSION - The JavaScript virtual OS and terminal application for the web."',
'echo " Type \\"info\\" for site information. Type \\"help\\" for available commands."',
'echo " ------------------------------------------------------------------------------"'
], 0755);

vfsForceFile('/etc/motd', 'f', [
'Aliquando praeterea rideo, iocor, ludo, homo sum. (Plinius iun.)'
], 0664);

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
"25  - necdum etiam causae irarum saevique dolores",
"26  exciderant animo; manet alta mente repostum",
"27  iudicium Paridis spretaeque iniuria formae",
"28  et genus invisum et rapti Ganymedis honores -",
"29  his accensa super iactatos aequore toto",
"30  Troas, reliquias Danaum qtque inmitis Achilli,",
"31  arcebat longe Latio, multosque per annos",
"32  errabant acti fatis maria omnia circum.",
"33  tantae molis erat Romanam condere gentem.",
"34    Vix e conspectu Siculae telluris in altum",
"35  vela dabant laeti et spumas salis aere ruebant,",
"36  cum Iuno aeternum servans sub pectore volnus",
"37  haec secum 'mene icepto desistere victam",
"38  nec posse Italia Teucrorum avertere classem",
"39  Argivom atque ipsos potuit submergere ponto",
"40  unius ob noxam et furias Aiacis Oilei?",
"41  quippe Iovis rapidum iaculata e nubibus ignem",
"42  disiecitque rates evertitque aequora ventis,",
"43  illum exspirantem transfixo pectore flammas",
"44  turbine corripuit scopuloque inflixit acuto;",
"45  ast ego, quae divom incedo regina, Iovisque",
"46  et sorror et coniunx, una cum gente tot annos",
"47  bella gero. et quisquam numen Iunonis adorat",
"48  praeterea aut supplex aris inponet honrem?'",
"49    Talia flammato secum dea corde volutans",
"50  nimborum in patriam, loca feta furentibus austris,",
"51  Aeoliam venit. hic vasto rex Aeolus antro",
"52  luctantis ventos tempestatesque sonoras",
"53  imperio premit ac vinclis et carcere frenat.",
"54  illi indignantes magno cum murmure montis",
"55  circam claustra fremunt; celsa sedet Aeolus arce",
"56  sceptra tenens mollitque animos et temperat iras.",
"57  ni faciat, maria ac terras caelumque profundum",
"58  quippe ferant rapidi secum verrantque per auras.",
"59  sed pater omnipotens speluncis abdidit atris",
"60  hoc metuens molemque et montis insuper altos",
"61  inposuit remque dedit, qui foedere certo",
"62  et premere et laxas sciret dare iussus habenas.",
"63  ..."
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