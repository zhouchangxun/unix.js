define([],function(){  //注意模块的写法
    //1,define intenal variable area//变量定义区
    var myModule = {}; //推荐方式
    var moduleName = "os.common";
    var version = "1.0.0";

    //2,define intenal funciton area//函数定义区
    var usrVAR = {};
    var usrALIAS = {};

    var os_mdate=new Date(2016,11,11,12,0,0);

//util txt
// text related

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

    console.log('common loaded...')
    //3,should be return/output a object[exports/API] if other module need
    //如有需要暴露(返回)本模块API(相关定义的变量和函数)给外部其它模块使用
    myModule.moduleName = moduleName;
    myModule.version = version;

    myModule.usrVAR = usrVAR;
    myModule.usrALIAS = usrALIAS;
    myModule.os_mdate = os_mdate;

    myModule.txt={
        stripStyles:txtStripStyles,
        normalize:txtNormalize,
        fillLeft:txtFillLeft,
        center:txtCenter,
        stringReplace:txtStringReplace
    }

    return myModule;

    /*
    //this is same to four line code upper//跟上面四行一样
    return {
        "moduleName":"work module 01"
        ,"version":"1.0.0"
        ,loadTip:loadTip
    };
    */

});