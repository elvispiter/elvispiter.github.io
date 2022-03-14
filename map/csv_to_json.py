import json

items = list()
with open('elvis5.csv', encoding='utf-8') as csv:
    for line in csv.read().split('\n'):
        item = dict()
        line = line.split(';')
        item['uuid'], item['id'], item['address'], item['direction'], item['location'], item['sides'], item['images'] = line
        item['sides'] = item['sides'].split(', ')
        item['images'] = item['images'].split(', ')
        item['location'] = [*map(float, item['location'].split(', '))]
        item['location'].reverse()
        #if 'onmouseover' in item['image']:
        #    print(f'Wrong URL! Id: {item["id"]}')
        items.append(item)

with open('elvis.json', 'w', encoding='utf-8') as data:
    data.write(json.dumps(items))
