import json

with open('elvisTest.json', encoding='utf-8') as f:
    data = json.loads(f.read())
with open('elvis.csv', encoding='utf-8') as f:
    csv = f.read().split('\n')

for i in data:
    i.append(list())
    for j in range(len(i[-2])):
        id = i[0]
        id = f'tr{id}.{j}'
        direction = ''
        print(id)
        for y in csv:
            if y.split(';')[0] == id:
                i[-1].append(y.split(';')[-1])
                direction = y.split(';')[-2]
                break
        else:
            print(f'no image found for id {id}')
        
    with open('elvis2.csv', 'a', encoding='utf-8') as f:
        f.write(f'{i[0]};{i[1]};{direction};{", ".join(map(str, i[2]))};{", ".join(i[4])};{", ".join(i[5])}\n')