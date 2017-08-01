YUI.add("moodle-atto_recordrtc-recording",function(e,t){M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;require(["atto_recordrtc/adapter"],function(e){window.adapter=e}),require(["atto_recordrtc/bowser"],function(e){window.bowser=e}),M.atto_recordrtc.commonmodule={editorScope:null,alertWarning:null,alertDanger:null,player:null,playerDOM:null,startStopBtn:null,uploadBtn:null,countdownSeconds:null,countdownTicker:null,recType:null,stream:null,mediaRecorder:null,chunks:null,blobSize:null,olderMoodle:null,maxUploadSize:null,check_secure:function(){var e=window.location.protocol==="https:"||window.location.host.indexOf("localhost")!==-1;e||n.alertDanger.ancestor().ancestor().removeClass("hide")},check_browser:function(){window.bowser.firefox&&window.bowser.version>=29||window.bowser.chrome&&window.bowser.version>=49||window.bowser.opera&&window.bowser.version>=36||n.alertWarning.ancestor().ancestor().removeClass("hide")},capture_user_media:function(e,t,n){window.navigator.mediaDevices.getUserMedia(e).then(t).catch(n)},handle_data_available:function(t){n.blobSize+=t.data.size,n.blobSize>=n.maxUploadSize&&!window.localStorage.getItem("alerted")?(window.localStorage.setItem("alerted","true"),n.startStopBtn.simulate("click"),e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("nearingmaxsize_title","atto_recordrtc"),message:M.util.get_string("nearingmaxsize","atto_recordrtc")})})):n.blobSize>=n.maxUploadSize&&window.localStorage.getItem("alerted")==="true"?window.localStorage.removeItem("alerted"):n.chunks.push(t.data)},start_recording:function(e,t){var r=null;e==="audio"?window.MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),mimeType:"audio/webm;codecs=opus"}:window.MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")&&(r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),mimeType:"audio/ogg;codecs=opus"}):window.MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=vp9,opus"}:window.MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")?r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=h264,opus"}:window.MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")&&(r={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=vp8,opus"}),n.mediaRecorder=r?new window.MediaRecorder(t,r):new window.MediaRecorder(t),n.mediaRecorder.ondataavailable=n.handle_data_available,n.mediaRecorder.start(1e3),n.player.set("muted",!0),n.countdownSeconds=n.editorScope.get("timelimit"),n.countdownSeconds++;var i=M.util.get_string("stoprecording","atto_recordrtc");i+=' (<span id="minutes"></span>:<span id="seconds"></span>)',n.startStopBtn.setHTML(i),n.set_time(),n.countdownTicker=window.setInterval(n.set_time,1e3),n.startStopBtn.set("disabled",!1)},upload_to_server:function(e,t){var r=new window.XMLHttpRequest;r.open("GET",n.player.get("src"),!0),r.responseType="blob",r.onload=function(){if(r.status===200){var i=this.response,s=(Math.random()*1e3).toString().replace(".","");e==="audio"?s+="-audio.ogg":s+="-video.webm";var o=new window.FormData;o.append("contextid",n.editorScope.get("contextid")),o.append("sesskey",n.editorScope.get("sesskey")),o.append(e+"-filename",s),o.append(e+"-blob",i),n.make_xmlhttprequest(n.editorScope.get("recordrtcroot")+"save.php",o,function(e,r){if(e==="upload-ended"){var i=n.editorScope.get("recordrtcroot")+"uploads.php/";return t("ended",i+r)}return t(e)})}},r.send()},make_xmlhttprequest:function(e,t,n){var r=new window.XMLHttpRequest;r.onreadystatechange=function(){r.readyState===4&&r.status===200?n("upload-ended",r.responseText):r.status===404&&n("upload-failed-404")},r.upload.onprogress=function(e){n(Math.round(e.loaded/e.total*100)+"% "+M.util.get_string("uploadprogress","atto_recordrtc"))},r.upload.onerror=function(e){n("upload-failed",e)},r.upload.onabort=function(e){n("upload-aborted",e)},r.open("POST",e),r.send(t)},pad:function(e){var t=e+"";return t.length<2?"0"+t:t},set_time:function(){n.countdownSeconds--,n.startStopBtn.one("span#seconds").set("textContent",n.pad(n.countdownSeconds%60)),n.startStopBtn.one("span#minutes").set("textContent",n.pad(window.parseInt(n.countdownSeconds/60,10))),n.countdownSeconds===0&&n.startStopBtn.simulate("click")},create_annotation:function(e,t){var n=window.prompt(M.util.get_string("annotationprompt","atto_recordrtc"),M.util.get_string("annotation:"+e,"atto_recordrtc"));if(!n)return undefined;var r='<a target="_blank" href="'+t+'">'+n+"</a>";return r},insert_annotation:function(e,t){var r=n.create_annotation(e,t);r?n.editorScope.setLink(n.editorScope,r):n.uploadBtn.set("textContent",M.util.get_string("attachrecording","atto_recordrtc"))}},M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;M.atto_recordrtc.audiomodule={init:function(t){n.editorScope=t,n.alertWarning=e.one("div#alert-warning"),n.alertDanger=e.one("div#alert-danger"),n.player=e.one("audio#player"),n.playerDOM=document.querySelector("audio#player"),n.startStopBtn=e.one("button#start-stop"),n.uploadBtn=e.one("button#upload"),n.recType="audio",n.olderMoodle=t.get("oldermoodle"),n.maxUploadSize=window.parseInt(t.get("maxrecsize").match(/\d+/)[0],10)*Math.pow(1024,2),n.check_secure(),n.check_browser(),n.startStopBtn.on("click",function(){n.startStopBtn.set("disabled",!0);if(n.startStopBtn.get("textContent")===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordingfailed","atto_recordrtc")){n.player.ancestor().ancestor().addClass("hide"),n.uploadBtn.ancestor().ancestor().addClass
("hide"),n.olderMoodle||n.startStopBtn.replaceClass("btn-outline-danger","btn-danger"),n.chunks=[],n.blobSize=0;var t={onMediaCaptured:function(e){n.stream=e,n.start_recording(n.recType,n.stream)},onMediaStopped:function(e){n.startStopBtn.set("textContent",e),n.startStopBtn.set("disabled",!1),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")},onMediaCapturingFailed:function(r){var i=M.util.get_string("recordingfailed","atto_recordrtc");switch(r.name){case"AbortError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumabort_title","atto_recordrtc"),message:M.util.get_string("gumabort","atto_recordrtc")})}),t.onMediaStopped(i);break;case"NotAllowedError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumnotallowed_title","atto_recordrtc"),message:M.util.get_string("gumnotallowed","atto_recordrtc")})}),t.onMediaStopped(i);break;case"NotFoundError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumnotfound_title","atto_recordrtc"),message:M.util.get_string("gumnotfound","atto_recordrtc")})}),t.onMediaStopped(i);break;case"NotReadableError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumnotreadable_title","atto_recordrtc"),message:M.util.get_string("gumnotreadable","atto_recordrtc")})}),t.onMediaStopped(i);break;case"OverConstrainedError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumoverconstrained_title","atto_recordrtc"),message:M.util.get_string("gumoverconstrained","atto_recordrtc")})}),t.onMediaStopped(i);break;case"SecurityError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumsecurity_title","atto_recordrtc"),message:M.util.get_string("gumsecurity","atto_recordrtc")})}),n.editorScope.closeDialogue(n.editorScope);break;case"TypeError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumtype_title","atto_recordrtc"),message:M.util.get_string("gumtype","atto_recordrtc")})}),t.onMediaStopped(i);break;default:}}};M.atto_recordrtc.audiomodule.capture_audio(t)}else window.clearInterval(n.countdownTicker),window.setTimeout(function(){n.startStopBtn.set("disabled",!1)},1e3),M.atto_recordrtc.audiomodule.stop_recording(n.stream),n.startStopBtn.set("textContent",M.util.get_string("recordagain","atto_recordrtc")),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")})},capture_audio:function(e){n.capture_user_media({audio:!0},function(t){n.playerDOM.srcObject=t,e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(t){n.mediaRecorder.stop(),t.getTracks().forEach(function(e){e.stop()});var r=new window.Blob(n.chunks,{type:n.mediaRecorder.mimeType});n.player.set("src",window.URL.createObjectURL(r)),n.player.set("muted",!1),n.player.set("controls",!0),n.player.ancestor().ancestor().removeClass("hide"),n.uploadBtn.ancestor().ancestor().removeClass("hide"),n.uploadBtn.set("textContent",M.util.get_string("attachrecording","atto_recordrtc")),n.uploadBtn.set("disabled",!1),n.uploadBtn.on("click",function(){!n.player.get("src")||n.chunks===[]?e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("norecordingfound_title","atto_recordrtc"),message:M.util.get_string("norecordingfound","atto_recordrtc")})}):(n.uploadBtn.set("disabled",!0),n.upload_to_server(n.recType,function(e,t){e==="ended"?(n.uploadBtn.set("disabled",!1),n.insert_annotation(n.recType,t)):e==="upload-failed"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadfailed","atto_recordrtc")+" "+t)):e==="upload-failed-404"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadfailed404","atto_recordrtc"))):e==="upload-aborted"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadaborted","atto_recordrtc")+" "+t)):n.uploadBtn.set("textContent",e)}))})}},M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;M.atto_recordrtc.videomodule={init:function(t){n.editorScope=t,n.alertWarning=e.one("div#alert-warning"),n.alertDanger=e.one("div#alert-danger"),n.player=e.one("video#player"),n.playerDOM=document.querySelector("video#player"),n.startStopBtn=e.one("button#start-stop"),n.uploadBtn=e.one("button#upload"),n.recType="video",n.olderMoodle=t.get("oldermoodle"),n.maxUploadSize=window.parseInt(t.get("maxrecsize").match(/\d+/)[0],10)*Math.pow(1024,2),n.check_secure(),n.check_browser(),n.startStopBtn.on("click",function(){n.startStopBtn.set("disabled",!0);if(n.startStopBtn.get("textContent")===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordingfailed","atto_recordrtc")){n.uploadBtn.ancestor().ancestor().addClass("hide"),n.olderMoodle||n.startStopBtn.replaceClass("btn-outline-danger","btn-danger"),n.chunks=[],n.blobSize=0;var t={onMediaCaptured:function(e){n.stream=e,n.start_recording(n.recType,n.stream)},onMediaStopped:function(e){n.startStopBtn.set("textContent",e),n.startStopBtn.set("disabled",!1),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")},onMediaCapturingFailed:function(r){var i=M.util.get_string("recordingfailed","atto_recordrtc");switch(r.name){case"AbortError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumabort_title","atto_recordrtc"),message:M.util.get_string("gumabort","atto_recordrtc")})}),t.onMediaStopped(i);break;case"NotAllowedError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumnotallowed_title","atto_recordrtc"),message:M.util.get_string("gumnotallowed","atto_recordrtc")})}),t.onMediaStopped(i);break;
case"NotFoundError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumnotfound_title","atto_recordrtc"),message:M.util.get_string("gumnotfound","atto_recordrtc")})}),t.onMediaStopped(i);break;case"NotReadableError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumnotreadable_title","atto_recordrtc"),message:M.util.get_string("gumnotreadable","atto_recordrtc")})}),t.onMediaStopped(i);break;case"OverConstrainedError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumoverconstrained_title","atto_recordrtc"),message:M.util.get_string("gumoverconstrained","atto_recordrtc")})}),t.onMediaStopped(i);break;case"SecurityError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumsecurity_title","atto_recordrtc"),message:M.util.get_string("gumsecurity","atto_recordrtc")})}),n.editorScope.closeDialogue(n.editorScope);break;case"TypeError":e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("gumtype_title","atto_recordrtc"),message:M.util.get_string("gumtype","atto_recordrtc")})}),t.onMediaStopped(i);break;default:}}};n.player.ancestor().ancestor().removeClass("hide"),n.player.set("controls",!1),M.atto_recordrtc.videomodule.capture_audio_video(t)}else window.clearInterval(n.countdownTicker),window.setTimeout(function(){n.startStopBtn.set("disabled",!1)},1e3),M.atto_recordrtc.videomodule.stop_recording(n.stream),n.startStopBtn.set("textContent",M.util.get_string("recordagain","atto_recordrtc")),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")})},capture_audio_video:function(e){n.capture_user_media({audio:!0,video:{width:{ideal:640},height:{ideal:480}}},function(t){n.playerDOM.srcObject=t,n.playerDOM.play(),e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(t){n.mediaRecorder.stop(),t.getTracks().forEach(function(e){e.stop()});var r=new window.Blob(n.chunks,{type:n.mediaRecorder.mimeType});n.player.set("src",window.URL.createObjectURL(r)),n.player.set("muted",!1),n.player.set("controls",!0),n.uploadBtn.ancestor().ancestor().removeClass("hide"),n.uploadBtn.set("textContent",M.util.get_string("attachrecording","atto_recordrtc")),n.uploadBtn.set("disabled",!1),n.uploadBtn.on("click",function(){!n.player.get("src")||n.chunks===[]?e.use("moodle-core-notification-alert",function(){new M.core.alert({title:M.util.get_string("norecordingfound_title","atto_recordrtc"),message:M.util.get_string("norecordingfound","atto_recordrtc")})}):(n.uploadBtn.set("disabled",!0),n.upload_to_server(n.recType,function(e,t){e==="ended"?(n.uploadBtn.set("disabled",!1),n.insert_annotation(n.recType,t)):e==="upload-failed"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadfailed","atto_recordrtc")+" "+t)):e==="upload-failed-404"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadfailed404","atto_recordrtc"))):e==="upload-aborted"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadaborted","atto_recordrtc")+" "+t)):n.uploadBtn.set("textContent",e)}))})}}},"@VERSION@",{requires:["moodle-atto_recordrtc-button"]});
