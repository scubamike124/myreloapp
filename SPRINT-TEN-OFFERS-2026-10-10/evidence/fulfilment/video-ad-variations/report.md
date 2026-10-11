<!-- Prepared with scripts/offers-run.ts for video-ad-variations. Invented test data (--synthetic). Review before sending. -->
# Short-Form Ad Variations from Your Video

**Sample made from invented data.**

## What went in

- Source: maple-lane-testimonial.mp4, 118 s, 1920×1080 at 30 fps (invented). Owner confirmed: yes.
- Transcript: 32 lines of an invented customer testimonial.
- Brief: Full-service dog grooming, booked online; for Dog owners within ten miles; 3 hooks; end card "Book a groom at maplelanegrooming.example"; for Instagram Reels, TikTok, YouTube Shorts.
- Limits: 15 s per variation; captions at most 32 characters a line and 2 lines a card.

## Summary

Three vertical (9:16) variations of at most 15 seconds, cut from Invented Test Co's 118-second customer clip (maple-lane-testimonial.mp4). Each opens with a different hook line over its first 2.5 seconds, carries burned-in captions, and ends on a 2-second card: "Book a groom at maplelanegrooming.example".

The clip, the business and the customer are invented for this sample, so nothing was rendered from it: this is the plan an editor follows, with the caption files and the commands.

Variation 1 (14.8 s), hook "Your dog deserves a spa day": 2 clips from 1:37.6–1:41.4 and 1:49.0–1:58.0, picked for the words "dog", "book", "groom", "online".

Variation 2 (14.8 s), hook "They called before the first clip": one clip from 1:45.2–1:58.0, picked for the words "call", "dog", "groom", "book", "online".

Variation 3 (13.4 s), hook "Matted coat to mirror shine in one visit": 2 clips from 0:55.8–1:03.4 and 1:37.6–1:41.4, picked for the words "coat", "matt", "mirror", "shine", "visit", "dog", "book", "groom".

How clips are picked: each transcript line scores 2 points for every hook word and 1 for every offer word it contains; the plan takes the best-scoring run of consecutive lines that fits in 13 seconds, and adds a second run only when that beats one run by more than 2 points.

Crop: the centre 608×1080 of the 1920×1080 frame (from x=656, y=0), scaled to 1080×1920.

## Cut sheet

| Variation | Part | Source in | Source out | Text |
|---|---|---|---|---|
| Variation 1 | Hook card, 0.0–2.5 s (text over clip 1) | 1:37.6 | 1:40.1 | Your dog deserves a spa day |
| Variation 1 | Clip 1, 0.0–3.8 s | 1:37.6 | 1:41.4 | If your dog has a coat that needs rescuing, book a groom. |
| Variation 1 | Clip 2, 3.8–12.8 s | 1:49.0 | 1:58.0 | Biscuit says thank you too. Maple Lane Dog Grooming. Book online, any time. |
| Variation 1 | End card, 12.8–14.8 s | — | — | Book a groom at maplelanegrooming.example |
| Variation 2 | Hook card, 0.0–2.5 s (text over clip 1) | 1:45.2 | 1:47.7 | They called before the first clip |
| Variation 2 | Clip 1, 0.0–12.8 s | 1:45.2 | 1:58.0 | Honestly, I wish I had called them years ago. Biscuit says thank you too. Maple Lane Dog Grooming. Book online, any time. |
| Variation 2 | End card, 12.8–14.8 s | — | — | Book a groom at maplelanegrooming.example |
| Variation 3 | Hook card, 0.0–2.5 s (text over clip 1) | 0:55.8 | 0:58.3 | Matted coat to mirror shine in one visit |
| Variation 3 | Clip 1, 0.0–7.6 s | 0:55.8 | 1:03.4 | He came out with a soft, fluffy, shiny coat. From matted to mirror shine in one visit. |
| Variation 3 | Clip 2, 7.6–11.4 s | 1:37.6 | 1:41.4 | If your dog has a coat that needs rescuing, book a groom. |
| Variation 3 | End card, 11.4–13.4 s | — | — | Book a groom at maplelanegrooming.example |

Source times are minutes:seconds in the client's video. The hook and end card are text added in the edit; the end card uses no footage.

## Captions (SRT)

- variation-1.srt
  1
  00:00:00,000 --> 00:00:03,800
  If your dog has a coat that
  needs rescuing, book a groom.
  
  2
  00:00:03,800 --> 00:00:06,800
  Biscuit says thank you too.
  
  3
  00:00:06,800 --> 00:00:09,800
  Maple Lane Dog Grooming.
  
  4
  00:00:09,800 --> 00:00:12,800
  Book online, any time.
  
