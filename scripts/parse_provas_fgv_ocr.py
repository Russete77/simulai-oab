# -*- coding: utf-8 -*-
"""
Exame 45: fontes sem ToUnicode CMap -> extração de texto vem ilegível.
Rota: renderiza cada página em PNG (200dpi) -> gpt-4o vision transcreve
verbatim -> mesmo parser/validação dos exames 44/46.
"""
import fitz
import json
import re
import sys
import os
import base64
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from parse_provas_fgv import ALT_RE, QNUM_RE, HEADER_RE, SURVEY_RE, parse_gabarito, classify_subjects, SUBJECTS

BASE = os.path.dirname(os.path.abspath(__file__))

TRANSCRIBE_PROMPT = """Transcreva o texto desta página de prova da OAB EXATAMENTE como está, verbatim.

REGRAS DE FORMATO:
- Número de questão: linha contendo APENAS o número (ex: "17")
- Alternativas: linha começando com "(A) ", "(B) ", "(C) " ou "(D) "
- NÃO inclua cabeçalho ("45º EXAME...", "Tipo Branca – Página N") nem rodapé
- NÃO resuma, NÃO corrija, NÃO complete texto — transcrição fiel, acentos incluídos
- Se a página não tiver questões (capa/instruções), responda apenas: [SEM QUESTOES]
- Colunas: transcreva a coluna da esquerda inteira primeiro, depois a da direita"""


def get_api_key():
    with open(r"C:\Users\erick\SIMULAI-OAB\.env.local", encoding="utf-8") as f:
        for line in f:
            if line.startswith(("OPENAI_API_KEY=", "OPEN_API_KEY=")):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("chave não encontrada")


def transcribe_page(png_bytes, api_key):
    b64 = base64.b64encode(png_bytes).decode()
    body = json.dumps({
        "model": "gpt-4o",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": TRANSCRIBE_PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "high"}},
            ],
        }],
        "temperature": 0,
        "max_tokens": 4000,
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read())
    return data["choices"][0]["message"]["content"]


def parse_lines(all_lines):
    questions, current, expected = [], None, 1
    for raw in all_lines:
        line = raw.strip()
        if not line or line == "[SEM QUESTOES]":
            continue
        if SURVEY_RE.search(line):
            break
        if HEADER_RE.search(line):
            continue
        m = QNUM_RE.match(line)
        if m and int(m.group(1)) == expected:
            if current:
                questions.append(current)
            current = {"number": expected, "statement": [], "choices": {}, "cur_alt": None}
            expected += 1
            continue
        if current is None:
            continue
        am = ALT_RE.match(line)
        if am:
            current["cur_alt"] = am.group(1)
            current["choices"][am.group(1)] = [am.group(2)] if am.group(2) else []
            continue
        if current["cur_alt"]:
            current["choices"][current["cur_alt"]].append(line)
        else:
            current["statement"].append(line)
    if current:
        questions.append(current)
    return [
        {"number": q["number"], "question": " ".join(q["statement"]).strip(),
         "choices": {k: " ".join(v).strip() for k, v in q["choices"].items()}}
        for q in questions
    ]


def main():
    api_key = get_api_key()
    exam_id, exam_year = "2025-03", "2025"
    cache_path = os.path.join(BASE, "45-transcript.json")

    if os.path.exists(cache_path):
        transcripts = json.load(open(cache_path, encoding="utf-8"))
        print(f"transcrição em cache: {len(transcripts)} páginas")
    else:
        doc = fitz.open(os.path.join(BASE, "45-prova.pdf"))
        transcripts = []
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=200)
            print(f"transcrevendo página {i+1}/{len(doc)}...")
            text = transcribe_page(pix.tobytes("png"), api_key)
            transcripts.append(text)
            # cache incremental — retomável se falhar no meio
            json.dump(transcripts, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)
        print("transcrição completa")

    all_lines = []
    for t in transcripts:
        all_lines.extend(t.split("\n"))

    prova = parse_lines(all_lines)
    gab = parse_gabarito(os.path.join(BASE, "45-gab.pdf"))

    errors = []
    if len(prova) != 80:
        errors.append(f"prova tem {len(prova)} questões (esperado 80)")
    if len(gab) != 80:
        errors.append(f"gabarito tem {len(gab)} respostas")
    for q in prova:
        if sorted(q["choices"].keys()) != ["A", "B", "C", "D"]:
            errors.append(f"Q{q['number']}: alternativas {sorted(q['choices'].keys())}")
        if len(q["question"]) < 60:
            errors.append(f"Q{q['number']}: enunciado curto")
    if errors:
        print("ERROS DE VALIDAÇÃO:")
        for e in errors[:20]:
            print("  -", e)
        sys.exit(1)
    print("validação OK (80 questões, 4 alternativas, gabarito completo)")

    print("classificando matérias...")
    subjects = classify_subjects(prova, api_key)
    # GENERAL não existe no SUBJECT_MAP do importador
    for k, v in subjects.items():
        if v == "GENERAL":
            subjects[k] = "CONSUMER" if "dado" in prova[k-1]["question"].lower() else "CONSTITUTIONAL"

    labels = ["A", "B", "C", "D"]
    dataset = []
    for q in prova:
        letter = gab[q["number"]]
        nullified = letter == "X"
        dataset.append({
            "id": f"{exam_id}_{q['number']}",
            "question_number": q["number"],
            "exam_id": exam_id,
            "exam_year": exam_year,
            "question_type": subjects[q["number"]],
            "nullified": nullified,
            "question": q["question"],
            "choices": {"label": labels, "text": [q["choices"][l] for l in labels]},
            "answerKey": 0 if nullified else labels.index(letter),
        })
    out = os.path.join(BASE, f"dataset_{exam_id}.json")
    json.dump(dataset, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    dist = {}
    for s in subjects.values():
        dist[s] = dist.get(s, 0) + 1
    print("distribuição:", json.dumps(dist, ensure_ascii=False))
    print(f"OK -> {out}")


if __name__ == "__main__":
    main()
