MAX_TURNS = 5
conversation_memory = []

def add_message(role: str, content: str):
    conversation_memory.append({"role": role, "content": content})
    if len(conversation_memory) > MAX_TURNS * 2:
        conversation_memory.pop(0)

def get_memory():
    return conversation_memory
