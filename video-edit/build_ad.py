"""Build a ~30s vertical Instagram ad from the MonoTrack screen recording.

Pipeline:
  gradient bg (PIL) + intro/end CTA cards (PIL)
  → per scene: extract src range, crop to phone, composite on bg, Ken-Burns push-in
  → burn one fade-in/out telop per scene (helpers/telop.py)
  → xfade-assemble intro + 6 scenes + end, add a silent audio track
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

SKILL = Path(r"C:\動画編集\.claude\skills\video-use")
HELPERS = SKILL / "helpers"
sys.path.insert(0, str(HELPERS))
from telop import burn_telops  # noqa: E402

SRC = Path(r"c:\Users\miumi\Videos\Captures\MonoTrack — 備品貸出管理 - Google Chrome 2026-06-20 20-12-42.mp4")
OUT = Path(r"c:\Users\miumi\Videos\Captures\edit")
WORK = OUT / "ad_build"
WORK.mkdir(parents=True, exist_ok=True)
FINAL = OUT / "MonoTrack_IG_ad.mp4"

W, H, FPS = 1080, 1920, 30
CROP = "crop=608:866:656:142"   # phone region in the 1920x1008 capture
PHONE_W = 1004
XF = 0.4                        # crossfade duration

BLUE = "#2563EB"
DARK = "#0F1A30"
GREEN = "#16A34A"
RED = "#DC2626"
FONT_B = r"C:\Windows\Fonts\YuGothB.ttc"
FONT_M = r"C:\Windows\Fonts\YuGothM.ttc"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def font(path: str, sz: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, sz, index=0)


# ---------------------------------------------------------------- assets (PIL)

def make_bg() -> Path:
    """Vertical brand gradient with a soft glow behind the device."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t = yy / H
    top = np.array([0x16, 0x2C, 0x55], np.float32)
    bot = np.array([0x07, 0x10, 0x20], np.float32)
    base = top * (1 - t)[..., None] + bot * t[..., None]
    cx, cy = W / 2, H * 0.40
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    glow = np.clip(1 - r / 820, 0, 1) ** 2
    base = base + glow[..., None] * np.array([26, 40, 80], np.float32)
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    p = WORK / "bg.png"
    img.save(p)
    return p


def _bg_image() -> Image.Image:
    return Image.open(WORK / "bg.png").convert("RGB")


def make_intro() -> Path:
    img = _bg_image()
    d = ImageDraw.Draw(img)
    cx = W // 2
    d.text((cx, int(H * 0.40)), "MonoTrack", font=font(FONT_B, 116),
           fill="#FFFFFF", anchor="mm")
    # accent underline
    d.rounded_rectangle([cx - 150, int(H * 0.40) + 80, cx + 150, int(H * 0.40) + 92],
                        radius=6, fill=BLUE)
    d.text((cx, int(H * 0.40) + 150), "備品の貸出・返却を、もっとシンプルに",
           font=font(FONT_M, 42), fill="#C7D2E5", anchor="mm")
    p = WORK / "intro.png"
    img.save(p)
    return p


def make_end() -> Path:
    img = _bg_image()
    d = ImageDraw.Draw(img)
    cx = W // 2
    d.text((cx, int(H * 0.30)), "現場の備品管理を、ラクに。",
           font=font(FONT_M, 46), fill="#C7D2E5", anchor="mm")
    d.text((cx, int(H * 0.40)), "MonoTrack", font=font(FONT_B, 100),
           fill="#FFFFFF", anchor="mm")
    # CTA button
    by = int(H * 0.58)
    bw, bh = 620, 132
    d.rounded_rectangle([cx - bw // 2, by - bh // 2, cx + bw // 2, by + bh // 2],
                        radius=66, fill=BLUE)
    d.text((cx, by), "資料請求はこちら  →", font=font(FONT_B, 46),
           fill="#FFFFFF", anchor="mm")
    d.text((cx, by + 130), "プロフィールのリンクから",
           font=font(FONT_M, 32), fill="#8FA0BD", anchor="mm")
    p = WORK / "end.png"
    img.save(p)
    return p


# ------------------------------------------------------------------ scene clips

def build_scene(i: int, s_start: float, s_end: float, bg: Path) -> tuple[Path, float]:
    dur = round(s_end - s_start, 3)
    zrate = 0.06 / max(1.0, dur * FPS)
    vf = (
        f"[0:v]{CROP},scale={PHONE_W}:-2,setsar=1[ph];"
        f"[1:v]scale={W}:{H}[bg];"
        f"[bg][ph]overlay=(W-w)/2:(H-h)/2[c];"
        f"[c]zoompan=z='min(zoom+{zrate:.6f},1.06)':d=1:"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},"
        f"setsar=1,format=yuv420p[v]"
    )
    out = WORK / f"scene{i}_base.mp4"
    run([
        "ffmpeg", "-y",
        "-ss", str(s_start), "-t", str(dur), "-i", str(SRC),
        "-loop", "1", "-t", str(dur), "-i", str(bg),
        "-filter_complex", vf, "-map", "[v]", "-an",
        "-r", str(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p", str(out),
    ])
    return out, dur


def add_telop(i: int, base: Path, dur: float, telop: dict) -> Path:
    t = dict(telop)
    t["start"] = 0.3
    t["end"] = round(dur - 0.3, 3)
    t.setdefault("fade", 0.3)
    out = WORK / f"scene{i}.mp4"
    with tempfile.TemporaryDirectory() as td:
        burn_telops(base, [t], out, Path(td))
    return out


def build_card(png: Path, dur: float, name: str) -> Path:
    out = WORK / f"{name}.mp4"
    vf = (
        f"zoompan=z='min(zoom+0.00035,1.05)':d=1:"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},"
        f"fade=t=in:st=0:d=0.4,fade=t=out:st={dur - 0.4:.3f}:d=0.4,"
        f"setsar=1,format=yuv420p"
    )
    run([
        "ffmpeg", "-y", "-loop", "1", "-t", str(dur), "-i", str(png),
        "-vf", vf, "-r", str(FPS), "-c:v", "libx264", "-preset", "fast",
        "-crf", "20", "-pix_fmt", "yuv420p", str(out),
    ])
    return out


