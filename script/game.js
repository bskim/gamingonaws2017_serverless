var AWS = nw.require('aws-sdk')
nw.require('amazon-cognito-js')
// initialize AWS sdk to prevent loading environment variables
AWS.config.credentials = new AWS.Credentials('','');
var CONFIG = nw.require("./script/config.json")
var region=CONFIG.region;
var IdentityPoolId= CONFIG.IdentityPoolId;
var score_api_url = CONFIG.score_api_url;
var kakao_user_profile;
var cognito_token;

function login(Token,Id)
{
    AWS.config.region=region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials(
        {
            IdentityPoolId:IdentityPoolId,
            IdentityId: Id,
            region: region,
            Logins:{
                'cognito-identity.amazonaws.com':Token
            }
        }
    )
    AWS.config.credentials.get(function(err){
        if(err) console.log(err)
        else {
            var client = new AWS.CognitoSyncManager()
            client.openOrCreateDataset("gamingonAWS",function(err,dataset){
                if (err) console.log(err)
                dataset.get("KakaoUserProfile",function(err,value){
                    if (err) console.log(err)
                    var svr_kakao_profile; 
                    if (value != undefined) svr_kakao_profile = JSON.parse(value)
                    if (svr_kakao_profile != undefined)
                    {
                       $('#my-signin').append(svr_kakao_profile.properties.nickname)
                       kakao_user_profile = svr_kakao_profile
                    }
                })
            })
        }
    })
    
}

var ctx, c, cw, ch;
var state = -1;
var time = 0;
var score = 0;
var down = false;
var gameMatrix, caveTop, caveHeight, caveDelta, previousPosition, position, velocity, imageData;
var authName ="DefaultUser";
var _table_ = document.createElement('table'),
    _tr_ = document.createElement('tr'),
    _th_ = document.createElement('th'),
    _td_ = document.createElement('td');

// Builds the HTML Table out 
 function buildHtmlTable(arr) {
     var table = _table_.cloneNode(false),
         columns = addAllColumnHeaders(arr, table);
     for (var i=0, maxi=arr.length; i < maxi; ++i) {
         var tr = _tr_.cloneNode(false);
         for (var j=0, maxj=columns.length; j < maxj ; ++j) {
             var td = _td_.cloneNode(false);
                 cellValue = arr[i][columns[j]];
             td.appendChild(document.createTextNode(arr[i][columns[j]] || ''));
             tr.appendChild(td);
         }
         table.appendChild(tr);
     }
     return table;
 }


 function addAllColumnHeaders(arr, table)
 {
     var columnSet = [],
         tr = _tr_.cloneNode(false);
     for (var i=0, l=arr.length; i < l; i++) {
         for (var key in arr[i]) {
             if (arr[i].hasOwnProperty(key) && columnSet.indexOf(key)===-1) {
                 columnSet.push(key);
                 var th = _th_.cloneNode(false);
                 th.appendChild(document.createTextNode(key));
                 tr.appendChild(th);
             }
         }
     }
     table.appendChild(tr);
     return columnSet;
 }
 

$(document).ready(function(){

    //console.log(kakao_user_profile)
    c = document.getElementById("c");
    cw = c.width;
    ch = c.height;
    ctx = c.getContext("2d");
    ctx.font="16px Verdana";
    ctx.lineCap = 'round';
    gameMatrix=[];
    for(var i=0;i<4;i++){
        gameMatrix[i]=new Array(32);
    }
  
    window.setInterval(drawFrame,75);
    $(document).on('mousedown touchstart keydown',function(e){
        down=true;
    }).on('mouseup touchend keyup',function(){
        down=false;
    });
});

function setState(s){
    state = s;
    time = 0;
}

