YUI.add("moodle-atto_recordrtc-recordingcommon",function(e,t){M.atto_recordrtc=M.atto_recordrtc||{},M.atto_recordrtc.commonmodule={editorScope:null,alertWarning:null,alertDanger:null,player:null,playerDOM:null,startStopBtn:null,uploadBtn:null,recType:null,stream:null,mediaRecorder:null,olderMoodle:null,show_alert:function(t,n){e.use("moodle-core-notification-alert",function(){var e=new M.core.alert({title:M.util.get_string(t+"_title","atto_recordrtc"),message:M.util.get_string(t,"atto_recordrtc")});n&&e.after("complete",n)})},handle_gum_errors:function(e,t){var n=M.util.get_string("recordingfailed","tinymce_recordrtc"),r=function(){t.onMediaStopped(n)},i="gum"+e.name.replace("Error","").toLowerCase();i!=="gumsecurity"?M.tinymce_recordrtc.show_alert(i,r):M.tinymce_recordrtc.show_alert(i,function(){tinyMCEPopup.close()})},check_secure:function(){var e=window.location.protocol==="https:"||window.location.host.indexOf("localhost")!==-1;e||n.alertDanger.ancestor().ancestor().removeClass("hide")},check_browser:function(){window.bowser.firefox&&window.bowser.version>=29||window.bowser.chrome&&window.bowser.version>=49||window.bowser.opera&&window.bowser.version>=36||n.alertWarning.ancestor().ancestor().removeClass("hide")},capture_user_media:function(e,t,n){window.navigator.mediaDevices.getUserMedia(e).then(t).catch(n)},create_annotation:function(e,t){var n=window.prompt(M.util.get_string("annotationprompt","atto_recordrtc"),M.util.get_string("annotation:"+e,"atto_recordrtc"));if(!n)return undefined;var r='<a target="_blank" href="'+t+'">'+n+"</a>";return r},insert_annotation:function(e,t){var r=n.create_annotation(e,t);r?n.editorScope.setLink(n.editorScope,r):n.uploadBtn.set("textContent",M.util.get_string("attachrecording","atto_recordrtc"))}};var n=M.atto_recordrtc.commonmodule},"@VERSION@",{requires:["moodle-atto_recordrtc-button"]});
