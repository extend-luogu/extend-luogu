#!/bin/env python

import re

html = open('index.html', 'r')

text = html.readlines()
for i, ln in enumerate(text):
    m = re.match(r'^\t<script src="(.*?)"></script>', ln)
    if m:
        fn = m.group(1)
        js = open(fn, 'r').readlines()
        text[i] = '\t<script>\n' + ''.join(js) + '\t</script>\n\n'
        print('Bundling script <%s> @ %d' % (fn, i))
        continue
    
    m = re.match(r'^\t<link rel="stylesheet" type="text/css" href="(.*?)" />', ln)
    if m:
        fn = m.group(1)
        css = open(fn, 'r').readlines()
        text[i] = '\t<style>\n' + ''.join(css) + '\t</style>\n\n'
        print('Bundling stylesheet <%s> @ %d' % (fn, i))
        continue

html.close()

html = open('bundle.html', 'w')

html.writelines(text)
print('Finishing bundling')

