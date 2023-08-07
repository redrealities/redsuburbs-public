#!/usr/bin/env python
# encoding: utf-8
import os
import re
import pathlib

def combine_css(dir_path, source, result):
  root_file_path = dir_path
  root_file_name = source
  result_file_path = dir_path + result

  total_css = ''
  with open(root_file_path + root_file_name) as file:
    data = file.read()
    imports = re.findall(r'\@import \'(.+)\';', data)

    for imp in imports:
      stylesheet_path = root_file_path + imp
      imp_dir = imp.replace(pathlib.PurePath(imp).name, '')
      with open(stylesheet_path) as stylesheet:
        content = stylesheet.read() #.replace("url(../", "url(")
        urls = re.findall(r'url\((.+)\)', content)
        if len(urls) > 0:
          for url in urls:
            content = content.replace('url(' + url + ')', 'url(' + imp_dir + url + ')')
        total_css = total_css + "\n" + content

  with open(result_file_path, 'w+') as result_file:
    result_file.write(total_css)

CSS_ROOT_FILE_PATH = 'css/'
CSS_ROOT_FILE_NAME = '_all.css'
CSS_RESULT_FILE_PATH = '_combined.css'

combine_css(CSS_ROOT_FILE_PATH, CSS_ROOT_FILE_NAME, CSS_RESULT_FILE_PATH)
# combine_css(CSS_ROOT_FILE_PATH, '_legacy.css', '_legacy-combined.css')
