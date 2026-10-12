#!/usr/bin/env python3
"""Makes the owner's working page (one self-contained HTML file) from kit/KIT-TEXT.md and the fixed wording of LAUNCH-APPROVAL.md:
the DNS records to add, every post with a copy button, the listing texts, the tutoring-center email and what is not started.
  python3 tools/make-kit-page.py <out.html> <dkim-value>
The DKIM value is read from Amber's support-mail comment on #105 (it is not kept in this repository's tools)."""
import html, re, sys

out_path, dkim = sys.argv[1], sys.argv[2]
kit = open("kit/KIT-TEXT.md", encoding="utf-8").read()
E = html.escape

def parse(sec):
    lines = sec.strip().split("\n")
    head = lines[0]
    items, files, desc_for = [], "", None
    for l in lines[1:]:
        l = l.strip()
        if not l:
            continue
        if l.startswith("Files:"):
            files = l[len("Files:"):].strip()
            continue
        m = re.match(r"\*\*(.+?)\*\*(?: \((.+?)\))?:? ?(.*)$", l)
        if m:
            label, note, text = m.group(1), m.group(2) or "", m.group(3).strip()
            if label.startswith("YouTube Short"):
                items.append(("YouTube Short title", note, text))
            else:
                items.append((label, note, text))
            continue
        if l.startswith("Description:"):
            items.append(("YouTube Short description", "", l[len("Description:"):].strip()))
    return head, files, items

demos = [parse(s) for s in re.split(r"(?m)^## ", kit)[1:]]

def copy_block(label, text, note="", mono=True):
    return (
        f'<div class="item"><div class="item-head"><span class="label">{E(label)}</span>'
        f'{f"<span class=note>{E(note)}</span>" if note else ""}'
        f'<button class="copy" type="button" data-copy>Copy</button></div>'
        f'<div class="{"val mono" if mono else "val"}" data-text>{E(text)}</div></div>'
    )

dns = [
    ("MX", "@", "inbound-smtp.us-east-1.amazonaws.com", "10", "Receives mail for support@amberoneai.com"),
    ("TXT", "resend._domainkey", dkim, "", "Signs the replies (DKIM)"),
    ("MX", "send", "feedback-smtp.us-east-1.amazonses.com", "10", "Lets other mail servers accept the replies"),
    ("TXT", "send", "v=spf1 include:amazonses.com ~all", "", "Lets other mail servers accept the replies (SPF)"),
]
dns_rows = ""
for i, (t, n, c, p, why) in enumerate(dns, 1):
    dns_rows += (
        f'<div class="rec"><div class="rec-top"><span class="num">{i}</span><span class="type">{E(t)}</span><span class="why">{E(why)}</span></div>'
        f'<div class="fields">'
        f'<div class="field"><span class="flabel">Name</span><span class="fval mono" data-text>{E(n)}</span><button class="copy" type="button" data-copy>Copy</button></div>'
        f'<div class="field"><span class="flabel">{"Mail server" if t == "MX" else "Content"}</span><span class="fval mono wrap" data-text>{E(c)}</span><button class="copy" type="button" data-copy>Copy</button></div>'
        + (f'<div class="field"><span class="flabel">Priority</span><span class="fval mono" data-text>{E(p)}</span><button class="copy" type="button" data-copy>Copy</button></div>' if p else "")
        + "</div></div>"
    )

posts_html = ""
for head, files, items in demos:
    posts_html += f'<section class="demo"><h3>{E(head)}</h3>'
    if files:
        posts_html += f'<p class="small">Files: {E(files)}</p>'
    for label, note, text in items:
        if label.startswith("Bio links"):
            continue
        posts_html += copy_block(label, text, note, mono=False)
    posts_html += "</section>"

SITE = "https://hq.amberoneai.com"
bio = [("TikTok bio", f"{SITE}/studyproofs/examples?src=tiktok-bio"), ("Instagram bio", f"{SITE}/studyproofs/examples?src=instagram-bio"), ("YouTube channel About", f"{SITE}/studyproofs/examples?src=youtube-about")]
bio_html = "".join(copy_block(l, u, "", mono=True) for l, u in bio)

