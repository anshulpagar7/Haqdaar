"""HAQDAAR logo — built as real vector geometry, not a raster generation.

The approved design: a deep-green rounded tile carrying the Devanagari letter
ह in cream, with a single gold dot at its foot; wordmark HAQDAAR alongside in
Sora ExtraBold. Every glyph here is pulled from the real font and converted to
a path, so the ह is the actual letter and the file needs no font to render.
"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from pathlib import Path

DEVA = "/tmp/fonts/fontsource-noto-sans-devanagari-5.3.0/files/noto-sans-devanagari-devanagari-800-normal.woff"
SORA = "/tmp/fonts/fontsource-sora-5.3.0/files/sora-latin-800-normal.woff"
OUT = Path("/home/claude/logo")
OUT.mkdir(exist_ok=True)

# palette — the app's own tokens
GREEN_D = "#1C5836"
CREAM   = "#FBF8F0"
GOLD    = "#D9812A"
INK     = "#14261D"


def load(p):
    f = TTFont(p)
    f.flavor = None
    return f, f.getBestCmap(), f.getGlyphSet(), f["head"].unitsPerEm


def glyph(font, char):
    f, cmap, gs, upem = font
    name = cmap[ord(char)]
    pen = SVGPathPen(gs)
    gs[name].draw(pen)
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    return pen.getCommands(), f["hmtx"][name][0], bp.bounds, upem


deva = load(DEVA)
sora = load(SORA)


def word_paths(font, text, size, tracking):
    """Lay out a string as one merged path, in SVG user units, y-down."""
    f, cmap, gs, upem = font
    s = size / upem
    x, parts, w = 0.0, [], 0.0
    for ch in text:
        d, adv, _, _ = glyph(font, ch)
        if d:
            parts.append(f'<path d="{d}" transform="translate({x:.2f} 0) scale({s:.5f} {-s:.5f})"/>')
        x += adv * s + tracking
        w = x
    return "".join(parts), w - tracking


# ── the mark ────────────────────────────────────────────────────────
TILE = 512
R = 118                      # corner radius — squircle-ish, not a pill
d_ha, adv_ha, bb_ha, upem = glyph(deva, "ह")
gx0, gy0, gx1, gy1 = bb_ha

HA_H = 300                                     # the letter's ink height inside the tile
s = HA_H / (gy1 - gy0)
gw = (gx1 - gx0) * s

# The letter and the gold dot are one composition, centred as a unit: the dot
# sits on the baseline just past the letter, the way a bindu would — and it is
# the same gold as the single confirmed match in the app's field.
DOT_R = 34
DOT_GAP = 18
GROUP_W = gw + DOT_GAP + DOT_R * 2

tx = (TILE - GROUP_W) / 2 - gx0 * s
ty = (TILE + HA_H) / 2 + gy0 * s               # ink box vertically centred

DOT_X = (TILE - GROUP_W) / 2 + gw + DOT_GAP + DOT_R
DOT_Y = ty - gy0 * s - DOT_R                    # resting on the baseline


def mark(tile_fill, letter_fill, dot_fill, ring=None):
    ringtag = ""
    if ring:
        ringtag = (f'<rect x="8" y="8" width="{TILE-16}" height="{TILE-16}" rx="{R-8}" '
                   f'fill="none" stroke="{ring}" stroke-width="16"/>')
    return f"""<rect width="{TILE}" height="{TILE}" rx="{R}" fill="{tile_fill}"/>{ringtag}
  <path d="{d_ha}" fill="{letter_fill}" transform="translate({tx:.2f} {ty:.2f}) scale({s:.5f} {-s:.5f})"/>
  <circle cx="{DOT_X:.1f}" cy="{DOT_Y:.1f}" r="{DOT_R}" fill="{dot_fill}"/>"""


def svg(body, w, h, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" role="img" aria-label="{title}">\n'
            f'  <title>{title}</title>\n  {body}\n</svg>\n')


# icon, three finishes
(OUT / "haqdaar-mark.svg").write_text(
    svg(mark(GREEN_D, CREAM, GOLD), TILE, TILE, "HAQDAAR"))
(OUT / "haqdaar-mark-mono-dark.svg").write_text(
    svg(mark(INK, CREAM, CREAM), TILE, TILE, "HAQDAAR"))
(OUT / "haqdaar-mark-mono-white.svg").write_text(
    svg(f'<rect width="{TILE}" height="{TILE}" rx="{R}" fill="#FFFFFF"/>'
        f'<path d="{d_ha}" fill="{INK}" transform="translate({tx:.2f} {ty:.2f}) '
        f'scale({s:.5f} {-s:.5f})"/>'
        f'<circle cx="{DOT_X:.1f}" cy="{DOT_Y:.1f}" r="{DOT_R}" fill="{INK}"/>',
        TILE, TILE, "HAQDAAR"))

# ── the horizontal lockup ───────────────────────────────────────────
WORD_SIZE = 218
TRACK = WORD_SIZE * 0.055
wd, wordw = word_paths(sora, "HAQDAAR", WORD_SIZE, TRACK)
CAP = 0.72 * WORD_SIZE                       # Sora cap height
GAP = 86
LW = TILE + GAP + wordw
LH = TILE

word_y = LH / 2 + CAP / 2


def lockup(word_fill, tile_fill, letter_fill, dot_fill):
    return (f'<g>{mark(tile_fill, letter_fill, dot_fill)}</g>'
            f'<g fill="{word_fill}" transform="translate({TILE + GAP:.1f} {word_y:.1f})">{wd}</g>')


(OUT / "haqdaar-logo.svg").write_text(
    svg(lockup(INK, GREEN_D, CREAM, GOLD), round(LW), LH, "HAQDAAR"))
(OUT / "haqdaar-logo-reversed.svg").write_text(
    svg(lockup(CREAM, CREAM, GREEN_D, GOLD), round(LW), LH, "HAQDAAR"))

# stacked, for square placements.
# The Q in Sora drops below the baseline, so the box has to leave room for it —
# without this the tail is clipped and HAQDAAR reads as HAODAAR.
sword_size = WORD_SIZE * 0.62
swd, sww = word_paths(sora, "HAQDAAR", sword_size, sword_size * 0.055)
SCAP = 0.72 * sword_size
SDESC = 0.24 * sword_size
sbase = TILE + 70 + SCAP
SH = sbase + SDESC
(OUT / "haqdaar-logo-stacked.svg").write_text(
    svg(f'<g transform="translate({(sww - TILE)/2:.1f} 0)">{mark(GREEN_D, CREAM, GOLD)}</g>'
        f'<g fill="{INK}" transform="translate(0 {sbase:.1f})">{swd}</g>',
        round(sww), round(SH), "HAQDAAR"))

print("wrote:", *[p.name for p in sorted(OUT.glob("*.svg"))], sep="\n  ")
print(f"lockup {round(LW)}x{LH}   word width {wordw:.0f}")
