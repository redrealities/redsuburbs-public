#!/usr/bin/env python
# encoding: utf-8
import os
import re
import pathlib

JS_PATH = 'src/scripts/'
JS_RESULT_FILE_PATH = 'src/scripts/_combined.js'

total_js = ''

files = os.listdir(JS_PATH)

for file_name in files:
    if '_' in file_name: continue

    with open(JS_PATH + file_name) as file:
        data = file.read()
        total_js = total_js + "\n/* === File: " + file_name + " === */\n";
        total_js = total_js + data;

with open(JS_RESULT_FILE_PATH, 'w+') as result_file:
    result_file.write(total_js)
