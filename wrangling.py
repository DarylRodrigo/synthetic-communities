#!/usr/bin/env python3
"""
Data wrangling script for personas.jsonl
- Removes duplicates prioritizing entries with MORE fields, then first instance
- Repairs corrupted text fields
- Overwrites the original file with cleaned data
"""

import json
import collections
import os
import re
from typing import Dict, List, Any

def count_fields(entry: Dict[str, Any]) -> int:
    """Count the number of fields in a persona entry."""
    count = 0
    for key, value in entry.items():
        if isinstance(value, dict):
            count += count_fields(value)
        elif isinstance(value, list):
            count += len(value)
        else:
            count += 1
    return count

def repair_text(text: str) -> str:
    """Attempt to repair common UTF-8 encoding issues in text."""
    if not isinstance(text, str):
        return text

    # Common encoding fixes based on observed patterns
    repairs = {
        'A': 'ç',  # ç
        'KA': 'Kä',  # Kä
        'BA��': 'Büş',  # Büş (approximate)
        'SA': 'Söh',  # Söhne (approximate)
        'FlA�': 'Flück',  # Flückiger (approximate)
    }

    repaired = text
    for corrupted, correct in repairs.items():
        repaired = repaired.replace(corrupted, correct)

    # Also fix some common patterns
    # Fix "A," patterns that should be "à" or "á"
    repaired = re.sub(r'A,([a-z])', r'À\1', repaired)  # À (could be à too)

    return repaired

def wrangle_personas(input_file: str, output_file: str):
    """Main wrangling function."""

    # Read and parse all entries
    entries = []
    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                entry = json.loads(line.strip())
                entries.append((line_num, entry))
            except json.JSONDecodeError as e:
                print(f"Warning: Skipping malformed line {line_num}: {e}")
                continue

    print(f"Loaded {len(entries)} valid entries from {input_file}")

    # Group by ID to find duplicates
    entries_by_id = collections.defaultdict(list)
    for line_num, entry in entries:
        entries_by_id[entry['id']].append((line_num, entry))

    # Process each ID group
    cleaned_entries = []

    for id_val, dup_entries in entries_by_id.items():
        if len(dup_entries) == 1:
            # No duplicate, keep as is
            cleaned_entries.append(dup_entries[0])
        else:
            # Has duplicates, choose the best one
            # Prioritize: more fields, then earlier line number

            # Sort by field count (descending), then by line number (ascending)
            sorted_entries = sorted(dup_entries, key=lambda x: (-count_fields(x[1]), x[0]))

            # Keep the first one after sorting (most fields, then earliest)
            best_entry = sorted_entries[0]
            cleaned_entries.append(best_entry)

            if len(dup_entries) > 1:
                removed_lines = [line_num for line_num, _ in dup_entries[1:]]
                print(f"Removed {len(removed_lines)} duplicates for ID {id_val} (kept line {best_entry[0]}, removed: {removed_lines})")

    print(f"After deduplication: {len(cleaned_entries)} unique entries")

    # Repair encoding issues in text fields
    text_fields = ['name', 'city', 'job', 'company', 'demeanour', 'backstory']

    for line_num, entry in cleaned_entries:
        for field in text_fields:
            if field in entry and isinstance(entry[field], str):
                original = entry[field]
                repaired = repair_text(original)
                if repaired != original:
                    entry[field] = repaired
                    print(f"Repaired encoding in line {line_num}, field {field}: '{original}' -> '{repaired}'")

        # Also fix nested text in other fields if needed
        if 'interests' in entry and isinstance(entry['interests'], list):
            for i, interest in enumerate(entry['interests']):
                if isinstance(interest, str):
                    repaired = repair_text(interest)
                    if repaired != interest:
                        entry['interests'][i] = repaired

    # Write cleaned data back to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        for line_num, entry in cleaned_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

    print(f"Cleaned data written to {output_file}")

    # If input and output are the same file, we're done
    if input_file == output_file:
        print("Overwrote original file with cleaned data")
        return

    # Otherwise, replace the original file
    backup_file = input_file + '.backup'
    os.rename(input_file, backup_file)
    os.rename(output_file, input_file)
    print(f"Original file backed up as {backup_file} and replaced with cleaned version")

def main():
    """Main function to run the wrangling."""
    input_file = os.path.join(os.path.dirname(__file__), "dashboard", "public", "personas.jsonl")

    # Use the same file for input and output to overwrite in place
    wrangle_personas(input_file, input_file)

if __name__ == "__main__":
    main()
