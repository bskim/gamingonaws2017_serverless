
var gui = require('nw.gui')
var gamewin;
var path = nw.require('path')
var os = nw.require('os')
var AWS = nw.require('aws-sdk')
var download = nw.require('download-file')
//var output = $('#output')
var kakao_token;
var kakao_user_profile;
var expires_in;
var files;
var CONFIG = nw.require("./script/config.json")
var bucketname=CONFIG.bucketname;
var uploadprefix=CONFIG.uploadprefix;
var region=CONFIG.region;
var api_url=CONFIG.api_url;
var cf_distribution_id = CONFIG.cloudfrontDistributionId;
var cf_url = CONFIG.cloudfrontURL;
var IdentityPoolId= CONFIG.IdentityPoolId;
var resourcepath = nw.__dirname + path.sep + "resources" + path.sep
var patchpath = nw.__dirname + path.sep + "patch" + path.sep
var dir = nw.require('node-dir')
var fs = nw.require('fs')
nw.require('amazon-cognito-js')
var cognito_token;
var cognito_id;

// initialize AWS sdk to prevent loading environment variables
AWS.config.credentials = new AWS.Credentials('','');
var s3;
var cf;
var cognitoSync;

var md5file = nw.require('md5-file')
var filedb = resourcepath+"filedb.db"
var filedb_patch = patchpath+"filedb.db"
var filedb_stripped_path= filedb.replace(resourcepath,'').split(path.sep).join('/')
var filedb_patch_stripped_path= filedb_patch.replace(patchpath,'').split(path.sep).join('/')
db ={};
db.file_to_upload = new Map();
db.file_to_download= new Map();
db.localfiledb = undefined; 
db.localfiledb_patch = undefined; 
db.localfiledb_tmp = undefined;


var asyncLoop = require('node-async-loop')

$('#output').append(`You are running on ${os.platform()}<br/>`)

function cognitoSyncUpdate(dataset_base,key,value_to_update)
{
    if (cognitoSync == undefined)
    {
        console.log("cognitoSync was not initialized.. login first")
        
    }else{
        cognitoSync.openOrCreateDataset(dataset_base,function(err,dataset){
            dataset.get(key,function(err,value){
                if (err) console.log(err)
                var svr_kakao_profile; 
                if (value != undefined) svr_kakao_profile = JSON.parse(value)
                if (svr_kakao_profile != undefined)
                {
                    //compare svr_kakao_profile
                    console.log(svr_kakao_profile)
                    if (svr_kakao_profile.id != kakao_user_profile.id)
                    {
                        console.log("kakao profile id mismatch....")
                    }
                }
                dataset.put(key,value_to_update,function(err,record){
                    if (err) console.log(err)
                    console.log(record)
                    dataset.synchronize({
                        onSuccess: function(dataset,newRecords){
                            console.log(newRecords)
                        },
                        onFailure: function(err){
                            console.log(err)
                        },
                        onConflict: function(dataset, conflicts, callback) {
                            
                            console.log(conflicts)
                            var resolved = [];
                            
                            for (var i=0; i<conflicts.length; i++) {
                    
                            // Take remote version.
                            resolved.push(conflicts[i].resolveWithRemoteRecord());
                    
                            // Or... take local version.
                            // resolved.push(conflicts[i].resolveWithLocalRecord());
                    
                            // Or... use custom logic.
                            // var newValue = conflicts[i].getRemoteRecord().getValue() + conflicts[i].getLocalRecord().getValue();
                            // resolved.push(conflicts[i].resolveWithValue(newValue);
                    
                            }
                    
                            dataset.resolve(resolved, function() {
                                return callback(true);
                            });
                    
                            // Or... callback false to stop the synchronization process.
                            // return callback(false);
                    
                        },
                        onDatasetDeleted: function(dataset, datasetName, callback) {
                            
                            // Return true to delete the local copy of the dataset.
                            // Return false to handle deleted datasets outsid ethe synchronization callback.
                    
                            return callback(true);
            
                        },
                    
                        onDatasetsMerged: function(dataset, datasetNames, callback) {
                    
                            // Return true to continue the synchronization process.
                            // Return false to handle dataset merges outside the synchroniziation callback.
                    
                            return callback(false);
                    
                        }
                    
                    })
                })
            })
        })
    }
}

