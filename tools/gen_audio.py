"""Re-record the narration after editing NARRATION in index.html.

Uses Microsoft's neural Indian English voice through the free edge-tts tool
(the text is sent to Microsoft's speech service to be synthesised).

    python3 -m venv .venv && .venv/bin/pip install edge-tts
    .venv/bin/python tools/gen_audio.py            # all clips
    .venv/bin/python tools/gen_audio.py casewait   # only the slides you name

Writes audio/<slide>-<step>.mp3, which the deck plays on each page. Needs node
on PATH to read NARRATION out of index.html.
"""
import asyncio, json, os, re, subprocess, sys
import edge_tts

VOICE = 'en-IN-PrabhatNeural'      # male, Indian English, "friendly, positive"
RATE  = '+4%'                      # a touch livelier than the default pace
ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT   = os.path.join(ROOT, 'audio')

def narration():
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    block = re.search(r'const NARRATION = \{.*?\n\};', html, re.S).group(0)
    js = block.replace('const NARRATION', 'const N') + '\nprocess.stdout.write(JSON.stringify(N));'
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)

async def one(text, path):
    for attempt in range(4):
        try:
            await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)
            if os.path.getsize(path) > 2000:
                return
        except Exception as e:
            print('retry', path, e, file=sys.stderr)
        await asyncio.sleep(2 + attempt * 2)
    raise SystemExit('failed: ' + path)

async def main(only):
    os.makedirs(OUT, exist_ok=True)
    data = narration()
    jobs = [(t, os.path.join(OUT, f'{sid}-{i}.mp3')) for sid, steps in data.items()
            if not only or sid in only for i, t in enumerate(steps)]
    sem = asyncio.Semaphore(4)
    async def run(t, p):
        async with sem:
            await one(t, p)
    await asyncio.gather(*(run(t, p) for t, p in jobs))
    print(len(jobs), 'clips written to', OUT)

asyncio.run(main(set(sys.argv[1:])))
