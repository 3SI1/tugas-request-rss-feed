// link rss berita
const portals = [
    {
        id: "detikNasional",
        rsslink: "http://rss.detik.com/index.php/detikcom_nasional",
    },
    {
        id: "vice",
        rsslink: `https://www.vice.com/id_id/rss`,
    },
    {
        id: "antara",
        rsslink: "https://www.antaranews.com/rss/top-news",
    }
]

// fungsi request xml dari link rss
const getNewsXML = (portals) => {
    $.each(portals, (index, portal) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                $(`#newsItems`).append(showResultXML(xhttp.responseXML, portal));
            }
        };
        xhttp.open("GET", portal.rsslink, true);
        xhttp.send();
    })
}

// fungsi menampilkan berita dari data XML
const showResultXML = (xml, portal) => {
    let txt = "";
    const itemPath = "rss/channel/item";
    const titlePath = "rss/channel/title";
    const linkPath = "rss/channel/link";
    const nodes = xml.evaluate(itemPath, xml, null, XPathResult.ANY_TYPE, null);
    const portalTitle = xml.evaluate(titlePath, xml, null, XPathResult.ANY_TYPE, null).iterateNext().textContent;
    const portalLink = xml.evaluate(linkPath, xml, null, XPathResult.ANY_TYPE, null).iterateNext().textContent;

    let result = nodes.iterateNext();
    while (result) {
        let title = result.querySelector('title').textContent;
        let link = result.querySelector('link').textContent;
        let pubDate = result.querySelector('pubDate').textContent.substr(0, 16);
        let desc = result.querySelector('description').textContent.replace(/<img([^>]*)>/g, '');
        let thumbnail = result.querySelector('description').textContent.match(/src\s*=\s*"(.+?)"/g);
        if (portal.id == 'vice') {
            thumbnail = `src="${result.querySelector('enclosure').getAttribute('url')}"`;
        }

        const newsAttribute = {
            portalTitle: portalTitle,
            portalLink: portalLink,
            newsTitle: title,
            newsLink: link,
            newsPubDate: pubDate,
            newsThumbnail: thumbnail,
            newsDesc: desc
        };

        txt += newsItem(newsAttribute)
        result = nodes.iterateNext();
    }

    return txt;
}

// fungsi request xml dari link rss dan diconvert ke json
const getNewsJson = async (portals) => {
    $.each(portals, async (index, portal) => {
        try {
            const response = await fetch(portal.rsslink);
            const responseXml = await response.text();
            if (responseXml.error) {
                showResponseMessage(responseXml.message);
            } else {
                const responseJson = await JSON.parse(xmlToJson(responseXml));
                $(`#newsItems`).append(showResultJSON(responseJson, portal));
            }
        } catch (error) {
            showResponseMessage(error);
        }
    })
}

// fungsi menampilkan berita dari data json
const showResultJSON = (json, portal) => {
    let txt = '';
    const portalTitle = json.rss.channel.title;
    const portalLink = json.rss.channel.link;
    const items = json.rss.channel.item;
    $.each(items, (index, item) => {
        let title = item.title["#cdata-section"];
        let link = item.link;
        let desc = item.description["#cdata-section"].replace(/<img([^>]*)>/g, '');
        let pubDate = item.pubDate.substr(0, 16);
        let thumbnail;

        if (portal.id == 'antara') {
            title = item.title;
            thumbnail = item.description["#cdata-section"].match(/src\s*=\s*"(.+?)"/g);
        } else {
            thumbnail = `src="${item.enclosure['-url']}"`;
        }

        const newsAttribute = {
            portalTitle: portalTitle,
            portalLink: portalLink,
            newsTitle: title,
            newsLink: link,
            newsPubDate: pubDate,
            newsThumbnail: thumbnail,
            newsDesc: desc
        };

        txt += newsItem(newsAttribute)
    });

    return txt;
}

// fungsi membuat card berita
const newsItem = attribute => {
    return `<div class="card">
                <a href="${attribute.newsLink}">
                    <img class="card-img-top" ${attribute.newsThumbnail}>
                </a>
                <div class="card-body">
                    <a href="${attribute.portalLink}" class="portal-name">${attribute.portalTitle}</a>
                    <a href="${attribute.newsLink}" class="card-title">
                        <span>${attribute.newsTitle}</span>
                    </a>
                    <p class="card-text">${attribute.newsDesc}</p>
                    <a href="${attribute.newsLink}" class="btn">Baca Selengkapnya</a>
                    <div class="pub-date">${attribute.newsPubDate}</div>
                </div>
            </div>`
}

const showResponseMessage = message => {
    console.log(message);
}

function loadData() {
    let data = $('#load');
    let news = $(`#newsItems`);
    // load data json
    if (data.text().match("Load JSON")) {
        data.html("Load XML");
        news.html("");
        getNewsJson(portals)
    } else { // load data XML
        data.html("Load JSON");
        news.html("");
        getNewsXML(portals)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    getNewsXML(portals)
});