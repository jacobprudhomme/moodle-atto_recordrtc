YUI.add("moodle-atto_recordrtc-recordingpremium",function(e,t){M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule,r=M.atto_recordrtc.premiumhelpermodule;M.atto_recordrtc.premiumhelpermodule={socket:null,init_connection:function(){var e=function(){n.editorScope.closeDialogue(n.editorScope)};r.socket.connect(),r.socket.on("connect",function(){r.socket.emit("authentication",{key:n.editorScope.get("apikey"),secret:n.editorScope.get("apisecret")}),r.socket.on("authenticated",function(){}),r.socket.on("unauthorized",function(){n.show_alert("notpremium",e)})}),r.socket.on("connect_error",function(){r.socket.disconnect(),n.show_alert("servernotfound",e)})},handle_data_available:function(e){r.socket.emit("data available",e.data)},handle_stop:function(){n.startStopBtn.set("textContent","Start Recording"),r.socket.emit("recording stopped"),r.socket.on("save finished",function(e){n.player.set("src",e),n.player.set("controls",!0),n.player.set("muted",!1),n.player.ancestor().ancestor().removeClass("hide"),n.uploadBtn.set("disabled",!1),n.uploadBtn.set("textContent",M.util.get_string("attachrecording","atto_recordrtc")),n.uploadBtn.ancestor().ancestor().removeClass("hide")})},start_recording:function(e,t){var i=(Math.random()*1e3).toString().replace(".","");e==="audio"?i+="-audio.ogg":i+="-video.webm";var s={contextid:n.editorScope.get("contextid"),type:n.recType,itemid:n.editorScope.get("sesskey"),filename:i};r.socket.emit("recording started",s);var o=n.best_rec_options(e);n.mediaRecorder=new window.MediaRecorder(t,o),r.socket.on("recording started",function(){n.startStopBtn.set("textContent",M.util.get_string("stoprecording","atto_recordrtc")),n.startStopBtn.set("disabled",!1),n.player.set("muted",!0),n.mediaRecorder.ondataavailable=r.handle_data_available,n.mediaRecorder.onstop=r.handle_stop,n.mediaRecorder.start(1500)})}},M.atto_recordrtc=M.atto_recordrtc||{};var n=null,r=null;M.atto_recordrtc.premiumaudiomodule={init:function(t){n=M.atto_recordrtc.commonmodule,r=M.atto_recordrtc.premiumhelpermodule,n.editorScope=t,n.alertWarning=e.one("div#alert-warning"),n.alertDanger=e.one("div#alert-danger"),n.player=e.one("audio#player"),n.playerDOM=document.querySelector("audio#player"),n.startStopBtn=e.one("button#start-stop"),n.uploadBtn=e.one("button#upload"),n.recType="audio",n.olderMoodle=t.get("oldermoodle"),r.socket=window.io(n.editorScope.get("serverurl")),n.check_secure(),n.check_browser(),r.init_connection(),n.startStopBtn.on("click",function(){n.startStopBtn.set("disabled",!0);if(n.startStopBtn.get("textContent")===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordingfailed","atto_recordrtc")){n.player.ancestor().ancestor().addClass("hide"),n.uploadBtn.ancestor().ancestor().addClass("hide"),n.olderMoodle||n.startStopBtn.replaceClass("btn-outline-danger","btn-danger");var e={onMediaCaptured:function(e){n.stream=e,r.start_recording(n.recType,n.stream)},onMediaStopped:function(e){n.startStopBtn.set("textContent",e),n.startStopBtn.set("disabled",!1),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")},onMediaCapturingFailed:function(t){n.handle_gum_errors(t,e)}};M.atto_recordrtc.premiumaudiomodule.capture_audio(e)}else window.setTimeout(function(){n.startStopBtn.set("disabled",!1)},1e3),M.atto_recordrtc.premiumaudiomodule.stop_recording(n.stream),n.startStopBtn.set("textContent",M.util.get_string("recordagain","atto_recordrtc")),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")}),n.uploadBtn.on("click",function(){n.player.get("src")?(n.uploadBtn.set("disabled",!0),r.socket.emit("recording uploaded"),n.insert_annotation(n.recType,n.player.get("src"))):n.show_alert("norecordingfound")})},capture_audio:function(e){n.capture_user_media({audio:!0},function(t){n.playerDOM.srcObject=t,e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(e){n.mediaRecorder.stop(),e.getTracks().forEach(function(e){e.stop()})}},M.atto_recordrtc=M.atto_recordrtc||{};var n=null,r=null;M.atto_recordrtc.premiumvideomodule={init:function(t){n=M.atto_recordrtc.commonmodule,r=M.atto_recordrtc.premiumhelpermodule,n.editorScope=t,n.alertWarning=e.one("div#alert-warning"),n.alertDanger=e.one("div#alert-danger"),n.player=e.one("video#player"),n.playerDOM=document.querySelector("video#player"),n.startStopBtn=e.one("button#start-stop"),n.uploadBtn=e.one("button#upload"),n.recType="video",n.olderMoodle=t.get("oldermoodle"),r.socket=window.io(n.editorScope.get("serverurl")),n.check_secure(),n.check_browser(),r.init_connection(),n.startStopBtn.on("click",function(){n.startStopBtn.set("disabled",!0);if(n.startStopBtn.get("textContent")===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.get("textContent")===M.util.get_string("recordingfailed","atto_recordrtc")){n.uploadBtn.ancestor().ancestor().addClass("hide"),n.olderMoodle||n.startStopBtn.replaceClass("btn-outline-danger","btn-danger");var e={onMediaCaptured:function(e){n.stream=e,r.start_recording(n.recType,n.stream)},onMediaStopped:function(e){n.startStopBtn.set("textContent",e),n.startStopBtn.set("disabled",!1),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")},onMediaCapturingFailed:function(t){n.handle_gum_errors(t,e)}};n.player.ancestor().ancestor().removeClass("hide"),n.player.set("controls",!1),M.atto_recordrtc.premiumvideomodule.capture_audio_video(e)}else window.setTimeout(function(){n.startStopBtn.set("disabled",!1)},1e3),M.atto_recordrtc.premiumvideomodule.stop_recording(n.stream),n.startStopBtn.set("textContent",M.util.get_string("recordagain","atto_recordrtc")),n.olderMoodle||n.startStopBtn.replaceClass("btn-danger","btn-outline-danger")}),n.uploadBtn.on("click",function(){n.player.get("src"
)?(n.uploadBtn.set("disabled",!0),r.socket.emit("recording uploaded"),n.insert_annotation(n.recType,n.player.get("src"))):n.show_alert("norecordingfound")})},capture_audio_video:function(e){n.capture_user_media({audio:!0,video:{width:{ideal:640},height:{ideal:480}}},function(t){n.playerDOM.srcObject=t,n.playerDOM.play(),e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(e){n.mediaRecorder.stop(),e.getTracks().forEach(function(e){e.stop()})}}},"@VERSION@",{requires:["moodle-atto_recordrtc-button","moodle-atto_recordrtc-recordingcommon"]});
