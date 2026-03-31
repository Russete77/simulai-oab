#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("Removendo duplicatas do dataset...\n")

with open('dataset_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total original: {len(data)} questoes\n")

# Manter apenas a primeira ocorrência de cada exam_id + question_number
seen = set()
unique_data = []

for q in data:
    key = f"{q['exam_id']}_{q['question_number']}"
    if key not in seen:
        seen.add(key)
        unique_data.append(q)

print(f"Questoes unicas: {len(unique_data)}")
print(f"Duplicatas removidas: {len(data) - len(unique_data)}\n")

# Salvar dataset limpo
output_file = "dataset_unique.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(unique_data, f, ensure_ascii=False, indent=2)

print(f"Dataset limpo salvo em: {output_file}")

# Estatísticas do dataset limpo
question_types = {}
for q in unique_data:
    qt = q['question_type']
    question_types[qt] = question_types.get(qt, 0) + 1

print(f"\nDistribuicao por tipo:")
for qt, count in sorted(question_types.items(), key=lambda x: x[1], reverse=True):
    print(f"  {qt}: {count}")
