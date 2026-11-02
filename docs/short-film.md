# Dị Môn — Đêm thức tỉnh

A narrative landing film, made following the requested 2D anime cinematic direction.
The runtime is 30 seconds, landscape 16:9, 1920 × 1080 at 30 fps.

This is a first layered 2D animation treatment: painted backgrounds, replacement
expression cels and articulated cutout characters. It is not frame-by-frame anime
or output from a native video generation model. No gameplay footage is used.
The protagonist retains swept brown hair, round black glasses and the navy varsity
jacket. The coworker retains her ponytail, office suit and employee lanyard.

## Story and sound

| Time | Scene |
| --- | --- |
| 00–03 | Rain outside an office tower, one late light still on. |
| 03–07 | The protagonist works late; structural rumbling interrupts him. |
| 07–11 | The office shakes, the floor opens and a coworker slips. |
| 11–16 | He takes her hand and pulls her clear of the opening. |
| 16–20 | A spirit appears; his decision to save others awakens his power. |
| 20–27 | He shields his coworker and repels a creature with air pressure. |
| 27–30 | End title: Dị Môn — Đêm thức tỉnh. |

The music and environmental Foley are synthesized for this film: rain, typing,
structural rumble, debris, fabric movement, spirit tones and the final air strike.
Dialogue is conveyed through burned-in Vietnamese subtitles; there is no voiceover.

## Files and reproduction

- `/movie`: published player page, separate from the playable game.
- `/trailer`: the previous preview address now plays this narrative film as well.
- `/media/di-mon-short-film-1080p.mp4`: streamable H.264/AAC MP4 with fast-start metadata.
- `/downloads/di-mon-short-film-1080p.mp4`: the same bytes with attachment headers.
- `movie/assets`: new anime art, expression/limb atlases and source rectangles.
- `movie/renderer.js`: deterministic scene staging, expressions and two-bone joints.
- `movie/tools/render.cjs`: Chromium Canvas rendering piped into FFmpeg.
- `movie/tools/score.py`: deterministic original stereo audio synthesis.

Serve the repository root at `http://127.0.0.1:4173`, then run:

```sh
node movie/tools/render.cjs stills
node movie/tools/render.cjs
python movie/tools/score.py
ffmpeg -y -i movie/output/di-mon-short-film-silent.mp4 -i movie/output/score.wav \
  -map 0:v -map 1:a -c:v copy -af loudnorm=I=-18:TP=-1.5:LRA=9 \
  -c:a aac -b:a 128k -ar 48000 -t 30 -movflags +faststart \
  movie/output/di-mon-short-film-1080p.mp4
```

Rendering requires Playwright, system Chromium, FFmpeg and the Noto Sans fonts
stored under `movie/assets`. The approved clear pressure artwork is reused
as a composited film effect; all character acting is newly staged for the film.

The game source and level work remain unchanged, checked against
`movie/game-source-baseline.json`.
