"""
Script de teste para validar implementação de interesses

Execute: python backend/app/utilities/test_interests.py

Testa:
  1. Normalização (entrada → banco)
  2. Conversão para labels (banco → IA)
  3. Formatos legados
  4. Suporte multilíngue
"""

import sys
import json
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.utilities.interests import (
    normalize_interests,
    parse_interests,
    get_interest_label,
    get_interest_labels,
    format_interests_for_prompt,
    INTEREST_LABELS_PT,
    INTEREST_LABELS_EN,
)


def test_normalize():
    """Testa normalização de diferentes formatos"""
    print("=" * 60)
    print("TESTE 1: Normalização (entrada → banco)")
    print("=" * 60)
    
    tests = [
        (["math", "physics"], ["math", "physics"]),
        (["Matemática", "Física"], ["math", "physics"]),
        ('["math","physics"]', ["math", "physics"]),
        ("math, physics", ["math", "physics"]),
        ([], None),
        (None, None),
    ]
    
    passed = 0
    failed = 0
    
    for input_val, expected in tests:
        normalized_str = normalize_interests(input_val)
        
        # Parse JSON to compare content, not format
        if normalized_str is None:
            result = None
        else:
            result = json.loads(normalized_str)
        
        status = "✅" if result == expected else "❌"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} Input: {input_val}")
        print(f"   Expected: {expected}")
        print(f"   Got:      {result}")
        if normalized_str:
            print(f"   Stored:   {normalized_str}  (JSON válido ✓)")
        print()
    
    print(f"Resultados: {passed} passou, {failed} falhou\n")
    return failed == 0


def test_labels():
    """Testa conversão para labels"""
    print("=" * 60)
    print("TESTE 2: Conversão para labels (banco → IA)")
    print("=" * 60)
    
    tests = [
        (["math", "physics"], "pt", ["Matemática", "Física"]),
        (["math", "physics"], "en", ["Mathematics", "Physics"]),
        (["programming", "biology"], "pt", ["Programação", "Biologia"]),
        ([], "pt", []),
    ]
    
    passed = 0
    failed = 0
    
    for ids, lang, expected in tests:
        result = get_interest_labels(ids, lang)
        status = "✅" if result == expected else "❌"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} IDs: {ids} (lang={lang})")
        print(f"   Expected: {expected}")
        print(f"   Got:      {result}")
        print()
    
    print(f"Resultados: {passed} passou, {failed} falhou\n")
    return failed == 0


def test_format_for_prompt():
    """Testa formatação para prompt"""
    print("=" * 60)
    print("TESTE 3: Formatação para prompt da IA")
    print("=" * 60)
    
    tests = [
        (["math", "physics"], "pt", "Matemática, Física"),
        (["math", "physics"], "en", "Mathematics, Physics"),
        ('["programming","study"]', "pt", "Programação, Estudos"),
        ([], "pt", None),
    ]
    
    passed = 0
    failed = 0
    
    for input_val, lang, expected in tests:
        result = format_interests_for_prompt(input_val, lang)
        status = "✅" if result == expected else "❌"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} Input: {input_val} (lang={lang})")
        print(f"   Expected: {expected}")
        print(f"   Got:      {result}")
        print()
    
    print(f"Resultados: {passed} passou, {failed} falhou\n")
    return failed == 0


def test_legacy_formats():
    """Testa formatos legados"""
    print("=" * 60)
    print("TESTE 4: Formatos legados")
    print("=" * 60)
    
    legacy_inputs = [
        "Matemática, Física",
        "math,physics",
        '["Matemática","Física"]',
        ["Matemática", "Física"],
    ]
    
    expected = ["math", "physics"]
    
    passed = 0
    failed = 0
    
    for input_val in legacy_inputs:
        result = parse_interests(input_val)
        status = "✅" if result == expected else "❌"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} Legacy format: {repr(input_val)}")
        print(f"   Expected: {expected}")
        print(f"   Got:      {result}")
        print()
    
    print(f"Resultados: {passed} passou, {failed} falhou\n")
    return failed == 0


def test_json_guarantee():
    """Testa garantia de JSON (não CSV)"""
    print("=" * 60)
    print("TESTE 5: Garantia de JSON (não CSV)")
    print("=" * 60)
    
    inputs = [
        ["math", "physics"],
        ["programming", "biology", "chemistry"],
    ]
    
    passed = 0
    failed = 0
    
    for input_val in inputs:
        normalized = normalize_interests(input_val)
        
        # Verifica se é JSON válido
        try:
            parsed = json.loads(normalized)
            is_list = isinstance(parsed, list)
            is_valid_json = True
        except:
            is_list = False
            is_valid_json = False
        
        # Verifica que não é CSV (não contém vírgula sem aspas)
        is_not_csv = "," not in normalized or "[" in normalized
        
        passed_test = is_valid_json and is_list and is_not_csv
        status = "✅" if passed_test else "❌"
        
        if passed_test:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} Input: {input_val}")
        print(f"   Normalized: {normalized}")
        print(f"   Valid JSON: {is_valid_json}")
        print(f"   Is list: {is_list}")
        print(f"   Not CSV: {is_not_csv}")
        print()
    
    print(f"Resultados: {passed} passou, {failed} falhou\n")
    return failed == 0


def test_all_labels_present():
    """Verifica se todos os IDs têm labels PT e EN"""
    print("=" * 60)
    print("TESTE 6: Todos os IDs têm labels")
    print("=" * 60)
    
    canonical_ids = [
        "math", "statistics", "physics", "chemistry", "programming",
        "engineering", "biology", "health", "anatomy", "physical-education",
        "history", "geography", "philosophy", "sociology", "psychology",
        "literature", "languages", "writing", "arts", "law",
        "economics", "research", "study"
    ]
    
    missing_pt = []
    missing_en = []
    
    for interest_id in canonical_ids:
        if interest_id not in INTEREST_LABELS_PT:
            missing_pt.append(interest_id)
        if interest_id not in INTEREST_LABELS_EN:
            missing_en.append(interest_id)
    
    passed = len(missing_pt) == 0 and len(missing_en) == 0
    status = "✅" if passed else "❌"
    
    print(f"{status} Verificando {len(canonical_ids)} IDs canônicos")
    
    if missing_pt:
        print(f"   ❌ Missing PT labels: {missing_pt}")
    else:
        print(f"   ✅ Todos têm labels PT")
    
    if missing_en:
        print(f"   ❌ Missing EN labels: {missing_en}")
    else:
        print(f"   ✅ Todos têm labels EN")
    
    print()
    return passed


def run_all_tests():
    """Executa todos os testes"""
    print("\n" + "🧪 " * 30)
    print("TESTES DE VALIDAÇÃO - SISTEMA DE INTERESSES")
    print("🧪 " * 30 + "\n")
    
    results = {
        "Normalização": test_normalize(),
        "Labels": test_labels(),
        "Formatação para Prompt": test_format_for_prompt(),
        "Formatos Legados": test_legacy_formats(),
        "Garantia JSON": test_json_guarantee(),
        "Labels Completos": test_all_labels_present(),
    }
    
    print("=" * 60)
    print("RESUMO FINAL")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"{status}: {test_name}")
    
    total_passed = sum(results.values())
    total_tests = len(results)
    
    print()
    print(f"Total: {total_passed}/{total_tests} testes passaram")
    
    if total_passed == total_tests:
        print("\n🎉 SUCESSO! Todos os testes passaram!")
        return 0
    else:
        print(f"\n⚠️  {total_tests - total_passed} teste(s) falharam")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