function drawFrame(){
    time++;
    switch(state){
        case -1: // before loggin-in
            if(time==1)
            {
                ctx.fillStyle='green';
                ctx.fillRect(0,0,cw,ch);
                ctx.fillStyle = "white";
                ctx.fillText("Demo Game - SFCave", 20,35);
           
                ctx.fillText("Loging in .. ", 20,300);
                position=180;
                previousPosition=180;
                ctx.strokeStyle="black";
                ctx.lineWidth=3;              
            }
            imageData=ctx.getImageData(0, 80, 256, 200);
            ctx.putImageData(imageData,-8,80);
            
            position=180-Math.sin(time/6)*(45-45*Math.cos(time/18));
            ctx.beginPath();
            ctx.moveTo(170, previousPosition);
            ctx.lineTo(178, position);
            ctx.stroke();
            previousPosition=position;
            
            if ( kakao_user_profile != undefined)
            {
                setState(0);
            }
            else{
            }
            return    
        case 0: // start screen 
            if(time==1){ // first frame
                ctx.fillStyle='green';
                ctx.fillRect(0,0,cw,ch);
                ctx.fillStyle = "white";
                ctx.fillText("Demo Game - SFCave", 20,35);
           
                ctx.fillText("click, touch, or spacebar", 20,300);
                position=180;
                previousPosition=180;
                ctx.strokeStyle="black";
                ctx.lineWidth=3;
            }
            
            imageData=ctx.getImageData(0, 80, 256, 200);
            ctx.putImageData(imageData,-8,80);
            
            position=180-Math.sin(time/6)*(45-45*Math.cos(time/18));
            ctx.beginPath();
            ctx.moveTo(170, previousPosition);
            ctx.lineTo(178, position);
            ctx.stroke();
            previousPosition=position;
            
            if(down){
                setState(1);
            }
            return;
        case 1: // game play
            if(time==1){ // first frame
                score=0;
                caveTop=20;
                caveHeight=260;
                caveDelta=0;
                position=100;
                previousPosition=100;
                velocity=-5;
                for(var col=0; col<32; col++){
                    var cval = Math.floor(20*Math.sin(col/2)+200);
                    ctx.fillStyle="rgb(0,"+cval+",0)";
                    ctx.fillRect(col*8,0,8,300);
                    ctx.fillStyle = "white";
                    ctx.fillRect(col*8,caveTop,8,caveHeight);
                    gameMatrix[0][col] = caveTop;
                    gameMatrix[1][col] = caveTop+caveHeight;
                    gameMatrix[2][col] = -1;
                }
            }
            score+=2;
            if(down){
                velocity--;
            }else{
                velocity++;
            }
            if(velocity<-8){
                velocity=-8;
            }else if(velocity >8){
                velocity=8;
            }
            position+=velocity;
            if(time%10==0){
                caveHeight--;
            }
            if(Math.random() < 0.1){
                caveDelta = Math.floor(Math.random()*10-5);
            }
            caveTop+=caveDelta;
            if(caveTop<10){
                caveTop=10;
                caveDelta=Math.abs(caveDelta);
            }
            if(caveTop>290-caveHeight){
                caveTop=290-caveHeight;
                caveDelta=-Math.abs(caveDelta);
            }
            ctx.fillStyle = "gray";
            ctx.fillRect(0,300,256,30);
            ctx.fillStyle = "white";
            ctx.fillText("score: "+score,5,315);
            
            imageData=ctx.getImageData(0, 0, 256, 300);
            ctx.putImageData(imageData,-8,0);
            
            for(var k1=0; k1 < 31; k1++){
                for(var l1 = 0; l1 < 4; l1++){
                    gameMatrix[l1][k1] = gameMatrix[l1][k1 + 1];
                }
            }
            
            ctx.strokeStyle="blue";
            ctx.lineWidth=6;
            ctx.beginPath();
            ctx.moveTo(60, previousPosition);
            ctx.lineTo(68, position);
            ctx.stroke();
            
            var cval = Math.floor(20*Math.sin(time/2)+200);
            ctx.fillStyle="rgb(0,"+cval+",0)";
            ctx.fillRect(248, 0, 8, 300);
            ctx.fillStyle='white';
            ctx.fillRect(248, caveTop, 8, caveHeight);
            
            gameMatrix[0][31] = caveTop;
            gameMatrix[1][31] = caveTop + caveHeight;
            if(time % 10 == 0)
            {
                var l = Math.floor(Math.random() * (caveHeight - 32) + caveTop);
                ctx.fillStyle="red";
                ctx.fillRect(248, l, 8, 32);
                gameMatrix[2][31] = l;
            }
            else
            {
                gameMatrix[2][31] = -1;
            }
            previousPosition = position;
            if( position < gameMatrix[0][8] ||
                gameMatrix[1][8] < position ||
                (gameMatrix[2][8] != -1 && gameMatrix[2][8] < position && position < gameMatrix[2][8] + 32)){
                setState(2);    
            }
            return;
        case 2: // death screen
            if(time==1){ // first frame
                ctx.strokeStyle = "red";
                ctx.lineWidth=1;
                ctx.fillStyle = "gray";
                ctx.fillRect(0,300,256,30);
                ctx.fillStyle = "white";
                ctx.fillText("score: "+score,5,315);
               				
				var newScore = {
					"username": kakao_user_profile.properties.nickname,
					"score": score
				};
					
				xhr = new XMLHttpRequest();
				
				xhr.open("POST", score_api_url, true);
				xhr.setRequestHeader("Content-type", "application/json");
				xhr.onreadystatechange = function () { 
					if (xhr.readyState == 4 && xhr.status == 200) {
					
						$.get(score_api_url, function(data, status)
						{ 
							document.getElementById('board').innerHTML = '';
							document.getElementById('board').appendChild(buildHtmlTable(data));
						
						});
					}
				}
				var data = JSON.stringify(newScore);
				xhr.send(data);
				
				
				
            }
            
            ctx.beginPath();
        	ctx.arc(68, position, time*4, 0, Math.PI*2, true);
        	ctx.closePath();
        	ctx.stroke();
            
            if(time==15){
                down=false;
                setState(0);
            }
            break;
        default:
            console.log('other');
    }
}

var gui = nw.require('nw.gui')
var scorewin;

//$('#scores').bind('click',function(event){
function scorestats()
{
    if (scorewin != undefined) {
        return
    }
    gui.Window.open("scores.html",{
        position:'center',
        width:975,
        height:520
    },function(win){
        scorewin = win
        //scorewin.show
        
        scorewin.on('loaded',function(){
            this.focus()
        })  
        scorewin.on('closed',function(){
            console.log("scorewin window closed")
            scorewin.close(true)
            scorewin = undefined;
        })
        
    })
}

nw.Window.get().on("close",function(){
    this.hide()
    if (scorewin!=undefined) {
        scorewin.close(true)
        scorewin = undefined
    }
    this.close(true)
})	