- variation-2.srt
  1
  00:00:00,000 --> 00:00:03,800
  Honestly, I wish I had called
  them years ago.
  
  2
  00:00:03,800 --> 00:00:06,800
  Biscuit says thank you too.
  
  3
  00:00:06,800 --> 00:00:09,800
  Maple Lane Dog Grooming.
  
  4
  00:00:09,800 --> 00:00:12,800
  Book online, any time.
  
- variation-3.srt
  1
  00:00:00,000 --> 00:00:03,800
  He came out with a soft, fluffy,
  shiny coat.
  
  2
  00:00:03,800 --> 00:00:07,600
  From matted to mirror shine in
  one visit.
  
  3
  00:00:07,600 --> 00:00:11,400
  If your dog has a coat that
  needs rescuing, book a groom.
  

Cut-relative times; at most 32 characters a line and 2 lines a card. The hook and end-card text are drawn on the video, not in the caption files.

## Editor commands (run locally; Amber did not run them)

Each variation needs three small files next to maple-lane-testimonial.mp4: its captions (the .srt above), its hook line and its end-card line. One ffmpeg command then cuts and joins the clips, crops the centre to 9:16, scales to 1080×1920, burns in the captions, shows the hook for the first 2.5 seconds and adds the end card.

These are text for an editor to run on their own computer. Amber did not run them, and for this sample there is nothing to run them on: the clip is invented.

Variation 1:
printf '%s\n' 'Your dog deserves a spa' 'day' > variation-1-hook.txt
printf '%s\n' 'Book a groom at' 'maplelanegrooming.example' > variation-1-cta.txt
ffmpeg -hide_banner -y -i maple-lane-testimonial.mp4 -filter_complex "[0:v]trim=start=97.600:end=101.400,setpts=PTS-STARTPTS[v0];[0:a]atrim=start=97.600:end=101.400,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a0];[0:v]trim=start=109.000:end=118.000,setpts=PTS-STARTPTS[v1];[0:a]atrim=start=109.000:end=118.000,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[bv][ba];[bv]crop=608:1080:656:0,scale=1080:1920,setsar=1,fps=30,subtitles=variation-1.srt:force_style='FontName=Sans,FontSize=9,Bold=1,Outline=2,Shadow=0,Alignment=2,MarginV=48',drawtext=font=Sans:textfile=variation-1-hook.txt:expansion=none:fontsize=65:fontcolor=white:line_spacing=24:box=1:boxcolor=black@0.6:boxborderw=24:x=(w-text_w)/2:y=h*0.2:enable='lt(t,2.5)',format=yuv420p[mv];color=c=0x1d3557:s=1080x1920:r=30:d=2,drawtext=font=Sans:textfile=variation-1-cta.txt:expansion=none:fontsize=60:fontcolor=white:line_spacing=24:x=(w-text_w)/2:y=(h-text_h)/2,setsar=1,format=yuv420p[cv];anullsrc=r=48000:cl=stereo,atrim=duration=2[ca];[mv][ba][cv][ca]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -movflags +faststart variation-1.mp4

Variation 2:
printf '%s\n' 'They called before the' 'first clip' > variation-2-hook.txt
printf '%s\n' 'Book a groom at' 'maplelanegrooming.example' > variation-2-cta.txt
ffmpeg -hide_banner -y -i maple-lane-testimonial.mp4 -filter_complex "[0:v]trim=start=105.200:end=118.000,setpts=PTS-STARTPTS[v0];[0:a]atrim=start=105.200:end=118.000,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a0];[v0][a0]concat=n=1:v=1:a=1[bv][ba];[bv]crop=608:1080:656:0,scale=1080:1920,setsar=1,fps=30,subtitles=variation-2.srt:force_style='FontName=Sans,FontSize=9,Bold=1,Outline=2,Shadow=0,Alignment=2,MarginV=48',drawtext=font=Sans:textfile=variation-2-hook.txt:expansion=none:fontsize=65:fontcolor=white:line_spacing=24:box=1:boxcolor=black@0.6:boxborderw=24:x=(w-text_w)/2:y=h*0.2:enable='lt(t,2.5)',format=yuv420p[mv];color=c=0x1d3557:s=1080x1920:r=30:d=2,drawtext=font=Sans:textfile=variation-2-cta.txt:expansion=none:fontsize=60:fontcolor=white:line_spacing=24:x=(w-text_w)/2:y=(h-text_h)/2,setsar=1,format=yuv420p[cv];anullsrc=r=48000:cl=stereo,atrim=duration=2[ca];[mv][ba][cv][ca]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -movflags +faststart variation-2.mp4

