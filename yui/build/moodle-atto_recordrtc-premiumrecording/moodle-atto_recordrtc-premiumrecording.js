YUI.add('moodle-atto_recordrtc-premiumrecording', function (Y, NAME) {

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

// Shorten access to M.atto_recordrtc.commonmodule namespace.
var pcm = M.atto_recordrtc.premiumcommonmodule;

M.atto_recordrtc.premiumcommonmodule = {
    // Unitialized variables to be used by the other modules.
    editorScope: null,
    alertWarning: null,
    alertDanger: null,
    player: null,
    playerDOM: null, // Used to manipulate DOM directly.
    startStopBtn: null,
    uploadBtn: null,
    recType: null,
    stream: null,
    mediaRecorder: null,
    olderMoodle: null,
    socket: null,

    // Notify and redirect user if plugin is used from insecure location.
    check_secure: function() {
        var isSecureOrigin = (window.location.protocol === 'https:') ||
                             (window.location.host.indexOf('localhost') !== -1);

        if (!isSecureOrigin) {
            pcm.alertDanger.ancestor().ancestor().removeClass('hide');
        }
    },

    // Display "consider switching browsers" message if not using:
    // - Firefox 29+;
    // - Chrome 49+;
    // - Opera 36+.
    check_browser: function() {
        if (!((window.bowser.firefox && window.bowser.version >= 29) ||
              (window.bowser.chrome && window.bowser.version >= 49) ||
              (window.bowser.opera && window.bowser.version >= 36))) {
            pcm.alertWarning.ancestor().ancestor().removeClass('hide');
        }
    },

    // Attempt to connect to the premium server via Socket.io.
    init_connection: function() {
        pcm.socket.connect();

        pcm.socket.on('connect', function() {
            // Send key and secret from Moodle settings
            pcm.socket.emit('authentication', {
                key: pcm.editorScope.get('apikey'),
                secret: pcm.editorScope.get('apisecret')
            });

            pcm.socket.on('authenticated', function() {
                // Continue as normal.
            });

            pcm.socket.on('unauthorized', function(err) {
                pcm.editorScope.closeDialogue(pcm.editorScope);
                Y.use('moodle-core-notification-alert', function() {
                    new M.core.alert({
                        title: M.util.get_string('notpremium_title', 'atto_recordrtc'),
                        message: M.util.get_string('notpremium', 'atto_recordrtc')
                    });
                });
            });
        });

        pcm.socket.on('connect_error', function() {
            pcm.editorScope.closeDialogue(pcm.editorScope);
            Y.use('moodle-core-notification-alert', function() {
                new M.core.alert({
                    title: M.util.get_string('servernotfound_title', 'atto_recordrtc'),
                    message: M.util.get_string('servernotfound', 'atto_recordrtc')
                });
            });
        });
    },

    // Capture webcam/microphone stream.
    capture_user_media: function(mediaConstraints, successCallback, errorCallback) {
        window.navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
    },

    // Push chunks of audio/video to server when made available.
    handle_data_available: function(event) {
        pcm.socket.emit('data available', event.data);
    },

    // Stop recording and handle end.
    handle_stop: function(event) {
        pcm.startStopBtn.set('textContent', 'Start Recording');

        pcm.socket.emit('recording stopped');

        pcm.socket.on('save finished', function(path) {
            pcm.player.set('src', path);
            pcm.player.set('controls', true);
            pcm.player.set('muted', false);
            pcm.player.ancestor().ancestor().removeClass('hide'); // AUDIO ONLY
        });
    },

    // Get everything set up to start recording.
    start_recording: function(type, stream) {
        // Generate filename with random ID and file extension.
        var fileName = (Math.random() * 1000).toString().replace('.', '');
        if (type === 'audio') {
            fileName += '-audio.ogg';
        } else {
            fileName += '-video.webm';
        }

        var data = {
            contextid: pcm.editorScope.get('contextid'),
            type: pcm.recType,
            itemid: pcm.editorScope.get('sesskey'), // Use session key as item ID.
            filename: fileName
        };
        pcm.socket.emit('recording started', data);

        // The options for the recording codecs and bitrates.
        var options = null;
        if (type === 'audio') {
            if (window.MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    mimeType: 'audio/webm;codecs=opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    mimeType: 'audio/ogg;codecs=opus'
                };
            }
        } else {
            if (window.MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: pcm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=vp9,opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: pcm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=h264,opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: pcm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=vp8,opus'
                };
            }
        }

        // If none of the options above are supported, fall back on browser defaults.
        pcm.mediaRecorder = options ? new window.MediaRecorder(stream, options)
                                    : new window.MediaRecorder(stream);

        pcm.socket.on('recording started', function() {
            // Make button clickable again, to allow stopping recording.
            pcm.startStopBtn.set('textContent', M.util.get_string('stoprecording', 'atto_recordrtc'));
            pcm.startStopBtn.set('disabled', false);

            // Mute audio, distracting while recording.
            pcm.player.set('muted', true);

            pcm.mediaRecorder.ondataavailable = pcm.handle_data_available;
            pcm.mediaRecorder.onstop = pcm.handle_stop;
            pcm.mediaRecorder.start(1500); // Capture in 1.5s chunks.
        });
    },

    // Generates link to recorded annotation to be inserted.
    create_annotation: function(type, recording_url) {
        var linkText = window.prompt(M.util.get_string('annotationprompt', 'atto_recordrtc'),
                                     M.util.get_string('annotation:' + type, 'atto_recordrtc'));

        // Return HTML for annotation link, if user did not press "Cancel".
        if (!linkText) {
            return undefined;
        } else {
            var annotation = '<a target="_blank" href="' + recording_url + '">' + linkText + '</a>';
            return annotation;
        }
    },

    // Inserts link to annotation in editor text area.
    insert_annotation: function(type, recording_url) {
        var annotation = pcm.create_annotation(type, recording_url);

        // Insert annotation link.
        // If user pressed "Cancel", just go back to main recording screen.
        if (!annotation) {
            pcm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
        } else {
            pcm.editorScope.setLink(pcm.editorScope, annotation);
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

// Shorten access to M.atto_recordrtc.commonmodule namespace.
var pcm = M.atto_recordrtc.premiumcommonmodule;

M.atto_recordrtc.premiumaudiomodule = {
    init: function(scope) {
        // Assignment of global variables.
        pcm.editorScope = scope; // Allows access to the editor's "this" context.
        pcm.alertWarning = Y.one('div#alert-warning');
        pcm.alertDanger = Y.one('div#alert-danger');
        pcm.player = Y.one('audio#player');
        pcm.playerDOM = document.querySelector('audio#player');
        pcm.startStopBtn = Y.one('button#start-stop');
        pcm.uploadBtn = Y.one('button#upload');
        pcm.recType = 'audio';
        pcm.olderMoodle = scope.get('oldermoodle');
        pcm.socket = window.io(pcm.editorScope.get('serverurl'));

        // Show alert and redirect user if connection is not secure.
        pcm.check_secure();
        // Show alert if using non-ideal browser.
        pcm.check_browser();

        // Connect to premium recording server.
        pcm.init_connection();

        // Run when user clicks on "record" button.
        pcm.startStopBtn.on('click', function() {
            pcm.startStopBtn.set('disabled', true);

            // If button is displaying "Start Recording" or "Record Again".
            if ((pcm.startStopBtn.get('textContent') === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (pcm.startStopBtn.get('textContent') === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (pcm.startStopBtn.get('textContent') === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Make sure the audio player and upload button are not shown.
                pcm.player.ancestor().ancestor().addClass('hide');
                pcm.uploadBtn.ancestor().ancestor().addClass('hide');

                // Change look of recording button.
                if (!pcm.olderMoodle) {
                    pcm.startStopBtn.replaceClass('btn-outline-danger', 'btn-danger');
                }

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make audio stream available at a higher level by making it a property of the common module.
                        pcm.stream = stream;

                        pcm.start_recording(pcm.recType, pcm.stream);
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        pcm.startStopBtn.set('textContent', btnLabel);
                        pcm.startStopBtn.set('disabled', false);
                        if (!pcm.olderMoodle) {
                            pcm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                        }
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        var btnLabel = M.util.get_string('recordingfailed', 'atto_recordrtc');

                        // Handle getUserMedia-thrown errors.
                        switch (error.name) {
                            case 'AbortError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumabort_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumabort', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'NotAllowedError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumnotallowed_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumnotallowed', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'NotFoundError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumnotfound_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumnotfound', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'NotReadableError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumnotreadable_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumnotreadable', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'OverConstrainedError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumoverconstrained_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumoverconstrained', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'SecurityError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumsecurity_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumsecurity', 'atto_recordrtc')
                                    });
                                });

                                pcm.editorScope.closeDialogue(pcm.editorScope);
                                break;
                            case 'TypeError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumtype_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumtype', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            default:
                                break;
                        }
                    }
                };

                // Capture audio stream from microphone.
                M.atto_recordrtc.premiumaudiomodule.capture_audio(commonConfig);
            } else { // If button is displaying "Stop Recording".
                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                window.setTimeout(function() {
                    pcm.startStopBtn.set('disabled', false);
                }, 1000);

                // Stop recording.
                M.atto_recordrtc.premiumaudiomodule.stop_recording(pcm.stream);

                // Change button to offer to record again.
                pcm.startStopBtn.set('textContent', M.util.get_string('recordagain', 'atto_recordrtc'));
                if (!pcm.olderMoodle) {
                    pcm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                }
            }
        });
    },

    // Setup to get audio stream from microphone.
    capture_audio: function(config) {
        pcm.capture_user_media(
            // Media constraints.
            {
                audio: true
            },

            // Success callback.
            function(audioStream) {
                // Set audio player source to microphone stream.
                pcm.playerDOM.srcObject = audioStream;

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
        pcm.mediaRecorder.stop();

        // Stop each individual MediaTrack.
        stream.getTracks().forEach(function(track) {
            track.stop();
        });

        // Show upload button.
        pcm.uploadBtn.ancestor().ancestor().removeClass('hide');
        pcm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
        pcm.uploadBtn.set('disabled', false);

        // Handle when upload button is clicked.
        pcm.uploadBtn.on('click', function() {
            // Trigger error if no recording has been made.
            if (!pcm.player.get('src')) {
                Y.use('moodle-core-notification-alert', function() {
                    new M.core.alert({
                        title: M.util.get_string('norecordingfound_title', 'atto_recordrtc'),
                        message: M.util.get_string('norecordingfound', 'atto_recordrtc')
                    });
                });
            } else {
                pcm.uploadBtn.set('disabled', true);

                pcm.insert_annotation(pcm.recType, pcm.player.get('src'));
            }
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

// Shorten access to M.atto_recordrtc.commonmodule namespace.
var pcm = M.atto_recordrtc.premiumcommonmodule;

M.atto_recordrtc.premiumvideomodule = {
    init: function(scope) {
        // Assignment of global variables.
        pcm.editorScope = scope; // Allows access to the editor's "this" context.
        pcm.alertWarning = Y.one('div#alert-warning');
        pcm.alertDanger = Y.one('div#alert-danger');
        pcm.player = Y.one('video#player');
        pcm.playerDOM = document.querySelector('video#player');
        pcm.startStopBtn = Y.one('button#start-stop');
        pcm.uploadBtn = Y.one('button#upload');
        pcm.recType = 'video';
        pcm.olderMoodle = scope.get('oldermoodle');
        pcm.socket = window.io(pcm.editorScope.get('serverurl'));

        // Show alert and redirect user if connection is not secure.
        pcm.check_secure();
        // Show alert if using non-ideal browser.
        pcm.check_browser();

        // Connect to premium recording server.
        pcm.init_connection();

        // Run when user clicks on "record" button.
        pcm.startStopBtn.on('click', function() {
            pcm.startStopBtn.set('disabled', true);

            // If button is displaying "Start Recording" or "Record Again".
            if ((pcm.startStopBtn.get('textContent') === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (pcm.startStopBtn.get('textContent') === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (pcm.startStopBtn.get('textContent') === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Make sure the upload button is not shown.
                pcm.uploadBtn.ancestor().ancestor().addClass('hide');

                // Change look of recording button.
                if (!pcm.olderMoodle) {
                    pcm.startStopBtn.replaceClass('btn-outline-danger', 'btn-danger');
                }

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make video stream available at a higher level by making it a property of the common module.
                        pcm.stream = stream;

                        pcm.start_recording(pcm.recType, pcm.stream);
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        pcm.startStopBtn.set('textContent', btnLabel);
                        pcm.startStopBtn.set('disabled', false);
                        if (!pcm.olderMoodle) {
                            pcm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                        }
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        var btnLabel = M.util.get_string('recordingfailed', 'atto_recordrtc');

                        // Handle getUserMedia-thrown errors.
                        switch (error.name) {
                            case 'AbortError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumabort_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumabort', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'NotAllowedError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumnotallowed_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumnotallowed', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'NotFoundError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumnotfound_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumnotfound', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'NotReadableError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumnotreadable_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumnotreadable', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'OverConstrainedError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumoverconstrained_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumoverconstrained', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            case 'SecurityError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumsecurity_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumsecurity', 'atto_recordrtc')
                                    });
                                });

                                pcm.editorScope.closeDialogue(pcm.editorScope);
                                break;
                            case 'TypeError':
                                Y.use('moodle-core-notification-alert', function() {
                                    new M.core.alert({
                                        title: M.util.get_string('gumtype_title', 'atto_recordrtc'),
                                        message: M.util.get_string('gumtype', 'atto_recordrtc')
                                    });
                                });

                                // Proceed to treat as a stopped recording.
                                commonConfig.onMediaStopped(btnLabel);
                                break;
                            default:
                                break;
                        }
                    }
                };

                // Show video tag without controls to view webcam stream.
                pcm.player.ancestor().ancestor().removeClass('hide');
                pcm.player.set('controls', false);

                // Capture audio+video stream from webcam/microphone.
                M.atto_recordrtc.premiumvideomodule.capture_audio_video(commonConfig);
            } else { // If button is displaying "Stop Recording".
                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                window.setTimeout(function() {
                    pcm.startStopBtn.set('disabled', false);
                }, 1000);

                // Stop recording.
                M.atto_recordrtc.premiumvideomodule.stop_recording(pcm.stream);

                // Change button to offer to record again.
                pcm.startStopBtn.set('textContent', M.util.get_string('recordagain', 'atto_recordrtc'));
                if (!pcm.olderMoodle) {
                    pcm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                }
            }
        });
    },

    // Setup to get audio+video stream from microphone/webcam.
    capture_audio_video: function(config) {
        pcm.capture_user_media(
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
                pcm.playerDOM.srcObject = audioVideoStream;
                pcm.playerDOM.play();

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
        pcm.mediaRecorder.stop();

        // Stop each individual MediaTrack.
        stream.getTracks().forEach(function(track) {
            track.stop();
        });

        // Show upload button.
        pcm.uploadBtn.ancestor().ancestor().removeClass('hide');
        pcm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
        pcm.uploadBtn.set('disabled', false);

        // Handle when upload button is clicked.
        pcm.uploadBtn.on('click', function() {
            // Trigger error if no recording has been made.
            if (!pcm.player.get('src')) {
                Y.use('moodle-core-notification-alert', function() {
                    new M.core.alert({
                        title: M.util.get_string('norecordingfound_title', 'atto_recordrtc'),
                        message: M.util.get_string('norecordingfound', 'atto_recordrtc')
                    });
                });
            } else {
                pcm.uploadBtn.set('disabled', true);

                pcm.insert_annotation(pcm.recType, pcm.player.get('src'));
            }
        });
    }
};


}, '@VERSION@', {"requires": ["moodle-atto_recordrtc-button"]});