listings = [
    ("Product Hunt: name", "StudyProofs", ""),
    ("Product Hunt: tagline (52 of 60 characters)", "Flashcards and quizzes from your notes, with sources", ""),
    ("Product Hunt: description (234 of 260 characters)", "Paste or upload your notes and get flashcards, a quiz and study notes back, each with the line of your notes it came from where it can find one. Free plan: 3 uploads a week. AI can make mistakes, so check the cards against your notes.", ""),
    ("Product Hunt: link", f"{SITE}/studyproofs/examples?src=producthunt", ""),
    ("Product Hunt: first maker comment", f"I'm the founder of StudyProofs. It turns your own notes into flashcards and a quiz and shows the line of the notes each one came from, where it can find one. There are two samples made from notes we wrote, one reworded question marked on its page: {SITE}/studyproofs/examples?src=producthunt. It is young and it makes mistakes sometimes, so what is confusing or wrong? Free plan available.", ""),
    ("AlternativeTo: short description", "Paste or upload notes, get flashcards, a quiz and study notes, each with the line it came from. Web. Free plan.", ""),
    ("AlternativeTo: link", f"{SITE}/studyproofs/examples?src=alternativeto", ""),
    ("ISTE EdTech Index: description", "Students paste or upload their own notes and get flashcards, a quiz and study notes back, each with the line of the notes it came from where it can find one. There is a free plan (3 uploads a week); paid plans are $4.99 a month (Student) and $9.99 a month (Pro). It is a young product and the study tools can contain mistakes, so students are told to check them against their notes.", ""),
    ("ISTE EdTech Index: link", f"{SITE}/studyproofs/examples?src=iste", ""),
]
listings_html = "".join(copy_block(l, t, n, mono=False) for l, t, n in listings)

email = """Subject: Free StudyProofs for {INSTITUTION} students: a working demo and a free semester

Hi,

I'm writing from StudyProofs, a small study tool. A student pastes or uploads their own notes and gets flashcards and a quiz back. Where it can, each one shows the line of the notes it came from, and it says when it cannot find one, so it is easy to check.

You can see what it makes from sample notes we wrote, with the line each item came from: https://hq.amberoneai.com/studyproofs/examples?src=tutoring-centers&campaign=outreach

If it would help {INSTITUTION}'s students, they can have Pro free for a semester (120 days). No card, nothing is charged, and their notes stay theirs when it ends. They sign up with this link, which fills in the code TUTORING-SEMESTER: https://hq.amberoneai.com/studyproofs/signup?src=tutoring-centers&campaign=outreach&code=TUTORING-SEMESTER (one use per student account, up to 300 students in all).

The free plan is real too: 3 uploads a week, and what a student makes stays in their library. Paid plans are $4.99 a month (Student) or $9.99 a month (Pro) and cancel any time.

It is a young product and the study tools can contain mistakes, so we tell students to check them against their notes. If this is not something you share with students, you do not need to reply and we will not write again. If you have a question, reply to this message.

The StudyProofs team"""

