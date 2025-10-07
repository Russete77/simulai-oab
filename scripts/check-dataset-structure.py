#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("Verificando estrutura do dataset...\n")

with open('dataset_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Verificar indices onde aparecem duplicatas
print("Verificando onde aparecem as duplicatas de 2010-01:\n")

indices_2010 = []
for i, q in enumerate(data):
    if q['exam_id'] == '2010-01' and q['question_number'] in [1, 2, 3]:
        indices_2010.append((i, q['question_number']))

print(f"Questoes 2010-01 (1, 2, 3):")
for idx, num in indices_2010:
    print(f"  Indice {idx}: questao numero {num}")

# Verificar se há um padrão
print("\n\nVerificando padrao de duplicacao:")
print("Primeiras 20 questoes:")
for i in range(20):
    q = data[i]
    print(f"  {i}: {q['exam_id']}_{q['question_number']} - {q['question_type']}")

print("\n\nUltimas 20 questoes:")
for i in range(len(data)-20, len(data)):
    q = data[i]
    print(f"  {i}: {q['exam_id']}_{q['question_number']} - {q['question_type']}")

# Tentar identificar onde está a "segunda cópia"
print("\n\nProcurando onde está a segunda cópia das questoes:")
first_occurrence = {}
second_occurrence = {}

for i, q in enumerate(data):
    key = f"{q['exam_id']}_{q['question_number']}"
    if key not in first_occurrence:
        first_occurrence[key] = i
    elif key not in second_occurrence:
        second_occurrence[key] = i

if len(second_occurrence) > 0:
    # Pegar alguns exemplos
    examples = list(second_occurrence.items())[:5]
    print("Exemplos (primeira vs segunda aparicao):")
    for key, second_idx in examples:
        first_idx = first_occurrence[key]
        print(f"  {key}: primeira em {first_idx}, segunda em {second_idx} (diferenca: {second_idx - first_idx})")
