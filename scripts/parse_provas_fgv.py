# -*- coding: utf-8 -*-
"""
Pipeline: PDF FGV (prova Tipo 1 + gabarito definitivo) -> JSON QuestionDataset.
Uso: python parse_provas.py <numero_exame> <exam_id> <exam_year>
Ex.:  python parse_provas.py 44 2025-02 2025
"""
import fitz
import json
import re
import sys
import os
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ALT_RE = re.compile(r"^\(([A-D])\)\s*(.*)")
QNUM_RE = re.compile(r"^(\d{1,2})\s*$")
# cabeçalho/rodapé das páginas da prova FGV (linhas exatas, não substrings soltas)
HEADER_RE = re.compile(
    r"^\d+\s*[oº°]?\s*EXAME\s+D[EO]\s+ORDEM"      # "44o EXAME DO ORDEM UNIFICADO"
    r"|^Tipo\s+Branca"                              # "Tipo Branca – Página 3"
    r"|^P[áa]gina\s+\d+\s*$",
    re.IGNORECASE,
)

SUBJECTS = [
    "ETHICS", "CONSTITUTIONAL", "CIVIL", "CIVIL_PROCEDURE", "CRIMINAL",
    "CRIMINAL_PROCEDURE", "LABOUR", "LABOUR_PROCEDURE", "ADMINISTRATIVE",
    "TAXES", "BUSINESS", "CONSUMER", "ENVIRONMENTAL", "CHILDREN",
    "INTERNATIONAL", "HUMAN_RIGHTS", "GENERAL",
]


# A prova FGV termina com um "Questionário de percepção" (pesquisa de opinião)
# logo após a Q80 — sem este cutoff ele era colado na alternativa D da última
# questão (bug corrigido em 04/07/2026 nos exames 44 e 46).
SURVEY_RE = re.compile(r"Question[áa]rio de percep[çc][ãa]o", re.IGNORECASE)


def parse_prova(path):
    doc = fitz.open(path)
    questions = []
    current = None  # {"number", "statement": [], "choices": {A:[],...}, "cur_alt": None}
    expected = 1
    done = False

    for page in doc:
        if done:
            break
        for raw_line in page.get_text().split("\n"):
            line = raw_line.strip()
            if not line:
                continue
            if SURVEY_RE.search(line):
                done = True
                break
            # pula cabeçalhos/rodapés
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
                continue  # texto de capa/instruções
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

    # normalizar
    out = []
    for q in questions:
        stmt = " ".join(q["statement"]).strip()
        choices = {k: " ".join(v).strip() for k, v in q["choices"].items()}
        out.append({"number": q["number"], "question": stmt, "choices": choices})
    return out


def parse_gabarito(path):
    doc = fitz.open(path)
    text = "\n".join(p.get_text() for p in doc)
    # recorta do primeiro "TIPO  1" até "TIPO  2"
    m1 = re.search(r"TIPO\s+1", text)
    m2 = re.search(r"TIPO\s+2", text)
    assert m1 and m2, "marcadores TIPO 1/2 não encontrados"
    segment = text[m1.end():m2.start()]
    tokens = [t.strip() for t in segment.split("\n") if t.strip()]
    answers = {}
    nums = []
    for t in tokens:
        if re.fullmatch(r"\d{1,2}", t):
            nums.append(int(t))
        elif re.fullmatch(r"[A-DX]", t):  # X = anulada em alguns gabaritos
            if nums:
                n = nums.pop(0)
                answers[n] = t
    return answers


def classify_subjects(questions, api_key):
    """Classifica matéria via gpt-4o-mini em lotes de 10."""
    results = {}
    for i in range(0, len(questions), 10):
        batch = questions[i:i + 10]
        items = "\n\n".join(
            f"[{q['number']}] {q['question'][:600]}" for q in batch
        )
        prompt = (
            "Classifique cada questão da OAB abaixo em UMA das matérias:\n"
            + ", ".join(SUBJECTS)
            + "\n\nRegras: Estatuto da OAB/ética/filosofia do direito -> ETHICS. "
            "Direito eleitoral -> CONSTITUTIONAL. ECA -> CHILDREN. "
            "Responda APENAS JSON: {\"<numero>\": \"<MATERIA>\", ...}\n\n" + items
        )
        body = json.dumps({
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }).encode()
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=body,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
        parsed = json.loads(data["choices"][0]["message"]["content"])
        for k, v in parsed.items():
            v = v.strip().upper()
            results[int(k)] = v if v in SUBJECTS else "GENERAL"
        print(f"  classificadas {min(i+10, len(questions))}/{len(questions)}")
    return results


def main():
    exam_num, exam_id, exam_year = sys.argv[1], sys.argv[2], sys.argv[3]
    base = os.path.dirname(os.path.abspath(__file__))

    # chave OpenAI do .env.local do projeto
    env_path = r"C:\Users\erick\SIMULAI-OAB\.env.local"
    api_key = None
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            if line.startswith("OPENAI_API_KEY=") or line.startswith("OPEN_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
    assert api_key, "chave OpenAI não encontrada"

    print(f"== Exame {exam_num} -> {exam_id} ==")
    prova = parse_prova(os.path.join(base, f"{exam_num}-prova.pdf"))
    gab = parse_gabarito(os.path.join(base, f"{exam_num}-gab.pdf"))

    # ---- VALIDAÇÕES RÍGIDAS ----
    errors = []
    if len(prova) != 80:
        errors.append(f"prova tem {len(prova)} questões (esperado 80)")
    if len(gab) != 80:
        errors.append(f"gabarito tem {len(gab)} respostas (esperado 80)")
    for q in prova:
        if sorted(q["choices"].keys()) != ["A", "B", "C", "D"]:
            errors.append(f"Q{q['number']}: alternativas {sorted(q['choices'].keys())}")
        elif any(len(t) < 2 for t in q["choices"].values()):
            errors.append(f"Q{q['number']}: alternativa vazia")
        if len(q["question"]) < 60:
            errors.append(f"Q{q['number']}: enunciado curto ({len(q['question'])} chars)")
    if errors:
        print("ERROS DE VALIDAÇÃO:")
        for e in errors[:20]:
            print("  -", e)
        sys.exit(1)
    print("validação da extração: OK (80 questões, 4 alternativas, gabarito completo)")

    print("classificando matérias com gpt-4o-mini...")
    subjects = classify_subjects(prova, api_key)

    dist = {}
    for s in subjects.values():
        dist[s] = dist.get(s, 0) + 1
    print("distribuição de matérias:", json.dumps(dist, ensure_ascii=False))

    dataset = []
    labels = ["A", "B", "C", "D"]
    nullified_count = 0
    for q in prova:
        letter = gab[q["number"]]
        nullified = letter == "X"
        if nullified:
            nullified_count += 1
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

    out_path = os.path.join(base, f"dataset_{exam_id}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=1)
    print(f"OK: {len(dataset)} questões ({nullified_count} anuladas) -> {out_path}")

    # amostra pra revisão humana
    s = dataset[9]
    print("\n--- AMOSTRA (Q10) ---")
    print("Matéria:", s["question_type"], "| Correta:", labels[s["answerKey"]])
    print("Enunciado:", s["question"][:200])
    print("Alt A:", s["choices"]["text"][0][:100])


if __name__ == "__main__":
    main()
