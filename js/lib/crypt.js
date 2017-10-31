// crypt
define([],function(){

var crptSalt= '0e7aff21';
var crptHexCode = new Array('0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F');
var crptKeyquence= new Array();

for (var i = 0; i<crptSalt.length; i+=2) {
	crptKeyquence[crptKeyquence.length]=parseInt(crptSalt.substring(i, i+2),16);
}

function crypt(x) {
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

	return {
		moduleName:'os.crypt',
		version:'1.0.0',
		enc:crypt
	};
});
