#!/usr/bin/env python3
"""Generate PWA icons for Nour Sudan - black bg with gold glowing N."""
import cairosvg
import os

ICON_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'icons')
SVG_PATH = os.path.join(ICON_DIR, 'icon.svg')

def svg_to_png(size, path):
    cairosvg.svg2png(url=SVG_PATH, write_to=path, output_width=size, output_height=size)

svg_to_png(192, os.path.join(ICON_DIR, 'icon-192.png'))
svg_to_png(512, os.path.join(ICON_DIR, 'icon-512.png'))
svg_to_png(180, os.path.join(ICON_DIR, 'apple-touch-icon.png'))
svg_to_png(32, os.path.join(ICON_DIR, 'favicon-32.png'))

from PIL import Image
icon32 = Image.open(os.path.join(ICON_DIR, 'favicon-32.png'))
icon32.save(os.path.join(ICON_DIR, 'favicon.ico'), format='ICO', sizes=[(32, 32)])

print("All icons generated successfully")
