javascript:
(() => {
    const scriptData = {
        name: 'Mass Attack Planner',
        version: 'v1.1.8',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink: 'https://forum.tribalwars.net/index.php?threads/mass-attack-planner.285331/',
    };

    const LS_PREFIX = `ra_massAttackPlanner_`;
    const TIME_INTERVAL = 1000 * 60 * 60 * 24 * 30;
    const LAST_UPDATED_TIME = localStorage.getItem(`${LS_PREFIX}_last_updated`) ?? 0;
    let unitInfo;

    initDebug();

    if (LAST_UPDATED_TIME !== null && Date.now() < Number(LAST_UPDATED_TIME) + TIME_INTERVAL) {
        unitInfo = JSON.parse(localStorage.getItem(`${LS_PREFIX}_unit_info`));
        init(unitInfo);
    } else {
        fetchUnitInfo();
    }

    function init(unitInfo) {
        const currentDateTime = getCurrentDateTime();
        let knightSpeed = 0;
        if (game_data.units.includes('knight')) {
            knightSpeed = unitInfo?.config['knight'].speed || 0;
        }

        const content = `
            <div class="ra-container">
                <h1>${scriptData.name}</h1>
                <label>Arrival Time <input id="arrival_time" type="text" value="${currentDateTime}"></label>
                <input type="hidden" id="nobleSpeed" value="${unitInfo.config['snob'].speed}">
                
                <div class="row">
                    <label>Slowest Nuke Unit
                        <select id="nuke_unit">
                            <option value="${unitInfo.config['axe'].speed}">Axe</option>
                            <option value="${unitInfo.config['light'].speed}">LC/MA/Paladin</option>
                            <option value="${unitInfo.config['heavy'].speed}">HC</option>
                            <option value="${unitInfo.config['ram'].speed}" selected>Ram/Cat</option>
                        </select>
                    </label>

                    <label>Slowest Support Unit
                        <select id="support_unit">
                            <option value="${unitInfo.config['spear'].speed}">Spear/Archer</option>
                            <option value="${unitInfo.config['sword'].speed}" selected>Sword</option>
                            <option value="${unitInfo.config['spy'].speed}">Spy</option>
                            <option value="${knightSpeed}" data-option-unit="knight">Paladin</option>
                            <option value="${unitInfo.config['heavy'].speed}">HC</option>
                            <option value="${unitInfo.config['catapult'].speed}">Cat</option>
                        </select>
                    </label>
                </div>

                <label>Targets Coords <textarea id="target_coords"></textarea></label>

                <div class="row">
                    <div>
                        <label>Nobles Coords <textarea id="nobel_coords"></textarea></label>
                        <label>Nobles per Target <input id="nobel_count" type="text" value="1"></label>
                    </div>
                    <div>
                        <label>Nukes Coords <textarea id="nuke_coords"></textarea></label>
                        <label>Nukes per Target <input id="nuke_count" type="text" value="1"></label>
                    </div>
                    <div>
                        <label>Support Coords <textarea id="support_coords"></textarea></label>
                        <label>Support per Target <input id="support_count" type="text" value="1"></label>
                    </div>
                </div>

                <button id="submit_btn" onclick="handleSubmit()">Get Plan!</button>
                <label>Results <textarea id="results"></textarea></label>

                <footer>
                    <small><strong>${scriptData.name} ${scriptData.version}</strong> - 
                        <a href="${scriptData.authorUrl}" target="_blank">${scriptData.author}</a> - 
                        <a href="${scriptData.helpLink}" target="_blank">Help</a>
                    </small>
                </footer>
            </div>
        `;

        const style = `
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 10px; box-sizing: border-box; background-color: #f4e4bc; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                label { display: block; margin-bottom: 10px; font-weight: bold; }
                input[type="text"], select, textarea {
                    width: 100%; padding: 6px; margin-top: 4px;
                    box-sizing: border-box; border: 1px solid #999;
                }
                textarea { height: 60px; resize: vertical; }
                button {
                    background-color: #603000; color: white; font-weight: bold;
                    padding: 10px 15px; border: none; cursor: pointer; margin-top: 15px;
                }
                .row {
                    display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;
                }
                .row > div, .row > label { flex: 1 1 30%; min-width: 200px; }
                footer { margin-top: 15px; font-size: 12px; }
                a { color: #603000; font-weight: bold; text-decoration: none; }
            </style>
        `;

        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${scriptData.name}</title>
                ${style}
            </head>
            <body>
                ${content}
                <script>
                    function loadJS(url, callback) {
                        const script = document.createElement('script');
                        script.src = url;
                        script.onload = callback;
                        document.body.appendChild(script);
                    }

                    loadJS('https://code.jquery.com/jquery-3.6.0.min.js', function () {
                        loadJS('https://twscripts.dev/scripts/attackPlannerHelper.js', function () {
                            console.log('Helper script loaded!');
                        });
                    });
                </script>
            </body>
            </html>
        `;

        const plannerWindow = window.open('', '', 'width=1000,height=800,resizable=1,scrollbars=1');
        plannerWindow.document.write(html);
        plannerWindow.document.close();
    }

    function fetchUnitInfo() {
        jQuery.ajax({
            url: '/interface.php?func=get_unit_info',
        }).done(function (response) {
            unitInfo = xml2json(jQuery(response));
            localStorage.setItem(`${LS_PREFIX}_unit_info`, JSON.stringify(unitInfo));
            localStorage.setItem(`${LS_PREFIX}_last_updated`, Date.now());
            init(unitInfo);
        });
    }

    function xml2json($xml) {
        let data = {};
        $xml.children().each(function () {
            const $this = jQuery(this);
            if ($this.children().length > 0) {
                data[$this.prop('tagName')] = xml2json($this);
            } else {
                data[$this.prop('tagName')] = $this.text().trim();
            }
        });
        return data;
    }

    function getCurrentDateTime() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0') + ' ' +
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0') + ':' +
            String(d.getSeconds()).padStart(2, '0');
    }

    function initDebug() {
        console.debug(`[${scriptData.name} ${scriptData.version}] Initialized`);
        console.debug(`[${scriptData.name}] Help: ${scriptData.helpLink}`);
    }
})();