$(window).on('message',  function(e){
    console.log(e.originalEvent.data);
    //output = $('#output')
    //output.text(output.text()+`\n ${JSON.stringify(e.originalEvent.data)}`)
    data = e.originalEvent.data
    switch ( data.msg_key )
    {
        case "kakao_token":
        {
            kakao_token = data.val.access_token;
            expires_in = data.val.expires_in;
            break;
        }
        case "kakao_user_profile":
        {
            kakao_user_profile = data.val;
            console.log(kakao_user_profile.id)
            var api_gw_req = api_url+"?id="+kakao_user_profile.id+"&access_token=" + kakao_token + "&expires_in=" + expires_in;
            $.getJSON(api_gw_req, function(json){
                console.log(json.Token)
                AWS.config.region=region;
                AWS.config.credentials = new AWS.CognitoIdentityCredentials(
                    {
                        IdentityPoolId:IdentityPoolId,
                        IdentityId: json.IdentityId,
                        region: region,
                        Logins:{
                            'cognito-identity.amazonaws.com':json.Token
                        }
                    }
                    
                )
                cognito_token = json.Token
                cognito_id =json.IdentityId
                AWS.config.credentials.get(function(err){
                    if(err) console.log(err)
                    else {
                        console.log(AWS.config.credentials)  
                        // create service object with given credentials.
                        s3 = new AWS.S3({region:region})
                        cf = new AWS.CloudFront()
                        $('#output').append(`You logged in as : KAKAO: ${kakao_user_profile.properties.nickname}<br/>`)
                        cognitoSync = new AWS.CognitoSyncManager()
                        cognitoSyncUpdate("gamingonAWS","KakaoUserProfile",JSON.stringify(kakao_user_profile))

                    }
                })

            });

            break;                      
        }
        default:
        {
            console.log(`unhandled message: ${data.msg_key}`)
        }
    }
})

function updateVersionInfo(path, json)
{
    fs.writeFileSync(path,json,"utf8")
}

function readVersionInfo(path)
{
    if ( !fs.existsSync(path)){
        return undefined
    }else{
        var obj = JSON.parse(fs.readFileSync(path,'utf8'))
        return obj
    }
}

function mapToJson(map){
    return JSON.stringify([...map])
}

function jsonTomap(jsonStr){
    return new Map(JSON.parse(jsonStr))
}

function updateFileDBtoS3andInvaldiateCF()
{
    var json = mapToJson(db.localfiledb_patch)
    updateVersionInfo(filedb_patch,json)        
    var filekey = uploadprefix+"/"+ filedb_patch_stripped_path
    s3.putObject({
        Key: filekey,
        Body: fs.createReadStream(filedb_patch),
        Bucket: bucketname
    },function(err,data){
        if (err){
            console.log("upload error:", arguments)
        }else{
            var version_id = data.VersionId
            var obj = readVersionInfo(patchpath+"version.json")
            if ( obj != undefined)
            {
                obj.s3_versionid = version_id
                updateVersionInfo(patchpath+"version.json", JSON.stringify(obj))
                s3.putObject(
                    {
                        Key: uploadprefix+"/version.json",
                        Body: fs.createReadStream(patchpath+"version.json"),
                        Bucket: bucketname
                    },
                    function (err,data){
                        if(err){
                            console.log("upload error:",arguments)
                        }else{
                            var params={
                                DistributionId: cf_distribution_id,
                                InvalidationBatch:{
                                    CallerReference:new Date().getTime().toString(),
                                    Paths:{
                                        Quantity: 1,
                                        Items:["/"+uploadprefix+"/version.json"]
                                    }
                                }
                            }
                            cf.createInvalidation(params,function(err,data)
                            {
                                if (err)
                                {
                                    console.log(err)
                                }else{
                                    console.log(data)
                                    cf.waitFor("invalidationCompleted",
                                    {
                                        DistributionId: cf_distribution_id,
                                        Id: data.Id
                                    },function(err,data){
                                        if(err){
                                            console.log(err)
                                        }else{
                                            console.log(data)
                                            $('#output').append("cloudfront invalidation complete<br/>")
                                            //alert("cloudfront invalidation complete")
                                        }
                                    })
                                }
                            })

                        }
                    }
                )

            }

        }
    })

}
function chooseFile(name){
    var chooser = $(name);
    chooser.unbind('change')
    chooser.change(function(evt){
        console.log($(this).val())
        //output.text(output.text()+`\n You chose ${$(this).val()}`)
        files = $(this).val()
    })
    chooser.trigger('click')
}

