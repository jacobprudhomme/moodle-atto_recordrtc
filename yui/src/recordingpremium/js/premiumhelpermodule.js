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
    hm = M.atto_recordrtc.premiumhelpermodule;

M.atto_recordrtc.premiumhelpermodule = {
    // Unitialized variables to be used by the other modules.
    socket: null,

    // Attempt to connect to the premium server via Socket.io.
    init_connection: function() {
        // Dialogue-closing behaviour.
        var closeDialogue = function() {
            cm.editorScope.closeDialogue(cm.editorScope);
        };

        hm.socket.connect();

        hm.socket.on('connect', function() {
            // Send key and secret from Moodle settings.
            hm.socket.emit('authentication', {
                key: cm.editorScope.get('apikey'),
                secret: cm.editorScope.get('apisecret')
            });

            hm.socket.on('authenticated', function() {
                // Continue as normal.
            });

            hm.socket.on('unauthorized', function() {
                cm.show_alert('notpremium', closeDialogue);
            });
        });

        hm.socket.on('connect_error', function() {
            hm.socket.disconnect();

            cm.show_alert('servernotfound', closeDialogue);
        });
    },

    // Push chunks of audio/video to server when made available.
    handle_data_available: function(event) {
        hm.socket.emit('data available', event.data);
    },

    // Stop recording and handle end.
    handle_stop: function() {
        cm.startStopBtn.set('textContent', 'Start Recording');

        hm.socket.emit('recording stopped');

        hm.socket.on('save finished', function(path) {
            cm.player.set('src', path);
            cm.player.set('controls', true);
            cm.player.set('muted', false);
            cm.player.ancestor().ancestor().removeClass('hide'); // Only audio player is hidden at this point.

            // Show upload button.
            cm.uploadBtn.set('disabled', false);
            cm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
            cm.uploadBtn.ancestor().ancestor().removeClass('hide');

            // Handle when upload button is clicked.
            cm.uploadBtn.on('click', function() {
                // Trigger error if no recording has been made.
                if (!cm.player.get('src')) {
                    cm.show_alert('norecordingfound');
                } else {
                    cm.uploadBtn.set('disabled', true);

                    cm.insert_annotation(cm.recType, cm.player.get('src'));
                }
            });
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
            contextid: cm.editorScope.get('contextid'),
            type: cm.recType,
            itemid: cm.editorScope.get('sesskey'), // Use session key as item ID.
            filename: fileName
        };
        hm.socket.emit('recording started', data);

        // If none of the mime-types are supported, fall back on browser defaults.
        var options = cm.best_rec_options(type);
        cm.mediaRecorder = new window.MediaRecorder(stream, options);

        hm.socket.on('recording started', function() {
            // Make button clickable again, to allow stopping recording.
            cm.startStopBtn.set('textContent', M.util.get_string('stoprecording', 'atto_recordrtc'));
            cm.startStopBtn.set('disabled', false);

            // Mute audio, distracting while recording.
            cm.player.set('muted', true);

            cm.mediaRecorder.ondataavailable = hm.handle_data_available;
            cm.mediaRecorder.onstop = hm.handle_stop;
            cm.mediaRecorder.start(1500); // Capture in 1.5s chunks.
        });
    }
};