# ------------------------------------------------------------------- assembly

def assemble(clips: list[Path], durs: list[float]) -> None:
    inputs: list[str] = []
    for c in clips:
        inputs += ["-i", str(c)]
    fc: list[str] = []
    cur = "[0:v]"
    acc = durs[0]
    for k in range(1, len(clips)):
        off = acc - XF
        nxt = f"[x{k}]"
        fc.append(f"{cur}[{k}:v]xfade=transition=fade:duration={XF}:offset={off:.3f}{nxt}")
        cur = nxt
        acc = acc + durs[k] - XF
    total = round(acc, 3)
    audio_idx = len(clips)
    cmd = [
        "ffmpeg", "-y", *inputs,
        "-f", "lavfi", "-t", f"{total:.3f}", "-i", "anullsrc=r=48000:cl=stereo",
        "-filter_complex", ";".join(fc),
        "-map", cur, "-map", f"{audio_idx}:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
        str(FINAL),
    ]
    run(cmd)
    print(f"final: {FINAL}  ({total:.1f}s)")


# ------------------------------------------------------------------------ main

SCENES = [
    (1.3, 6.3, {"text": "在庫状況がひと目でわかる", "position": "top",
                "box_color": BLUE, "box_opacity": 0.95, "font_size": 52, "margin": 60}),
    (5.6, 9.3, {"text": "QRコードでサッと貸出・返却", "position": "top",
                "box_color": BLUE, "box_opacity": 0.95, "font_size": 50, "margin": 60}),
    (9.3, 14.3, {"text": "貸出も返却も、かんたん登録", "position": "bottom",
                 "box_color": DARK, "box_opacity": 0.9, "font_size": 52, "margin": 60}),
    (29.0, 34.0, {"text": "貸出中・延滞をまとめて管理", "position": "top",
                  "box_color": BLUE, "box_opacity": 0.95, "font_size": 52, "margin": 60}),
    (39.8, 44.8, {"text": "借りた人の代わりに返却もOK", "position": "top",
                  "box_color": RED, "box_opacity": 0.92, "font_size": 50, "margin": 60}),
    (48.6, 53.2, {"text": "ワンタップで返却完了", "position": "bottom",
                  "box_color": GREEN, "box_opacity": 0.95, "font_size": 54, "margin": 60}),
]
INTRO_DUR, END_DUR = 1.7, 3.2


def main() -> None:
    bg = make_bg()
    intro_png, end_png = make_intro(), make_end()

    print("building scenes...")
    scene_clips: list[Path] = []
    scene_durs: list[float] = []
    for i, (a, b, telop) in enumerate(SCENES, start=1):
        base, dur = build_scene(i, a, b, bg)
        clip = add_telop(i, base, dur, telop)
        scene_clips.append(clip)
        scene_durs.append(dur)
        print(f"  scene {i}: {dur:.2f}s  {telop['text']}")

    print("building cards...")
    intro_clip = build_card(intro_png, INTRO_DUR, "intro")
    end_clip = build_card(end_png, END_DUR, "end")

    clips = [intro_clip] + scene_clips + [end_clip]
    durs = [INTRO_DUR] + scene_durs + [END_DUR]
    print("assembling...")
    assemble(clips, durs)


if __name__ == "__main__":
    main()
