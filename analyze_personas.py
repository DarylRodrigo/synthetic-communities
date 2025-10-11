#!/usr/bin/env python3
import json
import collections
import sys

def analyze_personas(file_path):
    """Analyze the personas.jsonl file for data quality issues."""

    # Read and parse the JSONL file
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f'Total lines: {len(lines)}')

    # Extract all IDs and check for duplicates
    ids = []
    valid_lines = 0
    malformed_lines = []

    for i, line in enumerate(lines):
        try:
            data = json.loads(line.strip())
            ids.append((i+1, data['id']))
            valid_lines += 1
        except json.JSONDecodeError as e:
            malformed_lines.append(i+1)

    print(f'Valid JSON lines: {valid_lines}')
    print(f'Malformed JSON lines: {len(malformed_lines)}')

    if malformed_lines:
        print(f'First few malformed lines: {malformed_lines[:5]}')

    # Find duplicate IDs
    id_counts = collections.Counter([id for _, id in ids])
    duplicates = [id for id, count in id_counts.items() if count > 1]

    print(f'Total unique IDs: {len(ids)}')
    print(f'Duplicate IDs: {len(duplicates)}')

    if duplicates:
        print(f'First few duplicate IDs: {duplicates[:5]}')

        # Show details for the first duplicate ID
        first_dup_id = duplicates[0]
        dup_lines = [(line_num, id) for line_num, id in ids if id == first_dup_id]
        print(f'Lines with ID {first_dup_id}: {dup_lines}')

    # Check for encoding issues and data inconsistencies
    encoding_issues = []
    inconsistent_data = []

    for i, line in enumerate(lines[:100]):  # Check first 100 lines for examples
        try:
            data = json.loads(line.strip())

            # Check for encoding issues in text fields
            text_fields = ['name', 'city', 'job', 'company', 'demeanour', 'backstory']
            for field in text_fields:
                if field in data:
                    value = data[field]
                    if isinstance(value, str):
                        # Check for common encoding artifacts
                        if any(ord(c) > 127 and c not in 'àáâäèéêëìíîïòóôöùúûüÿçñßäöüÄÖÜ' for c in value):
                            if not encoding_issues:
                                encoding_issues.append(f'Line {i+1}, field {field}: {repr(value[:100])}')

            # Check for data type inconsistencies
            if not isinstance(data.get('age'), int) or data['age'] < 0 or data['age'] > 120:
                inconsistent_data.append(f'Line {i+1}: Invalid age {data.get("age")}')

            if data.get('gender') not in ['M', 'F']:
                inconsistent_data.append(f'Line {i+1}: Invalid gender {data.get("gender")}')

            # Check media_diet sums to approximately 1
            media_diet = data.get('media_diet', {})
            if media_diet:
                total = sum(media_diet.values())
                if abs(total - 1.0) > 0.01:  # Allow small floating point errors
                    inconsistent_data.append(f'Line {i+1}: Media diet sum = {total}')

        except Exception as e:
            print(f'Error processing line {i+1}: {e}')

    print(f'Encoding issues found: {len(encoding_issues)}')
    if encoding_issues:
        print('Examples:', encoding_issues[:3])

    print(f'Data inconsistencies found: {len(inconsistent_data)}')
    if inconsistent_data:
        print('Examples:', inconsistent_data[:3])

if __name__ == "__main__":
    analyze_personas("dashboard/public/personas.jsonl")
