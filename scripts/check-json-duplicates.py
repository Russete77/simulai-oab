#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("Verificando duplicatas no dataset JSON...\n")

with open('dataset_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total de questoes no JSON: {len(data)}\n")

# Verificar duplicatas por exam_id + question_number
seen = set()
duplicates = []

for q in data:
    key = f"{q['exam_id']}_{q['question_number']}"
    if key in seen:
        duplicates.append(key)
    else:
        seen.add(key)

print(f"Questoes unicas (exam_id + question_number): {len(seen)}")
print(f"Duplicatas encontradas: {len(duplicates)}\n")

if len(duplicates) > 0:
    print("Primeiras 20 duplicatas:")
    for dup in duplicates[:20]:
        print(f"  {dup}")
