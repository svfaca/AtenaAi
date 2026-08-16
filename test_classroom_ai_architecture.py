#!/usr/bin/env python3
"""
🧪 QUICK TEST SCRIPT FOR CLASSROOM AI ARCHITECTURE
Run this after implementing to verify everything works
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test if all new modules can be imported"""
    print("\n" + "="*50)
    print("🧪 TEST 1: Module Imports")
    print("="*50)
    
    try:
        from app.models.classroom_member import ClassroomMember, ClassroomMemberRole
        print("✅ ClassroomMember imported successfully")
        
        from app.services.ai_service import AIMentionDetector, detect_ai_mention, generate_classroom_ai_response
        print("✅ AI service functions imported successfully")
        
        from app.schemas.teacher import ClassroomMemberResponse, ClassroomWithMembersResponse
        print("✅ New schemas imported successfully")
        
        print("\n✅ All imports successful!")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False


def test_ai_mention_detector():
    """Test AI mention detection"""
    print("\n" + "="*50)
    print("🧪 TEST 2: AI Mention Detection")
    print("="*50)
    
    try:
        from app.services.ai_service import detect_ai_mention
        
        test_cases = [
            ("@atenaai explica MRU", True, "explica MRU"),
            ("@AtenaAI qual é a capital?", True, "qual é a capital?"),
            ("@ATENAAI", True, "@ATENAAI"),
            ("olá pessoal", False, None),
            ("@maria tudo certo?", False, None),
        ]
        
        all_pass = True
        for content, expected_has, expected_prompt in test_cases:
            has_mention, prompt = detect_ai_mention(content)
            
            if has_mention == expected_has:
                if expected_has and prompt:
                    print(f"✅ '{content}' → has_mention={has_mention}, prompt='{prompt}'")
                else:
                    print(f"✅ '{content}' → has_mention={has_mention}")
            else:
                print(f"❌ '{content}' → Expected {expected_has}, got {has_mention}")
                all_pass = False
        
        if all_pass:
            print("\n✅ All mention detection tests passed!")
        else:
            print("\n❌ Some mention detection tests failed!")
        
        return all_pass
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_classroom_member_role():
    """Test ClassroomMemberRole enum"""
    print("\n" + "="*50)
    print("🧪 TEST 3: ClassroomMemberRole Enum")
    print("="*50)
    
    try:
        from app.models.classroom_member import ClassroomMemberRole
        
        expected_roles = ['admin', 'moderator', 'teacher', 'student']
        actual_roles = [role.value for role in ClassroomMemberRole]
        
        print(f"Expected roles: {expected_roles}")
        print(f"Actual roles:   {actual_roles}")
        
        if set(expected_roles) == set(actual_roles):
            print("\n✅ All roles are correctly defined!")
            return True
        else:
            missing = set(expected_roles) - set(actual_roles)
            extra = set(actual_roles) - set(expected_roles)
            if missing:
                print(f"❌ Missing roles: {missing}")
            if extra:
                print(f"❌ Extra roles: {extra}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database_migration():
    """Test if migration file exists"""
    print("\n" + "="*50)
    print("🧪 TEST 4: Database Migration File")
    print("="*50)
    
    try:
        migration_file = "backend/alembic/versions/a8d5f7e3c1f9_add_classroom_members_and_ai_support.py"
        
        if os.path.exists(migration_file):
            with open(migration_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'classroom_members' in content and 'upgrade' in content:
                    print(f"✅ Migration file exists and contains classroom_members table")
                    return True
                else:
                    print(f"❌ Migration file missing classroom_members definition")
                    return False
        else:
            print(f"❌ Migration file not found at {migration_file}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_websocket_handler():
    """Test if WebSocket handler has AI mention logic"""
    print("\n" + "="*50)
    print("🧪 TEST 5: WebSocket Handler AI Integration")
    print("="*50)
    
    try:
        handler_file = "backend/app/routes/group_chat.py"
        
        if os.path.exists(handler_file):
            with open(handler_file, 'r', encoding='utf-8') as f:
                content = f.read()
                checks = {
                    'has AI import': 'from app.services.ai_service import' in content,
                    'has mention detection': 'detect_ai_mention' in content,
                    'has AI response handler': '_handle_ai_response' in content,
                }
                
                all_pass = True
                for check_name, result in checks.items():
                    if result:
                        print(f"✅ {check_name}")
                    else:
                        print(f"❌ {check_name}")
                        all_pass = False
                
                return all_pass
        else:
            print(f"❌ WebSocket handler file not found at {handler_file}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_schemas():
    """Test if new schemas exist"""
    print("\n" + "="*50)
    print("🧪 TEST 6: Schema Definitions")
    print("="*50)
    
    try:
        schema_file = "backend/app/schemas/teacher.py"
        
        if os.path.exists(schema_file):
            with open(schema_file, 'r', encoding='utf-8') as f:
                content = f.read()
                schemas = [
                    'ClassroomMemberCreate',
                    'ClassroomMemberResponse',
                    'ClassroomMemberUpdate',
                    'ClassroomWithMembersResponse',
                ]
                
                all_found = True
                for schema in schemas:
                    if f'class {schema}' in content:
                        print(f"✅ {schema} defined")
                    else:
                        print(f"❌ {schema} NOT defined")
                        all_found = False
                
                return all_found
        else:
            print(f"❌ Schema file not found at {schema_file}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_classrooms_endpoints():
    """Test if new endpoints are in classrooms.py"""
    print("\n" + "="*50)
    print("🧪 TEST 7: Classroom Member Endpoints")
    print("="*50)
    
    try:
        route_file = "backend/app/routes/classrooms.py"
        
        if os.path.exists(route_file):
            with open(route_file, 'r', encoding='utf-8') as f:
                content = f.read()
                endpoints = {
                    'GET /classrooms/{id}/members': 'get_classroom_members',
                    'POST /classrooms/{id}/members': 'add_classroom_member',
                    'PUT /classrooms/{id}/members/{mid}/role': 'update_member_role',
                    'DELETE /classrooms/{id}/members/{mid}': 'remove_classroom_member',
                }
                
                all_found = True
                for endpoint_name, function_name in endpoints.items():
                    if f'def {function_name}' in content:
                        print(f"✅ {endpoint_name}")
                    else:
                        print(f"❌ {endpoint_name} NOT implemented")
                        all_found = False
                
                return all_found
        else:
            print(f"❌ Route file not found at {route_file}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("\n")
    print("╔" + "="*48 + "╗")
    print("║" + " "*10 + "🧪 CLASSROOM AI ARCHITECTURE TESTS" + " "*4 + "║")
    print("╚" + "="*48 + "╝")
    
    tests = [
        ("Imports", test_imports),
        ("AI Mention Detector", test_ai_mention_detector),
        ("ClassroomMemberRole", test_classroom_member_role),
        ("Database Migration", test_database_migration),
        ("WebSocket Handler", test_websocket_handler),
        ("Schemas", test_schemas),
        ("Endpoints", test_classrooms_endpoints),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n❌ Unhandled error in {test_name}: {e}")
            import traceback
            traceback.print_exc()
            results[test_name] = False
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Architecture is ready to use.")
    else:
        print(f"\n⚠️  {total - passed} tests failed. Please review the output above.")
    
    return passed == total


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    success = run_all_tests()
    sys.exit(0 if success else 1)