$('#filebutton').bind('click',function(event)
{
    chooseFile('#fileDialog')
})

$('#kakao-login').bind('click',function(event)
{
    var iframewindow = document.getElementById("oauthlogin")
    iframewindow.contentWindow.postMessage("kakao_login","*")
})    

$('#checkfiles').bind('click',function(event){
    dir.files(patchpath, function(err,files){
        asyncLoop(files, function(item,next){
            var stripped_path= item.replace(patchpath,'')
            var filepath = stripped_path.split(path.sep).join('/')
            var hash = md5file.sync(item)
            if (item == filedb_patch || item == patchpath+"version.json")
            {
                //skip filedb itself
                next()
            }
            else{
                
                if ( db.localfiledb_patch == undefined) {
                    var json = readVersionInfo(filedb_patch)
                    if ( json == undefined)
                    {
                        // no patchfile exist
                        console.log("no local patch db .. creating")
                        db.localfiledb_patch = new Map()
                    }else{
                        db.localfiledb_patch = new Map(json)
                    }
                }
                var obj = db.localfiledb_patch.get(filepath)
                if (obj == undefined){
                    db.localfiledb_patch.set(filepath,{
                        checksum: hash,
                        version: 0,
                        s3_versionid: ''                            
                    })
                    db.file_to_upload.set(item,0)
                }else{
                    if( hash!= obj.checksum)
                    {
                        db.localfiledb_patch.set(filepath,{
                            checksum: hash,
                            version: obj.version+1,
                            s3_versionid: obj.s3_versionid
                        })
                        db.file_to_upload.set(item,0)
                    }
                    
                }
                next();
            }    
        },function(err){
            if (err){
                console.log(err)
                return
            }
            console.log("Finished")
            //console.log(uneval([...db.localfiledb_patch]))
            if (db.file_to_upload.size== 0)
            {
                alert("nothing changed")
            }else
            {
                var obj =  readVersionInfo(patchpath+"version.json")
                if ( obj == undefined)
                {
                    updateVersionInfo(patchpath+"version.json",JSON.stringify({version:0,filedb:filedb_stripped_path,s3_versionid:0}))
                }else{
                    obj.version = obj.version+1
                    updateVersionInfo(patchpath+"version.json",JSON.stringify(obj))
                }
                $('#output').append(`${db.file_to_upload.size} files(s) updated. To deploy, click upload button<br/>`)
                //alert(`${db.file_to_upload.size} file(s) are updated. To deploy them, click upload button`)
            }
        })

    })
})

var idx=0;
function fileupload(value,key,map){
    var stripped_path= key.replace(patchpath,'')
    var filepath = stripped_path.split(path.sep).join('/')
    var filekey = uploadprefix+"/"+ stripped_path.split(path.sep).join('/')
    
    if (filepath == filedb_stripped_path || filepath == "version.json"){
        return
    } else{
        s3.putObject({
            Key: filekey,
            Body: fs.createReadStream(key),
            Bucket: bucketname
        },function(err,data){
            if (err){
                console.log("upload error:", arguments)
            }else{
                console.log(data)
                
                var version_id = data.VersionId;
                var obj = db.localfiledb_patch.get(filepath)
                db.localfiledb_patch.set(filepath,{
                    checksum: obj.checksum,
                    version: obj.version,
                    s3_versionid: version_id                        
                })
                if (idx == db.file_to_upload.size - 1){
                    //console.log("finished to upload:")
                    $('#output').append(`${idx+1} files(s) uploaded to S3. Please wait till cloudfront invalidation for version.json<br/>`)
                    
                    idx = 0;
                    db.file_to_upload.clear()
                    //updateVersionInfo(filedb_patch, mapToJson(db.localfiledb_patch))
                    updateFileDBtoS3andInvaldiateCF()
                }
                idx++

            }
        })
    }
}

$('#upload').bind('click',function(event){
    //console.log(AWS.config.credentials)
    if ( kakao_user_profile == undefined) {
        alert("Please login first")
        return
    }
    if ( db.file_to_upload.size == 0 ){
        alert("there is no file to upload, check upadted files first")
        return
    }
    idx= 0;
    db.file_to_upload.forEach(fileupload)
})

