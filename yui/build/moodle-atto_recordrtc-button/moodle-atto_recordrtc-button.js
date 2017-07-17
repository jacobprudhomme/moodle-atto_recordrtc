YUI.add('moodle-atto_recordrtc-button', function (Y, NAME) {

/*
* @package    atto_recordrtc
* @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
* @copyright  2016 Blindside Networks Inc.
* @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
*/

/**
 * @module moodle-atto_recordrtc-button
 */

/**
 * Atto text editor recordrtc plugin.
 *
 * @namespace M.atto_recordrtc
 * @class button
 * @extends M.editor_atto.EditorPlugin
 */

var PLUGINNAME = 'atto_recordrtc',
    RECORDRTC = 'recordrtc',
    STATE = false;
var atto_recordrtc_button;

Y.namespace('M.atto_recordrtc').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
    initializer: function() {
        var button = this.addButton({
            icon: 'icon',
            iconComponent: 'atto_recordrtc',
            callback: this._toggle
        });
        button.set('title', M.util.get_string('pluginname', PLUGINNAME));
        // If there is an event that may resize the editor, adjust the size of the recordrtc.
        Y.after('windowresize', Y.bind(this._fitToScreen, this));
        this.editor.on(['gesturemove', 'gesturemoveend'], Y.bind(this._fitToScreen, this), {
            standAlone: true
        }, this);
        this.toolbar.on('click', Y.bind(this._fitToScreen, this));
        //Object to be used from the iframe
        Y.namespace('M.atto_recordrtc').atto_recordrtc_button = this;
    },

    /**
     * Toggle recordrtc and normal display mode
     *
     * @method _toggle
     * @param {EventFacade} e
     * @private
     */
    _toggle: function(e) {
        e.preventDefault();
        this._toggle_action();
    },

    /**
     * Toggle recordrtc and normal display mode (actual action)
     *
     * @method _toggle_action
     * @private
     */
    _toggle_action: function() {
        var button = this.buttons[RECORDRTC];

        var id_submitbutton = Y.one('#id_submitbutton');
        if (button.getData(STATE)) {
            this.unHighlightButtons(RECORDRTC);
            this._setrecordrtc(button);
            id_submitbutton.set('disabled', false);
            id_submitbutton.removeClass('disabled');
        } else {
            this.highlightButtons(RECORDRTC);
            this._setrecordrtc(button, true);
            id_submitbutton.set('disabled', true);
            id_submitbutton.addClass('disabled');
        }
    },

    /**
     * Adjust editor to screen size
     *
     * @method _fitToScreen
     * @private
     */
    _fitToScreen: function() {
        var button = this.buttons[RECORDRTC];
        if (!button.getData(STATE)) {
            return;
        }
        var host = this.get('host');
        this.recordrtc.setStyles({
            position: "absolute",
            height: host.editor.getComputedStyle('height'),
            width: host.editor.getComputedStyle('width'),
            top: host.editor.getComputedStyle('top'),
            left: host.editor.getComputedStyle('left')
        });
        this.recordrtc.setY(this.editor.getY());
    },

    /**
     * Change recordrtc display state
     *
     * @method _setrecordrtc
     * @param {Node} button The recordrtc button
     * @param {Boolean} mode Whether the editor display recordrtc * @private
     */
    _setrecordrtc: function(button, mode) {
        var host = this.get('host');

        if (mode) {
            this.recordrtc = Y.Node.create('<iframe src="'
                + this.get('recordrtcurl') + '?sesskey='
                + this.get('sesskey')
                + '&contextid=' + this.get('contextid')
                + '&content=' + encodeURIComponent(host.textarea.get('value'))
                + '" srcdoc=""></iframe');
            this.recordrtc.setStyles({
                backgroundColor: Y.one('body').getComputedStyle('backgroundColor'),
                backgroundImage: 'url(' + M.util.image_url('i/loading', 'core') + ')',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center'
            });
            host._wrapper.appendChild(this.recordrtc);

            // Now we try this using the io module.
            var params = {
                    sesskey: this.get('sesskey'),
                    contextid: this.get('contextid'),
                    content: host.textarea.get('value')
                };

            // Fetch content and load asynchronously.
            Y.io(this.get('recordrtcurl'), {
                    context: this,
                    data: params,
                    on: {
                            complete: this._loadContent
                        },
                    method: 'POST'
                });

            // Disable all plugins.
            host.disablePlugins();

            // And then re-enable this one.
            host.enablePlugins(this.name);

            // Enable fullscreen plugin if present.
            if (typeof Y.M.atto_fullscreen !== 'undefined') {
                host.enablePlugins('fullscreen');
            }

        } else {
            this.recordrtc.remove(true);

            // Enable all plugins.
            host.enablePlugins();
        }
        button.setData(STATE, !!mode);
        this._fitToScreen();

    },

    /**
     * Load filtered content into iframe
     *
     * @param {String} id
     * @param {EventFacade} e
     * @method _loadContent
     * @private
     */
    _loadContent: function(id, e) {
        var content = e.responseText;

        this.recordrtc.setAttribute('srcdoc', content);
    },

    _annotate: function(annotation) {
        // Add annotation
    }
}, {
    ATTRS: {
        /**
         * The url to use when loading the recordrtc.
         *
         * @attribute recordrtcurl
         * @type String
         */
        recordrtcurl: {
            value: null
        },

        /**
         * The contextid to use when generating this recordrtc.
         *
         * @attribute contextid
         * @type String
         */
        contextid: {
            value: null
        },

        /**
         * The sesskey to use when generating this recordrtc.
         *
         * @attribute sesskey
         * @type String
         */
        sesskey: {
            value: null
        }
    }
});


}, '@VERSION@', {"requires": ["moodle-editor_atto-plugin"]});