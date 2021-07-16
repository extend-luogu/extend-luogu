#!/bin/env python3

import re


with open("index.html", "r") as html:
    text = html.readlines()

for i, ln in enumerate(text):
    m = re.match(r'^\t<script src="(.*?)"></script>', ln)
    if m:
        fn = m.group(1)
        with open(fn, "r") as js:
            text[i] = (
                "\t<script>\n" + "".join(js.readlines()) + "\t</script>\n\n"
            )
        print("Bundling script <%s> @ %d" % (fn, i))
        continue

    m = re.match(
        r'^\t<link rel="stylesheet" type="text/css" href="(.*?)" />', ln
    )
    if m:
        fn = m.group(1)
        with open(fn, "r") as css:
            text[i] = (
                "\t<style>\n" + "".join(css.readlines()) + "\t</style>\n\n"
            )
        print("Bundling stylesheet <%s> @ %d" % (fn, i))
        continue

with open("bundle.html", "w") as html:
    html.writelines(text)

print("Finishing bundling")
