define(["os.common"],function(os){
var kernel;
var os_mdate = os.os_mdata;
var usrVAR = os.usrVAR;
var krnlInodes;
//util

// vfs file system
//file desc
function VfsFile(k, lines) {
    this.mdate=new Date();
    this.kind=k;
    this.lines=(lines)? lines:[];
    this.inode=krnlInodes++;
    this.owner=0;
    this.group=0;
    this.mode=0;
    this.icnt=0
}
function _vffTouch() {
    this.mdate=new Date();
}
VfsFile.prototype.touch=_vffTouch;
//file operation
function VfsFileHandle(fh) {
    var f=null;
    if ((fh) && (typeof fh == 'object')) f=fh;
    this.file=f;
    this.lp=0;
    this.cp=0;
}

function _vfhReadLine() {
    if ((this.lp<this.file.lines.length) && (this.cp>=this.file.lines[this.lp].length) && (this.file.lines[this.lp]!='')) {
        this.cp=0;
        this.lp++
    };
    if (this.lp<this.file.lines.length) {
        var l=this.file.lines[this.lp].length;
        if (this.cp>0) {
            var p=this.cp;
            this.cp=0;
            return [l-p,this.file.lines[this.lp++].substring(p)]
        }
        else {
            return [l,this.file.lines[this.lp++]]
        }
    }
    else {
        return [-1,'']
    }
}

function _vfhClose() {
    if ((this.file.kind=='d') || (this.file.kind=='l')) return;
    if ((this.file.lines.length>0) && (this.file.lines[this.file.lines.length-1]=='')) {
        this.file.lines.length--
    };
    this.rewind()
}

function _vfhPutLine(t) {
    if (this.file.inode==kernel.data.krnlDevNull) return;
    var cl=Math.max(this.file.lines.length-1,0);
    if (this.file.lines[cl]) {
        this.file.lines[cl]+=t
    }
    else {
        this.file.lines[cl]=t;
    };
    this.file.lines[++cl]='';
    this.lp=cl;
    this.cp=0;
    this.file.touch()
}

function _vfhPutNewLine(t) {
    if (this.file.inode==krnlDevNull) return;
    this.lp=this.file.lines.length;
    this.file.lines[this.lp]=t;
    this.cp=this.file.lines[this.lp].length;
    this.file.touch()
}

function _vfhPutChunk(ch) {
    if (this.file.inode==krnlDevNull) return;
    var cl=Math.max(this.file.lines.length-1,0);
    if (this.file.lines[cl]) {
        this.file.lines[cl]+=t
    }
    else {
        this.file.lines[cl]=t;
    };
    this.lp=cl;
    this.cp=this.file.lines[cl].length;
    this.file.touch()
}

function _vfhGetChar() {
    if ((this.lp<this.file.lines.length) && (this.cp>=this.file.lines[this.lp].length) ) {
        cp=0;
        lp++
    };
    if (this.lp<this.file.lines.length) {
        return this.file.lines[this.lp].charAt(this.cp++)
    }
    else {
        return ''
    }
}

function _vfhUngetChar() {
    if (this.lp>=this.file.lines.length) {
        this.lp=this.file.lines.length-1;
        this.cp=Math.max(0,this.file.lines[this.lp].length-1)
    }
    else if (this.cp>0) {
        this.cp--
    }
    else {
        if (this.lp>0) {
            this.lp--;
            this.cp=Math.max(0,this.file.lines[this.lp].length-1)
        }
        else {
            this.cp=0;
            this.lp=0
        }
    }
}

function _vfhRewind() {
    this.cp=0;
    this.lp=0;
}

VfsFileHandle.prototype.readLine=_vfhReadLine;
VfsFileHandle.prototype.close=_vfhClose;
VfsFileHandle.prototype.putLine=_vfhPutLine;
VfsFileHandle.prototype.putNewLine=_vfhPutNewLine;
VfsFileHandle.prototype.putChunk=_vfhPutChunk;
VfsFileHandle.prototype.getChar=_vfhGetChar;
VfsFileHandle.prototype.ungetChar=_vfhUngetChar;
VfsFileHandle.prototype.rewind=_vfhRewind;
//
function vfsGetPath(path,cwd) {
    while ((cwd) && (cwd.charAt(cwd.length-1)=='/')) cwd=cwd.substring(0,cwd.length-1);
    if (path) {
        if (path.charAt(0)!='/') path=cwd+'/'+path;
    }
    else path=cwd;
    var pa=path.split('/');
    var cwa=new Array();
    for (var i=0; i<pa.length; i++) {
        var f=pa[i];
        if (f=='') continue;
        if (f=='..') {
            if (cwa.length>0) cwa.length--;
        }
        else if (f=='~') { cwa.length=0; cwa[0]=usrVAR.HOME.substring(1) }
        else if (f!='.') cwa[cwa.length]=f;
    };
    return fp='/'+cwa.join('/')
}

function vfsGetDir(absPath) {
    var pa=absPath.split('/');
    var d=new Array();
    d[0]=vfsRoot;
    di=0;
    for (var i=1; i<pa.length; i++) {
        cd=d[di];
        var pd=pa[i];
        if ((!cd) || (cd.kind!='d')) {
            return 0;
        }
        else if (!vfsPermission(cd,1)) return -1
        else if ((pd=='.')  || (pd=='')) continue
        else if (pd=='..') {
            if (di>0) {
                di--;
                d.length--
            }
        }
        else if ((cd.lines[pd]) && (cd.lines[pd].kind=='d')) {
            di++;
            d[di]=cd.lines[pd]
        }
        else {
            return 0
        }
    };
    return d[di]
}

function vfsGetFile(absPath) {
    while (absPath.charAt(absPath.length-1)=='/') absPath=absPath.substring(0,absPath.length-1);
    var pa=absPath.split('/');
    var f=vfsRoot;
    for (var i=0; i<pa.length; i++) {
        if (pa[i]=='') continue
        else if (f.lines[pa[i]]) {
            if (vfsPermission(f,1)) f=f.lines[pa[i]]
            else return -1;
        }
        else return 0
    };
    return f
}

function vfsGetParent(absPath) {
    while (absPath.charAt(absPath.length-1)=='/') absPath=absPath.substring(0,absPath.length-1);
    if (absPath=='') return null;
    var pn=vfsDirname(absPath);
    return vfsGetDir(pn)
}

function vfsBasename(path) {
    if (path=='') return '';
    var fos=path.lastIndexOf('/');
    return (fos==path.length-1)? '': (fos>=0)? path.substring(fos+1): path;
}

function vfsDirname(path) {
    if (path=='') return '';
    var fos=path.lastIndexOf('/');
    return (fos==0)? '/' : (fos>0)? path.substring(0,fos): '';
}

function vfsOpen(absPath,m) {
    var f=vfsGetFile(absPath);
    if (f<=0) return f;
    if ((m) && (!vfsPermission(f,m))) return -2
    else if (f) return f
    else return 0;
}

function vfsFileCopy(sf,tf,append) {
    if (!append) tf.lines=[];
    for (var i=0; i<sf.lines.length; i++) tf.lines[tf.lines.length]=sf.lines[i];
}

function vfsCreate(absPath,kind,fmode,cdate) {
    var fn=vfsBasename(absPath);
    var pn=vfsDirname(absPath);
    if ((fn=='') || (fn=='.') || (fn=='..') || (fn=='~')) return 0;
    if ((fn) && (pn)) {
        var pd=vfsGetDir(pn);
        if (pd<=0) return pd
        else if (pd) {
            if ((pd.mode) && (!vfsPermission(pd,2))) return -1;
            //if (pd.lines[fn]) return -3;
            var f=(kind=='d')? new VfsFile('d',{}) :  new VfsFile(kind,[]);
            f.icnt=(kind=='d')? 2:1;
            if (cdate) f.mdate=cdate;
            if (fmode) f.mode=fmode;
            if (usrVAR.UID!=null) f.owner=usrVAR.UID;
            if (usrVAR.GID!=null) f.group=usrVAR.GID;
            pd.lines[fn]=f;
            pd.mdate=f.mdate;
            return f
        }
    };
    return 0
}

function vfsForceFile(absPath,kind,flines,fmode,cdate) {
    var f=vfsCreate(absPath,kind,fmode,cdate);
    if (typeof f=='object') f.lines=flines;
    return f
}

function vfsUnlink(absPath) {
    var fn=vfsBasename(absPath);
    var pn=vfsDirname(absPath);
    if ((fn=='') || (fn=='.') || (fn=='~') || (fn=='..')) return 0;
    if ((fn) && (pn)) {
        var pd=vfsGetDir(pn);
        if (pd<=0) return pd
        else if (pd) {
            if ((pd.mode) && (!vfsPermission(pd,2))) return -1;
            if (pd.lines[fn]) {
                if ((pd.mode&01000) && ((pd.owner!=usrVAR.UID) && (pd.lines[fn].owner!=usrVAR.UID))) return -1;
                delete(pd.lines[fn])
                pd.touch();
                return 1
            }
        }
    };
    return 0
}

function vfsMove(fn1,fn2) {
    var f1=vfsOpen(fn1,4);
    if (typeof f1=='object') {
        var d=vfsGetParent(fn2);
        if (typeof d=='object') {
            if ((vfsPermission(d,2)) && (vfsUnlink(fn1)>0)) {
                d.lines[vfsBasename(fn2)]=f1;
                d.touch();
                return 1
            }
            else return -1
        }
        else return d
    }
    else return f1
}

function vfsGetSize(f) {
    var n=0;
    if ((f) && (f.kind=='d')) {
        for (var i in f.lines) n++;
    }
    else if (f) {
        for (var i=0; i<f.lines.length; i++) n+=f.lines[i].length;
    };
    return n
}

function vfsGetMdate(f) {
    var fd=f.mdate;
    return (fd)? fd.getFullYear()+'/'+os.txt.txtNormalize(fd.getMonth()+1,2)+'/'+os.txt.txtNormalize(fd.getDate(),2)+' '+os.txt.txtNormalize(fd.getHours(),2)+':'+os.txt.txtNormalize(fd.getMinutes(),2)+':'+os.txt.txtNormalize(fd.getSeconds(),2) : '???';
}

function vfsDirList(d) {
    var list=new Array();
    if ((d) && (d.lines)) {
        list[0]='.';
        list[1]='..';
        for (var i in d.lines) list[list.length]=i;
    };
    list.sort();
    return list
}

function vfsPermission(f,mode) {
    if (f) {
        if (usrVAR.UID==0){
            return ((mode) && (mode&1) && (f.kind!='d'))? f.mode&0100 : 1;
        }
        var m=0;
        if (usrVAR.UID==f.owner) 
            m= (f.mode>>6)&7
        else if (kernel.data.usrGroups[f.group]) 
            m= (f.mode>>3)&7
        else 
            m= f.mode&7;

        return m&mode
    }
    else 
        return 0
}

function vfsCheckInPath(fn,fobj) {
    if ((typeof fobj=='object') && (fobj.kind=='d')) {
        while (fn) {
            while (fn.charAt(fn.length-1)=='/') fn=fn.substring(0,fn.length-1);
            var fp=vfsGetFile(fn);
            if ((fp.inode==fobj.inode) && (fobj.inode!=vfsRoot.inode)) return true;
            fn=vfsDirname(fn)
        }
    };
    return false
}
//
function vfsTreeSetup() {
    var sysDirs=new Array('/sbin', '/dev', '/bin', '/home', '/var', '/usr', '/usr/bin');

    usrVAR.UID=0;
    usrVAR.GID=0;

    for (var i=0; i<sysDirs.length; i++) {
        var d=vfsCreate(sysDirs[i],'d',0775,os_mdate);
    };

    vfsCreate('/etc','d',01777,os_mdate);
    vfsCreate('/tmp','d',01777,os_mdate);
    vfsCreate('/root','d',0700,os_mdate);

    //create device file.
    var f;
    f=vfsCreate('/dev/null','b',0666,os_mdate);

    f=vfsCreate('/dev/console','b',0644,os_mdate);
    f.lines=['1'];

    f=vfsCreate('/dev/js','b',0755,os_mdate);
    f.lines=['JavaScript native code'];

}


//
function vfsInit(_kernel) {
    krnlInodes=100;
    vfsRoot=new VfsFile('d',{});
    vfsRoot.mdate=os_mdate;
    vfsRoot.mode=01777;
    vfsRoot.owner=0;
    vfsRoot.group=0;
    vfsRoot.icnt=2;
    vfsTreeSetup();
    console.log('fs ready...');
}

function init(_kernel) {
    kernel = _kernel;
}
    var myModule = {}; //推荐方式
    var moduleName = "os.fs";
    var version = "1.0.0";
    var vfsRoot;
    vfsInit();
    //2,define intenal funciton area//函数定义区

    console.log(moduleName+' loaded...')
    //3,should be return/output a object[exports/API] if other module need
    //如有需要暴露(返回)本模块API(相关定义的变量和函数)给外部其它模块使用
    myModule.moduleName = moduleName;
    myModule.version = version;

    myModule.File = VfsFile;
    myModule.fileHandle = VfsFileHandle;
    myModule.root = vfsRoot;
    myModule.ls = vfsDirList;
    myModule.unlink = vfsUnlink;
    myModule.create = vfsCreate;
    myModule.copy = vfsFileCopy;
    myModule.open = vfsOpen;
    myModule.getDir = vfsGetDir;
    myModule.getFile = vfsGetFile;
    myModule.getParentDir = vfsGetParent;
    myModule.vfsForceFile = vfsForceFile;
    myModule.vfsGetPath = vfsGetPath;
    myModule.vfsPermission = vfsPermission;
    myModule.vfsBasename = vfsBasename;
    myModule.vfsGetSize = vfsGetSize;
    myModule.vfsGetMdate = vfsGetMdate;
    myModule.init = init;
    return myModule;
});