Variation 3:
printf '%s\n' 'Matted coat to mirror' 'shine in one visit' > variation-3-hook.txt
printf '%s\n' 'Book a groom at' 'maplelanegrooming.example' > variation-3-cta.txt
ffmpeg -hide_banner -y -i maple-lane-testimonial.mp4 -filter_complex "[0:v]trim=start=55.800:end=63.400,setpts=PTS-STARTPTS[v0];[0:a]atrim=start=55.800:end=63.400,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a0];[0:v]trim=start=97.600:end=101.400,setpts=PTS-STARTPTS[v1];[0:a]atrim=start=97.600:end=101.400,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[bv][ba];[bv]crop=608:1080:656:0,scale=1080:1920,setsar=1,fps=30,subtitles=variation-3.srt:force_style='FontName=Sans,FontSize=9,Bold=1,Outline=2,Shadow=0,Alignment=2,MarginV=48',drawtext=font=Sans:textfile=variation-3-hook.txt:expansion=none:fontsize=65:fontcolor=white:line_spacing=24:box=1:boxcolor=black@0.6:boxborderw=24:x=(w-text_w)/2:y=h*0.2:enable='lt(t,2.5)',format=yuv420p[mv];color=c=0x1d3557:s=1080x1920:r=30:d=2,drawtext=font=Sans:textfile=variation-3-cta.txt:expansion=none:fontsize=60:fontcolor=white:line_spacing=24:x=(w-text_w)/2:y=(h-text_h)/2,setsar=1,format=yuv420p[cv];anullsrc=r=48000:cl=stereo,atrim=duration=2[ca];[mv][ba][cv][ca]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -movflags +faststart variation-3.mp4

## Checks per variation

| Variation | Length | Crop | Caption lines |
|---|---|---|---|
| Variation 1 | 14.8 s (clips 12.8 s + end card 2.0 s; limit 15 s) | 608×1080 from x=656, y=0, scaled to 1080×1920 (9:16) | 4 cards, 5 lines; longest line 29 of 32 characters; at most 2 of 2 lines a card |
| Variation 2 | 14.8 s (clips 12.8 s + end card 2.0 s; limit 15 s) | 608×1080 from x=656, y=0, scaled to 1080×1920 (9:16) | 4 cards, 5 lines; longest line 29 of 32 characters; at most 2 of 2 lines a card |
| Variation 3 | 13.4 s (clips 11.4 s + end card 2.0 s; limit 15 s) | 608×1080 from x=656, y=0, scaled to 1080×1920 (9:16) | 3 cards, 6 lines; longest line 32 of 32 characters; at most 2 of 2 lines a card |

## What this is not

No ad buying and no account access: Amber does not log in to any ad or social account, and does not post, schedule or boost anything.

No new filming and no music: the variations use only the footage and sound the client supplies. No music is added or licensed.

No performance promises: three openings are a way for the client to see which line their audience responds to. Nobody can say in advance which will do better.

The client confirms they own the video or are authorised to use it, and that the customer in it agreed to appear in ads.

This sample's clip, business and customer are invented, so nothing was rendered from it.

---

## How this report was checked

14 of 14 QA checks passed.

- Passed: The client confirmed they own the video or are authorised to use it
- Passed: Each variation is at most 15 seconds (clips plus the 2-second end card)
- Passed: Every cut lies inside the source video, and clips do not overlap within a variation
- Passed: The crop is even, fits inside the source frame, and the output is 9:16
- Passed: Every caption line is at most 32 characters and every card at most 2 lines (read back from the SRT)
- Passed: Captions are timed inside each cut, in order, without overlapping
- Passed: Hooks and the call to action make no guarantee, certification, compliance or results claim
- Passed: The three variations open with three different hooks
- Passed: Every address, email and phone number in the brief and transcript is invented
- Passed: No claims of guarantees, certification, compliance, affiliation or unmeasured results
- Passed: Nothing says a message was sent (Amber drafts; a person sends)
- Passed: Every section of messages is labelled as drafts
- Passed: No empty section without a note saying why
- Passed: Every stage of the demo completed
