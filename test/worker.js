var i = 0;  
  
function timeCount(){  
    i = i + 1;  
    postMessage(i);//postMessage是Worker对象的方法，用于向html页面回传一段消息  
    setTimeout("timeCount()",500);//定时任务  
}  
  
timeCount();//加1计数,每500毫秒调用一次  