function filedownload(value,key,map){

    var url = cf_url+"update/"+key +"?versionId="+value.s3_versionid
    var path_obj = key.split("/")
    var pure_filename = path_obj[path_obj.length - 1]
    var pure_path = key.replace(pure_filename,"").split("/").join(path.sep)
    
    var options = {
        directory: resourcepath+pure_path,
        filename: pure_filename
    }
        
    download(url,options,function(err){
        if(err) console.log(err)
        
        if( idx == db.file_to_download.size - 1){
            $('#output').append(`${idx+1} files(s) are updated from cloudfront.<br/>`)
            //console.log("download finished)")
            idx = 0;
            db.file_to_download.clear()
            
        }else
        {
            idx++
        }
        
    })  
    
}

function compareFiles(value,key,map){
    var obj = db.localfiledb.get(key)
    // didn't handle deleted files...
    if ( obj == undefined)
    {
        //new file
        db.file_to_download.set(key,value)
    }
    else if ( obj.version < value.version )
    {
        //updated file
        db.file_to_download.set(key,value)
    }
    
    if ( idx == db.localfiledb_tmp.size - 1){
        console.log("comparing finished")
        idx = 0;
        db.file_to_download.forEach(filedownload)
        updateVersionInfo(filedb,mapToJson(db.localfiledb_tmp))
    }else
    {
        idx++
    }
    
}

$('#update').bind('click',function(event){
    var obj = readVersionInfo(resourcepath+"version.json")
    var json;
    $.ajax({
        cache: false,
        async: false,
        url: cf_url+"update/version.json",
        success: function(data){
            json = JSON.parse(data)
            console.log(json)
            
            if ( obj == undefined){
                // no local version
                $('#output').append('update found. start downloading<br/>')
                console.log("no local version full download")
                $.ajax({
                    cache: false,
                    async: false,
                    url: cf_url+"update/"+json.filedb+"?versionId="+json.s3_versionid,
                    success: function(data){
                        var json2 = JSON.parse(data)
                        db.localfiledb = new Map(json2)
                        db.file_to_download.clear()
                        db.file_to_download = new Map(json2)
                        idx = 0;
                        db.file_to_download.forEach(filedownload)
                        updateVersionInfo(resourcepath+"version.json",JSON.stringify(json))
                        updateVersionInfo(filedb,mapToJson(db.localfiledb))
                    }
                });
            }else{
                if (json.version > obj.version){
                    console.log("update exist")
                    $('#output').append('update found. start downloading<br/>')
    
                    
                    $.ajax({
                        cache: false,
                        async: false,
                        url: cf_url+"update/"+json.filedb+"?versionId="+json.s3_versionid,
                        success: function(data){
                            var json2 = JSON.parse(data)
                            db.file_to_download.clear()
                            db.localfiledb_tmp = new Map(json2)
                            var json3 = readVersionInfo(filedb)
                            db.localfiledb = new Map(json3)
                            idx = 0;
                            db.localfiledb_tmp.forEach(compareFiles)
                            updateVersionInfo(resourcepath+"version.json",JSON.stringify(json))
                        }
    
                    })
    
                }else if ( json.version == obj.version)
                {
                    //console.log("no updates")
                    $('#output').append('no update found.<br/>')
                    
                }else{
                    console.log("error")
                }
    
            }                
        },
        error: function(err){
            console.log(err)
        }
    });


})

$('#launch').bind('click',function(event){
    if ( cognito_token == undefined )
    {
        alert("not logged in. login first")
    }else{
        if (gamewin != undefined) {
            gamewin.show()
            return
        }
        gui.Window.open("game.html",{
            position:'center',
            width:270,
            height:780
        },function(win){
            gamewin = win
            //gamewin.show
            
            gamewin.on('loaded',function(){
                //gamewin.window.cognito_token = cognito_token
                gamewin.eval(null,'login("'+cognito_token+'","'+cognito_id+'")')
                this.focus()
            })  
            gamewin.on('closed',function(){
                console.log("game window closed")
                gamewin.close(true)
                gamewin = undefined;
            })
            
        })
    }
})

nw.Window.get().on("close",function(){
    this.hide()
    if (gamewin!=undefined) 
    {
        gamewin.close(true)
        gamewin = undefined
    }
    this.close(true)
})
    




