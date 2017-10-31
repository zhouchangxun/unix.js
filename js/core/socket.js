/*
  === termlib.js Socket Extension v.1.02 ===

  (c) Norbert Landsteiner 2003-2007
  mass:werk - media environments
  <http://www.masswerk.at>

# Synopsis:
  Integrates async XMLHttpRequests (AJAX/JSON) tightly into termlib.js

# Example:

  myTerm = new Socket( { handler: myTermHandler } );
  myTerm.open();

  function myTermHandler() {
    this.newLine();
    if (this.lineBuffer == 'get file') {
       myTerm.send(
         {
           url: 'myservice',
           data: {
               book: 'theBook',
               chapter: 7,
               page: 45
             },
           callback: myCallback
          }
       );
       return;
    }
    else {
       // ...
    }
    this.prompt();
  }

  function myCallback() {
  	if (this.socket.success) {
  		this.write(this.socket.responseText);
  	}
  	else {
  		this.write('OOPS: ' + this.socket.status + ' ' + this.socket.statusText);
  		if (this.socket.errno) {
  			this.newLine();
  			this.write('Error: ' + this.socket.errstring);
  		}
  	}
  	this.prompt();
  }


# Documentation:

  for usage and description see readme.txt chapter 13:
  <http://www.masswerk.at/termlib/readme.txt>

  or refer to the sample page:
  <http://www.masswerk.at/termlib/sample_socket.html>

*/
define([],function(){

var Socket = function(){

}

Socket.prototype._HttpSocket = function() {
	var req=null;
	if (window.XMLHttpRequest) {
		try {
			req=new XMLHttpRequest();
		}
		catch(e) {}
	}
	else if (window.ActiveXObject) {
		var prtcls=this._msXMLHttpObjects;
		for (var i=0; i<prtcls.length; i++) {
			try {
				req=new ActiveXObject(prtcls[i]);
				if (req) {
					// shorten proto list to working element
					if (prtcls.length>1) this.prototype._msXMLHttpObjects= [ prtcls[i] ];
					break;
				}
			}
			catch(e) {}
		}
	}
	this.request=req;
	this.url;
	this.data=null;
	this.query='';
	this.timeoutTimer=null;
	this.localMode=Boolean(window.location.href.search(/^file:/i)==0);
	this.error=0;
}

Socket.prototype._HttpSocket.prototype = {
	version: '1.02',
	// config
	useXMLEncoding: false, // use ";" as separator if true, "&" else
	defaulTimeout: 10000,  // request timeout in ticks (milliseconds)
	defaultMethod: 'GET',
	forceNewline: true,    // translate line-breaks in responseText to newlines
	
	// static const
	errno: {
		OK: 0,
		NOTIMPLEMENTED: 1,
		FATALERROR: 2,
		TIMEOUT: 3,
		NETWORKERROR: 4,
		LOCALFILEERROR: 5
	},
	errstring: [
		'',
		'XMLHttpRequest not implemented.',
		'Could not open XMLHttpRequest.',
		'The connection timed out.',
		'Network error.',
		'The requested local document was not found.'
	],
	
	// private static data
	_msXMLHttpObjects: [
		'Msxml2.XMLHTTP',
		'Microsoft.XMLHTTP',
		'Msxml2.XMLHTTP.5.0',
		'Msxml2.XMLHTTP.4.0',
		'Msxml2.XMLHTTP.3.0'
	],
	
	// internal methods
	serializeData: function() {
		this.query=this.serialize(this.data);
	},
	serialize: function(data) {
		var v='';
		if( data != null ) {
			switch (typeof data) {
				case 'object':
					var d=[];
					if (data instanceof Array) {
						// array
						for (var i=0; i<data.length; i++) {
							d.push(this.serialize(data[i]));
						}
						v= d.join(',');
						break;
					}
					for (var i in data) {
						switch (typeof data[i]) {
							case 'object':
								d.push(encodeURIComponent(i)+'='+this.serialize(data[i]));
								break;
							default:
								d.push(encodeURIComponent(i)+'='+encodeURIComponent(data[i]));
								break;
						}
					}
					v= (this.useXMLEncoding)? d.join(';') : d.join('&');
					break;
				case 'number':
					v=String(data);
					break;
				case 'string':
					v=encodeURIComponent(data);
					break;
				case 'boolean':
					v=(data)? '1':'0';
					break;
			}
		}
		return v;
	},
	toCamelCase: function(s) {
		if (typeof s!='string') s=String(s);
		var a=s.toLowerCase().split('-');
		var cc=a[0];
		for (var i=1; i<a.length; i++) {
			p=a[i];
			if (p.length) cc+=p.charAt(0).toUpperCase()+p.substring(1);
		}
		return cc;
	},
	callbackHandler: function() {
		if (this.termRef.closed) return;
		var r=this.request;
		if (this.error==0 && r.readyState!=4) return;
		if (this.timeoutTimer) {
			clearTimeout (this.timeoutTimer);
			this.timeoutTimer = null;
		}
		var success=false;
		var failed=true;
		var response={
			headers: {},
			ErrorCodes: this.errno
		};
		if (this.localMode) {
			if (this.error && this.error<this.errno.NETWORKERROR) {
				response.status=0;
				response.statusText='Connection Error';
				response.responseText='';
				response.responseXML=null;
			}
			else if (this.error || r.responseText==null) {
				failed=false;
				response.status=404;
				response.statusText='Not Found';
				response.responseText='The document '+this.url+' was not found on this file system.';
				response.responseXML=null;
				this.error=this.errno.LOCALFILEERROR;
			}
			else {
				success=true;
				failed=false;
				response.status=200;
				response.statusText='OK';
				response.responseText=r.responseText;
				response.responseXML=r.responseXML;
			}
		}
		else {
			try {
				if (!this.error) {
					if (typeof r == 'object' && r.status != undefined)  {
						failed=false;
						if (r.status >= 200 && r.status < 300) {
							success=true;
						}
						else if (r.status >= 12000) {
							// MSIE network error
							failed=true;
							this.error=this.errno.NETWORKERROR;
						}
					}
				}
			}
			catch(e) {}
			if (!failed) {
				response.status=r.status;
				response.statusText= (r.status==404)? 'Not Found':r.statusText; // force correct header
				response.responseText=r.responseText;
				response.responseXML=r.responseXML;
				if (this.getHeaders) {
					if (this.getHeaders instanceof Array) {
						for (var i=0; i<this.getHeaders.length; i++) {
							var h=this.getHeaders[i];
							try {
								response.headers[this.toCamelCase(h)]=r.getResponseHeader(h);
							}
							catch(e) {}
						}
					}
					else {
						for (var h in this.getHeaders) {
							try {
								response.headers[this.toCamelCase(h)]=r.getResponseHeader(h);
							}
							catch(e) {}
						}
					}
				}
			}
			else {
				response.status=0;
				response.statusText='Connection Error';
				response.responseText='';
				response.responseXML=null;
			}
		}
		if (this.forceNewline) response.responseText=response.responseText.replace(/\r\n?/g, '\n');
		response.url=this.url;
		response.data=this.data;
		response.query=this.query;
		response.method=this.method;
		response.success=success;
		response.errno=this.error;
		response.errstring=this.errstring[this.error];
		var term=this.termRef;
		term.socket=response;
		if (this.callback) {
			if (typeof this.callback=='function') {
				this.callback.apply(term);
			}
			else if (window[this.callback] && typeof window[this.callback]=='function') {
				window[this.callback].apply(term);
			}
			else {
				term._defaultServerCallback();
			}
		}
		else {
			term._defaultServerCallback();
		}
		delete term.socket;
		this.request=null;
		this.callback=null;
	},
	timeoutHandler: function() {
		this.error = this.errno.TIMEOUT;
		try {
			this.request.abort();
		}
		catch(e) {}
		if (!this.localMode) this.callbackHandler();
	}
}

Socket.prototype.send = function( opts ) {
	var soc = new this._HttpSocket();
	if (opts) {
		if (typeof opts.method == 'string') {
			switch (opts.method.toLowerCase()) {
				case 'post':
					soc.method='POST'; break;
				case 'get':
					soc.method='GET'; break;
				default:
					soc.method=soc.defaultMethod.toUpperCase();
			}
		}
		else {
			soc.method=soc.defaultMethod;
		}
		if (opts.postbody != undefined) {
			soc.method='POST';
			soc.query=opts.postbody;
			soc.data=opts.data;
		}
		else if (opts.data != undefined) {
			soc.data=opts.data;
			soc.serializeData();
		}
		if (opts.url) soc.url=opts.url;
		if (opts.getHeaders && typeof opts.getHeaders=='object') {
			soc.getHeaders=opts.getHeaders;
		}
	}
	else {
		opts = {}
		soc.method=soc.defaultMethod;
	}
	var uri=soc.url;
	if (soc.method=='GET') {
		if (soc.query) {
			uri+= (uri.indexOf('?')<0)?
				'?'+soc.query :
				(soc.useXMLEncoding)? ';'+soc.query : '&'+soc.query;
		}
		if (!soc.localMode) {
			// add a random value to the query string (force a request)
			var uniqueparam= '_termlib_reqid=' +new Date().getTime()+'_'+Math.floor(Math.random()*100000);
			uri+= (uri.indexOf('?')<0)?
				'?'+uniqueparam :
				(soc.useXMLEncoding)? ';'+uniqueparam : '&'+uniqueparam;
		}
	}
	soc.callback=opts.callback;
	soc.termRef=this;
	if (!soc.request) {
		soc.error = soc.errno.NOTIMPLEMENTED;
		soc.callbackHandler();
		return;
	}
	else {
		try {
			if (opts.userid!=undefined) {
				if (opts.password!=undefined) {
					soc.request.open(soc.method, uri, true, opts.userid, opts.password);
				}
				else {
					soc.request.open(soc.method, uri, true, opts.userid);
				}
			}
			else {
				soc.request.open(soc.method, uri, true);
			}
		}
		catch(e) {
			soc.error = soc.errno.FATALERROR;
			soc.callbackHandler();
			return;
		}
		var body=null;
		if (soc.method == 'POST') {
			try {
				soc.request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}
			catch(e) {}
			body=soc.query;
		}
		if (opts.headers && typeof opts.headers == 'objects') {
			for (var i in opts.headers) {
				try {
					soc.request.setRequestHeader(i, opts.headers[i]);
				}
				catch(e) {}
			}
		}
		if (opts.mimetype && soc.request.overrideMimeType) {
			try {
				soc.request.overrideMimeType(opts.mimetype);
				// force "Connection: close" (Bugzilla #246651)
				soc.request.setRequestHeader('Connection', 'close');
			}
			catch(e) {}
		}
		
		var timeoutDelay=(opts.timeout && typeof opts.timeout=='number')? opts.tiomeout : soc.defaulTimeout;
		
		soc.request.onreadystatechange=function() { soc.callbackHandler(); };
		try {
			soc.request.send(body);
		}
		catch(e) {
			if (soc.localMode) {
				soc.request.onreadystatechange=null;
				soc.request.abort();
				soc.error = soc.errno.LOCALFILEERROR;
			}
			else {
				soc.request.onreadystatechange=null;
				try {
					soc.request.abort();
				}
				catch(e2) {}
				soc.error = soc.errno.NETWORKERROR;
			}
			soc.callbackHandler();
			return true;
		}
		soc.timeoutTimer = setTimeout(function() { soc.timeoutHandler() }, timeoutDelay);
	}
}
Socket.prototype._defaultServerCallback = function() {
	if (this.socket.success) {
		// output im more-mode
		console.log('Server Response:'+this.socket.responseText);
	}
	else {
		var s='Request failed: '+this.socket.status+' '+this.socket.statusText;
		if (this.socket.errno) s += ',reason: '+this.socket.errstring;
		console.log(s);
	}
}

return {moduleName:"os.socket",
		version:"1.0.0",
		Socket: Socket
	};
});

