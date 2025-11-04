function mockPanelWindow() {
    const html =
        '<!doctype html><html><body><div id="chaoContainer"></div></div></body></html>';

    var jsdom = require('jsdom');
    var document = new jsdom.JSDOM(html);
    var window = document.window;

    global.document = window.document;
    global.window = window;
    window.console = global.console;
}

mockPanelWindow();
