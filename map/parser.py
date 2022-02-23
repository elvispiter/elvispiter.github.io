from urllib import response
import requests
import urllib.parse
cookies = {
    'PHPSESSID': '1d3dcf31af33cf434acc1ac538fd6ba7',
}

headers = {
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Origin': 'http://elvispiter.ru',
    'Referer': 'http://elvispiter.ru/index.php?r=bb/group&id=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,45,46,47,48,49,50',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh;q=0.5',
}

params = (
    ('r', 'bb/ajaxReq'),
)
def get_image(id):
    data = {
    'val_id': id
    }
    return requests.post('http://elvispiter.ru/index.php', headers=headers, params=params, cookies=cookies, data=data, verify=False)


def slice(s: str, start, stop):
    return s[s.find(start) + len(start):s.find(stop)]

uids = list()

with open('parse.html', encoding='utf-8') as f:
    for line in f.readlines():
        if 'dowin' in line:
            line = line[:len(line) - len('</td></tr>') - 1]
            #print(line)
            uid = slice(line, "dowin('", "');")
            if(uid in uids):
                print('dublicate!')
                continue
            uids.append(uid)
            
            guid = slice(line, "<td>", "</td>").rstrip()
            adress = slice(line, ');">', '</a>')
            direction = line[line.find('</a></td><td>') + len('</a></td><td>'):line.rfind('</td><td>')]
            side = line[line.rfind('</td><td') + len('</td><td') + 1:]
            resp = get_image(uid).text
            img = resp[resp.rfind('src="/i') + len('src="') + 1:]
            img = img[:img.rfind('" >')]
            img = urllib.parse.quote(img)
            if not img:
                print('wtf', uid, resp)
            with open('elvis.csv', 'a', encoding='utf-8') as csv:
                csv.write(f'{uid};{guid};{adress};{direction};{side};http://elvispiter.ru/{img}\n')