page = f"""<title>StudyProofs Launch Kit</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap">
<style>
/* Layout: one reading column; a quiet sticky index; every block that holds text to copy is a labelled row with its own Copy button. */
:root {{
  --bg: #f5f6f2; --panel: #ffffff; --ink: #1c231f; --muted: #5b655e; --line: #d9ded6;
  --accent: #1d6b57; --accent-ink: #ffffff; --warn: #8a5a00; --warn-bg: #fbf1d9; --bad: #9a2f2f; --bad-bg: #fbe9e7; --ok: #1d6b57; --ok-bg: #e3f2ec;
  --code-bg: #eef1ec;
  --display: "Newsreader", Georgia, "Times New Roman", serif; --body: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif; --mono: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #111613; --panel: #181f1b; --ink: #e7ece6; --muted: #9aa69d; --line: #2c3731; --accent: #5fc2a5; --accent-ink: #0c1411;
  --warn: #e3b75b; --warn-bg: #2b2412; --bad: #f09a93; --bad-bg: #2e1a18; --ok: #6fd1b3; --ok-bg: #14281f; --code-bg: #202923; color-scheme: dark; }} }}
:root[data-theme="dark"] {{
  --bg: #111613; --panel: #181f1b; --ink: #e7ece6; --muted: #9aa69d; --line: #2c3731; --accent: #5fc2a5; --accent-ink: #0c1411;
  --warn: #e3b75b; --warn-bg: #2b2412; --bad: #f09a93; --bad-bg: #2e1a18; --ok: #6fd1b3; --ok-bg: #14281f; --code-bg: #202923; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); padding-inline: 16px; padding-block: 8px 48px; }}
main {{ max-width: 860px; margin: 0 auto; }}
header {{ padding-block: 28px 8px; }}
h1 {{ font: 600 clamp(28px, 5vw, 40px)/1.12 var(--display); margin: 0 0 6px; text-wrap: balance; }}
h2 {{ font: 600 22px/1.2 var(--display); margin: 0 0 10px; text-wrap: balance; }}
h3 {{ font: 600 17px/1.3 var(--body); margin: 20px 0 8px; }}
p {{ margin: 0 0 10px; max-width: 70ch; }}
.lede {{ color: var(--muted); max-width: 62ch; }}
.small {{ color: var(--muted); font-size: 13px; }}
nav.index {{ position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); border-bottom: 1px solid var(--line); display: flex; gap: 6px 16px; flex-wrap: wrap; padding: 8px 0; margin-block: 8px 20px; font-size: 13px; }}
nav.index a {{ color: var(--muted); text-decoration: none; }}
nav.index a:hover, nav.index a:focus-visible {{ color: var(--accent); text-decoration: underline; }}
section.block {{ margin-block: 32px; padding-top: 4px; }}
.status {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }}
.card {{ background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; min-width: 0; }}
.card .k {{ font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }}
.pill {{ display: inline-block; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 999px; margin-top: 4px; }}
.pill.ok {{ background: var(--ok-bg); color: var(--ok); }} .pill.warn {{ background: var(--warn-bg); color: var(--warn); }} .pill.bad {{ background: var(--bad-bg); color: var(--bad); }}
.card p {{ margin: 6px 0 0; font-size: 14px; }}
.rec {{ background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; margin-block: 10px; }}
.rec-top {{ display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }}
.num {{ font: 600 13px var(--mono); color: var(--accent); }} .type {{ font: 600 13px var(--mono); background: var(--code-bg); padding: 1px 7px; border-radius: 5px; }} .why {{ color: var(--muted); font-size: 14px; }}
.fields {{ display: grid; gap: 6px; }}
.field {{ display: grid; grid-template-columns: 92px minmax(0, 1fr) auto; gap: 10px; align-items: start; }}
.flabel {{ font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); padding-top: 4px; }}
.fval {{ background: var(--code-bg); border-radius: 6px; padding: 3px 8px; min-width: 0; overflow-wrap: anywhere; }}
.mono {{ font-family: var(--mono); font-size: 13px; }}
.item {{ background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; margin-block: 8px; }}
.item-head {{ display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }}
.label {{ font-weight: 600; }} .note {{ color: var(--muted); font-size: 13px; flex: 1 1 200px; min-width: 0; overflow-wrap: anywhere; }}
.val {{ white-space: pre-wrap; overflow-wrap: anywhere; min-width: 0; }}
.val.mono {{ background: var(--code-bg); border-radius: 6px; padding: 6px 8px; }}
button.copy {{ margin-left: auto; font: 500 12px var(--body); color: var(--accent); background: transparent; border: 1px solid var(--accent); border-radius: 6px; padding: 3px 10px; cursor: pointer; }}
button.copy:hover {{ background: var(--accent); color: var(--accent-ink); }}
button.copy:focus-visible, nav.index a:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
button.copy.done {{ background: var(--accent); color: var(--accent-ink); }}
.callout {{ border-left: 3px solid var(--warn); background: var(--warn-bg); padding: 10px 14px; border-radius: 0 8px 8px 0; margin-block: 12px; max-width: 70ch; }}
ul.plain {{ padding-left: 18px; margin: 0 0 10px; max-width: 70ch; }} ul.plain li {{ margin-block: 4px; }}
code {{ font: 13px var(--mono); background: var(--code-bg); padding: 1px 5px; border-radius: 4px; }}
table {{ border-collapse: collapse; width: 100%; font-size: 14px; }} th, td {{ text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }} th {{ font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); }}
.scroll {{ overflow-x: auto; }}
@media (max-width: 520px) {{ .field {{ grid-template-columns: minmax(0, 1fr) auto; }} .flabel {{ grid-column: 1 / -1; padding-top: 0; }} }}
@media (prefers-reduced-motion: no-preference) {{ button.copy {{ transition: background .12s, color .12s; }} }}
</style>
<main>
<header>
  <h1>StudyProofs launch kit</h1>
  <p class="lede">Everything you need to say yes to, in one place: the four DNS records that make the support address work, the exact posts and links, the listing texts and the tutoring-center email. Nothing here has been posted, sent or paid for.</p>
</header>
<nav class="index" aria-label="Sections"><a href="#state">Where it stands</a><a href="#dns">1. DNS records</a><a href="#posts">2. Posts</a><a href="#lists">3. Listings</a><a href="#email">4. Tutoring email</a><a href="#not">Not started</a></nav>

<section class="block" id="state">
  <h2>Where it stands</h2>
  <div class="status">
    <div class="card"><div class="k">Student journey</div><span class="pill ok">Works in production</span><p>Sign up, upload notes or a PDF, flashcards and a quiz, return, trial, checkout session. Accounts and saved sets survived a redeploy.</p></div>
    <div class="card"><div class="k">Support address</div><span class="pill bad">Needs your DNS records</span><p><code>support@amberoneai.com</code> receives nothing until step 1 is done. Everything else for it is deployed.</p></div>
    <div class="card"><div class="k">Advertising gate</div><span class="pill warn">Shut</span><p>It opens when the production walk passes its last check, which is that address receiving mail.</p></div>
    <div class="card"><div class="k">Real payment</div><span class="pill warn">Unverified</span><p>No real transaction has been completed. Your own $1 round trip is the only way to see one.</p></div>
  </div>
</section>

<section class="block" id="dns">
  <h2>1. Add four DNS records for amberoneai.com</h2>
  <p>In Cloudflare: the domain, then DNS, then Records, then Add record, four times. Mail records have no proxy setting. Nothing else changes: the domain has no mail records today, so no existing mail is affected. These are the records Resend itself asks for. About 30 to 60 minutes after they exist, Amber verifies the domain, tests receiving and replying, and emails you once when it passes.</p>
  {dns_rows}
  <p class="small">Prefer not to do this by hand? Put a Cloudflare API token limited to DNS edit on amberoneai.com in the vault as <code>CLOUDFLARE_API_TOKEN</code> and Amber adds and checks the records itself.</p>
</section>

<section class="block" id="posts">
  <h2>2. The posts, per demonstration</h2>
  <p>Say which platforms and which posts you approve. A person pastes each one: no platform lets Amber post without an audit that does not exist. Every post carries the disclosure "Made by StudyProofs. AI can make mistakes, so check the cards against your notes."</p>
  <div class="callout">BIO 101 quiz question 3 was reworded by a person because the product's wording had two defensible answers. The example page says so and shows the original; the BIO community post says so. STAT 200 is exactly as the product made it.</div>
  <h3>Profile links (one per platform, so each is counted on its own)</h3>
  {bio_html}
  {posts_html}
  <h3>One-time steps only you can do</h3>
  <div class="scroll"><table><thead><tr><th>Platform</th><th>Step</th></tr></thead><tbody>
    <tr><td>Pinterest</td><td>Create a free business account; Settings, Bulk Create Pins, upload <code>kit/pinterest-bulk.csv</code> from a desktop browser</td></tr>
    <tr><td>Instagram</td><td>Create the professional account (phone or CAPTCHA checks are yours)</td></tr>
    <tr><td>TikTok</td><td>Create the account and switch it to Business; on each post turn on Disclose commercial content, then Your brand</td></tr>
    <tr><td>YouTube</td><td>Create the channel</td></tr>
    <tr><td>Product Hunt</td><td>Create a personal account now (it cannot post for a week); launch no earlier than day 8 and only if you agree; no request for votes</td></tr>
  </tbody></table></div>
</section>

<section class="block" id="lists">
  <h2>3. Listing texts</h2>
  <p>Free forms only. Stop at any price, badge or reciprocal-link request.</p>
  {listings_html}
</section>

<section class="block" id="email">
  <h2>4. The tutoring-center email</h2>
  <p>The campaign emails one university tutoring or academic-support center at a time, at an address the institution published, with an unsubscribe link and the postal address. It sends nothing until you approve this exact text. Fingerprint of the text and the trial terms: <code>325af7731b77</code>. To approve, say in your own words that you approve the tutoring-center email with that fingerprint; Amber records your words and the date. Replies go to the support address and are always handed to you.</p>
  {copy_block("Email text", email, "{INSTITUTION} is filled in per institution", mono=False)}
</section>

<section class="block" id="not">
  <h2>Not started, and why</h2>
  <ul class="plain">
    <li><strong>Connected accounts.</strong> None of Amber's social accounts belongs to StudyProofs; posting there would put StudyProofs under another brand.</li>
    <li><strong>Reddit</strong> is excluded by your rule. <strong>Paid listings, fast tracks and sponsorships</strong> are excluded by the no-spend rule.</li>
    <li><strong>Student creators.</strong> A person-to-person request you choose and send yourself; Amber prepares the note and a trial code of their own on request.</li>
    <li><strong>Communities.</strong> One post, by hand, only where the written rules allow it; no Reddit; no direct messages.</li>
  </ul>
</section>
</main>
<script>
document.addEventListener("click", function (ev) {{
  var b = ev.target.closest("[data-copy]");
  if (!b) return;
  var holder = b.closest(".field, .item");
  var el = holder && holder.querySelector("[data-text]");
  if (!el) return;
  var text = el.textContent;
  var done = function () {{ var o = b.textContent; b.textContent = "Copied"; b.classList.add("done"); setTimeout(function () {{ b.textContent = o; b.classList.remove("done"); }}, 1400); }};
  var fallback = function () {{
    try {{ var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected: press copy"; setTimeout(function () {{ b.textContent = "Copy"; }}, 2200); }} catch (e) {{}}
  }};
  try {{ navigator.clipboard.writeText(text).then(done, fallback); }} catch (e) {{ fallback(); }}
}});
</script>
"""
open(out_path, "w", encoding="utf-8").write(page)
print("wrote", out_path, len(page))
