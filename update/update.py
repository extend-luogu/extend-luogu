#!/bin/env python

import os
import sys


def shell(cmd):
    print("Running $ " + cmd)
    os.system(cmd)
    print()


shell("git log -1 HEAD")

print("Inquiring version")
ver = input("VER ")

print("Modifying the version in the script")

fn = "extend-luogu.user.js"
with open(fn, "r") as js:
    text = js.readlines()

for i, ln in enumerate(text):
    if ln.startswith("// @version"):
        text[i] = "// @version" + " " * (ln.count(" ") - 1) + ver + "\n"
        break

with open(fn, "w+") as js:
    js.writelines(text)

shell("git add " + fn)

shell("git commit" + (" --amend" if "a" in sys.argv else ""))

print("Finishing updating")
