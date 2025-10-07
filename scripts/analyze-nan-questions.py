#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisa questões com question_type = 'nan'
"""
import json
import sys

# Fix encoding for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("Analisando questoes com question_type = 'nan'...\n")

with open('dataset_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

nan_questions = [q for q in data if q['question_type'] == 'nan']

print(f"Total de questoes com 'nan': {len(nan_questions)}\n")

# Agrupar por ano
by_year = {}
for q in nan_questions:
    year = q['exam_year']
    by_year[year] = by_year.get(year, 0) + 1

print("Distribuicao por ano:")
for year in sorted(by_year.keys()):
    print(f"  {year}: {by_year[year]} questoes")

# Mostrar algumas questões exemplo
print("\nExemplos de questoes com 'nan':")
for i, q in enumerate(nan_questions[:5]):
    print(f"\n--- Questao {i+1} ---")
    print(f"ID: {q['id']}")
    print(f"Exam: {q['exam_id']}")
    print(f"Year: {q['exam_year']}")
    print(f"Number: {q['question_number']}")
    print(f"Question: {q['question'][:200]}...")
