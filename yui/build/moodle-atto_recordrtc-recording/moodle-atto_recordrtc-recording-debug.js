YUI.add('moodle-atto_recordrtc-recording', function (Y, NAME) {

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
//

/**
 * Atto recordrtc library functions
 *
 * @package    atto_recordrtc
 * @author     Jesus Federico (jesus [at] blindsidenetworks [dt] com)
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2017 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// JSHint directives.
/*jshint es5: true */
/*jshint onevar: false */
/*jshint shadow: true */
/*global M */

// Scrutinizer CI directives.
/** global: M */

M.atto_recordrtc = M.atto_recordrtc || {};

// Shorten access to module namespaces.
var cm = M.atto_recordrtc.commonmodule,
    hm = M.atto_recordrtc.helpermodule;

M.atto_recordrtc.helpermodule = {
    // Unitialized variables to be used by the other modules.
    blobSize: null,
    chunks: null,
    countdownSeconds: null,
    countdownTicker: null,
    maxUploadSize: null,

    // Add chunks of audio/video to array when made available.
    handle_data_available: function(event) {
        // Size of all recorded data so far.
        hm.blobSize += event.data.size;

        // Push recording slice to array.
        // If total size of recording so far exceeds max upload limit, stop recording.
        // An extra condition exists to avoid displaying alert twice.
        if ((hm.blobSize >= hm.maxUploadSize) && (!window.localStorage.getItem('alerted'))) {
            window.localStorage.setItem('alerted', 'true');

            cm.startStopBtn.simulate('click');
            cm.show_alert('nearingmaxsize');
        } else if ((hm.blobSize >= hm.maxUploadSize) && (window.localStorage.getItem('alerted') === 'true')) {
            window.localStorage.removeItem('alerted');
        } else {
            hm.chunks.push(event.data);
        }
    },

    // Handle recording end.
    handle_stop: function() {
        // Set source of audio player.
        var blob = new window.Blob(hm.chunks, {type: cm.mediaRecorder.mimeType});
        cm.player.set('src', window.URL.createObjectURL(blob));

        // Show audio player with controls enabled, and unmute.
        cm.player.set('muted', false);
        cm.player.set('controls', true);
        cm.player.ancestor().ancestor().removeClass('hide'); // Only audio player is hidden at this point.

        // Show upload button.
        cm.uploadBtn.set('disabled', false);
        cm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
        cm.uploadBtn.ancestor().ancestor().removeClass('hide');

        // Handle when upload button is clicked.
        cm.uploadBtn.on('click', function() {
            // Trigger error if no recording has been made.
            if (!cm.player.get('src') || hm.chunks === []) {
                cm.show_alert('norecordingfound');
            } else {
                cm.uploadBtn.set('disabled', true);

                // Upload recording to server.
                hm.upload_to_server(cm.recType, function(progress, fileURLOrError) {
                    if (progress === 'ended') { // Insert annotation in text.
                        cm.uploadBtn.set('disabled', false);
                        cm.insert_annotation(cm.recType, fileURLOrError);
                    } else if (progress === 'upload-failed') { // Show error message in upload button.
                        cm.uploadBtn.set('disabled', false);
                        cm.uploadBtn.set('textContent',
                            M.util.get_string('uploadfailed', 'atto_recordrtc') + ' ' + fileURLOrError);
                    } else if (progress === 'upload-failed-404') { // 404 error = File too large in Moodle.
                        cm.uploadBtn.set('disabled', false);
                        cm.uploadBtn.set('textContent', M.util.get_string('uploadfailed404', 'atto_recordrtc'));
                    } else if (progress === 'upload-aborted') {
                        cm.uploadBtn.set('disabled', false);
                        cm.uploadBtn.set('textContent',
                            M.util.get_string('uploadaborted', 'atto_recordrtc') + ' ' + fileURLOrError);
                    } else {
                        cm.uploadBtn.set('textContent', progress);
                    }
                });
            }
        });
    },

    // Get everything set up to start recording.
    start_recording: function(type, stream) {
        // The options for the recording codecs and bitrates.
        var options = null;
        if (type === 'audio') {
            if (window.MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = {
                    audioBitsPerSecond: cm.editorScope.get('audiobitrate'),
                    mimeType: 'audio/webm;codecs=opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options = {
                    audioBitsPerSecond: cm.editorScope.get('audiobitrate'),
                    mimeType: 'audio/ogg;codecs=opus'
                };
            }
        } else {
            if (window.MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                options = {
                    audioBitsPerSecond: cm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: cm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=vp9,opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
                options = {
                    audioBitsPerSecond: cm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: cm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=h264,opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                options = {
                    audioBitsPerSecond: cm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: cm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=vp8,opus'
                };
            }
        }

        // If none of the options above are supported, fall back on browser defaults.
        cm.mediaRecorder = options ? new window.MediaRecorder(stream, options)
                                   : new window.MediaRecorder(stream);

        // Initialize MediaRecorder events and start recording.
        cm.mediaRecorder.ondataavailable = hm.handle_data_available;
        cm.mediaRecorder.onstop = hm.handle_stop;
        cm.mediaRecorder.start(1000); // Capture in 1s chunks. Must be set to work with Firefox.

        // Mute audio, distracting while recording.
        cm.player.set('muted', true);

        // Set recording timer to the time specified in the settings.
        hm.countdownSeconds = cm.editorScope.get('timelimit');
        hm.countdownSeconds++;
        var timerText = M.util.get_string('stoprecording', 'atto_recordrtc');
        timerText += ' (<span id="minutes"></span>:<span id="seconds"></span>)';
        cm.startStopBtn.setHTML(timerText);
        hm.set_time();
        hm.countdownTicker = window.setInterval(hm.set_time, 1000);

        // Make button clickable again, to allow stopping recording.
        cm.startStopBtn.set('disabled', false);
    },

    // Upload recorded audio/video to server.
    upload_to_server: function(type, callback) {
        var xhr = new window.XMLHttpRequest();

        // Get src media of audio/video tag.
        xhr.open('GET', cm.player.get('src'), true);
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) { // If src media was successfully retrieved.
                // blob is now the media that the audio/video tag's src pointed to.
                var blob = this.response;

                // Generate filename with random ID and file extension.
                var fileName = (Math.random() * 1000).toString().replace('.', '');
                if (type === 'audio') {
                    fileName += '-audio.ogg';
                } else {
                    fileName += '-video.webm';
                }

                // Create FormData to send to PHP upload/save script.
                var formData = new window.FormData();
                formData.append('contextid', cm.editorScope.get('contextid'));
                formData.append('sesskey', cm.editorScope.get('sesskey'));
                formData.append(type + '-filename', fileName);
                formData.append(type + '-blob', blob);

                // Pass FormData to PHP script using XHR.
                hm.make_xmlhttprequest(cm.editorScope.get('recordrtcroot') + 'save.php', formData,
                    function(progress, responseText) {
                        if (progress === 'upload-ended') {
                            var initialURL = cm.editorScope.get('recordrtcroot') + 'uploads.php/';
                            return callback('ended', initialURL + responseText);
                        }
                        return callback(progress);
                    }
                );
            }
        };

        xhr.send();
    },

    // Handle XHR sending/receiving/status.
    make_xmlhttprequest: function(url, data, callback) {
        var xhr = new window.XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if ((xhr.readyState === 4) && (xhr.status === 200)) { // When request is finished and successful.
                callback('upload-ended', xhr.responseText);
            } else if (xhr.status === 404) { // When request returns 404 Not Found.
                callback('upload-failed-404');
            }
        };

        xhr.upload.onprogress = function(event) {
            callback(Math.round(event.loaded / event.total * 100) + "% " + M.util.get_string('uploadprogress', 'atto_recordrtc'));
        };

        xhr.upload.onerror = function(error) {
            callback('upload-failed', error);
        };

        xhr.upload.onabort = function(error) {
            callback('upload-aborted', error);
        };

        // POST FormData to PHP script that handles uploading/saving.
        xhr.open('POST', url);
        xhr.send(data);
    },

    // Makes 1min and 2s display as 1:02 on timer instead of 1:2, for example.
    pad: function(val) {
        var valString = val + "";

        if (valString.length < 2) {
            return "0" + valString;
        } else {
            return valString;
        }
    },

    // Functionality to make recording timer count down.
    // Also makes recording stop when time limit is hit.
    set_time: function() {
        hm.countdownSeconds--;

        cm.startStopBtn.one('span#seconds').set('textContent', hm.pad(hm.countdownSeconds % 60));
        cm.startStopBtn.one('span#minutes').set('textContent', hm.pad(window.parseInt(hm.countdownSeconds / 60, 10)));

        if (hm.countdownSeconds === 0) {
            cm.startStopBtn.simulate('click');
        }
    }
};
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
//

/**
 * Atto recordrtc library functions
 *
 * @package    atto_recordrtc
 * @author     Jesus Federico (jesus [at] blindsidenetworks [dt] com)
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2017 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// JSHint directives.
/*jshint es5: true */
/*jshint onevar: false */
/*jshint shadow: true */
/*global M */

// Scrutinizer CI directives.
/** global: M */
/** global: Y */

M.atto_recordrtc = M.atto_recordrtc || {};

var cm = null,
    hm = null;

M.atto_recordrtc.audiomodule = {
    init: function(scope) {
        // Shorten access to module namespaces.
        cm = M.atto_recordrtc.commonmodule;
        hm = M.atto_recordrtc.helpermodule;

        // Assignment of global variables.
        cm.editorScope = scope; // Allows access to the editor's "this" context.
        cm.alertWarning = Y.one('div#alert-warning');
        cm.alertDanger = Y.one('div#alert-danger');
        cm.player = Y.one('audio#player');
        cm.playerDOM = document.querySelector('audio#player');
        cm.startStopBtn = Y.one('button#start-stop');
        cm.uploadBtn = Y.one('button#upload');
        cm.recType = 'audio';
        cm.olderMoodle = scope.get('oldermoodle');
        // Extract the numbers from the string, and convert to bytes.
        hm.maxUploadSize = window.parseInt(scope.get('maxrecsize').match(/\d+/)[0], 10) * Math.pow(1024, 2);

        // Show alert and redirect user if connection is not secure.
        cm.check_secure();
        // Show alert if using non-ideal browser.
        cm.check_browser();

        // Run when user clicks on "record" button.
        cm.startStopBtn.on('click', function() {
            cm.startStopBtn.set('disabled', true);

            // If button is displaying "Start Recording" or "Record Again".
            if ((cm.startStopBtn.get('textContent') === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (cm.startStopBtn.get('textContent') === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (cm.startStopBtn.get('textContent') === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Make sure the audio player and upload button are not shown.
                cm.player.ancestor().ancestor().addClass('hide');
                cm.uploadBtn.ancestor().ancestor().addClass('hide');

                // Change look of recording button.
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-outline-danger', 'btn-danger');
                }

                // Empty the array containing the previously recorded chunks.
                hm.chunks = [];
                hm.blobSize = 0;

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make audio stream available at a higher level by making it a property of the common module.
                        cm.stream = stream;

                        hm.start_recording(cm.recType, cm.stream);
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        cm.startStopBtn.set('textContent', btnLabel);
                        cm.startStopBtn.set('disabled', false);
                        if (!cm.olderMoodle) {
                            cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                        }
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        var btnLabel = M.util.get_string('recordingfailed', 'atto_recordrtc');
                        var treatAsStopped = function() {
                            commonConfig.onMediaStopped(btnLabel);
                        };

                        // Handle getUserMedia-thrown errors.
                        // After alert, proceed to treat as stopped recording, or close dialogue.
                        switch (error.name) {
                            case 'AbortError':
                                cm.show_alert('gumabort', treatAsStopped);

                                break;
                            case 'NotAllowedError':
                                cm.show_alert('gumnotallowed', treatAsStopped);

                                break;
                            case 'NotFoundError':
                                cm.show_alert('gumnotfound', treatAsStopped);

                                break;
                            case 'NotReadableError':
                                cm.show_alert('gumnotreadable', treatAsStopped);

                                break;
                            case 'OverConstrainedError':
                                cm.show_alert('gumoverconstrained', treatAsStopped);

                                break;
                            case 'SecurityError':
                                cm.show_alert('gumsecurity', function() {
                                    cm.editorScope.closeDialogue(cm.editorScope);
                                });

                                break;
                            case 'TypeError':
                                cm.show_alert('gumtype', treatAsStopped);

                                break;
                            default:
                                break;
                        }
                    }
                };

                // Capture audio stream from microphone.
                M.atto_recordrtc.audiomodule.capture_audio(commonConfig);
            } else { // If button is displaying "Stop Recording".
                // First of all clears the countdownTicker.
                window.clearInterval(hm.countdownTicker);

                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                window.setTimeout(function() {
                    cm.startStopBtn.set('disabled', false);
                }, 1000);

                // Stop recording.
                M.atto_recordrtc.audiomodule.stop_recording(cm.stream);

                // Change button to offer to record again.
                cm.startStopBtn.set('textContent', M.util.get_string('recordagain', 'atto_recordrtc'));
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                }
            }
        });
    },

    // Setup to get audio stream from microphone.
    capture_audio: function(config) {
        cm.capture_user_media(
            // Media constraints.
            {
                audio: true
            },

            // Success callback.
            function(audioStream) {
                // Set audio player source to microphone stream.
                cm.playerDOM.srcObject = audioStream;

                config.onMediaCaptured(audioStream);
            },

            // Error callback.
            function(error) {
                config.onMediaCapturingFailed(error);
            }
        );
    },

    stop_recording: function(stream) {
        // Stop recording microphone stream.
        cm.mediaRecorder.stop();

        // Stop each individual MediaTrack.
        stream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
};
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
//

/**
 * Atto recordrtc library functions
 *
 * @package    atto_recordrtc
 * @author     Jesus Federico (jesus [at] blindsidenetworks [dt] com)
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2017 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// JSHint directives.
/*jshint es5: true */
/*jshint onevar: false */
/*jshint shadow: true */
/*global M */

// Scrutinizer CI directives.
/** global: M */
/** global: Y */

M.atto_recordrtc = M.atto_recordrtc || {};

var cm = null,
    hm = null;

M.atto_recordrtc.videomodule = {
    init: function(scope) {
        // Shorten access to module namespaces.
        cm = M.atto_recordrtc.commonmodule;
        hm = M.atto_recordrtc.helpermodule;

        // Assignment of global variables.
        cm.editorScope = scope; // Allows access to the editor's "this" context.
        cm.alertWarning = Y.one('div#alert-warning');
        cm.alertDanger = Y.one('div#alert-danger');
        cm.player = Y.one('video#player');
        cm.playerDOM = document.querySelector('video#player');
        cm.startStopBtn = Y.one('button#start-stop');
        cm.uploadBtn = Y.one('button#upload');
        cm.recType = 'video';
        cm.olderMoodle = scope.get('oldermoodle');
        // Extract the numbers from the string, and convert to bytes.
        hm.maxUploadSize = window.parseInt(scope.get('maxrecsize').match(/\d+/)[0], 10) * Math.pow(1024, 2);

        // Show alert and redirect user if connection is not secure.
        cm.check_secure();
        // Show alert if using non-ideal browser.
        cm.check_browser();

        // Run when user clicks on "record" button.
        cm.startStopBtn.on('click', function() {
            cm.startStopBtn.set('disabled', true);

            // If button is displaying "Start Recording" or "Record Again".
            if ((cm.startStopBtn.get('textContent') === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (cm.startStopBtn.get('textContent') === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (cm.startStopBtn.get('textContent') === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Make sure the upload button is not shown.
                cm.uploadBtn.ancestor().ancestor().addClass('hide');

                // Change look of recording button.
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-outline-danger', 'btn-danger');
                }

                // Empty the array containing the previously recorded chunks.
                hm.chunks = [];
                hm.blobSize = 0;

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make video stream available at a higher level by making it a property of the common module.
                        cm.stream = stream;

                        hm.start_recording(cm.recType, cm.stream);
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        cm.startStopBtn.set('textContent', btnLabel);
                        cm.startStopBtn.set('disabled', false);
                        if (!cm.olderMoodle) {
                            cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                        }
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        var btnLabel = M.util.get_string('recordingfailed', 'atto_recordrtc');
                        var treatAsStopped = function() {
                            commonConfig.onMediaStopped(btnLabel);
                        };

                        // Handle getUserMedia-thrown errors.
                        // After alert, proceed to treat as stopped recording, or close dialogue.
                        switch (error.name) {
                            case 'AbortError':
                                cm.show_alert('gumabort', treatAsStopped);

                                break;
                            case 'NotAllowedError':
                                cm.show_alert('gumnotallowed', treatAsStopped);

                                break;
                            case 'NotFoundError':
                                cm.show_alert('gumnotfound', treatAsStopped);

                                break;
                            case 'NotReadableError':
                                cm.show_alert('gumnotreadable', treatAsStopped);

                                break;
                            case 'OverConstrainedError':
                                cm.show_alert('gumoverconstrained', treatAsStopped);

                                break;
                            case 'SecurityError':
                                cm.show_alert('gumsecurity', function() {
                                    cm.editorScope.closeDialogue(cm.editorScope);
                                });

                                break;
                            case 'TypeError':
                                cm.show_alert('gumtype', treatAsStopped);

                                break;
                            default:
                                break;
                        }
                    }
                };

                // Show video tag without controls to view webcam stream.
                cm.player.ancestor().ancestor().removeClass('hide');
                cm.player.set('controls', false);

                // Capture audio+video stream from webcam/microphone.
                M.atto_recordrtc.videomodule.capture_audio_video(commonConfig);
            } else { // If button is displaying "Stop Recording".
                // First of all clears the countdownTicker.
                window.clearInterval(hm.countdownTicker);

                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                window.setTimeout(function() {
                    cm.startStopBtn.set('disabled', false);
                }, 1000);

                // Stop recording.
                M.atto_recordrtc.videomodule.stop_recording(cm.stream);

                // Change button to offer to record again.
                cm.startStopBtn.set('textContent', M.util.get_string('recordagain', 'atto_recordrtc'));
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                }
            }
        });
    },

    // Setup to get audio+video stream from microphone/webcam.
    capture_audio_video: function(config) {
        cm.capture_user_media(
            // Media constraints.
            {
                audio: true,
                video: {
                    width: {ideal: 640},
                    height: {ideal: 480}
                }
            },

            // Success callback.
            function(audioVideoStream) {
                // Set video player source to microphone+webcam stream, and play it back as it's recording.
                cm.playerDOM.srcObject = audioVideoStream;
                cm.playerDOM.play();

                config.onMediaCaptured(audioVideoStream);
            },

            // Error callback.
            function(error) {
                config.onMediaCapturingFailed(error);
            }
        );
    },

    stop_recording: function(stream) {
        // Stop recording microphone stream.
        cm.mediaRecorder.stop();

        // Stop each individual MediaTrack.
        stream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
};


}, '@VERSION@', {"requires": ["moodle-atto_recordrtc-button", "moodle-atto_recordrtc-recordingcommon"]});
