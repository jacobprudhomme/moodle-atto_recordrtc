YUI.add("moodle-atto_recordrtc-recording",function(e,t){M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule,r=M.atto_recordrtc.helpermodule;M.atto_recordrtc.helpermodule={blobSize:null,chunks:null,countdownSeconds:null,countdownTicker:null,maxUploadSize:null,handle_data_available:function(e){r.blobSize+=e.data.size,r.blobSize>=r.maxUploadSize&&!window.localStorage.getItem("alerted")?(window.localStorage.setItem("alerted","true"),n.startStopBtn.simulate("click"),n.show_alert("nearingmaxsize")):r.blobSize>=r.maxUploadSize&&window.localStorage.getItem("alerted")==="true"?window.localStorage.removeItem("alerted"):r.chunks.push(e.data)},handle_stop:function(){var e=new window.Blob(r.chunks,{type:n.mediaRecorder.mimeType});n.player.set("src",window.URL.createObjectURL(e)),n.player.set("muted",!1),n.player.set("controls",!0),n.player.ancestor().ancestor().removeClass("hide"),n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("attachrecording","atto_recordrtc")),n.uploadBtn.ancestor().ancestor().removeClass("hide"),n.uploadBtn.on("click",function(){!n.player.get("src")||r.chunks===[]?n.show_alert("norecordingfound"):(n.uploadBtn.set("disabled",!0),r.upload_to_server(n.recType,function(e,t){e==="ended"?(n.uploadBtn.set("disabled",!1),n.insert_annotation(n.recType,t)):e==="upload-failed"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadfailed","atto_recordrtc")+" "+t)):e==="upload-failed-404"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadfailed404","atto_recordrtc"))):e==="upload-aborted"?(n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("uploadaborted","atto_recordrtc")+" "+t)):n.uploadBtn.set("textContent",e)}))})},start_recording:function(e,t){var i=null;e==="audio"?window.MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?i={audioBitsPerSecond:n.editorScope.get("audiobitrate"),mimeType:"audio/webm;codecs=opus"}:window.MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")&&(i={audioBitsPerSecond:n.editorScope.get("audiobitrate"),mimeType:"audio/ogg;codecs=opus"}):window.MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?i={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=vp9,opus"}:window.MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")?i={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=h264,opus"}:window.MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")&&(i={audioBitsPerSecond:n.editorScope.get("audiobitrate"),videoBitsPerSecond:n.editorScope.get("videobitrate"),mimeType:"video/webm;codecs=vp8,opus"}),n.mediaRecorder=i?new window.MediaRecorder(t,i):new window.MediaRecorder(t),n.mediaRecorder.ondataavailable=r.handle_data_available,n.mediaRecorder.onstop=r.handle_stop,n.mediaRecorder.start(1e3),n.player.set("muted",!0),r.countdownSeconds=n.editorScope.get("timelimit"),r.countdownSeconds++;var s=M.util.get_string("stoprecording","atto_recordrtc");s+=' (<span id="minutes"></span>:<span id="seconds"></span>)',n.startStopBtn.setHTML(s),r.set_time(),r.countdownTicker=window.setInterval(r.set_time,1e3),n.startStopBtn.set("disabled",!1)},upload_to_server:function(e,t){var i=new window.XMLHttpRequest;i.open("GET",n.player.get("src"),!0),i.responseType="blob",i.onload=function(){if(i.status===200){var s=this.response,o=(Math.random()*1e3).toString().replace(".","");e==="audio"?o+="-audio.ogg":o+="-video.webm";var u=new window.FormData;u.append("contextid",n.editorScope.get("contextid")),u.append("sesskey",n.editorScope.get("sesskey")),u.append(e+"-filename",o),u.append(e+"-blob",s),r.make_xmlhttprequest(n.editorScope.get("recordrtcroot")+"save.php",u,function(e,r){if(e==="upload-ended"){var i=n.editorScope.get("recordrtcroot")+"uploads.php/";return t("ended",i+r)}return t(e)})}},i.send()},make_xmlhttprequest:function(e,t,n){var r=new window.XMLHttpRequest;r.onreadystatechange=function(){r.readyState===4&&r.status===200?n("upload-ended",r.responseText):r.status===404&&n("upload-failed-404")},r.upload.onprogress=function(e){n(Math.round(e.loaded/e.total*100)+"% "+M.util.get_string("uploadprogress","atto_recordrtc"))},r.upload.onerror=function(e){n("upload-failed",e)},r.upload.onabort=function(e){n("upload-aborted",e)},r.open("POST",e),r.send(t)},pad:function(e){var t=e+"";return t.length<2?"0"+t:t},set_time:function(){r.countdownSeconds--,n.startStopBtn.one("span#seconds").set("textContent",r.pad(r.countdownSeconds%60)),n.startStopBtn.one("span#minutes").set("textContent",r.pad(window.parseInt(r.countdownSeconds/60,10))),r.countdownSeconds===0&&n.startStopBtn.simulate("click")}},M.atto_recordrtc=M.atto_recordrtc||{};var n=null,r=null;M.atto_recordrtc.audiomodule={init:function(t){n=M.atto_recordrtc.commonmodule,r=M.atto_recordrtc.helpermodule,n.editorScope=t,n.alertWarning=e.one("div#alert-warning"),n.alertDanger=e.one("div#alert-danger"),n.player=e.one("audio#player"),n.playerDOM=document.querySelector("audio#player"),n.startStopBtn=e.one("button#start-stop"),n.uploadBtn=e.one("button#upload"),n.recType="audio",n.olderMoodle=t.get("oldermoodle"),r.maxUploadSize=window.parseInt(t.get("maxrecsize").match(/\d+/)[0],10)*Math.pow(1024,2),n.check_secure(),n.check_browser(),n.startStopBtn.on("click",function(){n.startStopBtn.set("disabled",!0);if(n.startStopBtn.get("textContent")===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordingfailed","atto_recordrtc")){n.player.ancestor().ancestor().addClass("hide"),n.uploadBtn.ancestor().ancestor().addClass("hide"),n.olderMoodle||n.startStopBtn.replaceClass("btn-outline-danger","btn-danger"),r.chunks=[],r.blobSize=0;var e={onMediaCaptured:function(e){n.stream=e
,r.start_recording(n.recType,n.stream)},onMediaStopped:function(e){n.startStopBtn.set("textContent",e),n.startStopBtn.set("disabled",!1),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")},onMediaCapturingFailed:function(t){var r=M.util.get_string("recordingfailed","atto_recordrtc"),i=function(){e.onMediaStopped(r)};switch(t.name){case"AbortError":n.show_alert("gumabort",i);break;case"NotAllowedError":n.show_alert("gumnotallowed",i);break;case"NotFoundError":n.show_alert("gumnotfound",i);break;case"NotReadableError":n.show_alert("gumnotreadable",i);break;case"OverConstrainedError":n.show_alert("gumoverconstrained",i);break;case"SecurityError":n.show_alert("gumsecurity",function(){n.editorScope.closeDialogue(n.editorScope)});break;case"TypeError":n.show_alert("gumtype",i);break;default:}}};M.atto_recordrtc.audiomodule.capture_audio(e)}else window.clearInterval(r.countdownTicker),window.setTimeout(function(){n.startStopBtn.set("disabled",!1)},1e3),M.atto_recordrtc.audiomodule.stop_recording(n.stream),n.startStopBtn.set("textContent",M.util.get_string("recordagain","atto_recordrtc")),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")})},capture_audio:function(e){n.capture_user_media({audio:!0},function(t){n.playerDOM.srcObject=t,e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(e){n.mediaRecorder.stop(),e.getTracks().forEach(function(e){e.stop()})}},M.atto_recordrtc=M.atto_recordrtc||{};var n=null,r=null;M.atto_recordrtc.videomodule={init:function(t){n=M.atto_recordrtc.commonmodule,r=M.atto_recordrtc.helpermodule,n.editorScope=t,n.alertWarning=e.one("div#alert-warning"),n.alertDanger=e.one("div#alert-danger"),n.player=e.one("video#player"),n.playerDOM=document.querySelector("video#player"),n.startStopBtn=e.one("button#start-stop"),n.uploadBtn=e.one("button#upload"),n.recType="video",n.olderMoodle=t.get("oldermoodle"),r.maxUploadSize=window.parseInt(t.get("maxrecsize").match(/\d+/)[0],10)*Math.pow(1024,2),n.check_secure(),n.check_browser(),n.startStopBtn.on("click",function(){n.startStopBtn.set("disabled",!0);if(n.startStopBtn.get("textContent")===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordingfailed","atto_recordrtc")){n.uploadBtn.ancestor().ancestor().addClass("hide"),n.olderMoodle||n.startStopBtn.replaceClass("btn-outline-danger","btn-danger"),r.chunks=[],r.blobSize=0;var e={onMediaCaptured:function(e){n.stream=e,r.start_recording(n.recType,n.stream)},onMediaStopped:function(e){n.startStopBtn.set("textContent",e),n.startStopBtn.set("disabled",!1),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")},onMediaCapturingFailed:function(t){var r=M.util.get_string("recordingfailed","atto_recordrtc"),i=function(){e.onMediaStopped(r)};switch(t.name){case"AbortError":n.show_alert("gumabort",i);break;case"NotAllowedError":n.show_alert("gumnotallowed",i);break;case"NotFoundError":n.show_alert("gumnotfound",i);break;case"NotReadableError":n.show_alert("gumnotreadable",i);break;case"OverConstrainedError":n.show_alert("gumoverconstrained",i);break;case"SecurityError":n.show_alert("gumsecurity",function(){n.editorScope.closeDialogue(n.editorScope)});break;case"TypeError":n.show_alert("gumtype",i);break;default:}}};n.player.ancestor().ancestor().removeClass("hide"),n.player.set("controls",!1),M.atto_recordrtc.videomodule.capture_audio_video(e)}else window.clearInterval(r.countdownTicker),window.setTimeout(function(){n.startStopBtn.set("disabled",!1)},1e3),M.atto_recordrtc.videomodule.stop_recording(n.stream),n.startStopBtn.set("textContent",M.util.get_string("recordagain","atto_recordrtc")),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")})},capture_audio_video:function(e){n.capture_user_media({audio:!0,video:{width:{ideal:640},height:{ideal:480}}},function(t){n.playerDOM.srcObject=t,n.playerDOM.play(),e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(e){n.mediaRecorder.stop(),e.getTracks().forEach(function(e){e.stop()})}}},"@VERSION@",{requires:["moodle-atto_recordrtc-button","moodle-atto_recordrtc-recordingcommon"]});
