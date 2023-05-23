import requests
from bs4 import BeautifulSoup
import datetime
import time
import json

# nacteni konfiguraku
with open('config.json', 'r') as f:
    config = json.load(f)

days = {}
textnormal_3_data = {}

def fetchDays():
    global days
    global textnormal_3_data
    days = {}
    textnormal_3_data = {}

    dtime = 0

    while True:
        day = datetime.datetime.now() + datetime.timedelta(days=dtime)
        url = "https://www.gymkc.cz/suplovani/" + day.strftime("%Y-%m-%d") + ".html"
        # url = "https://www.gymkc.cz/suplovani/2023-03-30.html" # testovaci den
        page = requests.get(url)
        soup = BeautifulSoup(page.content, 'html.parser')

        table = soup.find("table", {"class": "tb_supltrid_3"})
        textnormal_3 = soup.find("p", {"class": "textnormal_3"})

        if textnormal_3:
            textnormal_3_data[day.strftime("%Y-%m-%d")] = textnormal_3.text.strip()

        data = []
        # kontrola jestli uz je dostupny dalsi den a jestli to neni vikend
        if table is None and day.weekday() < 5:
            break
        if table is None and day.weekday() > 5:
            dtime += 1
            continue
        else:
            rows = table.find_all("tr")

            for row in rows[1:]:
                cols = row.find_all("td")
                cols = [ele.text.strip() for ele in cols]
                data.append((cols[0], cols[1:]))

            days[day.strftime("%Y-%m-%d")] = data
        # break
        dtime += 1

while True:
    fetchDays()
    
    with open("data.json", "w") as f:
        json.dump(days, f, ensure_ascii=False, indent=2)
    with open("oznameni.json", "w") as f:
        json.dump(textnormal_3_data, f, ensure_ascii=False, indent=2)
    # znova zkouknu jestli se neco nezmenilo kazdych x sekund
    time.sleep(config['interval_aktualizace_dat_sekundy'])