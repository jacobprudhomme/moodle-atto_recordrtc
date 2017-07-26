YUI.add("moodle-atto_recordrtc-recording",function(e,t){M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;require(["atto_recordrtc/adapter"],function(e){window.adapter=e}),require(["atto_recordrtc/bowser"],function(e){window.bowser=e}),M.atto_recordrtc.commonmodule={editorScope:null,player:null,startStopBtn:null,uploadBtn:null,countdownSeconds:null,countdownTicker:null,recType:null,stream:null,mediaRecorder:null,chunks:null,blobSize:null,olderMoodle:null,maxUploadSize:null,check_secure:function(){var t=window.location.protocol==="https:"||window.location.host.indexOf("localhost")!==-1;t||(e.use("moodle-core-notification-alert",function(){new M.core.alert({message:M.util.get_string("insecurealert","atto_recordrtc")})}),n.editorScope.closeDialogue(n.editorScope))},check_browser:function(){if(!(window.bowser.firefox&&window.bowser.version>=29||window.bowser.chrome&&window.bowser.version>=49||window.bowser.opera&&window.bowser.version>=36)){e.use("moodle-core-notification-alert",function(){new M.core.alert({message:document.querySelector("div#alert-warning")})});var t=document.querySelector("div#alert-warning");t.parentElement.parentElement.classList.remove("hide")}},capture_user_media:function(e,t,n){navigator.mediaDevices.getUserMedia(e).then(t).catch(n)},handle_data_available:function(t){n.blobSize+=t.data.size,n.blobSize>=n.maxUploadSize&&!localStorage.getItem("alerted")?(localStorage.setItem("alerted","true"),n.startStopBtn.click(),e.use("moodle-core-notification-alert",function(){new M.core.alert({message:M.util.get_string("nearingmaxsize","atto_recordrtc")})})):n.blobSize>=n.maxUploadSize&&localStorage.getItem("alerted")==="true"?localStorage.removeItem("alerted"):n.chunks.push(t.data)},start_recording:function(e,t){var r=null;e==="audio"?MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),mimeType:"audio/webm;codecs=opus"}:MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")&&(r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),mimeType:"audio/ogg;codecs=opus"}):MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=vp9,opus"}:MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")?r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=h264,opus"}:MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")&&(r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=vp8,opus"}),n.mediaRecorder=r?new MediaRecorder(t,r):new MediaRecorder(t),n.mediaRecorder.ondataavailable=n.handle_data_available,n.mediaRecorder.start(1e3),n.player.muted=!0,n.countdownSeconds=n.editorScope.get("timelimit"),n.countdownSeconds++,n.startStopBtn.innerHTML=M.util.get_string("stoprecording","atto_recordrtc"),n.startStopBtn.innerHTML+=' (<span id="minutes"></span>:<span id="seconds"></span>)',n.set_time(),n.countdownTicker=setInterval(n.set_time,1e3),n.startStopBtn.disabled=!1},upload_to_server:function(e,t){var r=new XMLHttpRequest;r.open("GET",n.player.src,!0),r.responseType="blob",r.onload=function(){if(r.status===200){var i=this.response,s=(Math.random()*1e3).toString().replace(".","");e==="audio"?s+="-audio.ogg":s+="-video.webm";var o=new FormData;o.append("contextid",n.editorScope.get("contextid")),o.append("sesskey",n.editorScope.get("sesskey")),o.append(e+"-filename",s),o.append(e+"-blob",i),n.make_xmlhttprequest(n.editorScope.get("recordrtcroot")+"save.php",o,function(e,r){if(e==="upload-ended"){var i=n.editorScope.get("recordrtcroot")+"uploads.php/";return t("ended",i+r)}return t(e)})}},r.send()},make_xmlhttprequest:function(e,t,n){var r=new XMLHttpRequest;r.onreadystatechange=function(){r.readyState===4&&r.status===200?n("upload-ended",r.responseText):r.status===404&&n("upload-failed-404")},r.upload.onprogress=function(e){n(Math.round(e.loaded/e.total*100)+"% "+M.util.get_string("uploadprogress","atto_recordrtc"))},r.upload.onerror=function(e){n("upload-failed",e)},r.upload.onabort=function(e){n("upload-aborted",e)},r.open("POST",e),r.send(t)},pad:function(e){var t=e+"";return t.length<2?"0"+t:t},set_time:function(){n.countdownSeconds--,n.startStopBtn.querySelector("span#seconds").textContent=n.pad(n.countdownSeconds%60),n.startStopBtn.querySelector("span#minutes").textContent=n.pad(parseInt(n.countdownSeconds/60,10)),n.countdownSeconds===0&&n.startStopBtn.click()},create_annotation:function(e,t){var n=window.prompt(M.util.get_string("annotationprompt","atto_recordrtc"),M.util.get_string("annotation:"+e,"atto_recordrtc"));if(!n)return undefined;var r='<a target="_blank" href="'+t+'">'+n+"</a>";return r},insert_annotation:function(e,t){var r=n.create_annotation(e,t);r?n.editorScope.setLink(n.editorScope,r):n.uploadBtn.textContent=M.util.get_string("attachrecording","atto_recordrtc")}},M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;M.atto_recordrtc.audiomodule={init:function(e){n.editorScope=e,n.player=document.querySelector("audio#player"),n.startStopBtn=document.querySelector("button#start-stop"),n.uploadBtn=document.querySelector("button#upload"),n.recType="audio",n.olderMoodle=e.get("oldermoodle"),n.maxUploadSize=parseInt(e.get("maxrecsize").match(/\d+/)[0],10)*Math.pow(1024,2),n.check_secure(),n.check_browser(),n.startStopBtn.onclick=function(){n.startStopBtn.disabled=!0;if(n.startStopBtn.textContent===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.textContent===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.textContent===M.util.get_string("recordingfailed","atto_recordrtc")){var e=document.querySelector("div[id=alert-danger]");e.parentElement.parentElement.classList.add("hide"),n.player.parentElement.parentElement.classList.add("hide"),n.uploadBtn
.parentElement.parentElement.classList.add("hide"),n.olderMoodle||(n.startStopBtn.classList.remove("btn-outline-danger"),n.startStopBtn.classList.add("btn-danger")),n.chunks=[],n.blobSize=0;var t={onMediaCaptured:function(e){n.stream=e,n.startStopBtn.mediaCapturedCallback&&n.startStopBtn.mediaCapturedCallback()},onMediaStopped:function(e){n.startStopBtn.textContent=e},onMediaCapturingFailed:function(e){var n=null;if(e.name==="PermissionDeniedError"&&window.bowser.firefox)InstallTrigger.install({Foo:{URL:"https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/",toString:function(){return this.URL}}}),n=M.util.get_string("startrecording","atto_recordrtc");else if(e.name==="DevicesNotFoundError"||e.name==="NotFoundError"){var r=document.querySelector("div[id=alert-danger]");r.parentElement.parentElement.classList.remove("hide"),r.textContent=M.util.get_string("inputdevicealert_title","atto_recordrtc")+" ",r.textContent+=M.util.get_string("inputdevicealert","atto_recordrtc"),n=M.util.get_string("recordingfailed","atto_recordrtc")}t.onMediaStopped(n)}};M.atto_recordrtc.audiomodule.capture_audio(t),n.startStopBtn.mediaCapturedCallback=function(){n.start_recording(n.recType,n.stream)}}else clearInterval(n.countdownTicker),setTimeout(function(){n.startStopBtn.disabled=!1},1e3),M.atto_recordrtc.audiomodule.stop_recording(n.stream),n.startStopBtn.textContent=M.util.get_string("recordagain","atto_recordrtc"),n.olderMoodle||(n.startStopBtn.classList.remove("btn-danger"),n.startStopBtn.classList.add("btn-outline-danger"))}},capture_audio:function(e){n.capture_user_media({audio:!0},function(t){n.player.srcObject=t,e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(e){n.mediaRecorder.stop(),e.getTracks().forEach(function(e){e.stop()});var t=new Blob(n.chunks,{type:n.mediaRecorder.mimeType});n.player.src=URL.createObjectURL(t),n.player.muted=!1,n.player.controls=!0,n.player.parentElement.parentElement.classList.remove("hide"),n.uploadBtn.parentElement.parentElement.classList.remove("hide"),n.uploadBtn.textContent=M.util.get_string("attachrecording","atto_recordrtc"),n.uploadBtn.disabled=!1,n.uploadBtn.onclick=function(){return!n.player.src||n.chunks===[]?window.alert(M.util.get_string("norecordingfound","atto_recordrtc")):(n.uploadBtn.disabled=!0,n.upload_to_server(n.recType,function(e,t){e==="ended"?(n.uploadBtn.disabled=!1,n.insert_annotation(n.recType,t)):e==="upload-failed"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadfailed","atto_recordrtc")+" "+t):e==="upload-failed-404"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadfailed404","atto_recordrtc")):e==="upload-aborted"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadaborted","atto_recordrtc")+" "+t):n.uploadBtn.textContent=e}),undefined)}}},M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;M.atto_recordrtc.videomodule={init:function(e){n.editorScope=e,n.player=document.querySelector("video#player"),n.startStopBtn=document.querySelector("button#start-stop"),n.uploadBtn=document.querySelector("button#upload"),n.recType="video",n.olderMoodle=e.get("oldermoodle"),n.maxUploadSize=parseInt(e.get("maxrecsize").match(/\d+/)[0],10)*Math.pow(1024,2),n.check_secure(),n.check_browser(),n.startStopBtn.onclick=function(){n.startStopBtn.disabled=!0;if(n.startStopBtn.textContent===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.textContent===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.textContent===M.util.get_string("recordingfailed","atto_recordrtc")){var e=document.querySelector("div[id=alert-danger]");e.parentElement.parentElement.classList.add("hide"),n.uploadBtn.parentElement.parentElement.classList.add("hide"),n.olderMoodle||(n.startStopBtn.classList.remove("btn-outline-danger"),n.startStopBtn.classList.add("btn-danger")),n.chunks=[],n.blobSize=0;var t={onMediaCaptured:function(e){n.stream=e,n.startStopBtn.mediaCapturedCallback&&n.startStopBtn.mediaCapturedCallback()},onMediaStopped:function(e){n.startStopBtn.textContent=e},onMediaCapturingFailed:function(e){var n=null;if(e.name==="PermissionDeniedError"&&window.bowser.firefox)InstallTrigger.install({Foo:{URL:"https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/",toString:function(){return this.URL}}}),n=M.util.get_string("startrecording","atto_recordrtc");else if(e.name==="DevicesNotFoundError"||e.name==="NotFoundError"){var r=document.querySelector("div[id=alert-danger]");r.parentElement.parentElement.classList.remove("hide"),r.textContent=M.util.get_string("inputdevicealert","atto_recordrtc")+" ",r.textContent+=M.util.get_string("inputdevicealert","atto_recordrtc"),n=M.util.get_string("recordingfailed","atto_recordrtc")}t.onMediaStopped(n)}};n.player.parentElement.parentElement.classList.remove("hide"),n.player.controls=!1,M.atto_recordrtc.videomodule.capture_audio_video(t),n.startStopBtn.mediaCapturedCallback=function(){n.start_recording(n.recType,n.stream)}}else clearInterval(n.countdownTicker),setTimeout(function(){n.startStopBtn.disabled=!1},1e3),M.atto_recordrtc.videomodule.stop_recording(n.stream),n.startStopBtn.textContent=M.util.get_string("recordagain","atto_recordrtc"),n.olderMoodle||(n.startStopBtn.classList.remove("btn-danger"),n.startStopBtn.classList.add("btn-outline-danger"))}},capture_audio_video:function(e){n.capture_user_media({audio:!0,video:{width:{ideal:640},height:{ideal:480}}},function(t){n.player.srcObject=t,n.player.play(),e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(e){n.mediaRecorder.stop(),e.getTracks().forEach(function(e){e.stop()});var t=new Blob(n.chunks,{type:n.mediaRecorder.mimeType});n.player.src=URL.createObjectURL(t),n.player.muted=!1,n.player.controls=!0,n.uploadBtn.parentElement.parentElement.classList.remove("hide"),n.uploadBtn.textContent=M.util.get_string("attachrecording","atto_recordrtc"),n.uploadBtn.disabled=!1
,n.uploadBtn.onclick=function(){return!n.player.src||n.chunks===[]?window.alert(M.util.get_string("norecordingfound","atto_recordrtc")):(n.uploadBtn.disabled=!0,n.upload_to_server(n.recType,function(e,t){e==="ended"?(n.uploadBtn.disabled=!1,n.insert_annotation(n.recType,t)):e==="upload-failed"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadfailed","atto_recordrtc")+" "+t):e==="upload-failed-404"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadfailed404","atto_recordrtc")):e==="upload-aborted"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadaborted","atto_recordrtc")+" "+t):n.uploadBtn.textContent=e}),undefined)}}}},"@VERSION@",{requires:["moodle-atto_recordrtc-button"]});
