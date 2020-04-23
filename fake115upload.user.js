// ==UserScript==
// @author       T3rry
// @name         115一键转存
// @namespace    Fake115Upload
// @version      1.3.4
// @description  115文件一键转存
// @match        https://115.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_log
// @connect      proapi.115.com
// @connect      webapi.115.com
// @connect      115.com
// @require      https://cdn.bootcss.com/jsSHA/2.3.1/sha1.js
// @require      https://greasyfork.org/scripts/5392-waitforkeyelements/code/WaitForKeyElements.js?version=115012
// ==/UserScript==

(function() {
    'use strict';

    var str=document.URL;
    var hProtocol="115://";
    waitForKeyElements("div.file-opr", AddShareSHA1Btn);
    waitForKeyElements("div.dialog-bottom", AddDownloadSha1Btn);

    function PostData(dict) {
        var k, tmp, v;
        tmp = [];
        for (k in dict) {
            v = dict[k];
            tmp.push(k + "=" + v);
        }
        return tmp.join('&');
    };

    function UrlData(dict) {
        var k, tmp, v;
        tmp = [];
        for (k in dict) {
            v = dict[k];
            tmp.push((encodeURIComponent(k)) + "=" + (encodeURIComponent(v)));
        }
        return tmp.join('&');
    };

    function GetSig(userid, fileid, target, userkey) {
        var sha1, tmp;
        sha1 = new jsSHA('SHA-1', 'TEXT');
        sha1.update("" + userid + fileid + fileid+target + "0");
        tmp = sha1.getHash('HEX');
        sha1 = new jsSHA('SHA-1', 'TEXT');
        sha1.update("" + userkey + tmp + "000000");
        return sha1.getHash('HEX', {
            outputUpper: true
        });
    }
        function test(info,flag)
    {
        if(info==false){
            alert("请选择正确的文件");
            return;
        }

        GetShareLink(info,flag);
    }
 function CreateShareLink(url,info,flag){

        var pre_buff=null;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Range": "bytes=0-154112"
            },
            responseType: 'arraybuffer',
            onload: function(response,shalink) {
                if (response.status === 206) {
                    pre_buff = response.response;

                    try
                    {
                        var data= new Uint8Array(pre_buff);
                        var sha1 = new jsSHA('SHA-1', 'ARRAYBUFFER');
                        sha1.update(data.slice(0, 128 * 1024));
                        var preid = sha1.getHash('HEX', {
                            outputUpper: true
                        });
                        console.log(hProtocol+info[0]+'|'+preid);
                        if(flag){
                            var link= prompt("复制分享链接到剪贴板",hProtocol+info[0]+'|'+preid);
                        }

                    }
                    catch(err)
                    {
                        alert(err);
                    }
                } else {

                    return GM_log("response.status = " + response.status);
                }
            }
        });

    }
    function GetShareLink(info,flag)
    {
        var download_info=null;

        GM_xmlhttpRequest({
            method: "GET",
            url: 'http://webapi.115.com/files/download?pickcode='+info[1],
            responseType: 'json',
            onload: function(response) {
                if (response.status === 200) {
                    download_info = response.response;
                    try
                    {

                        CreateShareLink(download_info.file_url,info,flag);

                    }
                    catch(err)
                    {
                        alert('请先登录115');
                    }
                } else {

                    return GM_log("response.status = " + response.status);
                }
            }
        });

    }
    function  DownLoadFileFromSha1Links(links)
    {
       // console.log(links);
        if (links=="")
        {
            alert("链接不能为空");
            return;
        }
        var uploadinfo=null;
        var cid=0;
        GM_xmlhttpRequest({
            method: "GET",
            url: 'http://proapi.115.com/app/uploadinfo',
            responseType: 'json',
            onload: function(response) {
                if (response.status === 200) {
                    uploadinfo = response.response;
                    //  alert(uploadinfo.user_id+'|'+uploadinfo.userkey);
                    try
                    {

                        var lines=links.split(/\r?\n/);
                        lines.forEach(function (line) {


                            if (line.trim()=="")
                            {
                              return;
                            }
                            var nsf=line.split('|');

                           if(nsf[0].substring(0,6)==hProtocol)
                            {
                                nsf[0]=nsf[0].substring(6);
                            }
                            if(nsf[0]!='' && nsf[1]!='' && nsf[2]!=''&& nsf[3]!=''&&nsf[2].length==40&&nsf[3].length==40)
                            {

                               DownFileBySha1JS(uploadinfo.userkey,uploadinfo.user_id,nsf[0],nsf[1],nsf[2],nsf[3]);



                            }

                            else
                            {
                                alert("链接格式错误!");
                            }

                        });



                    }
                    catch(err)
                    {
                        alert('请先登录115'+err);
                    }
                } else {

                    return GM_log("response.status = " + response.status);
                }

            }
        });
    }

    function DownFileBySha1JS(userkey,user_id,filename,filesize,fileid,preid)
    {
       GM_xmlhttpRequest({
            method: 'POST',
            url: 'http://uplb.115.com/3.0/initupload.php?' + UrlData({
                isp: 0,
                appid: 0,
                appversion: '12.2.0',
                format: 'json',
                sig: GetSig(user_id, fileid, 'U_1_0', userkey),

            }),
            data: PostData({
                preid: preid,
                fileid: fileid,
                quickid:fileid,
                app_ver: '12.2.0',
                filename: filename,
                filesize: filesize,
                exif:'',
                target: 'U_1_0',
                userid:user_id

            }),
            responseType: 'json',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            onload: function(response) {
                if (response.status === 200) {

                    if (response.response.status === 2) {
                        return console.log(''+filename+' 转存成功！');
                    } else {
                        return console.log(''+filename+' 转存失败！');
                    }
                } else {
                    return GM_log("response.status = " + response.status);
                }
            }
        });
    }
    function GetSha1LinkByliNode(liNode)
    {
        var type=(liNode.getAttribute("file_type"));
        if(type=="0")
        {
            var fid  = liNode.getAttribute('cate_id');
            return false;
        }
        else
        {
            var filename  = liNode.getAttribute('title');
            var filesize =liNode.getAttribute('file_size');
            var sha1 =liNode.getAttribute('sha1');
            var pickcode=liNode.getAttribute('pick_code');
            return [filename+'|'+filesize+'|'+sha1, pickcode];
        }
    }
    function AddDownloadSha1Btn(jNode)
    {   if (document.getElementById('downsha1')==null){
        var id=document.createElement('div');
        id.setAttribute('class','con');
        id.setAttribute('id','downsha1');
        var ia=document.createElement('a');
        ia.setAttribute('class','button');
        ia.setAttribute('href','javascript:;');
        var inode=document.createTextNode("转存");
        ia.appendChild(inode);
        id.appendChild(ia);
        jNode[0].appendChild(id);
        id.addEventListener('click', function (e) {
            var links= document.getElementById('js_offline_new_add').value
            DownLoadFileFromSha1Links(links);

           (document.getElementsByClassName('close')[2].click());


        })
    }

    }
       function AddShareSHA1Btn(jNode)
    {
        var parentNode=jNode[0].parentNode;
        var sha1Link=GetSha1LinkByliNode(parentNode);
        var aclass=document.createElement('a');
        aclass.addEventListener('click', function (e) {
            test(sha1Link,true);

        })


        var iclass=document.createElement('i');

        var ispan=document.createElement('span');

        var node=document.createTextNode("分享SHA1");

        ispan.appendChild(node);

        aclass.appendChild(iclass);
        aclass.appendChild(ispan);
        jNode[0].appendChild(aclass);

    }

})();
