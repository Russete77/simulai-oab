#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("Analisando duplicatas em detalhes...\n")

with open('dataset_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total de questoes no JSON: {len(data)}\n")

# Agrupar por exam_id + question_number
grouped = {}
for q in data:
    key = f"{q['exam_id']}_{q['question_number']}"
    if key not in grouped:
        grouped[key] = []
    grouped[key].append(q)

# Encontrar duplicatas
duplicates = {k: v for k, v in grouped.items() if len(v) > 1}

print(f"Chaves unicas: {len(grouped)}")
print(f"Chaves com duplicatas: {len(duplicates)}\n")

if len(duplicates) > 0:
    print("Analisando primeiras 5 duplicatas:\n")
    for i, (key, questions) in enumerate(list(duplicates.items())[:5]):
        print(f"=== {key} ({len(questions)} copias) ===")
        for j, q in enumerate(questions):
            print(f"\nCopia {j+1}:")
            print(f"  ID: {q['id']}")
            print(f"  exam_year: {q['exam_year']}")
            print(f"  question_type: {q['question_type']}")
            print(f"  question: {q['question'][:100]}...")
            print(f"  answerKey: {q['answerKey']}")
        print("\n" + "="*60 + "\n")

# Verificar se são realmente duplicatas (mesmo conteúdo)
print("\nVerificando se duplicatas tem conteudo identico:")
identical = 0
different = 0

for key, questions in duplicates.items():
    # Comparar question text
    texts = [q['question'] for q in questions]
    if len(set(texts)) == 1:
        identical += 1
    else:
        different += 1
        if different <= 3:
            print(f"\n{key} - CONTEUDO DIFERENTE:")
            for i, q in enumerate(questions):
                print(f"  {i+1}. {q['question'][:80]}...")

print(f"\nDuplicatas com conteudo identico: {identical}")
print(f"Duplicatas com conteudo diferente: {different}")
