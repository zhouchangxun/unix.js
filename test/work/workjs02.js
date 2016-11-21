define(['workjs01'],function(w01){
    //1,define intenal variable area//变量定义区
    var moduleName = "work module 02";
    var moduleVersion = "1.0.0";

    //2,define intenal funciton area//函数定义区
    var hello=function(){
    }
    console.log('workjs02 loaded...')
    //3,auto run when js file is loaded finish
    //在JS加载完,可在本模块尾部[return之前]运行某函数,即完成自动运行
    w01.func1();

    //4,should be return/output a object[exports/API]
    //如有需要暴露(返回)本模块API(相关定义的变量和函数)给外部其它模块使用
    return {
        "moduleName":moduleName
        ,"version": moduleVersion
    }

});