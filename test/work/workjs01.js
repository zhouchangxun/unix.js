define(['jquery'],function($){  //注意模块的写法
    //1,define intenal variable area//变量定义区
    var myModule = {}; //推荐方式
    var moduleName = "work module 01";
    var version = "1.0.0";

    //2,define intenal funciton area//函数定义区
    var func1 = function(){
        console.log('workjs01.func1()')
    };
    console.log('workjs01 loaded...')
    //3,should be return/output a object[exports/API] if other module need
    //如有需要暴露(返回)本模块API(相关定义的变量和函数)给外部其它模块使用
    myModule.moduleName = moduleName;
    myModule.version = version;
    myModule.func1 = func1;
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