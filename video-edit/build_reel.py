"""Build a vertical Instagram *reel* by stitching clips from one or more
screen recordings into a single showcase — now with optional AI narration.

Generalized sibling of build_ad.py.  **Every scene carries its own `src`,
`mode`, `crop`, `telop` and (optional) `vo` narration line** — so you can
weave together several recordings (or several ranges of one recording, or a
mix of phone-frame and full-page screens) into one reel, with a voiceover
that drives the pacing.

Per-scene `mode`:
  "phone" — crop the phone-mockup region, drop it on the brand gradient,
            Ken-Burns push-in.
  "full"  — crop a full-width region (e.g. a generated report / desktop page),
            fit it to the reel width on the gradient, gentle zoom.

Narration (AI voice, ElevenLabs):
  Set NARRATION=True.  Each Scene.vo / Reel.intro["vo"] / Reel.end["vo"] line
  is synthesized once (cached in reel_build/vo/), its duration measured, and
  the owning clip is stretched to fit voice + padding.  The clips are then
  xfaded together and each narration is mixed in at its clip's start offset.
  Telops stay on top, so voice + captions reinforce each other.

Pipeline:
  synth narration -> size each clip to its voice -> gradient bg + intro/end
  cards -> per scene: crop/composite/Ken-Burns -> burn telop -> xfade-assemble
  -> mix narration onto the timeline.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

SKILL = Path(r"C:\動画編集\.claude\skills\video-use")
HELPERS = SKILL / "helpers"
sys.path.insert(0, str(HELPERS))
from telop import burn_telops  # noqa: E402

OUT = Path(r"c:\Users\miumi\Videos\Captures\edit")
WORK = OUT / "reel_build"
WORK.mkdir(parents=True, exist_ok=True)

W, H, FPS = 1080, 1920, 30
XF = 0.4                         # crossfade duration between clips

# ----- narration (AI voice) ------------------------------------------------
NARRATION = True
VOICE_ID = "EXAVITQu4vr4xnSDxMaL"    # ElevenLabs "Sarah" (calm female)
VO_MODEL = "eleven_multilingual_v2"
VO_DIR = WORK / "vo"
VO_HEAD = 0.35                   # silence before a line starts inside its clip
VO_PAD = 0.70                    # total head+tail padding added to a clip

# brand palette -----------------------------------------------------------
NAVY = "#1E3A5F"
BLUE = "#2563EB"
GREEN = "#16A34A"
DARK = "#0F1A30"
RED = "#DC2626"
FONT_B = r"C:\Windows\Fonts\YuGothB.ttc"
FONT_M = r"C:\Windows\Fonts\YuGothM.ttc"


# ----------------------------------------------------------------- scene model

@dataclass
class Scene:
    src: Path
    start: float
    end: float
    telop: dict
    mode: str = "phone"          # "phone" | "full"
    crop: str = ""               # ffmpeg crop=w:h:x:y  (region to lift)
    scale_w: int = 900           # width the lifted region is scaled to
    vo: str = ""                 # narration line (empty = silent scene)


@dataclass
class Reel:
    name: str                    # output basename (no extension)
    intro: dict                  # {title, subtitle, vo?}
    end: dict                    # {lead, title, cta, note, vo?}
    scenes: list[Scene]
    intro_dur: float = 1.7
    end_dur: float = 3.2


# --------------------------------------------------------------------- helpers

def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def probe_dur(p: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nk=1:nw=1", str(p)],
        capture_output=True, text=True).stdout.strip()
    return float(out)


def font(path: str, sz: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, sz, index=0)


# ------------------------------------------------------------------ narration

def _api_key() -> str:
    env = (SKILL / ".env").read_text(encoding="utf-8")
    for line in env.splitlines():
        if line.startswith("ELEVENLABS_API_KEY"):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("ELEVENLABS_API_KEY not found in .env")


def synth_vo(name: str, text: str) -> tuple[Path, float]:
    """Text -> mp3 via ElevenLabs, cached by name.  Returns (path, duration)."""
    VO_DIR.mkdir(parents=True, exist_ok=True)
    out = VO_DIR / f"{name}.mp3"
    if not (out.exists() and out.stat().st_size > 0):
        body = json.dumps({
            "text": text, "model_id": VO_MODEL,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0},
        }).encode("utf-8")
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}", data=body,
            headers={"xi-api-key": _api_key(), "Content-Type": "application/json"},
            method="POST")
        out.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return out, probe_dur(out)


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


def make_intro(cfg: dict) -> Path:
    img = _bg_image()
    d = ImageDraw.Draw(img)
    cx = W // 2
    d.text((cx, int(H * 0.40)), cfg["title"], font=font(FONT_B, 116),
           fill="#FFFFFF", anchor="mm")
    d.rounded_rectangle([cx - 150, int(H * 0.40) + 80, cx + 150, int(H * 0.40) + 92],
                        radius=6, fill=BLUE)
    d.text((cx, int(H * 0.40) + 150), cfg["subtitle"],
           font=font(FONT_M, 40), fill="#C7D2E5", anchor="mm")
    p = WORK / "intro.png"
    img.save(p)
    return p


def make_end(cfg: dict) -> Path:
    img = _bg_image()
    d = ImageDraw.Draw(img)
    cx = W // 2
    d.text((cx, int(H * 0.30)), cfg["lead"],
           font=font(FONT_M, 44), fill="#C7D2E5", anchor="mm")
    d.text((cx, int(H * 0.40)), cfg["title"], font=font(FONT_B, 100),
           fill="#FFFFFF", anchor="mm")
    by = int(H * 0.58)
    bw, bh = 620, 132
    d.rounded_rectangle([cx - bw // 2, by - bh // 2, cx + bw // 2, by + bh // 2],
                        radius=66, fill=GREEN)
    d.text((cx, by), cfg["cta"], font=font(FONT_B, 46),
           fill="#FFFFFF", anchor="mm")
    d.text((cx, by + 130), cfg["note"],
           font=font(FONT_M, 32), fill="#8FA0BD", anchor="mm")
    p = WORK / "end.png"
    img.save(p)
    return p


# ------------------------------------------------------------------ scene clips

def build_scene(i: int, sc: Scene, dur: float, bg: Path) -> Path:
    """Extract `dur` seconds from sc.start, composite on bg per mode."""
    out = WORK / f"scene{i}_base.mp4"
    if sc.mode == "phone":
        zrate = 0.06 / max(1.0, dur * FPS)
        zmax = 1.06
    else:                        # "full"
        zrate = 0.05 / max(1.0, dur * FPS)
        zmax = 1.05
    vf = (
        f"[0:v]{sc.crop},scale={sc.scale_w}:-2,setsar=1[ph];"
        f"[1:v]scale={W}:{H}[bg];"
        f"[bg][ph]overlay=(W-w)/2:(H-h)/2[c];"
        f"[c]zoompan=z='min(zoom+{zrate:.6f},{zmax})':d=1:"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},"
        f"setsar=1,format=yuv420p[v]"
    )
    run([
        "ffmpeg", "-y",
        "-ss", str(sc.start), "-t", f"{dur:.3f}", "-i", str(sc.src),
        "-loop", "1", "-t", f"{dur:.3f}", "-i", str(bg),
        "-filter_complex", vf, "-map", "[v]", "-an",
        "-r", str(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p", str(out),
    ])
    return out


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
        "ffmpeg", "-y", "-loop", "1", "-t", f"{dur:.3f}", "-i", str(png),
        "-vf", vf, "-r", str(FPS), "-c:v", "libx264", "-preset", "fast",
        "-crf", "20", "-pix_fmt", "yuv420p", str(out),
    ])
    return out


# ------------------------------------------------------------------- assembly

def assemble(clips: list[Path], durs: list[float],
             narration: list[tuple[Path, float]], final: Path) -> None:
    """xfade the clips, then mix each narration clip at its start offset."""
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

    # --- audio: silent base + delayed narration, all mixed ---
    base_idx = len(clips)
    inputs += ["-f", "lavfi", "-t", f"{total:.3f}", "-i", "anullsrc=r=48000:cl=stereo"]
    vo_labels: list[str] = []
    for j, (p, at) in enumerate(narration):
        inputs += ["-i", str(p)]
        idx = base_idx + 1 + j
        ms = max(0, round(at * 1000))
        fc.append(f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,"
                  f"adelay={ms}|{ms}[vo{j}]")
        vo_labels.append(f"[vo{j}]")
    mix_in = f"[{base_idx}:a]" + "".join(vo_labels)
    fc.append(f"{mix_in}amix=inputs={len(vo_labels) + 1}:normalize=0:"
              f"dropout_transition=0[aout]")

    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", ";".join(fc),
        "-map", cur, "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
        str(final),
    ]
    run(cmd)
    print(f"final: {final}  ({total:.1f}s, {len(narration)} narration lines)")


# ------------------------------------------------------------------------ build

def build(reel: Reel) -> Path:
    bg = make_bg()
    intro_png = make_intro(reel.intro)
    end_png = make_end(reel.end)

    # 1. synth narration + decide each clip's duration from its voice line
    def clip_dur(name: str, text: str, base: float) -> tuple[float, Path | None]:
        if NARRATION and text:
            vp, vd = synth_vo(name, text)
            return max(base, round(vd + VO_PAD, 3)), vp
        return base, None

    intro_dur, intro_vo = clip_dur("intro", reel.intro.get("vo", ""), reel.intro_dur)
    end_dur, end_vo = clip_dur("end", reel.end.get("vo", ""), reel.end_dur)

    print(f"building {reel.name}: {len(reel.scenes)} scenes"
          f"{' + narration' if NARRATION else ''}")
    scene_clips: list[Path] = []
    scene_durs: list[float] = []
    scene_vos: list[Path | None] = []
    for i, sc in enumerate(reel.scenes, start=1):
        base_dur = round(sc.end - sc.start, 3)
        dur, vp = clip_dur(f"s{i}", sc.vo, base_dur)
        base = build_scene(i, sc, dur, bg)
        clip = add_telop(i, base, dur, sc.telop)
        scene_clips.append(clip)
        scene_durs.append(dur)
        scene_vos.append(vp)
        print(f"  scene {i} [{sc.mode}]: {dur:.2f}s  {sc.telop['text']}"
              f"{'  VO: ' + sc.vo if sc.vo else ''}")

    intro_clip = build_card(intro_png, intro_dur, "intro")
    end_clip = build_card(end_png, end_dur, "end")

    clips = [intro_clip] + scene_clips + [end_clip]
    durs = [intro_dur] + scene_durs + [end_dur]
    vos = [intro_vo] + scene_vos + [end_vo]

    # 2. start offset of each clip on the final (xfaded) timeline
    starts = [0.0] * len(clips)
    for k in range(1, len(clips)):
        starts[k] = starts[k - 1] + durs[k - 1] - XF

    narration = [(vp, starts[k] + VO_HEAD) for k, vp in enumerate(vos) if vp]

    print("assembling...")
    final = OUT / f"{reel.name}.mp4"
    assemble(clips, durs, narration, final)
    return final


# =============================================================== reel configs

# Two clean (cursor-free) takes of the same app, combined into one reel:
#   A = capture / photo-list flow   B = generate -> report -> LINE send
GENBA_A = Path(r"c:\Users\miumi\Videos\Captures\現場日報 - 工事写真から施主報告書を自動生成 - Google Chrome 2026-07-04 20-55-05.mp4")
GENBA_B = Path(r"c:\Users\miumi\Videos\Captures\現場日報 - 工事写真から施主報告書を自動生成 - Google Chrome 2026-07-04 20-55-25.mp4")
PHONE_CROP = "crop=384:822:750:140"     # phone mockup region (same in both takes)
REPORT_CROP = "crop=800:876:512:130"    # generated-report card region

GENBA_REEL = Reel(
    name="Genba_Nippo_reel",
    intro={"title": "現場日報", "subtitle": "現場写真から、施主報告書を自動で。",
           "vo": "現場の報告書づくり、まだ手作業ですか？"},
    end={"lead": "報告書づくりを、現場で終わらせる。", "title": "現場日報",
         "cta": "無料で試す  →", "note": "プロフィールのリンクから",
         "vo": "報告業務は、これひとつ。現場日報を、まずは無料で。"},
    scenes=[
        # --- from take A: shooting & photo list ---
        Scene(GENBA_A, 1.0, 5.8, mode="phone", crop=PHONE_CROP, scale_w=900,
              vo="現場で写真を撮るだけ。作業内容がどんどん記録されます。",
              telop={"text": "現場で撮るだけ、写真がどんどん記録", "position": "top",
                     "box_color": NAVY, "box_opacity": 0.95, "font_size": 50, "margin": 60}),
        Scene(GENBA_A, 7.0, 11.8, mode="phone", crop=PHONE_CROP, scale_w=900,
              vo="話した内容も、音声メモが自動でテキストに。",
              telop={"text": "音声メモも自動でテキスト化", "position": "bottom",
                     "box_color": DARK, "box_opacity": 0.9, "font_size": 52, "margin": 60}),
        # --- from take B: generate -> report -> LINE ---
        Scene(GENBA_B, 6.5, 9.0, mode="phone", crop=PHONE_CROP, scale_w=900,
              vo="あとは、ワンタップ。",
              telop={"text": "ワンタップで報告書を生成", "position": "top",
                     "box_color": GREEN, "box_opacity": 0.95, "font_size": 52, "margin": 60}),
        Scene(GENBA_B, 10.3, 16.8, mode="full", crop=REPORT_CROP, scale_w=1040,
              vo="AIが、施主向けの報告書をまるごと自動作成。",
              telop={"text": "AIが施主報告書を自動作成", "position": "top",
                     "box_color": BLUE, "box_opacity": 0.95, "font_size": 52, "margin": 60}),
        Scene(GENBA_B, 23.2, 26.6, mode="phone", crop=PHONE_CROP, scale_w=900,
              vo="そのまま、LINEで施主へ送信。",
              telop={"text": "そのままLINEで施主へ送信", "position": "bottom",
                     "box_color": GREEN, "box_opacity": 0.95, "font_size": 52, "margin": 60}),
    ],
)


if __name__ == "__main__":
    build(GENBA_REEL)
