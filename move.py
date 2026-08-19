import sys
lines = open('index.html','r',encoding='utf-8').readlines()
# find drivers start
for i,line in enumerate(lines):
    if '<section class=\"screen\" data-panel=\"drivers\" id=\"screen-drivers\">' in line:
        ds=i; break
# find drivers end after ds
for i in range(ds,len(lines)):
    if lines[i].strip()=='</section>':
        de=i; break
# find div line
for i in range(ds,de+1):
    if 'id=\"drivers-journey-summary\"' in lines[i]:
        div=lines[i]; lines.pop(i); de-=1; break
# find routes start
for i,line in enumerate(lines):
    if '<section class=\"screen\" data-panel=\"routes\" id=\"screen-routes\">' in line:
        rs=i; break
# find routes end after rs
for i in range(rs,len(lines)):
    if lines[i].strip()=='</section>':
        re=i; break
# find routes-app div
for i in range(rs,re+1):
    if '<div id=\"routes-app\"' in lines[i]:
        insert=i+1; break
lines.insert(insert,div)
open('index.html','w',encoding='utf-8').write(''.join(lines))
