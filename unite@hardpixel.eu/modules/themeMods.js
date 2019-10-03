const GObject      = imports.gi.GObject;
const Gtk          = imports.gi.Gtk;
const Main         = imports.ui.main;
const Unite        = imports.misc.extensionUtils.getCurrentExtension();
const Base         = Unite.imports.module.BaseModule;
const versionCheck = Unite.imports.helpers.versionCheck;

var ThemeMods = new GObject.Class({
  Name: 'UniteThemeMods',
  Extends: Base,

  _onInitialize() {
    this.gtkSettings = Gtk.Settings.get_default();
    this._mainStyles = Main.uiGroup.get_style();
    this._appMenu    = Main.panel.statusArea.appMenu;
    this._leftBox    = Main.panel._leftBox;
    this._centerBox  = Main.panel._centerBox;
    this._rightBox   = Main.panel._rightBox;
  },

  _onActivate() {
    this._signals.connect(this.gtkSettings, 'notify::gtk-font-name', 'updateShellFont');
    this._signals.connect(this._leftBox, 'actor_added', 'removePanelArrows');
    this._signals.connect(this._centerBox, 'actor_added', 'removePanelArrows');
    this._signals.connect(this._rightBox, 'actor_added', 'removePanelArrows');

    this._settings.connect('use-system-fonts', 'updateShellFont');
    this._settings.connect('hide-app-menu-icon', 'toggleAppMenuIcon');

    this._addAppmenuSpacing();

    this._setShellFont();
    this._toggleAppMenuIcon();
    this._removePanelArrows();
  },

  _onDeactivate() {
    this._removeAppmenuSpacing();

    this._resetShellFont();
    this._resetAppMenuIcon();
    this._resetPanelArrows();
  },

  _addAppmenuSpacing() {
    if (versionCheck('< 3.34.0')) {
      Main.panel._addStyleClassName('appmenu-spacing');
    }
  },

  _removeAppmenuSpacing() {
    if (versionCheck('< 3.34.0')) {
      Main.panel._removeStyleClassName('appmenu-spacing');
    }
  },

  _setShellFont() {
    const enabled = this._settings.get('use-system-fonts');
    if (!enabled) return;

    const gtkFont = this.gtkSettings.gtk_font_name;
    const cssFont = gtkFont.replace(/\s\d+$/, '');

    Main.uiGroup.set_style(`font-family: ${cssFont};`);
    this._addClass('system-fonts');
  },

  _resetShellFont() {
    Main.uiGroup.set_style(this._mainStyles);
    this._removeClass('system-fonts');
  },

  _updateShellFont() {
    this._resetShellFont();
    this._setShellFont();
  },

  _toggleAppMenuIcon() {
    const enabled = this._settings.get('hide-app-menu-icon');

    if (enabled) {
      this._appMenu._iconBox.hide();
    } else {
      this._resetAppMenuIcon();
    }
  },

  _resetAppMenuIcon() {
    this._appMenu._iconBox.show();
  },

  _getWidgetArrow(widget) {
    let arrow = widget._arrow;

    if (!arrow) {
      const item  = widget.get_children ? widget : widget.actor;
      const last  = item.get_n_children() - 1;
      const actor = item.get_children()[last];

      if (!actor) return;

      if (actor.has_style_class_name && actor.has_style_class_name('popup-menu-arrow'))
        arrow = actor;
      else
        arrow = this._getWidgetArrow(actor);
    }

    if (arrow && !widget.hasOwnProperty('_arrow'))
      widget._arrow = arrow;

    return arrow;
  },

  _toggleWidgetArrow(widget, hide) {
    const arrow = this._getWidgetArrow(widget);
    if (!arrow) return;

    arrow.visible = !hide;
  },

  _removePanelArrows() {
    for (const [name, widget] of Object.entries(Main.panel.statusArea)) {
      if (name != 'aggregateMenu' && widget && !widget._arrowHandled) {
        widget._arrowHandled = true;
        this._toggleWidgetArrow(widget, true);
      }
    }
  },

  _resetPanelArrows() {
    for (const [name, widget] of Object.entries(Main.panel.statusArea)) {
      if (name != 'aggregateMenu' && widget && widget._arrowHandled) {
        this._toggleWidgetArrow(widget, false);
        delete widget._arrowHandled;
      }
    }
  },

  _addClass(name) {
    Main.panel._addStyleClassName(name);
  },

  _removeClass(name) {
    Main.panel._removeStyleClassName(name);
  }
});
