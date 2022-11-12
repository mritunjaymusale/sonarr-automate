import puppeteer from "puppeteer";
import * as fs from "fs";


(async () => {
    const browser = await puppeteer.launch({ headless: false ,defaultViewport: null});
    const page = await browser.newPage();
    
    // auth.json contains the cookies that you have to manually copy from the browser
    let rawdata = fs.readFileSync('auth.json');
    let cookies = JSON.parse(rawdata);
    
    await setPageCookiesBasedOnAuthJson(page, cookies);
    await page.goto("<sonarr_link>/series/<show>");

    // !  hardcoded loop 
    while (true) {
        
        
        await clickManageEpisodesButtonWhenLoaded(page);

        
        const tableSelector = await getListOfEpisodesTableAfterLoading(page);
        
        var { rows, rowSelector } = await getRowsFromTable(tableSelector, page);
        
        for (let i = 0; i < rows.length; i++) {
        
            // localFileName is RelativePath in Sonarr
            let { episode, checkbox, localFileName } = await getCellDataFromRow(page, rowSelector, i);

            // if episode is blank for a row, then it means that episode is missing
            if (episode === "") {
                // click the checkbox
                await checkbox.click();
                
                // select the "episodes" from the dropdown, which is at the bottom of the ui
                await selectEpisodeFromDropdown(page);
                
                // now another table appears with the episodes, need to apply the same logic as above but instead the episode name needs to be searched in the new table and then clicked but without the ".mp4" part

                // insert in the search box the local video file name which is the relative path in sonarr db
                await fillSecondPopUpTableModal(page, localFileName);

                // hit the import button
                await clickImportButton(page);
                
                // wait for the import to finish
                await new Promise(r => setTimeout(r, 1000));

                // breaks the inner for loop but outer loop will continue
                break;
            }
        }
        
    }
    
})();


async function fillSecondPopUpTableModal(page, localFileName) {
    await typeLocalFileNameInSearchBar(page, localFileName);

    // select the checkbox with the first result
    await clickCheckboxOfFirstResult(page);

    // hit the select episode button
    await clickSelectEpisodeButton(page);
}

async function clickImportButton(page) {
    await page.click("#portal-root > div > div > div > div > div > div.InteractiveImportModalContent-footer-1DZmX.ModalFooter-modalFooter-3jawm > div.InteractiveImportModalContent-rightButtons-1-U0i > button.Button-button-1tAe5.Link-link-1HpiV.Button-success-2zRuG.Button-medium-2em98.Link-link-1HpiV");
}

async function clickSelectEpisodeButton(page) {
    await page.click("#portal-root > div > div > div > div > div > div.SelectEpisodeModalContent-footer-2ixvK.ModalFooter-modalFooter-3jawm > div.SelectEpisodeModalContent-buttons-3gzNo > button.Button-button-1tAe5.Link-link-1HpiV.Button-success-2zRuG.Button-medium-2em98.Link-link-1HpiV");
}

async function clickCheckboxOfFirstResult(page) {
    const checkboxFromSearchResult = "#portal-root > div > div > div > div > div > div.SelectEpisodeModalContent-modalBody-3etyO.ModalBody-modalBody-1BZJ6.Scroller-scroller-_8_uO.Scroller-none-M_Ysn.Scroller-autoScroll-2_rs9 > div > div > table > tbody > tr > td.TableSelectCell-selectCell-IK1fB.TableRowCell-cell-1CLnf";
    await page.waitForSelector(checkboxFromSearchResult);
    await page.click(checkboxFromSearchResult);
}

async function typeLocalFileNameInSearchBar(page, localFileName) {
    const searchInputWithinSecondSelector = "#portal-root > div > div > div > div > div > div.SelectEpisodeModalContent-modalBody-3etyO.ModalBody-modalBody-1BZJ6.Scroller-scroller-_8_uO.Scroller-none-M_Ysn.Scroller-autoScroll-2_rs9 > input";
    await page.waitForSelector(searchInputWithinSecondSelector);
    await page.type(searchInputWithinSecondSelector,
        localFileName.replace(".mp4", ""));
}

async function selectEpisodeFromDropdown(page) {
    const drowndowmSeletor = "#portal-root > div > div > div > div > div > div.InteractiveImportModalContent-footer-1DZmX.ModalFooter-modalFooter-3jawm > div.InteractiveImportModalContent-leftButtons-2T20q > select";
    await page.select(drowndowmSeletor, 'episode');
}

async function getCellDataFromRow(page, rowSelector, i) {
    let cells = await page.$$(rowSelector + ":nth-child(" + (i + 1) + ") > td");
    let checkbox = await cells[0].$("input");
    let localFileName = await page.evaluate((cell) => cell.innerText, cells[1]);
    let episode = await page.evaluate((cell) => cell.innerText, cells[3]);
    return { episode, checkbox, localFileName };
}

async function getRowsFromTable(tableSelector, page) {
    const rowSelector = tableSelector + " > tbody > tr";
    let rows = await page.$$(rowSelector);
    return { rows, rowSelector };
}

async function getListOfEpisodesTableAfterLoading(page) {
    const tableSelector = "#portal-root > div > div > div > div > div > div.ModalBody-modalScroller-20byr.Scroller-scroller-_8_uO.Scroller-both-3q6bq.Scroller-autoScroll-2_rs9 > div > div > table";
    await page.waitForSelector(tableSelector);
    return tableSelector;
}

async function clickManageEpisodesButtonWhenLoaded(page) {
    const manageEpisodesButton = "#root > div > div.Page-main-3AyGO > div.PageContent-content-B3Bmu > div.PageToolbar-toolbar-WwUGV > div:nth-child(1) > div > button:nth-child(5)";
    await page.waitForSelector(manageEpisodesButton);
    await page.click(manageEpisodesButton);
}

async function setPageCookiesBasedOnAuthJson(page, cookies) {
    await page.setCookie(cookies);
    
}

